import { describe, expect, it } from "vitest";
import { matchNoteStages, type StagedReference } from "./match-note-stages";

const source = (overrides: Partial<StagedReference> = {}): StagedReference => ({ id: "example", brand: "House", name: "Example", concentration: "Eau de parfum", year: 2020, url: "https://example.com/perfume", noteStages: { opening: ["Lemon"], heart: ["Rose"], base: ["Musk"] }, ...overrides });
const item = { productId: "p00001", brand: "House", name: "Example", year: 2020 };

describe("exact edition note-stage matching", () => {
  it("matches accents and explicit concentration suffixes without changing the source notes", () => {
    const reference = source({ name: "Exámple" });
    expect(matchNoteStages([{ ...item, name: "Example Eau De Parfum" }], [reference]).matches).toEqual([{ productId: item.productId, reference }]);
  });
  it("rejects a different concentration, flanker, house or release year", () => {
    for (const change of [{ concentration: "Eau de toilette" }, { name: "Example Intense" }, { brand: "Other House" }, { year: 2021 }]) {
      expect(matchNoteStages([{ ...item, concentration: "Eau de parfum" }], [source(change)]).matches).toHaveLength(0);
    }
  });
  it("does not guess which edition an unqualified catalog name represents", () => {
    const editions = [source(), source({ id: "edt", concentration: "Eau de toilette", noteStages: { opening: [], heart: [], base: [] } })];
    expect(matchNoteStages([item], editions).matches).toHaveLength(0);
    expect(matchNoteStages([{ ...item, concentration: "Eau de parfum" }], editions).matches).toHaveLength(1);
  });
  it("retains reviewed research and rejects incomplete or conflicting sources", () => {
    expect(matchNoteStages([{ ...item, hasStages: true }], [source()]).matches).toHaveLength(0);
    expect(matchNoteStages([item], [source({ noteStages: { opening: [], heart: [], base: ["Musk"] } })]).matches).toHaveLength(0);
    expect(matchNoteStages([item], [source({ name: "Example Eau de Toilette" })]).matches).toHaveLength(0);
  });
  it("rejects a source that could describe two catalog identities", () => {
    expect(matchNoteStages([item, { ...item, productId: "p00002", name: "Example Eau de Parfum" }], [source()]).matches).toHaveLength(0);
  });
});
