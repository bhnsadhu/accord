import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { catalogRequests, fragrances, user } from "@/db/schema";
import { seedCatalog } from "@/lib/catalog/seed";
import { importResearch } from "@/lib/catalog/import-research";
import { catalogManifestSchema, type CatalogManifest } from "@/lib/catalog/research-schema";
import { getEditions, getFragrance, searchFragrances } from "@/lib/catalog/queries";
import { productIdFromSlug } from "@/lib/catalog/text";
import { getCollection, upsertEntry } from "@/lib/collection/repo";
import { requestFingerprint, requestSchema, submitCatalogRequest } from "@/lib/catalog/requests";
import { POST } from "@/app/api/catalog-requests/route";

const id = "aabc123abc123";
const source = { id: "brand", title: "Official fixture", publisher: "Reference fixture", url: "https://example.test/fragrance", kind: "brand", checkedAt: "2026-01-01", fields: ["identity", "summary", "featuredNotes", "concentration", "perfumers", "year", "noteStages", "edition", "wear"] };
const raw = { version: 1, entries: [
  { productId: "p90001", brand: "Reference fixture", name: "Quasar Eau de Toilette", research: { concentration: "Eau de toilette", editionGroup: "test-quasar", editionLabel: "Eau de toilette", aliases: ["Quasar original"], sources: [source] } },
  { productId: id, brand: "Reference fixture", name: "Quasar Eau de Parfum", catalog: { notes: ["Bergamot", "Vanilla"], family: "Woody" }, research: { summary: "Citrus with soft vanilla.", concentration: "Eau de parfum", perfumers: ["Test Perfumer"], year: 2024, featuredNotes: ["Bergamot", "Vanilla"], noteStages: { opening: ["Bergamot"], heart: [], base: ["Vanilla"] }, editionGroup: "test-quasar", editionLabel: "Eau de parfum", aliases: ["Stellar edition"], wear: [{ aspect: "Projection", text: "A close scent, according to its maker.", sourceId: "brand" }], sources: [source] } },
] };
let manifest: CatalogManifest;
beforeAll(async () => {
  manifest = catalogManifestSchema.parse(raw);
  await seedCatalog(db, [{ product_id: "p90001", brand: "Reference fixture", name: "Quasar Eau de Toilette", notes: "Bergamot, Musk", family: "WOODY", subfamily: "", accords: "Woods Classical", gender: "Unisex", year: "2020" }]);
});
afterAll(async () => {
  await db.delete(user).where(eq(user.id, "reference-user"));
  await db.delete(fragrances).where(inArray(fragrances.productId, [id, "p90001"]));
  await db.delete(catalogRequests).where(eq(catalogRequests.brand, "Reference fixture"));
});

describe("reviewed catalog enrichment", () => {
  it("previews without writing, applies idempotently and preserves original IDs and notes", async () => {
    expect((await importResearch(db, manifest)).changes[1].action).toBe("create");
    expect(await getFragrance(db, id)).toBeNull();
    await importResearch(db, manifest, true);
    await importResearch(db, manifest, true);
    const original = await getFragrance(db, "p90001");
    expect(original?.notes).toEqual(["Bergamot", "Musk"]);
    const added = await getFragrance(db, id);
    expect(added).toMatchObject({ concentration: "Eau de parfum", perfumers: ["Test Perfumer"], year: 2024 });
    expect(productIdFromSlug(added!.slug)).toBe(id);
    expect(await getEditions(db, "test-quasar")).toHaveLength(2);
  });
  it("rejects an identity mismatch before writing any of the batch", async () => {
    const invalid = structuredClone(manifest);
    invalid.entries[0].research.summary = "Should not be written.";
    invalid.entries[1].name = "Wrong identity";
    await expect(importResearch(db, invalid, true)).rejects.toThrow("Identity mismatch");
    expect((await getFragrance(db, "p90001"))?.research?.summary).toBeUndefined();
  });
  it("requires source attribution and valid dates", () => {
    const invalid = structuredClone(raw);
    invalid.entries[1].research.wear![0].sourceId = "unknown";
    expect(catalogManifestSchema.safeParse(invalid).success).toBe(false);
    const invalidDate = structuredClone(raw);
    invalidDate.entries[0].research.sources[0].checkedAt = "2026-02-30";
    expect(catalogManifestSchema.safeParse(invalidDate).success).toBe(false);
  });
  it("keeps exact formats distinct and searches research aliases and perfumers", async () => {
    expect((await searchFragrances(db, { q: "quasar edp" })).items.map(f => f.productId)).toEqual([id]);
    expect((await searchFragrances(db, { q: "quasar edt" })).items.map(f => f.productId)).toEqual(["p90001"]);
    expect((await searchFragrances(db, { q: "quasar extrait" })).total).toBe(0);
    expect((await searchFragrances(db, { q: "stellar edition" })).items[0].productId).toBe(id);
    expect((await searchFragrances(db, { perfumer: "Test Perfumer" })).items.map(f => f.productId)).toEqual([id]);
  });
  it("combines every included and excluded note and recovers totals after the last page", async () => {
    expect((await searchFragrances(db, { brand: "reference-fixture", notes: ["bergamot", "vanilla"], excludeNotes: ["musk"] })).items.map(f => f.productId)).toEqual([id]);
    expect((await searchFragrances(db, { brand: "reference-fixture", notes: ["vanilla"], excludeNotes: ["vanilla"] })).total).toBe(0);
    const result = await searchFragrances(db, { brand: "reference-fixture", page: 50 });
    expect(result.total).toBe(2); expect(result.items).toEqual([]);
  });
  it("lets people save researched additions alongside ScentLens entries", async () => {
    await db.insert(user).values({ id: "reference-user", name: "Fixture", email: "reference@example.test" });
    await upsertEntry(db, "reference-user", { productId: id, shelf: "owned", rating: 4 });
    await upsertEntry(db, "reference-user", { productId: "p90001", shelf: "wishlist" });
    expect((await getCollection(db, "reference-user")).map(f => f.productId).sort()).toEqual([id, "p90001"]);
  });
});

describe("private catalog requests", () => {
  const input = { fragrance: "Unlisted edition", brand: "Reference fixture", sourceUrl: "https://example.test/official" };
  it("validates names and links without fetching user supplied URLs", () => {
    expect(requestSchema.safeParse({ ...input, sourceUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(requestSchema.safeParse({ ...input, fragrance: " " }).success).toBe(false);
    expect(requestFingerprint("127.0.0.1", "secret")).toHaveLength(64);
  });
  it("deduplicates and caps submissions without publishing the inbox", async () => {
    const fingerprint = "reference-test";
    expect(await submitCatalogRequest(db, input, fingerprint)).toEqual({ ok: true });
    expect(await submitCatalogRequest(db, input, fingerprint)).toEqual({ ok: true });
    await submitCatalogRequest(db, { ...input, fragrance: "Second" }, fingerprint);
    await submitCatalogRequest(db, { ...input, fragrance: "Third" }, fingerprint);
    expect(await submitCatalogRequest(db, { ...input, fragrance: "Fourth" }, fingerprint)).toEqual({ ok: false, reason: "limit" });
  });
  it("rejects cross-origin and malformed requests", async () => {
    const url = "http://localhost:3000/api/catalog-requests";
    expect((await POST(new Request(url, { method: "POST", headers: { origin: "https://elsewhere.test" }, body: JSON.stringify(input) }))).status).toBe(403);
    expect((await POST(new Request(url, { method: "POST", headers: { origin: "http://localhost:3000" }, body: "bad" }))).status).toBe(400);
  });
});
