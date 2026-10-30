import { describe, expect, it } from "vitest";
import { buildCatalogIndex, type FragranceFeatures } from "./catalog-index";
import { archetypes, similarTo } from "./discover";
import { personalizedPageRank } from "./graph";
import { itemWeightFromCollection, rankAll, recommend } from "./recommend";
import { jaccard, similarity, sparseDot } from "./similarity";

let seq = 0;
function f(brand: string, notes: string[], extra: Partial<FragranceFeatures> = {}): FragranceFeatures {
  seq += 1;
  return {
    productId: `p${String(seq).padStart(5, "0")}`,
    name: `${brand} ${seq}`,
    brand,
    family: null,
    subfamily: null,
    wheel: null,
    character: null,
    facets: [],
    notes,
    gender: "unisex",
    year: 2020,
    ...extra,
  };
}

// Three clear taste clusters plus filler so IDF has something to work with.
const gourmand = (brand: string, extra: string[] = []) =>
  f(brand, ["vanilla", "tonka-bean", "caramel", "musk", ...extra], {
    family: "Amber",
    subfamily: "Gourmand",
    wheel: "Soft Amber",
    character: "Classical",
    facets: ["Gourmand"],
  });
const citrus = (brand: string, extra: string[] = []) =>
  f(brand, ["bergamot", "lemon", "grapefruit", "musk", ...extra], {
    family: "Citrus",
    subfamily: "Citrus",
    wheel: "Citrus",
    character: "Fresher",
    facets: ["Water"],
  });
const oud = (brand: string, extra: string[] = []) =>
  f(brand, ["oud-agarwood", "leather", "saffron", "rose", ...extra], {
    family: "Woody",
    subfamily: "Leather",
    wheel: "Dry Woods",
    character: "Richer",
    facets: ["Spicy"],
  });

const catalog: FragranceFeatures[] = [
  gourmand("A"), gourmand("B", ["praline"]), gourmand("C", ["coffee"]), gourmand("D", ["benzoin"]), gourmand("E"),
  citrus("F"), citrus("G", ["neroli"]), citrus("H", ["mint"]), citrus("I", ["vetiver"]), citrus("J"),
  oud("K"), oud("L", ["incense-olibanum"]), oud("M", ["patchouli"]), oud("N", ["vanilla"]), oud("O"),
  ...Array.from({ length: 30 }, (_, i) => f(`Filler${i}`, ["musk", `rare-${i}`, `rare-${i + 1}`])),
];
const index = buildCatalogIndex(catalog);
const id = (brand: string) => catalog.find((c) => c.brand === brand)!.productId;
const brandOf = (productId: string) => index.byId.get(productId)!.brand;
const GOURMANDS = new Set(["A", "B", "C", "D", "E"]);
const CITRUS = new Set(["F", "G", "H", "I", "J"]);

describe("similarity", () => {
  it("is 1 for identical sparse vectors and symmetric", () => {
    const a = index.byId.get(id("A"))!;
    const b = index.byId.get(id("B"))!;
    expect(sparseDot(a.noteIds, a.noteW, a.noteIds, a.noteW)).toBeCloseTo(1, 5);
    expect(similarity(a, b)).toBeCloseTo(similarity(b, a), 10);
  });

  it("ranks same-cluster fragrances above other clusters", () => {
    const a = index.byId.get(id("A"))!;
    expect(similarity(a, index.byId.get(id("E"))!)).toBeGreaterThan(similarity(a, index.byId.get(id("F"))!));
  });

  it("computes jaccard on sorted ids", () => {
    expect(jaccard(Int32Array.from([1, 2, 3]), Int32Array.from([2, 3, 4]))).toBeCloseTo(0.5);
    expect(jaccard(new Int32Array(), new Int32Array())).toBe(0);
  });

  it("weights rare notes above ubiquitous ones", () => {
    const musk = index.noteIndex.get("musk")!;
    const caramel = index.noteIndex.get("caramel")!;
    expect(index.noteIdf[caramel]).toBeGreaterThan(index.noteIdf[musk]);
  });
});

describe("similarTo", () => {
  it("returns cluster neighbours with shared notes", () => {
    const results = similarTo(index, id("A"), 4);
    expect(results.length).toBe(4);
    expect(results.every((r) => GOURMANDS.has(brandOf(r.productId)))).toBe(true);
    expect(results[0].sharedNotes).toContain("vanilla");
    expect(results.map((r) => r.productId)).not.toContain(id("A"));
  });

  it("returns nothing for unknown ids", () => {
    expect(similarTo(index, "p99999")).toEqual([]);
  });
});

