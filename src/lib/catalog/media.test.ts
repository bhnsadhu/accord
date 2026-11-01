import { describe, expect, it } from "vitest";
import { readFileSync, statSync } from "node:fs";
import bottles from "../../../data/media/bottles.json";
import notes from "../../../data/media/notes.json";
import research from "../../../data/research/fragrances.json";
import { bottleImage, noteReferenceKey } from "./media";

describe("reference image identity and provenance", () => {
  it("matches each pictured bottle to an exact researched edition", () => {
    for (const [id, photo] of Object.entries(bottles)) {
      const entry = research.entries.find(e => e.productId === id)!;
      expect(entry, id).toBeDefined();
      expect(entry.brand).toBe(photo.brand);
      expect(entry.name.toLocaleLowerCase()).toBe(photo.name.toLocaleLowerCase());
      expect(entry.research.concentration).toBe(photo.concentration);
    }
    expect(bottleImage("p07571")).toBeUndefined(); // Sauvage EDT cannot borrow the EDP photo.
    expect(bottleImage("p05816")).toBeUndefined(); // Bleu Parfum cannot borrow the EDP photo.
    expect(bottleImage("p22702")).toBeUndefined(); // Ombré Leather Parfum is a different bottle.
  });
  it("ships local, bounded WebP assets with credit, source and explicit reuse terms", () => {
    for (const photo of [...Object.values(bottles), ...Object.values(notes)]) {
      expect(photo.author.trim().length).toBeGreaterThan(0);
      expect(photo.source).toMatch(/^https:\/\//);
      expect(photo.licenseUrl).toMatch(/^https:\/\//);
      expect(photo.license).toMatch(/^(CC BY|CC0|Public domain|Unsplash License)/);
      expect(photo.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(photo.path).toMatch(/^\/images\/(fragrances|notes)\/[a-z0-9-]+\.webp$/);
      const path = `public${photo.path}`;
      expect(readFileSync(path).subarray(8, 12).toString()).toBe("WEBP");
      expect(statSync(path).size).toBeLessThan(300_000);
      expect(photo.width).toBeGreaterThan(0);
      expect(photo.height).toBeGreaterThan(0);
    }
  });
  it("does not invent photographs for abstract accords or unknown notes", () => {
    expect(notes).not.toHaveProperty("amber");
    expect(notes).not.toHaveProperty("musk");
    expect(noteReferenceKey("iris")).toBe("iris-orris");
    expect(noteReferenceKey("unknown-material")).toBe("unknown-material");
  });
});
