import { describe, expect, it } from "vitest";
import { accordProfile, type NoteFamilyStats } from "./accord-profile";

const stats: NoteFamilyStats = {
  total: 100,
  families: { Woods: 25, Floral: 50, Citrus: 25 },
  byNote: {
    sandalwood: { Woods: 18, Floral: 2 },
    cedarwood: { Woods: 12, Floral: 4, Citrus: 4 },
    bergamot: { Citrus: 15, Floral: 10, Woods: 5 },
    rose: { Floral: 30, Woods: 2 },
    rare: { Woods: 2 },
  },
};

describe("accordProfile", () => {
  it("ranks families the notes over-represent, strongest first", () => {
    const p = accordProfile(["sandalwood", "cedarwood", "bergamot"], stats);
    expect(p[0].family).toBe("Woods");
    expect(p[0].strength).toBe(1);
    expect(p.map(x => x.family)).toContain("Citrus");
    expect(p.find(x => x.family === "Woods")?.notes).toEqual(["sandalwood", "cedarwood"]);
  });

  it("never lets a common family win just by being common", () => {
    const p = accordProfile(["sandalwood"], stats);
    expect(p.map(x => x.family)).toEqual(["Woods"]);
  });

  it("puts the catalog family first and ignores notes without enough evidence", () => {
    const p = accordProfile(["sandalwood", "rose", "rare"], stats, { primary: "Floral" });
    expect(p[0].family).toBe("Floral");
    expect(accordProfile(["rare"], stats)).toEqual([]);
    expect(accordProfile(["rare"], stats, { primary: "Woods" })).toEqual([{ family: "Woods", strength: 1, notes: [] }]);
  });
});
