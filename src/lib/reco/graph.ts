import type { CatalogIndex } from "./catalog-index";

/**
 * Personalized PageRank over the fragrance–note–accord graph, after the PPR
 * recommender in Fragrance DNA (MIT, github.com/mikeyoknow/fragrance-dna),
 * which walks a perfume similarity graph. Here the walk runs on the bipartite
 * graph itself, so it needs no precomputed all-pairs similarity: mass flows
 * from a person's liked fragrances and notes to the notes and accords they
 * share, and on to other fragrances. Two hops let taste spread along real
 * co-occurrence (vanilla -> tonka bean -> fragrances built on tonka).
 */

const ACCORD_EDGE = 0.35;

type Graph = {
  itemOut: Float32Array;
  noteItems: Int32Array[];
  noteItemW: Float32Array[];
  noteTotal: Float32Array;
  accordTotal: Float32Array;
};

const graphs = new WeakMap<CatalogIndex, Graph>();

function graphFor(index: CatalogIndex): Graph {
  const cached = graphs.get(index);
  if (cached) return cached;
  const noteCount = index.noteKeys.length;
  const lists: { items: number[]; w: number[] }[] = Array.from({ length: noteCount }, () => ({ items: [], w: [] }));
  const itemOut = new Float32Array(index.items.length);
  const noteTotal = new Float32Array(noteCount);
  const accordTotal = new Float32Array(index.accordKeys.length);
  for (const item of index.items) {
    let out = 0;
    for (let j = 0; j < item.noteIds.length; j++) {
      const n = item.noteIds[j];
      lists[n].items.push(item.idx);
      lists[n].w.push(item.noteW[j]);
      noteTotal[n] += item.noteW[j];
      out += item.noteW[j];
    }
    for (const a of item.accordIds) accordTotal[a] += ACCORD_EDGE;
    itemOut[item.idx] = out + ACCORD_EDGE * item.accordIds.length;
  }
  const graph: Graph = {
    itemOut,
    noteItems: lists.map((l) => Int32Array.from(l.items)),
    noteItemW: lists.map((l) => Float32Array.from(l.w)),
    noteTotal,
    accordTotal,
  };
  graphs.set(index, graph);
  return graph;
}

export type Restart = {
  items?: Map<number, number>;
  notes?: Map<number, number>;
  accords?: Map<number, number>;
};

/**
 * Returns a PPR score per item (by item index). Only positive restart weights
 * are used; dislikes are handled by the scorer, not the walk.
 */
export function personalizedPageRank(
  index: CatalogIndex,
  restart: Restart,
  { alpha = 0.85, iterations = 16 } = {},
): Float64Array {
  const g = graphFor(index);
  const nItems = index.items.length;
  const nNotes = index.noteKeys.length;
  const nAccords = index.accordKeys.length;

  const r = { items: new Float64Array(nItems), notes: new Float64Array(nNotes), accords: new Float64Array(nAccords) };
  let total = 0;
  for (const [i, w] of restart.items ?? []) if (w > 0) (r.items[i] += w), (total += w);
  for (const [n, w] of restart.notes ?? []) if (w > 0) (r.notes[n] += w), (total += w);
  for (const [a, w] of restart.accords ?? []) if (w > 0) (r.accords[a] += w), (total += w);
  if (total === 0) return new Float64Array(nItems);
  for (const arr of [r.items, r.notes, r.accords]) for (let k = 0; k < arr.length; k++) arr[k] /= total;

  let p = { items: Float64Array.from(r.items), notes: Float64Array.from(r.notes), accords: Float64Array.from(r.accords) };

  for (let step = 0; step < iterations; step++) {
    const next = { items: new Float64Array(nItems), notes: new Float64Array(nNotes), accords: new Float64Array(nAccords) };
    for (const item of index.items) {
      const m = p.items[item.idx];
      if (m === 0 || g.itemOut[item.idx] === 0) continue;
      const share = (alpha * m) / g.itemOut[item.idx];
      for (let j = 0; j < item.noteIds.length; j++) next.notes[item.noteIds[j]] += share * item.noteW[j];
      for (const a of item.accordIds) next.accords[a] += share * ACCORD_EDGE;
    }
    for (let n = 0; n < nNotes; n++) {
      const m = p.notes[n];
      if (m === 0 || g.noteTotal[n] === 0) continue;
      const share = (alpha * m) / g.noteTotal[n];
      const items = g.noteItems[n];
      const w = g.noteItemW[n];
      for (let k = 0; k < items.length; k++) next.items[items[k]] += share * w[k];
    }
    for (let a = 0; a < nAccords; a++) {
      const m = p.accords[a];
      if (m === 0 || g.accordTotal[a] === 0) continue;
      const share = (alpha * m * ACCORD_EDGE) / g.accordTotal[a];
      for (const i of index.accordPostings[a]) next.items[i] += share;
    }
    for (let k = 0; k < nItems; k++) next.items[k] += (1 - alpha) * r.items[k];
    for (let k = 0; k < nNotes; k++) next.notes[k] += (1 - alpha) * r.notes[k];
    for (let k = 0; k < nAccords; k++) next.accords[k] += (1 - alpha) * r.accords[k];
    p = next;
  }

  // Dampen the pull of items with many edges, which otherwise collect mass
  // from every note they list regardless of fit.
  const scores = p.items;
  for (let k = 0; k < nItems; k++) scores[k] = g.itemOut[k] > 0 ? scores[k] / Math.sqrt(g.itemOut[k]) : 0;
  return scores;
}
