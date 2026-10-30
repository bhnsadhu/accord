import { facetKey, wheelKey, type CatalogIndex, type Gender, type Item } from "./catalog-index";
import { personalizedPageRank } from "./graph";
import { similarity } from "./similarity";

/** Strongest liked fragrances considered for nearest-neighbour scoring. */
const NEIGHBOR_LIMIT = 30;

/**
 * Everything Accord knows about a person's taste. Explicit choices come from
 * the scent profile; item weights come from their collection (see
 * itemWeightsFromCollection) and range from -1 (disliked) to 1 (loved).
 */
export type TasteSignals = {
  likedNotes?: string[];
  dislikedNotes?: string[];
  /** Wheel families ("Woody Amber") or facets ("Gourmand"). */
  likedAccords?: string[];
  /** Catalog families ("Woody", "Chypre"). */
  families?: string[];
  gender?: Gender | "any";
  items?: { productId: string; weight: number }[];
};

export type Reason =
  | { kind: "liked-notes"; notes: string[] }
  | { kind: "shared-notes"; notes: string[]; via: string[] }
  | { kind: "accord"; accord: string }
  | { kind: "family"; family: string }
  | { kind: "similar"; productId: string; weight: number };

export type Recommendation = {
  productId: string;
  score: number;
  /** Share of eligible catalog fragrances this one outscored, 0–100. A relative fit, not a probability. */
  match: number;
  reasons: Reason[];
};

/**
 * Blend of the scoring components. Chosen on the offline line hold-out task
 * in scripts/evaluate-reco.ts (see docs/EVALUATION.md):
 *  - notes:    cosine between the taste centroid and the fragrance's notes
 *  - accords:  overlap with preferred wheel families and facets
 *  - family:   agreement with preferred catalog families
 *  - graph:    personalized PageRank over the fragrance–note graph
 *  - neighbor: similarity to the single closest liked fragrance, which keeps
 *              a varied taste (citrus *and* oud) from averaging into mush
 */
export const SCORE_WEIGHTS = { notes: 0.4, accords: 0.05, family: 0.05, graph: 0.1, neighbor: 0.4 };

/** Rocchio-style: disliked fragrances push away at a fraction of a like's pull. */
const NEGATIVE_FACTOR = 0.6;
const EXPLICIT_NOTE_WEIGHT = 0.8;

export type CollectionSignal = {
  productId: string;
  shelf: "owned" | "tried" | "wishlist";
  rating: number | null;
  favorite: boolean;
};

/**
 * Turn collection state into a taste weight. A rating is the strongest
 * signal: 5 -> 1, 4 -> 0.5, 3 -> 0, 2 -> -0.5, 1 -> -1. Without a rating,
 * owning or wishing for a fragrance is a moderate positive signal.
 */
export function itemWeightFromCollection(entry: CollectionSignal): number {
  if (entry.rating != null) {
    const w = (entry.rating - 3) / 2;
    return entry.favorite ? Math.max(w, 0.75) : w;
  }
  if (entry.favorite) return 1;
  if (entry.shelf === "owned") return 0.6;
  if (entry.shelf === "wishlist") return 0.4;
  return 0.15;
}

function accordIdsForLabel(index: CatalogIndex, label: string): number[] {
  return [wheelKey(label), facetKey(label)].flatMap((k) => {
    const id = index.accordIndex.get(k);
    return id === undefined ? [] : [id];
  });
}

type Profile = {
  note: Float64Array;
  accord: Float64Array;
  family: Map<string, number>;
  subfamily: Map<string, number>;
  liked: { item: Item; weight: number }[];
  known: Set<number>;
  blockedNotes: Set<number>;
  explicitNotes: Set<number>;
  explicitAccords: Set<number>;
  explicitFamilies: Set<string>;
};

function normalize(v: Float64Array) {
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < v.length; i++) v[i] /= norm;
}

