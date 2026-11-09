/** Build an offline, reviewable research manifest from the licensed Scento snapshot.
 * Usage: tsx scripts/prepare-note-stages.ts source.jsonl output-directory YYYY-MM-DD
 * Does not write to the database. Use catalog:research to validate and import.
 */
import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { Pool } from "pg";
import { z } from "zod";
import { matchNoteStages } from "../src/lib/catalog/match-note-stages";
import { catalogManifestSchema, researchSchema } from "../src/lib/catalog/research-schema";
import { noteImage } from "../src/lib/catalog/media";
import { slugify } from "../src/lib/catalog/text";

const [input, output, checkedAt] = process.argv.slice(2);
if (!input || !output || !/^\d{4}-\d{2}-\d{2}$/.test(checkedAt ?? "")) throw new Error("Supply the downloaded Scento JSONL, an output directory and the source check date (YYYY-MM-DD)");
const raw = await readFile(input, "utf8");
const recordSchema = z.object({ id: z.string(), house: z.string(), name: z.string(), year: z.number().int().nullable(), concentration: z.string(), url: z.url().refine(url => /^https:\/\/www\.scento\.com\/(perfume-database\/)?perfumes\//.test(url)), top_notes: z.array(z.string()), heart_notes: z.array(z.string()), base_notes: z.array(z.string()) });
const references = raw.trim().split("\n").map(line => recordSchema.parse(JSON.parse(line))).map(row => ({ id: row.id, brand: row.house, name: row.name, year: row.year, concentration: row.concentration.replace(/-/g, " "), url: row.url, noteStages: { opening: row.top_notes, heart: row.heart_notes, base: row.base_notes } }));
const manifest = catalogManifestSchema.parse(JSON.parse(await readFile("data/research/fragrances.json", "utf8")));
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  const { rows } = await pool.query<{ productId: string; brand: string; name: string; year: number | null; research: unknown }>('select f.product_id as "productId", b.name as brand, f.name, f.year, r.data as research from fragrances f join brands b on b.id=f.brand_id left join fragrance_research r on r.product_id=f.product_id order by f.product_id');
  const catalog = rows.map(row => {
    const research = row.research ? researchSchema.parse(row.research) : null;
    return { ...row, research, year: research?.year ?? row.year, concentration: research?.concentration, hasStages: Boolean(research?.noteStages) };
  });
  const { matches, skipped } = matchNoteStages(catalog, references);
  const changes = matches.map(({ productId, reference }) => {
    const row = catalog.find(row => row.productId === productId)!;
    const existing = manifest.entries.find(entry => entry.productId === productId);
    const research = row.research ?? researchSchema.parse({ sources: [{ id: "scento-note-stages", title: `${row.name}: note stages`, publisher: "Scento", url: reference.url, kind: "reference", checkedAt, fields: ["noteStages"] }] });
    return { productId, brand: row.brand, name: row.name, ...(existing?.catalog ? { catalog: existing.catalog } : {}), research: { ...research, noteStages: reference.noteStages, sources: [...research.sources.filter(source => source.id !== "scento-note-stages"), { id: "scento-note-stages", title: `${row.name}: note stages`.slice(0, 160), publisher: "Scento", url: reference.url, kind: "reference" as const, checkedAt, fields: ["noteStages" as const] }] } };
  });
  const updated = catalogManifestSchema.parse({ version: 1, entries: [...manifest.entries.filter(entry => !changes.some(change => change.productId === entry.productId)), ...changes] });
  const missingImages = [...new Set(changes.flatMap(entry => Object.values(entry.research.noteStages).flat()))].filter(note => !noteImage(slugify(note))).sort();
  await mkdir(output, { recursive: true });
  for (const [name, value] of Object.entries({ "manifest.json": updated, "changes.json": { version: 1, entries: changes }, "report.json": { source: "https://github.com/Scento-com/perfume-dataset", sourceSha256: createHash("sha256").update(raw).digest("hex"), sourceRows: references.length, catalogRows: catalog.length, matched: matches.length, stagedTotal: updated.entries.filter(entry => entry.research.noteStages).length, missingImages, matches: matches.map(({ productId, reference }) => ({ productId, sourceId: reference.id, url: reference.url })), skipped } })) await writeFile(join(output, name), JSON.stringify(value, null, 2) + "\n");
  console.log(JSON.stringify({ matches: matches.length, stagedTotal: updated.entries.filter(entry => entry.research.noteStages).length, missingImages: missingImages.length, output }));
} finally { await pool.end(); }
