import { eq, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { brands, fragranceNotes, fragranceResearch, fragrances, notes } from "@/db/schema";
import { catalogManifestSchema, researchDate } from "./research-schema";
import { foldText, fragranceSlug, slugify } from "./text";
import { WHEEL_FAMILIES } from "./parse";

/** Validate the complete batch before changing anything. Existing identities never move. */
export async function importResearch(db: Database, input: unknown, apply = false) {
  const manifest = catalogManifestSchema.parse(input);
  const today = new Date().toISOString().slice(0, 10);
  const changes: { productId: string; action: "create" | "enrich"; name: string }[] = [];
  const identities = new Set<string>();
  for (const entry of manifest.entries) {
    const identity = foldText(`${entry.brand} ${entry.name}`);
    if (identities.has(identity)) throw new Error(`Duplicate identity in batch: ${entry.name}`);
    identities.add(identity);
    const [current] = await db.select({ name: fragrances.name, brand: brands.name }).from(fragrances).innerJoin(brands, eq(brands.id, fragrances.brandId)).where(eq(fragrances.productId, entry.productId));
    if (current && (foldText(current.name) !== foldText(entry.name) || foldText(current.brand) !== foldText(entry.brand))) throw new Error(`Identity mismatch for ${entry.productId}`);
    if (!current) {
      if (!entry.productId.startsWith("a") || !entry.catalog) throw new Error(`New entry ${entry.productId} needs an Accord ID and catalog facts`);
      const duplicate = await db.select({ id: fragrances.productId }).from(fragrances).where(eq(fragrances.searchText, foldText(`${entry.brand} ${entry.name}`))).limit(1);
      if (duplicate.length) throw new Error(`Possible duplicate of ${duplicate[0].id}: ${entry.name}`);
    }
    if (entry.catalog) {
      if (!entry.productId.startsWith("a")) throw new Error(`ScentLens catalog facts cannot be overwritten: ${entry.productId}`);
      if (!entry.research.sources.some(s => s.fields.includes("identity") && s.fields.includes("featuredNotes"))) throw new Error(`Entry ${entry.productId} needs sourced identity and notes`);
      if (entry.catalog.notes.some(note => !entry.research.featuredNotes.some(n => foldText(n) === foldText(note)))) throw new Error(`Entry ${entry.productId} has unsourced catalog notes`);
    }
    if (entry.catalog?.wheel && !WHEEL_FAMILIES.includes(entry.catalog.wheel as typeof WHEEL_FAMILIES[number])) throw new Error(`Unknown wheel family: ${entry.catalog.wheel}`);
    if (entry.research.sources.some(s => s.checkedAt > today)) throw new Error(`Future verification date for ${entry.productId}`);
    changes.push({ productId: entry.productId, action: current ? "enrich" : "create", name: `${entry.brand} ${entry.name}` });
  }
  if (!apply) return { applied: false, changes };
  await db.transaction(async tx => {
    for (const entry of manifest.entries) {
      const creating = changes.find(c => c.productId === entry.productId)!.action === "create";
      if (creating) {
        const brandSlug = slugify(entry.brand);
        await tx.insert(brands).values({ name: entry.brand, slug: brandSlug }).onConflictDoNothing({ target: brands.slug });
        const [brand] = await tx.select().from(brands).where(eq(brands.slug, brandSlug));
        const catalog = entry.catalog!;
        await tx.insert(fragrances).values({
          productId: entry.productId, slug: fragranceSlug(entry.brand, entry.name, entry.productId), brandId: brand.id,
          name: entry.name, family: catalog.family ?? null, wheel: catalog.wheel ?? null,
          gender: catalog.gender ?? null, year: entry.research.year ?? null,
          accordsRaw: catalog.family ?? "", notesRaw: catalog.notes.join(", "), searchText: foldText(`${entry.brand} ${entry.name}`),
        });
      }
      if (entry.catalog && entry.productId.startsWith("a")) {
        const catalog = entry.catalog;
        await tx.update(fragrances).set({ family: catalog.family ?? null, wheel: catalog.wheel ?? null, gender: catalog.gender ?? null, year: entry.research.year ?? null, accordsRaw: catalog.family ?? "", notesRaw: catalog.notes.join(", ") }).where(eq(fragrances.productId, entry.productId));
        await tx.delete(fragranceNotes).where(eq(fragranceNotes.productId, entry.productId));
        for (const [position, label] of catalog.notes.entries()) {
          const key = slugify(label);
          await tx.insert(notes).values({ key, label }).onConflictDoNothing({ target: notes.key });
          const [note] = await tx.select().from(notes).where(eq(notes.key, key));
          await tx.insert(fragranceNotes).values({ productId: entry.productId, noteId: note.id, position }).onConflictDoNothing();
        }
      }
      const data = entry.research;
      const values = {
        concentration: data.concentration ?? null, perfumers: data.perfumers, editionGroup: data.editionGroup ?? null,
        aliasesText: foldText(data.aliases.join(" ")), data, verifiedAt: researchDate(data), updatedAt: new Date(),
      };
      await tx.insert(fragranceResearch).values({ productId: entry.productId, ...values }).onConflictDoUpdate({ target: fragranceResearch.productId, set: values });
    }
    if (manifest.entries.some(entry => entry.catalog)) {
      await tx.execute(sql`update ${brands} b set fragrance_count = (select count(*)::int from ${fragrances} f where f.brand_id=b.id)`);
      await tx.execute(sql`update ${notes} n set fragrance_count = (select count(*)::int from ${fragranceNotes} fn where fn.note_id=n.id)`);
    }
  });
  return { applied: true, changes };
}
