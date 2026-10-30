import type { CatalogIndex, Item } from "./catalog-index";
import { diversify } from "./recommend";
import { similarityBreakdown, type SimilarityBreakdown } from "./similarity";

export type SimilarResult = { productId: string; similarity: SimilarityBreakdown; sharedNotes: string[] };

/** "What smells like this?": nearest neighbours by note/accord/family similarity, diversified. */
export function similarTo(index: CatalogIndex, productId: string, k = 12): SimilarResult[] {
  const target = index.byId.get(productId);
  if (!target) return [];

  // Only fragrances sharing at least one note or accord can score meaningfully.
  const candidates = new Set<number>();
  for (const n of target.noteIds) for (const i of index.notePostings[n]) candidates.add(i);
  for (const a of target.accordIds) for (const i of index.accordPostings[a]) candidates.add(i);
  candidates.delete(target.idx);

  const ranked = [...candidates]
    .map((i) => {
      const item = index.items[i];
      return { item, breakdown: similarityBreakdown(target, item), score: 0 };
    })
    .map((r) => ({ ...r, score: r.breakdown.score }))
    .sort((a, b) => b.score - a.score || a.item.idx - b.item.idx);

  return diversify(ranked, k, { lambda: 0.85, perBrand: 3 }).map((r) => ({
    productId: r.item.productId,
    similarity: r.breakdown,
    sharedNotes: sharedNoteKeys(index, target, r.item),
  }));
}

export function sharedNoteKeys(index: CatalogIndex, a: Item, b: Item): string[] {
  const bSet = new Set(b.noteIds);
  return [...a.noteIds]
    .map((n, j) => ({ n, w: a.noteW[j] }))
    .filter(({ n }) => bSet.has(n))
    .sort((x, y) => y.w - x.w)
    .map(({ n }) => index.noteKeys[n]);
}

/**
 * Cold start without any signal: for each wheel family, the fragrances closest
 * to that family's average note profile: its most archetypal members :
 * interleaved so the first screen spans the whole wheel. No popularity data
 * exists in the catalog, so none is implied.
 */
export function archetypes(index: CatalogIndex, perWheel = 3): string[] {
  const groups = new Map<string, Item[]>();
  for (const item of index.items) {
    if (!item.wheel || item.noteIds.length < 5) continue;
    const list = groups.get(item.wheel) ?? [];
    list.push(item);
    groups.set(item.wheel, list);
  }
  const picks: string[][] = [];
  for (const items of [...groups.values()].sort((a, b) => b.length - a.length)) {
    if (items.length < 20) continue;
    const centroid = new Float64Array(index.noteKeys.length);
    for (const it of items) for (let j = 0; j < it.noteIds.length; j++) centroid[it.noteIds[j]] += it.noteW[j];
    const seenBrands = new Set<string>();
    const ranked = items
      .map((it) => {
        let dot = 0;
        for (let j = 0; j < it.noteIds.length; j++) dot += centroid[it.noteIds[j]] * it.noteW[j];
        return { it, dot };
      })
      .sort((a, b) => b.dot - a.dot || a.it.idx - b.it.idx);
    const chosen: string[] = [];
    for (const { it } of ranked) {
      if (seenBrands.has(it.brand)) continue;
      seenBrands.add(it.brand);
      chosen.push(it.productId);
      if (chosen.length === perWheel) break;
    }
    picks.push(chosen);
  }
  const out: string[] = [];
  for (let round = 0; round < perWheel; round++) for (const p of picks) if (p[round]) out.push(p[round]);
  return out;
}