function buildProfile(index: CatalogIndex, signals: TasteSignals): Profile {
  const note = new Float64Array(index.noteKeys.length);
  const accord = new Float64Array(index.accordKeys.length);
  const family = new Map<string, number>();
  const subfamily = new Map<string, number>();
  const known = new Set<number>();
  const liked: Profile["liked"] = [];
  const bump = (m: Map<string, number>, k: string | null, w: number) => k && m.set(k, (m.get(k) ?? 0) + w);

  // Centroid of rated/collected fragrances.
  let mass = 0;
  for (const { productId, weight } of signals.items ?? []) {
    const item = index.byId.get(productId);
    if (!item) continue;
    known.add(item.idx);
    if (weight === 0) continue;
    const w = weight > 0 ? weight : weight * NEGATIVE_FACTOR;
    mass += Math.abs(w);
    if (weight > 0) liked.push({ item, weight });
    for (let j = 0; j < item.noteIds.length; j++) note[item.noteIds[j]] += w * item.noteW[j];
    const accordShare = item.accordIds.length ? 1 / Math.sqrt(item.accordIds.length) : 0;
    for (const a of item.accordIds) accord[a] += w * accordShare;
    bump(family, item.family, w);
    bump(subfamily, item.subfamily, w);
  }
  if (mass > 0) {
    for (let i = 0; i < note.length; i++) note[i] /= mass;
    for (let i = 0; i < accord.length; i++) accord[i] /= mass;
    for (const m of [family, subfamily]) for (const [k, v] of m) m.set(k, v / mass);
  }

  // Explicit preferences, as a unit vector of their own blended in.
  const explicitNotes = new Set<number>();
  for (const key of signals.likedNotes ?? []) {
    const id = index.noteIndex.get(key);
    if (id !== undefined) explicitNotes.add(id);
  }
  if (explicitNotes.size) {
    let norm = 0;
    for (const id of explicitNotes) norm += index.noteIdf[id] ** 2;
    norm = Math.sqrt(norm);
    for (const id of explicitNotes) note[id] += (EXPLICIT_NOTE_WEIGHT * index.noteIdf[id]) / norm;
  }
  const explicitAccords = new Set((signals.likedAccords ?? []).flatMap((l) => accordIdsForLabel(index, l)));
  for (const id of explicitAccords) accord[id] += EXPLICIT_NOTE_WEIGHT / Math.sqrt(explicitAccords.size);
  const explicitFamilies = new Set(signals.families ?? []);
  for (const f of explicitFamilies) family.set(f, (family.get(f) ?? 0) + EXPLICIT_NOTE_WEIGHT / explicitFamilies.size);

  const blockedNotes = new Set<number>();
  for (const key of signals.dislikedNotes ?? []) {
    const id = index.noteIndex.get(key);
    if (id === undefined) continue;
    blockedNotes.add(id);
    note[id] = Math.min(note[id], 0) - 0.5;
  }

  normalize(note);
  normalize(accord);
  return { note, accord, family, subfamily, liked, known, blockedNotes, explicitNotes, explicitAccords, explicitFamilies };
}

export function hasSignals(signals: TasteSignals): boolean {
  return Boolean(
    signals.likedNotes?.length ||
      signals.likedAccords?.length ||
      signals.families?.length ||
      signals.items?.some((i) => i.weight !== 0),
  );
}

type Scored = {
  item: Item;
  score: number;
  parts: { notes: number; accords: number; family: number; graph: number; neighbor: number };
};

function eligible(item: Item, profile: Profile, gender: TasteSignals["gender"]): boolean {
  if (profile.known.has(item.idx)) return false;
  if (gender && gender !== "any" && item.gender && item.gender !== gender && item.gender !== "unisex") return false;
  for (const n of item.noteIds) if (profile.blockedNotes.has(n)) return false;
  return true;
}

