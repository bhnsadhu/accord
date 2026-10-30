import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getCollection, getProfile, mergeGuestState, removeEntry, saveProfile, upsertEntry } from "@/lib/collection/repo";
import { getFragrance, getFragrancesByIds, searchFragrances } from "@/lib/catalog/queries";
import { seedCatalog, type CatalogRow } from "@/lib/catalog/seed";
import { productIdFromSlug } from "@/lib/catalog/text";

const row = (id: string, brand: string, name: string, notes: string, accords: string, family = "WOODY"): CatalogRow => ({
  product_id: id,
  brand,
  name,
  family,
  subfamily: "AMBERY (ORIENTAL)",
  accords,
  notes,
  gender: "Unisex",
  year: "2019",
});

const rows: CatalogRow[] = [
  row("p00001", "Chanel", "Chance Eau De Parfum", "Jasmine, Pink Pepper, Patchouli, Vanilla", "Woody Amber Fresher Gourmand", "CHYPRE"),
  row("p00002", "Chanel", "Chance Eau Tendre", "Grapefruit, Quince, Jasmine, Musk", "Floral Fresher Fruity", "FLORAL"),
  row("p00003", "Dior", "Sauvage Eau De Toilette", "Bergamot, Pepper, Lavender, Ambergris", "Aromatic Fougère Fresher Citrus", "AROMATIC FOUGERE"),
  row("p00004", "Maison Francis Kurkdjian", "Baccarat Rouge 540", "Saffron, Jasmine, Ambergris, Cedarwood", "Woody Amber Fresher Gourmand"),
  row("p00005", "Le Labo", "Santal 33", "Sandalwood, Cardamom, Iris (Florence), Leather", "Woods Classical"),
  row("p00006", "Tom Ford", "Tobacco Vanille", "Tobacco Leaf, Vanilla, Tonka Bean, Cocoa", "Amber Classical Gourmand", "AMBERY (ORIENTAL)"),
];

beforeAll(async () => {
  await seedCatalog(db, rows);
  await db
    .insert(user)
    .values([
      { id: "u-alice", name: "Alice", email: "alice@example.test" },
      { id: "u-bob", name: "Bob", email: "bob@example.test" },
    ])
    .onConflictDoNothing();
});

describe("catalog seed", () => {
  it("is idempotent and keeps product ids", async () => {
    const again = await seedCatalog(db, rows);
    expect(again.fragrances).toBe(rows.length);
    const f = await getFragrance(db, "p00005");
    expect(f).toMatchObject({ name: "Santal 33", brand: "Le Labo", wheel: "Woods", character: "Classical", family: "Woody" });
    expect(f!.notes).toEqual(["Sandalwood", "Cardamom", "Iris", "Leather"]);
    expect(productIdFromSlug(f!.slug)).toBe("p00005");
  });

  it("returns null for unknown ids", async () => {
    expect(await getFragrance(db, "p99999")).toBeNull();
  });

  it("returns fragrances in requested order", async () => {
    const list = await getFragrancesByIds(db, ["p00003", "p00001", "p99999"]);
    expect(list.map((f) => f.productId)).toEqual(["p00003", "p00001"]);
  });
});

describe("search", () => {
  it("matches words in any order", async () => {
    const r = await searchFragrances(db, { q: "sauvage dior" });
    expect(r.items[0].productId).toBe("p00003");
  });

  it("tolerates typos and accents", async () => {
    expect((await searchFragrances(db, { q: "bacarat roug" })).items[0]?.productId).toBe("p00004");
    expect((await searchFragrances(db, { q: "SANTAL" })).items[0]?.productId).toBe("p00005");
  });

  it("ranks prefix matches first", async () => {
    const r = await searchFragrances(db, { q: "chanel chance" });
    expect(r.items.slice(0, 2).map((i) => i.brand)).toEqual(["Chanel", "Chanel"]);
  });

  it("filters by note, excluded note, family and facet", async () => {
    const vanilla = await searchFragrances(db, { notes: ["vanilla"] });
    expect(vanilla.items.map((i) => i.productId).sort()).toEqual(["p00001", "p00006"]);
    const noJasmine = await searchFragrances(db, { notes: ["vanilla"], excludeNotes: ["jasmine"] });
    expect(noJasmine.items.map((i) => i.productId)).toEqual(["p00006"]);
    const gourmand = await searchFragrances(db, { facet: "Gourmand", family: "Woody" });
    expect(gourmand.items.map((i) => i.productId)).toEqual(["p00004"]);
  });

  it("paginates with a total", async () => {
    const r = await searchFragrances(db, { pageSize: 2, page: 2 });
    expect(r.total).toBe(rows.length);
    expect(r.items).toHaveLength(2);
  });

  it("returns nothing for gibberish", async () => {
    expect((await searchFragrances(db, { q: "zzqxv" })).total).toBe(0);
  });
});

