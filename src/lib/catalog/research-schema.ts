import { z } from "zod";

export const CONCENTRATIONS = ["Eau de cologne", "Eau de toilette", "Eau de parfum", "Parfum", "Extrait de parfum"] as const;
const cleanText = (max: number) => z.string().trim().min(1).max(max).refine(v => !/[\u2013\u2014]/.test(v), "Use ordinary punctuation");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const parsed = new Date(v); return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === v; }, "Invalid date");
const sourceFields = ["identity", "summary", "concentration", "perfumers", "year", "noteStages", "featuredNotes", "edition", "wear", "image"] as const;
export const researchSourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: cleanText(160),
  publisher: cleanText(100),
  url: z.url().refine(v => v.startsWith("https://"), "Use an HTTPS source"),
  kind: z.enum(["brand", "perfumer", "reference"]),
  checkedAt: date,
  fields: z.array(z.enum(sourceFields)).min(1),
}).strict();

export const researchSchema = z.object({
  summary: cleanText(650).optional(),
  concentration: z.enum(CONCENTRATIONS).optional(),
  perfumers: z.array(cleanText(100)).max(8).default([]),
  year: z.number().int().min(1700).max(2100).optional(),
  featuredNotes: z.array(cleanText(70)).max(30).default([]),
  noteStages: z.object({ opening: z.array(cleanText(70)).max(20), heart: z.array(cleanText(70)).max(20), base: z.array(cleanText(70)).max(20) }).strict().optional(),
  editionGroup: z.string().regex(/^[a-z0-9-]+$/).max(100).optional(),
  editionLabel: cleanText(100).optional(),
  aliases: z.array(cleanText(120)).max(20).default([]),
  wear: z.array(z.object({ aspect: z.enum(["Longevity", "Projection", "Scent trail", "When to wear"]), text: cleanText(400), sourceId: z.string() }).strict()).max(8).default([]),
  image: z.object({ path: z.string().regex(/^\/images\/fragrances\/[a-z0-9-]+\.(webp|png|jpg)$/), alt: cleanText(160), credit: cleanText(160), permission: cleanText(300), sourceId: z.string() }).strict().optional(),
  sources: z.array(researchSourceSchema).min(1).max(20),
}).strict().superRefine((value, ctx) => {
  const ids = value.sources.map(s => s.id);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "Duplicate source IDs" });
  const fields = new Set(value.sources.flatMap(s => s.fields));
  for (const field of ["summary", "concentration", "year", "noteStages", "image"] as const) {
    if (value[field] !== undefined && !fields.has(field)) ctx.addIssue({ code: "custom", message: `Missing source for ${field}` });
  }
  for (const field of ["perfumers", "featuredNotes"] as const) {
    if (value[field].length && !fields.has(field)) ctx.addIssue({ code: "custom", message: `Missing source for ${field}` });
  }
  if ((value.editionGroup || value.editionLabel) && (!value.editionGroup || !value.editionLabel || !fields.has("edition"))) ctx.addIssue({ code: "custom", message: "Edition needs a group, label and source" });
  for (const report of value.wear) {
    if (!value.sources.some(s => s.id === report.sourceId && s.fields.includes("wear"))) ctx.addIssue({ code: "custom", message: "Wear guidance needs a matching source" });
  }
  if (value.image && !value.sources.some(s => s.id === value.image!.sourceId && s.fields.includes("image"))) ctx.addIssue({ code: "custom", message: "Image needs a matching source" });
});

export type FragranceResearch = z.infer<typeof researchSchema>;
export type ResearchSource = z.infer<typeof researchSourceSchema>;

export const catalogEntrySchema = z.object({
  productId: z.string().regex(/^(p\d{5}|a[0-9a-f]{12})$/),
  brand: cleanText(160),
  name: cleanText(200),
  // Only new Accord IDs can create catalog entries. ScentLens IDs must already exist.
  catalog: z.object({
    notes: z.array(cleanText(70)).min(1).max(40),
    family: cleanText(80).optional(),
    wheel: cleanText(80).optional(),
    gender: z.enum(["feminine", "masculine", "unisex"]).optional(),
  }).strict().optional(),
  research: researchSchema,
}).strict();
export const catalogManifestSchema = z.object({ version: z.literal(1), entries: z.array(catalogEntrySchema).min(1) }).strict().superRefine((value, ctx) => {
  if (new Set(value.entries.map(e => e.productId)).size !== value.entries.length) ctx.addIssue({ code: "custom", message: "Duplicate product IDs" });
});
export type CatalogManifest = z.infer<typeof catalogManifestSchema>;

export function sourcesFor(research: FragranceResearch, field: ResearchSource["fields"][number]) {
  return research.sources.filter(source => source.fields.includes(field));
}

export function researchDate(research: FragranceResearch) {
  return research.sources.map(s => s.checkedAt).sort().at(-1)!;
}
