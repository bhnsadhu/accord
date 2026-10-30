import { describe, expect, it } from "vitest";
import { familyLabel, parseAccords, parseGender, parseNotes, parseYear } from "./parse";
import { foldText, fragranceSlug, productIdFromSlug } from "./text";

describe("parseAccords", () => {
  it("splits wheel family, character and facets", () => {
    expect(parseAccords("Woody Amber Fresher Citrus")).toEqual({
      wheel: "Woody Amber",
      character: "Fresher",
      facets: ["Citrus"],
    });
  });

  it("prefers multi-word phrases", () => {
    expect(parseAccords("Floral Fresher White Flower")).toEqual({
      wheel: "Floral",
      character: "Fresher",
      facets: ["White Flower"],
    });
    expect(parseAccords("Aromatic Fougère Fresher Aromatic").facets).toEqual(["Aromatic"]);
  });

  it("normalizes legacy and short modifiers", () => {
    expect(parseAccords("Floral Oriental Fresh Citrus Fruity")).toEqual({
      wheel: "Floral Amber",
      character: "Fresher",
      facets: ["Citrus", "Fruity"],
    });
    expect(parseAccords("Amber Rich Gourmand").character).toBe("Richer");
  });

  it("drops junk tokens", () => {
    expect(parseAccords("$$$\ninfo")).toEqual({ wheel: null, character: null, facets: [] });
    expect(parseAccords("Floral Crisp Fabrice Pellegrin").facets).toEqual([]);
  });
});

describe("parseNotes", () => {
  it("strips origins and dedupes", () => {
    const notes = parseNotes("Jasmine (Grandiflorum), Vetiver (Haiti), Jasmine, Iris / Orris");
    expect(notes.map((n) => n.key)).toEqual(["jasmine", "vetiver", "iris-orris"]);
    expect(notes[2].label).toBe("Iris / Orris");
  });

  it("ignores empty segments", () => {
    expect(parseNotes(" , Rose,")).toEqual([{ label: "Rose", key: "rose" }]);
  });
});

describe("catalog fields", () => {
  it("labels families", () => {
    expect(familyLabel("AMBERY (ORIENTAL)")).toBe("Amber");
    expect(familyLabel("WATERY")).toBe("Aquatic");
  });

  it("parses gender and year", () => {
    expect(parseGender("Female")).toBe("feminine");
    expect(parseGender("")).toBeNull();
    expect(parseYear("2019")).toBe(2019);
    expect(parseYear("unknown")).toBeNull();
  });
});

describe("slugs", () => {
  it("folds accents", () => {
    expect(foldText("Désinvolte  Eau-de-Parfum")).toBe("desinvolte eau de parfum");
  });

  it("round-trips product ids", () => {
    const slug = fragranceSlug("Chanel", "Chance Eau De Parfum", "p05819");
    expect(slug).toBe("chanel-chance-eau-de-parfum-p05819");
    expect(productIdFromSlug(slug)).toBe("p05819");
    expect(productIdFromSlug("p05819")).toBe("p05819");
    expect(productIdFromSlug("chanel-chance")).toBeNull();
  });
});
