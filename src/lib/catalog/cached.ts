import { cacheLife, cacheTag } from "next/cache";
import { similarFragrances } from "@/lib/reco/service";
import { brandOverview, catalogCoverage, facetCounts, getEditions, getFragrance, getFragrancesByIds, getNote, listBrands, listNotes, listPerfumers, noteFamilyStats, searchFragrances, yearCounts, type SearchParams } from "./queries";
import { withBottleThumbnail } from "./bottle-media";
import { accordProfile } from "./accord-profile";

// The catalog only changes when it is re-seeded; tag "catalog" invalidates it.

export async function cachedEditions(group: string) {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");
  return (await getEditions(group)).map(withBottleThumbnail);
}

export async function cachedCoverage() {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");
  return catalogCoverage();
}

export async function cachedFragrance(productId: string) {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  const fragrance = await getFragrance(productId);
  return fragrance ? withBottleThumbnail(fragrance) : null;
}

export async function cachedFragrancesByIds(ids: string[]) {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  return (await getFragrancesByIds(ids)).map(withBottleThumbnail);
}

export async function cachedSearch(params: SearchParams) {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");
  const result = await searchFragrances(params);
  return { ...result, items: result.items.map(withBottleThumbnail) };
}

export async function cachedSimilar(productId: string, k = 12) {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  const similar = await similarFragrances(productId, k);
  const [rows, notes] = await Promise.all([getFragrancesByIds(similar.map((s) => s.productId)), listNotes()]);
  const byId = new Map(rows.map((r) => [r.productId, r]));
  const label = new Map(notes.map((n) => [n.key, n.label]));
  return similar.flatMap((s) => {
    const fragrance = byId.get(s.productId);
    const sharedNotes = s.sharedNotes.map((key) => label.get(key) ?? key);
    return fragrance ? [{ fragrance: withBottleThumbnail(fragrance), similarity: s.similarity, sharedNotes }] : [];
  });
}

export async function cachedFacets() {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  return facetCounts();
}

export async function cachedNotes() {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  return listNotes();
}

export async function cachedNote(key: string) {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  return getNote(key);
}

/**
 * The homepage demonstration: what Accord would suggest to someone who loves
 * one well-known fragrance, with the shared notes that justify it. Computed
 * by the real engine; nothing here is written by hand.
 */
export async function cachedExample(sourceIds: string[]) {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  const { getCatalogIndex } = await import("@/lib/reco/load");
  const { recommend } = await import("@/lib/reco/recommend");
  const { similarity: sim } = await import("@/lib/reco/similarity");
  const index = await getCatalogIndex();
  // Among well-known sources, show the pair the engine itself scores closest.
  let best: { sourceId: string; pick: ReturnType<typeof recommend>[number]; score: number } | null = null;
  for (const sourceId of sourceIds) {
    const a = index.byId.get(sourceId);
    if (!a) continue;
    const recs = recommend(index, { items: [{ productId: sourceId, weight: 1 }] }, { k: 12 });
    // A different house, so the showcase is never a flanker of its own source.
    const pick = recs.find(
      (r) => index.byId.get(r.productId)?.brand !== a.brand && r.reasons.some((x) => x.kind === "shared-notes"),
    );
    const b = pick && index.byId.get(pick.productId);
    if (!pick || !b) continue;
    const score = sim(a, b);
    if (!best || score > best.score) best = { sourceId, pick, score };
  }
  if (!best) return null;
  const { sourceId, pick } = best;
  const shared = pick.reasons.find((x) => x.kind === "shared-notes");
  const [rows, notes] = await Promise.all([getFragrancesByIds([sourceId, pick.productId]), listNotes()]);
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
  return (await getFragrancesByIds(archetypes(await getCatalogIndex(), 1))).map(withBottleThumbnail);
}

/** Side-by-side comparison of two fragrances with the similarity breakdown. */
export async function cachedCompare(a: string, b: string) {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  const { getCatalogIndex } = await import("@/lib/reco/load");
  const { similarityBreakdown } = await import("@/lib/reco/similarity");
  const [fa, fb, index] = await Promise.all([getFragrance(a), getFragrance(b), getCatalogIndex()]);
  if (!fa || !fb) return null;
  const ia = index.byId.get(a);
  const ib = index.byId.get(b);
  const breakdown = ia?.wheel && ib?.wheel && ia.character && ib.character ? similarityBreakdown(ia, ib) : null;
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

/** The estimated accord profile for one fragrance (see accord-profile.ts). */
export async function cachedAccordProfile(noteKeys: string[], primary: string | null) {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  return accordProfile(noteKeys, await noteFamilyStats(), { primary });
}

export async function cachedBrands() {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  return listBrands(5000);
}

export async function cachedBrandOverview(slug: string) {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  return brandOverview(slug);
}

export async function cachedPerfumers() {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  return listPerfumers();
}

export async function cachedYears() {
  "use cache";
  cacheLife("weeks");
  cacheTag("catalog");
  return yearCounts();
}
