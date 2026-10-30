import type { Item } from "./catalog-index";

/**
 * Item-to-item similarity, adapted from the accord-aware perfume similarity in
 * Fragrance DNA (MIT, github.com/mikeyoknow/fragrance-dna), which blends note
 * overlap 0.7 with accord overlap 0.3. Accord keeps that note-first balance and
 * adds two signals the ScentLens catalog provides: family/subfamily and the
 * wheel "character" (fresher, classical, crisp, richer). Notes use IDF-weighted
 * cosine instead of plain Jaccard so ubiquitous notes count for less.
 */
export const SIMILARITY_WEIGHTS = { notes: 0.55, accords: 0.25, family: 0.15, character: 0.05 } as const;

export type SimilarityBreakdown = {
  score: number;
  notes: number;
  accords: number;
  family: number;
  character: number;
};

/** Cosine of two sparse, L2-normalized vectors with sorted ids. */
export function sparseDot(aIds: Int32Array, aW: Float32Array, bIds: Int32Array, bW: Float32Array): number {
  let i = 0;
  let j = 0;
  let sum = 0;
  while (i < aIds.length && j < bIds.length) {
    if (aIds[i] === bIds[j]) {
      sum += aW[i] * bW[j];
      i++;
      j++;
    } else if (aIds[i] < bIds[j]) i++;
    else j++;
  }
  return sum;
}

export function jaccard(a: Int32Array, b: Int32Array): number {
  if (a.length === 0 && b.length === 0) return 0;
  let i = 0;
  let j = 0;
  let shared = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      shared++;
      i++;
      j++;
    } else if (a[i] < b[j]) i++;
    else j++;
  }
  return shared / (a.length + b.length - shared);
}

export function familyAgreement(a: Item, b: Item): number {
  return (a.family && a.family === b.family ? 0.6 : 0) + (a.subfamily && a.subfamily === b.subfamily ? 0.4 : 0);
}

export function similarityBreakdown(a: Item, b: Item): SimilarityBreakdown {
  const notes = sparseDot(a.noteIds, a.noteW, b.noteIds, b.noteW);
  const accords = jaccard(a.accordIds, b.accordIds);
  const family = familyAgreement(a, b);
  const character = a.character && a.character === b.character ? 1 : 0;
  const w = SIMILARITY_WEIGHTS;
  return {
    score: w.notes * notes + w.accords * accords + w.family * family + w.character * character,
    notes,
    accords,
    family,
    character,
  };
}

export function similarity(a: Item, b: Item): number {
  return similarityBreakdown(a, b).score;
}
