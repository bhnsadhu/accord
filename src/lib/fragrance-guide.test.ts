import { describe, expect, it } from "vitest";
import type { FragranceSummary } from "./catalog/queries";
import { fragranceIntroduction, namedConcentration } from "./fragrance-guide";

const sparse: FragranceSummary = { productId: "p00001", slug: "test-p00001", name: "Test", brand: "Test house", brandSlug: "test-house", family: null, subfamily: null, wheel: null, character: null, facets: [], gender: null, year: null, notes: [] };

describe("fragrance reference truth", () => {
  it("does not invent a profile or note layer when metadata is absent", () => {
    const text = fragranceIntroduction(sparse);
    expect(text).not.toMatch(/null|undefined|woody|floral|top|base|heart|hours/i);
    expect(fragranceIntroduction({ ...sparse, family: "Woody" })).toContain("woody family");
  });
  it("keeps the catalog note order and does not imply an exhaustive list", () => {
    const text = fragranceIntroduction({ ...sparse, wheel: "Woods", character: "Classical", notes: ["Sandalwood", "Iris / Orris", "Leather", "Amber"] });
    expect(text).toContain("sandalwood, iris / orris and leather among its notes");
    expect(fragranceIntroduction({ ...sparse, notes: ["Rose"] })).toContain("lists rose.");
    expect(fragranceIntroduction({ ...sparse, notes: ["Rose", "Musk"] })).toContain("lists rose and musk.");
  });
  it("only recognizes an explicit full format in the name", () => {
    expect(namedConcentration("Chance Eau De Parfum")).toBe("Eau de parfum");
    expect(namedConcentration("Extrait de Parfum")).toBe("Extrait de parfum");
    expect(namedConcentration("Eau de Toilette Intense")).toBe("Eau de toilette");
    expect(namedConcentration("Eau de Cologne")).toBe("Eau de cologne");
    for (const name of ["Santal 33", "Intense", "Cologne Indélébile", "Le Parfum", "Parfum de Peau"]) expect(namedConcentration(name)).toBeNull();
  });
});
