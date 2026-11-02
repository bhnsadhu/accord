import { describe, expect, it } from "vitest";
import catalog from "../../../data/media/catalog-index.json";
import release from "../../../data/media/catalog-release.json";
import { bottleCoverage, bottleImage, withBottleThumbnail } from "./bottle-media";
import { readFileSync } from "node:fs";

describe("catalog photograph coverage and edition isolation", () => {
  it("covers the original catalog with bounded exact-name image records", () => {
    expect(Object.keys(catalog)).toHaveLength(24647);
    expect(release.entries).toBe(Object.keys(catalog).length);
    for (const [id, [width, height, name, brand, source]] of Object.entries(catalog)) {
      expect(id).toMatch(/^(p\d{5}|a[a-f0-9]{12})$/);
      expect(width, id).toBeGreaterThan(0); expect(width, id).toBeLessThanOrEqual(640);
      expect(height, id).toBeGreaterThan(0); expect(height, id).toBeLessThanOrEqual(800);
      expect(name, id).not.toBe(""); expect(brand, id).not.toBe(""); expect(source, id).not.toContain("/");
    }
  });
  it("keeps EDT, EDP and Parfum photography separate", () => {
    expect(bottleImage("p07571")?.name).toBe("Sauvage Eau De Toilette");
    expect(bottleImage("a7782dc120305")?.path).toBe("/images/fragrances/a7782dc120305.webp");
    expect(bottleImage("a8b0937dbc0cb")).toBeUndefined();
    expect(bottleImage("p05816")?.name).toBe("Bleu De Chanel Parfum");
    expect(bottleImage("a0549a9bac3f8")?.name).toBe("Bleu de Chanel Eau de Parfum");
    expect(bottleImage("p22702")?.name).toBe("Ombré Leather Parfum");
    expect(bottleImage("not-in-catalog")).toBeUndefined();
    expect(bottleCoverage).toBe(24649);
  });
  it("sends only a requested thumbnail to search clients", () => {
    const item = withBottleThumbnail({ productId: "p14487", name: "Santal 33" });
    expect(Object.keys(item).sort()).toEqual(["bottleThumbnail", "name", "productId"]);
    expect(item.bottleThumbnail).toMatch(/\/images\/catalog\/[a-f0-9]{12}\/p14487-thumb.webp$/);
    expect(withBottleThumbnail({ productId: "a8b0937dbc0cb" })).toEqual({ productId: "a8b0937dbc0cb" });
    expect(readFileSync("src/components/command-palette.tsx", "utf8")).not.toContain("catalog-index");
  });
});
