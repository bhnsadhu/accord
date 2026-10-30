import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import type { Database } from "@/db";
import { brands, fragranceNotes, fragrances, notes } from "@/db/schema";
import { foldText } from "./text";

export type FragranceSummary = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  brandSlug: string;
  family: string | null;
  subfamily: string | null;
  wheel: string | null;
  character: string | null;
  facets: string[];
  gender: "feminine" | "masculine" | "unisex" | null;
  year: number | null;
  notes: string[];
};

export type FragranceDetail = FragranceSummary & {
  accordsRaw: string;
  notes: string[];
  noteKeys: string[];
};

export type SearchParams = {
  q?: string;
  family?: string;
  wheel?: string;
  facet?: string;
  notes?: string[];
  excludeNotes?: string[];
  gender?: "feminine" | "masculine" | "unisex";
  brand?: string;
  sort?: "relevance" | "name" | "newest" | "oldest";
  page?: number;
  pageSize?: number;
};

export type SearchResult = { items: FragranceSummary[]; total: number; page: number; pageSize: number };

const noteLabels = sql<string[]>`coalesce((
  select array_agg(n.label order by fn.position)
  from ${fragranceNotes} fn join ${notes} n on n.id = fn.note_id
  where fn.product_id = ${fragrances.productId}
), '{}')`;

const summaryColumns = {
  productId: fragrances.productId,
  slug: fragrances.slug,
  name: fragrances.name,
  brand: brands.name,
  brandSlug: brands.slug,
  family: fragrances.family,
  subfamily: fragrances.subfamily,
  wheel: fragrances.wheel,
  character: fragrances.character,
  facets: fragrances.facets,
  gender: fragrances.gender,
  year: fragrances.year,
  notes: noteLabels,
};

function hasNote(key: string): SQL {
  return sql`exists (
    select 1 from ${fragranceNotes} fn join ${notes} n on n.id = fn.note_id
    where fn.product_id = ${fragrances.productId} and n.key = ${key})`;
}

/**
 * Fuzzy name/brand search plus attribute filters, all in Postgres.
 * A row matches the text query when it contains every query word, contains
 * the whole phrase, or is trigram-similar enough to absorb a typo.
 */
export async function searchFragrances(db: Database, params: SearchParams): Promise<SearchResult> {
  const pageSize = Math.min(Math.max(params.pageSize ?? 24, 1), 60);
  const page = Math.max(params.page ?? 1, 1);
  const q = foldText(params.q ?? "").slice(0, 80);
  const words = q.split(" ").filter(Boolean);

  const filters: SQL[] = [];
  if (q) {
    const allWords = and(...words.map((w) => sql`${fragrances.searchText} like ${`%${w}%`}`))!;
    filters.push(sql`(${allWords} or ${q} <% ${fragrances.searchText})`);
  }
  if (params.family) filters.push(eq(fragrances.family, params.family));
  if (params.wheel) filters.push(eq(fragrances.wheel, params.wheel));
  if (params.facet) filters.push(sql`${fragrances.facets} @> array[${params.facet}]::text[]`);
  if (params.gender) filters.push(eq(fragrances.gender, params.gender));
  if (params.brand) filters.push(eq(brands.slug, params.brand));
  for (const key of params.notes ?? []) filters.push(hasNote(key));
  for (const key of params.excludeNotes ?? []) filters.push(sql`not ${hasNote(key)}`);

  const sort = params.sort ?? (q ? "relevance" : "name");
  const order: SQL[] =
    sort === "relevance" && q
      ? [
          sql`(${fragrances.searchText} like ${`${q}%`} or ${fragrances.searchText} like ${`% ${q}%`}) desc`,
          sql`word_similarity(${q}, ${fragrances.searchText}) desc`,
          sql`similarity(${q}, ${fragrances.searchText}) desc`,
          asc(fragrances.name),
        ]
      : sort === "newest"
        ? [sql`${fragrances.year} desc nulls last`, asc(fragrances.name)]
        : sort === "oldest"
          ? [sql`${fragrances.year} asc nulls last`, asc(fragrances.name)]
          : [asc(brands.name), asc(fragrances.name)];

  const rows = await db
    .select({ ...summaryColumns, total: sql<number>`count(*) over ()`.mapWith(Number) })
    .from(fragrances)
    .innerJoin(brands, eq(brands.id, fragrances.brandId))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(...order, asc(fragrances.productId))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    items: rows.map(({ total: _total, ...item }) => item),
    total: rows[0]?.total ?? 0,
    page,
    pageSize,
  };
}

export async function getFragrance(db: Database, productId: string): Promise<FragranceDetail | null> {
  const [row] = await db
    .select({
      ...summaryColumns,
      accordsRaw: fragrances.accordsRaw,
      noteKeys: sql<string[]>`coalesce((
        select array_agg(n.key order by fn.position)
        from ${fragranceNotes} fn join ${notes} n on n.id = fn.note_id
        where fn.product_id = ${fragrances.productId}
      ), '{}')`,
    })
    .from(fragrances)
    .innerJoin(brands, eq(brands.id, fragrances.brandId))
    .where(eq(fragrances.productId, productId));
  return row ?? null;
}

export async function getFragrancesByIds(db: Database, ids: string[]): Promise<FragranceSummary[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select(summaryColumns)
    .from(fragrances)
    .innerJoin(brands, eq(brands.id, fragrances.brandId))
    .where(sql`${fragrances.productId} = any(${sql.param(ids)}::text[])`);
  const byId = new Map(rows.map((r) => [r.productId, r]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

export async function getBrand(db: Database, slug: string) {
  const [row] = await db.select().from(brands).where(eq(brands.slug, slug));
  return row ?? null;
}

export async function getNote(db: Database, key: string) {
  const [row] = await db.select().from(notes).where(eq(notes.key, key));
  return row ?? null;
}

export async function listNotes(db: Database) {
  return db.select().from(notes).orderBy(desc(notes.fragranceCount), asc(notes.label));
}

export async function listBrands(db: Database, limit = 2000) {
  return db.select().from(brands).orderBy(desc(brands.fragranceCount), asc(brands.name)).limit(limit);
}

export async function facetCounts(db: Database) {
  const [families, wheels, facets] = await Promise.all([
    db
      .select({ value: fragrances.family, count: sql<number>`count(*)`.mapWith(Number) })
      .from(fragrances)
      .where(sql`${fragrances.family} is not null`)
      .groupBy(fragrances.family)
      .orderBy(sql`2 desc`),
    db
      .select({ value: fragrances.wheel, count: sql<number>`count(*)`.mapWith(Number) })
      .from(fragrances)
      .where(sql`${fragrances.wheel} is not null`)
      .groupBy(fragrances.wheel)
      .orderBy(sql`2 desc`),
    db.execute<{ value: string; count: number }>(sql`
      select f as value, count(*)::int as count
      from ${fragrances}, unnest(${fragrances.facets}) f
      group by f order by 2 desc`),
  ]);
  return {
    families: families as { value: string; count: number }[],
    wheels: wheels as { value: string; count: number }[],
    facets: facets.rows,
  };
}
