import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { similarFragrances } from "@/lib/reco/service";
import { facetCounts, getFragrance, getFragrancesByIds, listNotes, searchFragrances, type SearchParams } from "./queries";

// The catalog only changes when it is re-seeded; tag "catalog" invalidates it.

export async function cachedFragrance(productId: string) {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  return getFragrance(db, productId);
}

export async function cachedFragrancesByIds(ids: string[]) {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  return getFragrancesByIds(db, ids);
}

export async function cachedSearch(params: SearchParams) {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");
  return searchFragrances(db, params);
}

export async function cachedSimilar(productId: string, k = 12) {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  const similar = await similarFragrances(db, productId, k);
  const [rows, notes] = await Promise.all([getFragrancesByIds(db, similar.map((s) => s.productId)), listNotes(db)]);
  const byId = new Map(rows.map((r) => [r.productId, r]));
  const label = new Map(notes.map((n) => [n.key, n.label]));
  return similar.flatMap((s) => {
    const fragrance = byId.get(s.productId);
    const sharedNotes = s.sharedNotes.map((key) => label.get(key) ?? key);
    return fragrance ? [{ fragrance, similarity: s.similarity, sharedNotes }] : [];
  });
}

export async function cachedFacets() {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  return facetCounts(db);
}

export async function cachedNotes() {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  return listNotes(db);
}

/**
 * The homepage demonstration: what Accord would suggest to someone who loves
 * one well-known fragrance, with the shared notes that justify it. Computed
 * by the real engine; nothing here is written by hand.
 */
export async function cachedExample(sourceId: string) {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  const { getCatalogIndex } = await import("@/lib/reco/load");
  const { recommend } = await import("@/lib/reco/recommend");
  const index = await getCatalogIndex(db);
  const recs = recommend(index, { items: [{ productId: sourceId, weight: 1 }] }, { k: 5 });
  const pick = recs.find((r) => r.reasons.some((x) => x.kind === "shared-notes")) ?? recs[0];
  if (!pick) return null;
  const shared = pick.reasons.find((x) => x.kind === "shared-notes");
  const [rows, notes] = await Promise.all([getFragrancesByIds(db, [sourceId, pick.productId]), listNotes(db)]);
  const label = new Map(notes.map((n) => [n.key, n.label]));
  const source = rows.find((r) => r.productId === sourceId);
  const fragrance = rows.find((r) => r.productId === pick.productId);
  if (!source || !fragrance) return null;
  const { similarity } = await import("@/lib/reco/similarity");
  const a = index.byId.get(sourceId);
  const b = index.byId.get(pick.productId);
  return {
    source,
    fragrance,
    similarity: a && b ? Math.round(similarity(a, b) * 100) : null,
    sharedNotes: shared?.kind === "shared-notes" ? shared.notes.map((k) => label.get(k) ?? k) : [],
  };
}

export async function cachedArchetypes() {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  const { getCatalogIndex } = await import("@/lib/reco/load");
  const { archetypes } = await import("@/lib/reco/discover");
  return getFragrancesByIds(db, archetypes(await getCatalogIndex(db), 1));
}

/** Side-by-side comparison of two fragrances with the similarity breakdown. */
export async function cachedCompare(a: string, b: string) {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  const { getCatalogIndex } = await import("@/lib/reco/load");
  const { similarityBreakdown } = await import("@/lib/reco/similarity");
  const [fa, fb, index] = await Promise.all([getFragrance(db, a), getFragrance(db, b), getCatalogIndex(db)]);
  if (!fa || !fb) return null;
  const ia = index.byId.get(a);
  const ib = index.byId.get(b);
  const breakdown = ia && ib ? similarityBreakdown(ia, ib) : null;
  const bKeys = new Set(fb.noteKeys);
  const aKeys = new Set(fa.noteKeys);
  return {
    a: fa,
    b: fb,
    breakdown,
    shared: fa.notes.filter((_, i) => bKeys.has(fa.noteKeys[i])),
    onlyA: fa.notes.filter((_, i) => !bKeys.has(fa.noteKeys[i])),
    onlyB: fb.notes.filter((_, i) => !aKeys.has(fb.noteKeys[i])),
  };
}
