/**
 * In-memory feature index over the catalog. Every fragrance becomes:
 *  - a sparse note vector weighted by inverse document frequency, so a rare
 *    material (osmanthus) says more about a scent than musk, which appears in
 *    almost half the catalog;
 *  - a set of accord ids (Edwards wheel family + facets);
 *  - its family, subfamily and character labels.
 * Built once per server instance (~24k items, a few MB).
 */

export type Gender = "feminine" | "masculine" | "unisex";

export type FragranceFeatures = {
  productId: string;
  name: string;
  brand: string;
  family: string | null;
  subfamily: string | null;
  wheel: string | null;
  character: string | null;
  facets: string[];
  /** Note keys in source order. */
  notes: string[];
  gender: Gender | null;
  year: number | null;
};

export type Item = {
  idx: number;
  productId: string;
  name: string;
  brand: string;
  family: string | null;
  subfamily: string | null;
  wheel: string | null;
  character: string | null;
  gender: Gender | null;
  /** Sorted note ids with matching L2-normalized IDF weights. */
  noteIds: Int32Array;
  noteW: Float32Array;
  /** Sorted accord ids (wheel family first, then facets). */
  accordIds: Int32Array;
};

export type CatalogIndex = {
  items: Item[];
  byId: Map<string, Item>;
  noteKeys: string[];
  noteIndex: Map<string, number>;
  noteIdf: Float32Array;
  accordKeys: string[];
  accordIndex: Map<string, number>;
  /** noteId -> item indexes, for graph walks and candidate generation. */
  notePostings: Int32Array[];
  accordPostings: Int32Array[];
};

/** Accord ids are namespaced so a "Citrus" wheel family and a "Citrus" facet stay distinct. */
export const wheelKey = (wheel: string) => `wheel:${wheel}`;
export const facetKey = (facet: string) => `facet:${facet}`;

export function buildCatalogIndex(features: FragranceFeatures[]): CatalogIndex {
  const noteIndex = new Map<string, number>();
  const accordIndex = new Map<string, number>();
  const noteDf: number[] = [];
  const intern = (map: Map<string, number>, key: string) => {
    let id = map.get(key);
    if (id === undefined) {
      id = map.size;
      map.set(key, id);
    }
    return id;
  };

  const raw = features.map((f) => {
    const notes = [...new Set(f.notes)].map((k) => intern(noteIndex, k)).sort((a, b) => a - b);
    for (const n of notes) noteDf[n] = (noteDf[n] ?? 0) + 1;
    const accords = [
      ...(f.wheel ? [wheelKey(f.wheel)] : []),
      ...f.facets.map(facetKey),
    ].map((k) => intern(accordIndex, k));
    return { f, notes, accords: [...new Set(accords)].sort((a, b) => a - b) };
  });

  const n = features.length;
  const noteIdf = new Float32Array(noteIndex.size);
  for (let i = 0; i < noteIdf.length; i++) noteIdf[i] = Math.log((1 + n) / (1 + noteDf[i])) + 1;

  const notePostingLists: number[][] = Array.from({ length: noteIndex.size }, () => []);
  const accordPostingLists: number[][] = Array.from({ length: accordIndex.size }, () => []);

  const items: Item[] = raw.map(({ f, notes, accords }, idx) => {
    const w = new Float32Array(notes.length);
    let norm = 0;
    notes.forEach((id, j) => {
      w[j] = noteIdf[id];
      norm += w[j] * w[j];
    });
    norm = Math.sqrt(norm) || 1;
    for (let j = 0; j < w.length; j++) w[j] /= norm;
    for (const id of notes) notePostingLists[id].push(idx);
    for (const id of accords) accordPostingLists[id].push(idx);
    return {
      idx,
      productId: f.productId,
      name: f.name,
      brand: f.brand,
      family: f.family,
      subfamily: f.subfamily,
      wheel: f.wheel,
      character: f.character,
      gender: f.gender,
      noteIds: Int32Array.from(notes),
      noteW: w,
      accordIds: Int32Array.from(accords),
    };
  });

  return {
    items,
    byId: new Map(items.map((it) => [it.productId, it])),
    noteKeys: [...noteIndex.keys()],
    noteIndex,
    noteIdf,
    accordKeys: [...accordIndex.keys()],
    accordIndex,
    notePostings: notePostingLists.map((l) => Int32Array.from(l)),
    accordPostings: accordPostingLists.map((l) => Int32Array.from(l)),
  };
}
