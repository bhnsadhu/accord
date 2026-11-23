import "server-only";
import { getCatalogSnapshot } from "./snapshot";
import { parseFragranceQuery } from "./search-query";
import { foldText } from "./text";
import type { CatalogRecord } from "./snapshot-types";
import type { FragranceDetail, FragranceSummary, SearchParams, SearchResult } from "./types";
export type { FragranceDetail, FragranceSummary, SearchParams, SearchResult } from "./types";

const alphabetical = (a: string, b: string) => a.localeCompare(b, "en");
let indexed: Promise<Awaited<ReturnType<typeof createIndex>>> | undefined;
async function createIndex() {
  const snapshot = await getCatalogSnapshot();
  return {
    snapshot,
    byId: new Map(snapshot.fragrances.map(f => [f.productId, f])),
    search: snapshot.fragrances.map(f => {
      const text = foldText(`${f.searchText} ${f.aliasesText}`);
      return { f, text, name: foldText(f.name), words: text.split(/\s+/) };
    }),
  };
}
function index() {
  indexed ??= createIndex().catch(error => { indexed = undefined; throw error; });
  return indexed;
}

function detail(f: CatalogRecord): FragranceDetail {
  const { searchText: _search, aliasesText: _aliases, featureYear: _year, ...result } = f;
  return result;
}
function summary(f: CatalogRecord): FragranceSummary {
  const { accordsRaw: _accords, noteKeys: _keys, research: _research, ...result } = detail(f);
  return result;
}

/** Small edit distances also allow an adjacent transposition, such as "santla". */
function distance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  let beforePrevious = previous;
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(row[j - 1] + 1, previous[j] + 1, previous[j - 1] + Number(a[i - 1] !== b[j - 1]));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) row[j] = Math.min(row[j], beforePrevious[j - 2] + 1);
    }
    if (Math.min(...row) > limit) return limit + 1;
    beforePrevious = previous;
    previous = row;
  }
  return previous[b.length];
}
function fuzzyCost(query: string[], words: string[]) {
  let total = 0;
  for (const word of query) {
    if (words.some(candidate => candidate.startsWith(word))) continue;
    const limit = word.length >= 6 ? 2 : word.length >= 4 ? 1 : 0;
    if (!limit) return null;
    const cost = Math.min(...words.map(candidate => distance(word, candidate, limit)));
    if (cost > limit) return null;
    total += cost;
  }
  return total;
}

/** Filter and rank the bundled public catalog without a database connection. */
export async function searchFragrances(params: SearchParams): Promise<SearchResult> {
  const pageSize = Number.isFinite(params.pageSize) ? Math.min(Math.max(Math.trunc(params.pageSize!), 1), 60) : 24;
  const page = Number.isFinite(params.page) ? Math.min(Math.max(Math.trunc(params.page!), 1), 2000) : 1;
  const parsed = parseFragranceQuery((params.q ?? "").slice(0, 200));
  const q = parsed.text;
  const words = q.split(" ").filter(Boolean);
  const concentration = params.concentration || parsed.concentration;
  const included = [...new Set(params.notes ?? [])].slice(0, 12);
  const excluded = [...new Set(params.excludeNotes ?? [])].slice(0, 12);
  const sort = params.sort ?? (q ? "relevance" : "name");
  const matches: { f: CatalogRecord; rank: number[] }[] = [];
  for (const entry of (await index()).search) {
    const { f, text, name } = entry;
    if (params.family && f.family !== params.family || params.wheel && f.wheel !== params.wheel || params.facet && !f.facets.includes(params.facet) ||
        params.gender && f.gender !== params.gender || params.brand && f.brandSlug !== params.brand || concentration && f.concentration !== concentration ||
        params.year && Number.isInteger(params.year) && f.year !== params.year || params.perfumer && !f.perfumers?.includes(params.perfumer) ||
        !included.every(key => f.noteKeys.includes(key)) || excluded.some(key => f.noteKeys.includes(key))) continue;
    const allWords = words.every(word => text.includes(word));
    const cost = allWords ? 0 : fuzzyCost(words, entry.words);
    if (cost === null) continue;
    const rank = q ? [Number(f.searchText === q), Number(name === q), Number(allWords), Number(name.startsWith(q)), Number(text.startsWith(q) || text.includes(` ${q}`)), -cost] : [];
    matches.push({ f, rank });
  }
  matches.sort((a, b) => {
    if (sort === "relevance" && q) {
      for (let i = 0; i < a.rank.length; i++) if (a.rank[i] !== b.rank[i]) return b.rank[i] - a.rank[i];
    } else if (sort === "newest" || sort === "oldest") {
      if (a.f.year !== b.f.year) {
        if (a.f.year === null) return 1;
        if (b.f.year === null) return -1;
        return sort === "newest" ? b.f.year - a.f.year : a.f.year - b.f.year;
      }
    } else {
      const brand = alphabetical(a.f.brand, b.f.brand);
      if (brand) return brand;
    }
    return alphabetical(a.f.name, b.f.name) || alphabetical(a.f.productId, b.f.productId);
  });
  return { items: matches.slice((page - 1) * pageSize, page * pageSize).map(({ f }) => summary(f)), total: matches.length, page, pageSize };
}

