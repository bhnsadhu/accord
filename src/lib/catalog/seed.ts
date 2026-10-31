import { sql } from "drizzle-orm";
import type { Database } from "@/db";
import { brands, fragranceNotes, fragrances, notes } from "@/db/schema";
import { familyLabel, parseAccords, parseGender, parseNotes, parseYear } from "./parse";
import { foldText, fragranceSlug, slugify } from "./text";

/** One row of ScentLens artifacts/export/products.csv. */
export type CatalogRow = {
  product_id: string;
  brand: string;
  name: string;
  family: string;
  subfamily: string;
  accords: string;
  notes: string;
  gender: string;
  year: string;
};

const BATCH = 500;

function chunks<T>(items: T[], size = BATCH): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Upsert the catalog. Safe to re-run: product ids are the primary key, so a
 * re-seed updates metadata in place without touching user collections.
 */
export async function seedCatalog(db: Database, rows: CatalogRow[]) {
  const valid = rows.filter((r) => /^p\d{5}$/.test(r.product_id) && r.brand.trim() && r.name.trim());

  // Brands: first spelling of each slug wins.
  const brandNames = new Map<string, string>();
  for (const r of valid) {
    const slug = slugify(r.brand);
    if (!brandNames.has(slug)) brandNames.set(slug, r.brand.trim());
  }
  for (const batch of chunks([...brandNames].map(([slug, name]) => ({ slug, name })))) {
    await db.insert(brands).values(batch).onConflictDoNothing({ target: brands.slug });
  }
  const brandIds = new Map((await db.select({ id: brands.id, slug: brands.slug }).from(brands)).map((b) => [b.slug, b.id]));

  // Notes: the most common spelling becomes the label.
  const parsedNotes = new Map(valid.map((r) => [r.product_id, parseNotes(r.notes)]));
  const labelVotes = new Map<string, Map<string, number>>();
  for (const list of parsedNotes.values()) {
    for (const n of list) {
      const votes = labelVotes.get(n.key) ?? new Map<string, number>();
      votes.set(n.label, (votes.get(n.label) ?? 0) + 1);
      labelVotes.set(n.key, votes);
    }
  }
  const noteRows = [...labelVotes].map(([key, votes]) => ({
    key,
    label: [...votes].sort((a, b) => b[1] - a[1])[0][0],
  }));
  for (const batch of chunks(noteRows)) {
    await db
      .insert(notes)
      .values(batch)
      .onConflictDoUpdate({ target: notes.key, set: { label: sql`excluded.label` } });
  }
  const noteIds = new Map((await db.select({ id: notes.id, key: notes.key }).from(notes)).map((n) => [n.key, n.id]));

  const fragranceRows = valid.map((r) => {
    const accords = parseAccords(r.accords);
    return {
      productId: r.product_id,
      slug: fragranceSlug(r.brand, r.name, r.product_id),
      brandId: brandIds.get(slugify(r.brand))!,
      name: r.name.trim(),
      family: r.family.trim() ? familyLabel(r.family) : null,
      subfamily: r.subfamily.trim() ? familyLabel(r.subfamily) : null,
      gender: parseGender(r.gender),
      year: parseYear(r.year),
      wheel: accords.wheel,
      character: accords.character,
      facets: accords.facets,
      accordsRaw: r.accords.trim(),
      notesRaw: r.notes.trim(),
      searchText: foldText(`${r.brand} ${r.name}`),
    };
  });
  for (const batch of chunks(fragranceRows)) {
    await db
      .insert(fragrances)
      .values(batch)
      .onConflictDoUpdate({
        target: fragrances.productId,
        set: {
          slug: sql`excluded.slug`,
          brandId: sql`excluded.brand_id`,
          name: sql`excluded.name`,
          family: sql`excluded.family`,
          subfamily: sql`excluded.subfamily`,
          gender: sql`excluded.gender`,
          year: sql`excluded.year`,
          wheel: sql`excluded.wheel`,
          character: sql`excluded.character`,
          facets: sql`excluded.facets`,
          accordsRaw: sql`excluded.accords_raw`,
          notesRaw: sql`excluded.notes_raw`,
          searchText: sql`excluded.search_text`,
        },
      });
  }

  const links = valid.flatMap((r) =>
    parsedNotes.get(r.product_id)!.map((n, position) => ({
      productId: r.product_id,
      noteId: noteIds.get(n.key)!,
      position,
    })),
  );
  for (const batch of chunks(links, 2000)) {
    await db.insert(fragranceNotes).values(batch).onConflictDoNothing();
  }

  await db.execute(sql`
    update ${brands} b set fragrance_count = coalesce(c.n, 0)
    from (select brand_id, count(*)::int n from ${fragrances} group by brand_id) c
    where c.brand_id = b.id`);
  await db.execute(sql`
    update ${notes} n set fragrance_count = coalesce(c.n, 0)
    from (select note_id, count(*)::int n from ${fragranceNotes} group by note_id) c
    where c.note_id = n.id`);

  return { fragrances: fragranceRows.length, brands: brandNames.size, notes: noteRows.length, links: links.length };
}