function scoreAll(index: CatalogIndex, profile: Profile, signals: TasteSignals): Scored[] {
  const restartItems = new Map(profile.liked.map(({ item, weight }) => [item.idx, weight]));
  const restartNotes = new Map([...profile.explicitNotes].map((id) => [id, 0.5]));
  const restartAccords = new Map([...profile.explicitAccords].map((id) => [id, 0.5]));
  const ppr = personalizedPageRank(index, { items: restartItems, notes: restartNotes, accords: restartAccords });

  const familyMax = Math.max(0, ...profile.family.values());
  const subfamilyMax = Math.max(0, ...profile.subfamily.values());

  const neighbors = [...profile.liked].sort((a, b) => b.weight - a.weight).slice(0, NEIGHBOR_LIMIT);

  const scored: Scored[] = [];
  let pprMax = 0;
  for (const item of index.items) {
    if (!eligible(item, profile, signals.gender)) continue;
    let notes = 0;
    for (let j = 0; j < item.noteIds.length; j++) notes += profile.note[item.noteIds[j]] * item.noteW[j];
    let accords = 0;
    if (item.accordIds.length) {
      for (const a of item.accordIds) accords += profile.accord[a];
      accords /= Math.sqrt(item.accordIds.length);
    }
    const fam = familyMax > 0 && item.family ? Math.max(0, profile.family.get(item.family) ?? 0) / familyMax : 0;
    const sub =
      subfamilyMax > 0 && item.subfamily ? Math.max(0, profile.subfamily.get(item.subfamily) ?? 0) / subfamilyMax : 0;
    const graph = ppr[item.idx];
    if (graph > pprMax) pprMax = graph;
    let neighbor = 0;
    for (const { item: l, weight } of neighbors) neighbor = Math.max(neighbor, weight * similarity(item, l));
    scored.push({ item, score: 0, parts: { notes, accords, family: 0.6 * fam + 0.4 * sub, graph, neighbor } });
  }
  const w = SCORE_WEIGHTS;
  for (const s of scored) {
    s.parts.graph = pprMax > 0 ? s.parts.graph / pprMax : 0;
    s.score =
      w.notes * s.parts.notes +
      w.accords * s.parts.accords +
      w.family * s.parts.family +
      w.graph * s.parts.graph +
      w.neighbor * s.parts.neighbor;
  }
  return scored;
}

/**
 * Maximal marginal relevance: trade a little score for variety so a list is
 * not ten flankers of one bottle. Also caps fragrances per brand.
 */
export function diversify<T extends { item: Item; score: number }>(
  ranked: T[],
  k: number,
  { lambda = 0.75, perBrand = 2, pool = 150 } = {},
): T[] {
  const candidates = ranked.slice(0, Math.max(pool, k));
  if (candidates.length === 0) return [];
  const top = candidates[0].score;
  const bottom = candidates[candidates.length - 1].score;
  const range = top - bottom || 1;
  const chosen: T[] = [];
  const brandCount = new Map<string, number>();
  const maxSim = new Float64Array(candidates.length);
  const used = new Uint8Array(candidates.length);
  while (chosen.length < k) {
    let best = -1;
    let bestValue = -Infinity;
    for (let i = 0; i < candidates.length; i++) {
      if (used[i]) continue;
      if ((brandCount.get(candidates[i].item.brand) ?? 0) >= perBrand) continue;
      const relevance = (candidates[i].score - bottom) / range;
      const value = lambda * relevance - (1 - lambda) * maxSim[i];
      if (value > bestValue) {
        bestValue = value;
        best = i;
      }
    }
    if (best < 0) break;
    used[best] = 1;
    const pick = candidates[best];
    chosen.push(pick);
    brandCount.set(pick.item.brand, (brandCount.get(pick.item.brand) ?? 0) + 1);
    for (let i = 0; i < candidates.length; i++) {
      if (!used[i]) maxSim[i] = Math.max(maxSim[i], similarity(pick.item, candidates[i].item));
    }
  }
  return chosen;
}