export async function getFragrance(productId: string): Promise<FragranceDetail | null> {
  const f = (await index()).byId.get(productId);
  return f ? detail(f) : null;
}
export async function getFragrancesByIds(ids: string[]): Promise<FragranceSummary[]> {
  const { byId } = await index();
  return ids.flatMap(id => { const f = byId.get(id); return f ? [summary(f)] : []; });
}
export async function getBrand(slug: string) { return (await getCatalogSnapshot()).brands.find(b => b.slug === slug) ?? null; }
export async function getEditions(group: string) {
  return (await getCatalogSnapshot()).fragrances.filter(f => f.editionGroup === group)
    .sort((a, b) => (a.featureYear ?? Infinity) - (b.featureYear ?? Infinity) || alphabetical(a.name, b.name)).map(summary);
}
export async function catalogCoverage() { return (await getCatalogSnapshot()).coverage; }
export async function getNote(key: string) { return (await getCatalogSnapshot()).notes.find(n => n.key === key) ?? null; }
export async function listNotes() { return (await getCatalogSnapshot()).notes; }
export async function listBrands(limit = 2000) { return (await getCatalogSnapshot()).brands.slice(0, limit); }
export async function facetCounts() { return (await getCatalogSnapshot()).facets; }
export async function noteFamilyStats() { return (await getCatalogSnapshot()).noteFamilies; }
export async function listPerfumers() { return (await getCatalogSnapshot()).perfumers; }
export async function yearCounts() { return (await getCatalogSnapshot()).years; }

function counts(values: string[]) {
  const totals = new Map<string, number>();
  for (const value of values) totals.set(value, (totals.get(value) ?? 0) + 1);
  return [...totals].map(([value, n]) => ({ value, n })).sort((a, b) => b.n - a.n || alphabetical(a.value, b.value));
}
export async function brandOverview(slug: string) {
  const snapshot = await getCatalogSnapshot();
  const brand = await getBrand(slug);
  if (!brand) return null;
  const rows = snapshot.fragrances.filter(f => f.brandSlug === slug);
  const years = rows.flatMap(f => f.year === null ? [] : [f.year]);
  const labels = new Map(snapshot.notes.map(n => [n.key, n.label]));
  return {
    brand,
    span: { first: years.length ? Math.min(...years) : null, last: years.length ? Math.max(...years) : null, dated: years.length },
    families: counts(rows.flatMap(f => f.wheel ? [f.wheel] : [])).map(({ value: wheel, n }) => ({ wheel, n })),
    perfumers: counts(rows.flatMap(f => f.perfumers ?? [])).map(({ value: name, n }) => ({ name, n })),
    topNotes: counts(rows.flatMap(f => f.noteKeys)).map(({ value: key, n }) => ({ key, label: labels.get(key) ?? key, n })).sort((a, b) => b.n - a.n || alphabetical(a.label, b.label)).slice(0, 12),
    genders: counts(rows.flatMap(f => f.gender ? [f.gender] : [])).map(({ value: gender, n }) => ({ gender, n })),
  };
}