describe("recommend", () => {
  it("returns nothing without signals (cold start handled by archetypes)", () => {
    expect(recommend(index, {})).toEqual([]);
  });

  it("follows explicit note preferences", () => {
    const recs = recommend(index, { likedNotes: ["vanilla", "caramel"] }, { k: 5 });
    expect(recs.filter((r) => GOURMANDS.has(brandOf(r.productId))).length).toBeGreaterThanOrEqual(4);
    expect(recs[0].reasons[0]).toMatchObject({ kind: "liked-notes" });
  });

  it("different preferences produce different rankings", () => {
    const sweet = recommend(index, { likedNotes: ["vanilla"] }, { k: 5 }).map((r) => r.productId);
    const fresh = recommend(index, { likedNotes: ["lemon"] }, { k: 5 }).map((r) => r.productId);
    expect(sweet.filter((p) => fresh.includes(p))).toEqual([]);
    expect(fresh.filter((p) => CITRUS.has(brandOf(p))).length).toBeGreaterThanOrEqual(4);
  });

  it("never recommends fragrances with a disliked note", () => {
    const recs = recommend(index, { likedNotes: ["vanilla"], dislikedNotes: ["oud-agarwood"] }, { k: 20 });
    expect(recs.map((r) => brandOf(r.productId))).not.toContain("N");
  });

  it("excludes fragrances already in the collection", () => {
    const recs = recommend(index, { items: [{ productId: id("A"), weight: 1 }] }, { k: 10 });
    expect(recs.map((r) => r.productId)).not.toContain(id("A"));
  });

  it("explains rated-item recommendations with evidence from the liked fragrance", () => {
    const recs = recommend(index, { items: [{ productId: id("B"), weight: 1 }] }, { k: 3 });
    const shared = recs[0].reasons.find((r) => r.kind === "shared-notes");
    const similar = recs[0].reasons.find((r) => r.kind === "similar");
    expect(shared ?? similar).toBeDefined();
    if (shared?.kind === "shared-notes") {
      expect(shared.via).toEqual([id("B")]);
      const liked = index.byId.get(id("B"))!;
      for (const n of shared.notes) expect(liked.noteIds).toContain(index.noteIndex.get(n));
    }
  });

  it("ratings move rankings: a low rating pushes its cluster down", () => {
    const base = rankAll(index, { likedNotes: ["musk"] });
    const after = rankAll(index, {
      likedNotes: ["musk"],
      items: [{ productId: id("F"), weight: itemWeightFromCollection({ productId: id("F"), shelf: "tried", rating: 1, favorite: false }) }],
    });
    const meanRank = (ranking: string[]) => {
      const ranks = ["G", "H", "I", "J"].map((b) => ranking.indexOf(id(b)));
      return ranks.reduce((a, b) => a + b, 0) / ranks.length;
    };
    expect(meanRank(after)).toBeGreaterThan(meanRank(base));
  });

  it("match is a percentile between 0 and 100", () => {
    const recs = recommend(index, { likedNotes: ["vanilla"] }, { k: 5, diversity: false });
    expect(recs[0].match).toBe(100);
    for (const r of recs) expect(r.match).toBeGreaterThanOrEqual(0);
  });

  it("diversifies brands", () => {
    const recs = recommend(index, { likedNotes: ["musk"] }, { k: 20 });
    const counts = new Map<string, number>();
    for (const r of recs) counts.set(brandOf(r.productId), (counts.get(brandOf(r.productId)) ?? 0) + 1);
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
  });

  it("respects gender preference while keeping unisex", () => {
    const local = buildCatalogIndex([
      f("X", ["iris-orris", "violet"], { gender: "feminine" }),
      f("Y", ["iris-orris", "violet"], { gender: "masculine" }),
      f("Z", ["iris-orris", "violet"], { gender: "unisex" }),
    ]);
    const brands = recommend(local, { likedNotes: ["iris-orris"], gender: "masculine" }).map((r) => local.byId.get(r.productId)!.brand);
    expect(brands.sort()).toEqual(["Y", "Z"]);
  });
});

describe("collection weights", () => {
  it("maps ratings and shelves to taste weights", () => {
    const base = { productId: "p00001", favorite: false } as const;
    expect(itemWeightFromCollection({ ...base, shelf: "tried", rating: 5 })).toBe(1);
    expect(itemWeightFromCollection({ ...base, shelf: "tried", rating: 1 })).toBe(-1);
    expect(itemWeightFromCollection({ ...base, shelf: "tried", rating: 3 })).toBe(0);
    expect(itemWeightFromCollection({ ...base, shelf: "owned", rating: null })).toBe(0.6);
    expect(itemWeightFromCollection({ ...base, shelf: "wishlist", rating: null })).toBe(0.4);
    expect(itemWeightFromCollection({ ...base, shelf: "tried", rating: null, favorite: true })).toBe(1);
  });
});

describe("graph walk", () => {
  it("spreads mass from a liked note to co-occurring notes' fragrances", () => {
    const scores = personalizedPageRank(index, { notes: new Map([[index.noteIndex.get("caramel")!, 1]]) });
    const praline = index.byId.get(id("B"))!.idx;
    const lemon = index.byId.get(id("F"))!.idx;
    expect(scores[praline]).toBeGreaterThan(scores[lemon]);
  });

  it("is empty without positive restart mass", () => {
    expect(personalizedPageRank(index, {}).every((x) => x === 0)).toBe(true);
  });
});

describe("archetypes", () => {
  it("is empty for tiny wheels and deterministic", () => {
    expect(archetypes(index)).toEqual(archetypes(index));
  });
});