const SIMILAR_REASON_THRESHOLD = 0.45;

function explain(index: CatalogIndex, profile: Profile, s: Scored): Reason[] {
  const reasons: { reason: Reason; strength: number }[] = [];
  const item = s.item;

  const liked = item.noteIds.filter((n) => profile.explicitNotes.has(n));
  if (liked.length) {
    reasons.push({
      reason: { kind: "liked-notes", notes: [...liked].map((n) => index.noteKeys[n]).slice(0, 3) },
      strength: 1 + liked.length,
    });
  }

  // Notes that both drive the score and come from fragrances the person likes.
  const contributions: { note: number; value: number }[] = [];
  for (let j = 0; j < item.noteIds.length; j++) {
    const n = item.noteIds[j];
    if (profile.explicitNotes.has(n)) continue;
    const value = profile.note[n] * item.noteW[j];
    if (value > 0) contributions.push({ note: n, value });
  }
  contributions.sort((a, b) => b.value - a.value);
  const topNotes = contributions.slice(0, 3).map((c) => c.note);
  if (topNotes.length && profile.liked.length) {
    const via = profile.liked
      .filter(({ item: l }) => topNotes.some((n) => l.noteIds.includes(n)))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 2)
      .map(({ item: l }) => l.productId);
    if (via.length) {
      reasons.push({
        reason: { kind: "shared-notes", notes: topNotes.map((n) => index.noteKeys[n]), via },
        strength: contributions.slice(0, 3).reduce((sum, c) => sum + c.value, 0) * 4,
      });
    }
  }

  if (profile.liked.length) {
    let best: { item: Item; weight: number; sim: number } | null = null;
    for (const { item: l, weight } of profile.liked.slice(0, 40)) {
      const sim = similarity(item, l);
      if (sim >= SIMILAR_REASON_THRESHOLD && (!best || sim * weight > best.sim * best.weight)) best = { item: l, weight, sim };
    }
    if (best) {
      reasons.push({ reason: { kind: "similar", productId: best.item.productId, weight: best.weight }, strength: best.sim * 3 });
    }
  }

  const accord = [...item.accordIds].find((a) => profile.explicitAccords.has(a));
  if (accord !== undefined) {
    reasons.push({ reason: { kind: "accord", accord: index.accordKeys[accord].split(":")[1] }, strength: 1.2 });
  }
  if (item.family && profile.explicitFamilies.has(item.family)) {
    reasons.push({ reason: { kind: "family", family: item.family }, strength: 0.8 });
  }

  return reasons
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)
    .map((r) => r.reason);
}

export type RecommendOptions = { k?: number; diversity?: boolean };

export function recommend(index: CatalogIndex, signals: TasteSignals, { k = 24, diversity = true }: RecommendOptions = {}): Recommendation[] {
  if (!hasSignals(signals)) return [];
  const profile = buildProfile(index, signals);
  const scored = scoreAll(index, profile, signals).sort((a, b) => b.score - a.score || a.item.idx - b.item.idx);
  const total = scored.length;
  const rank = new Map(scored.map((s, i) => [s.item.idx, i]));
  const picked = diversity ? diversify(scored, k) : scored.slice(0, k);
  return picked.map((s) => ({
    productId: s.item.productId,
    score: s.score,
    match: Math.floor((100 * (total - 1 - rank.get(s.item.idx)!)) / Math.max(total - 1, 1)),
    reasons: explain(index, profile, s),
  }));
}

/** Rank every eligible item; used by evaluation to measure held-out ranks. */
export function rankAll(index: CatalogIndex, signals: TasteSignals): string[] {
  const profile = buildProfile(index, signals);
  return scoreAll(index, profile, signals)
    .sort((a, b) => b.score - a.score || a.item.idx - b.item.idx)
    .map((s) => s.item.productId);
}