describe("collections and profiles", () => {
  it("stores, updates and removes entries per user", async () => {
    await upsertEntry(db, "u-alice", { productId: "p00001", shelf: "owned", rating: 5, favorite: true });
    await upsertEntry(db, "u-alice", { productId: "p00003", shelf: "wishlist" });
    await upsertEntry(db, "u-alice", { productId: "p00003", shelf: "tried", rating: 2 });
    const items = await getCollection(db, "u-alice");
    expect(items).toHaveLength(2);
    expect(items.find((i) => i.productId === "p00003")).toMatchObject({ shelf: "tried", rating: 2 });
    await removeEntry(db, "u-alice", "p00003");
    expect(await getCollection(db, "u-alice")).toHaveLength(1);
  });

  it("isolates users from each other", async () => {
    await upsertEntry(db, "u-bob", { productId: "p00005", shelf: "owned" });
    // Bob removing Alice's product id touches only Bob's rows.
    await removeEntry(db, "u-bob", "p00001");
    expect((await getCollection(db, "u-alice")).map((i) => i.productId)).toEqual(["p00001"]);
    expect((await getCollection(db, "u-bob")).map((i) => i.productId)).toEqual(["p00005"]);
  });

  it("rejects invalid input", async () => {
    await expect(upsertEntry(db, "u-alice", { productId: "p00001", shelf: "owned", rating: 9 })).rejects.toThrow();
    await expect(upsertEntry(db, "u-alice", { productId: "DROP TABLE", shelf: "owned" })).rejects.toThrow();
    await expect(saveProfile(db, "u-alice", { likedNotes: ["Not A Key!"] })).rejects.toThrow();
  });

  it("saves profiles with defaults", async () => {
    await saveProfile(db, "u-alice", { likedNotes: ["vanilla"] });
    expect(await getProfile(db, "u-alice")).toEqual({
      likedNotes: ["vanilla"],
      dislikedNotes: [],
      likedAccords: [],
      families: [],
      gender: "any",
    });
    expect((await getProfile(db, "u-nobody")).likedNotes).toEqual([]);
  });

  it("merges guest state without overwriting account data", async () => {
    const result = await mergeGuestState(db, "u-alice", {
      version: 1,
      profile: { likedNotes: ["tonka-bean"], dislikedNotes: [], likedAccords: ["Woods"], families: [], gender: "unisex" },
      collection: [
        { productId: "p00001", shelf: "wishlist", rating: null, favorite: false },
        { productId: "p00006", shelf: "tried", rating: 4, favorite: false },
      ],
    });
    expect(result.added).toBe(1);
    expect(result.profile.likedNotes).toEqual(["vanilla", "tonka-bean"]);
    const items = await getCollection(db, "u-alice");
    expect(items.find((i) => i.productId === "p00001")).toMatchObject({ shelf: "owned", rating: 5 });
    expect(items.find((i) => i.productId === "p00006")).toMatchObject({ rating: 4 });
  });

  it("deletes a user's data with the account", async () => {
    const { eq } = await import("drizzle-orm");
    await db.delete(user).where(eq(user.id, "u-bob"));
    expect(await getCollection(db, "u-bob")).toEqual([]);
  });
});
