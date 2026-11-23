import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { brandOverview, catalogCoverage, getEditions, getFragrance, getFragrancesByIds, listBrands, listNotes, searchFragrances, yearCounts } from "./queries";
import { getCatalogSnapshot } from "./snapshot";
import { presentRecommendations } from "@/lib/reco/present";
import { emptyProfile } from "@/lib/profile";

// Any accidental account/database dependency in public catalog code fails here.
vi.mock("@/db", () => ({ db: new Proxy({}, { get() { throw new Error("Database is offline"); } }) }));

describe("bundled public catalog with no database", () => {
  it("contains the complete source identities and current reviewed research", async () => {
    const snapshot = await getCatalogSnapshot();
    expect(snapshot.fragrances.length).toBeGreaterThan(24_000);
    expect(new Set(snapshot.fragrances.map(f => f.productId)).size).toBe(snapshot.fragrances.length);
    expect((await catalogCoverage()).total).toBe(snapshot.fragrances.length);
    expect(snapshot.researchSha256).toBe(createHash("sha256").update(await readFile("data/research/fragrances.json")).digest("hex"));
    for (const f of snapshot.fragrances) expect(f.notes.length).toBe(f.noteKeys.length);
    const shelf = await getFragrancesByIds(["p08355", "p14487", "p12527", "a09e1f2c0fabb", "p03345", "p03615"]);
    expect(shelf).toHaveLength(6);
    expect(shelf.at(-1)?.brand).toBe("Bath & Body Works");
    expect(shelf[1]).toMatchObject({ name: "Santal 33", brand: "Le Labo" });
    expect(shelf[1]).not.toHaveProperty("research");
    expect(shelf[1]).not.toHaveProperty("searchText");
  });

  it("searches names, aliases, accents, reversed words and common typos", async () => {
    expect((await searchFragrances({ q: "33 labo santal" })).items[0]?.productId).toBe("p14487");
    expect((await searchFragrances({ q: "santla 33" })).items[0]?.productId).toBe("p14487");
    expect((await searchFragrances({ q: "bacarat roug" })).items[0]?.name).toContain("Baccarat Rouge");
    expect((await searchFragrances({ q: "ombre leather edp" })).items.some(f => f.productId === "a09e1f2c0fabb")).toBe(true);
    expect((await searchFragrances({ q: "zzqxv" })).total).toBe(0);
  });

  it("combines filters and preserves totals on empty pages", async () => {
    const result = await searchFragrances({ notes: ["vanilla"], excludeNotes: ["jasmine"], wheel: "Amber", pageSize: 4 });
    expect(result.total).toBeGreaterThan(4);
    for (const f of result.items) {
      const detail = await getFragrance(f.productId);
      expect(detail?.noteKeys).toContain("vanilla");
      expect(detail?.noteKeys).not.toContain("jasmine");
      expect(detail?.wheel).toBe("Amber");
    }
    const last = await searchFragrances({ notes: ["vanilla"], excludeNotes: ["jasmine"], wheel: "Amber", pageSize: 4, page: 2000 });
    expect(last.items).toEqual([]);
    expect(last.total).toBe(result.total);
    expect((await searchFragrances({ brand: "le-labo", sort: "newest" })).items.every(f => f.brandSlug === "le-labo")).toBe(true);
  });

  it("keeps directories, sourced details and editions available", async () => {
    expect(await getFragrance("missing")).toBeNull();
    expect(await brandOverview("missing")).toBeNull();
    expect((await brandOverview("le-labo"))?.topNotes.length).toBeGreaterThan(0);
    expect((await listBrands()).length).toBeGreaterThan(100);
    expect((await listNotes()).length).toBe(304);
    const years = await yearCounts();
    expect(years[0].year).toBeGreaterThan(years.at(-1)!.year);
    const researched = (await getCatalogSnapshot()).fragrances.find(f => f.editionGroup)!;
    expect((await getEditions(researched.editionGroup!)).map(f => f.productId)).toContain(researched.productId);
    expect((await getFragrance(researched.productId))?.research?.sources.length).toBeGreaterThan(0);
  });

  it("makes personal recommendations without losing saved-item exclusions", async () => {
    const saved = [{ productId: "p14487", shelf: "owned" as const, rating: 5, favorite: true }];
    const result = await presentRecommendations({ ...emptyProfile, likedNotes: ["sandalwood"] }, saved, 12);
    expect(result.kind).toBe("personal");
    expect(result.items).toHaveLength(12);
    expect(result.items.some(item => item.fragrance.productId === "p14487")).toBe(false);
    expect(result.items[0].reasons.length).toBeGreaterThan(0);
    expect((await presentRecommendations(emptyProfile, [])).kind).toBe("starter");
  });
});
