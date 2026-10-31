import { describe, expect, it } from "vitest";
import { parseFragranceQuery } from "./search-query";

describe("fragrance query intent", () => {
  it("understands common house and fragrance abbreviations", () => {
    expect(parseFragranceQuery("MFK BR540 EDP")).toEqual({ text: "maison francis kurkdjian baccarat rouge 540", concentration: "Eau de parfum" });
    expect(parseFragranceQuery("YSL MYSLF").text).toBe("yves saint laurent myslf");
    expect(parseFragranceQuery("BDC EDT")).toEqual({ text: "bleu de chanel", concentration: "Eau de toilette" });
    expect(parseFragranceQuery("Thé Noir 29").text).toBe("the noir 29");
  });
  it("distinguishes formats while preserving marketing names", () => {
    expect(parseFragranceQuery("Sauvage Parfum").concentration).toBe("Parfum");
    expect(parseFragranceQuery("Baccarat Rouge 540 extrait").concentration).toBe("Extrait de parfum");
    expect(parseFragranceQuery("Aventus Cologne").concentration).toBeUndefined();
    expect(parseFragranceQuery("Le Male Le Parfum").text).toBe("le male le parfum");
  });
});
