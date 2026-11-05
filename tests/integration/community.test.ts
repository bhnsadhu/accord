import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inArray, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, collectionItems, fragrances, notes, user } from "@/db/schema";
import { upsertEntry } from "@/lib/collection/repo";
import { seedCatalog, type CatalogRow } from "@/lib/catalog/seed";
import {
  addReminder,
  communityTotals,
  deleteReview,
  getCommunity,
  getMember,
  getMine,
  mostOnShelf,
  moderationQueue,
  removeReminder,
  reportReview,
  saveReview,
  saveVote,
  setReviewStatus,
  toggleHelpful,
  topRated,
} from "@/lib/community/repo";
import { REMINDS_LIMIT, REPORT_THRESHOLD } from "@/lib/community/rules";

const row = (id: string, name: string): CatalogRow => ({
  product_id: id,
  brand: "Community House",
  name,
  family: "WOODY",
  subfamily: "WOODY",
  accords: "Woods Classical",
  notes: "Cedarwood, Vetiver, Musk",
  gender: "Unisex",
  year: "2020",
});

const A = "p90001";
const B = "p90002";
const C = "p90003";
const members = ["c-ana", "c-ben", "c-cai", "c-dee"];
const body = "Opens with a dry cedar note that settles into soft vetiver within the hour.";

beforeAll(async () => {
  await seedCatalog(db, [row(A, "Cedar One"), row(B, "Cedar Two"), row(C, "Cedar Three"), ...Array.from({ length: REMINDS_LIMIT + 1 }, (_, i) => row(`p9010${i}`, `Spare ${i}`))]);
  await db.insert(user).values(members.map(id => ({ id, name: id.slice(2).toUpperCase(), email: `${id}@example.test` }))).onConflictDoNothing();
});

// Other integration files count the whole catalog, so leave the shared database as we found it.
afterAll(async () => {
  await db.delete(collectionItems).where(inArray(collectionItems.userId, members));
  await db.delete(user).where(inArray(user.id, members));
  await db.delete(fragrances).where(like(fragrances.productId, "p90%"));
  await db.delete(brands).where(inArray(brands.name, ["Community House"]));
  await db.delete(notes).where(sql`${notes.id} not in (select note_id from fragrance_notes)`);
});

describe("wear votes", () => {
  it("keeps one vote per member and aggregates counts", async () => {
    await saveVote(db, "c-ana", { productId: A, longevity: 4, sillage: 2, seasons: ["autumn", "winter"], occasions: ["night"] });
    await saveVote(db, "c-ana", { productId: A, longevity: 5, sillage: 2, seasons: ["autumn"], occasions: ["night"] });
    await saveVote(db, "c-ben", { productId: A, longevity: 5, reads: 3, seasons: ["autumn", "autumn"], occasions: ["day", "night"] });
    const c = await getCommunity(db, A);
    expect(c.wear.voters).toBe(2);
    expect(c.wear.longevity).toEqual([0, 0, 0, 0, 2]);
    expect(c.wear.sillage).toEqual([0, 1, 0, 0]);
    expect(c.wear.reads).toEqual([0, 0, 1, 0, 0]);
    expect(c.wear.seasons).toEqual({ winter: 0, spring: 0, summer: 0, autumn: 2 });
    expect(c.wear.occasions).toEqual({ day: 1, night: 2 });
  });

  it("removes a vote when every answer is cleared and rejects out-of-range values", async () => {
    await saveVote(db, "c-ben", { productId: A });
    expect((await getCommunity(db, A)).wear.voters).toBe(1);
    await expect(saveVote(db, "c-ben", { productId: A, longevity: 9 })).rejects.toThrow();
    await expect(saveVote(db, "c-ben", { productId: A, seasons: ["monsoon"] })).rejects.toThrow();
  });

  it("returns zero counts for a fragrance nobody voted on", async () => {
    const c = await getCommunity(db, C);
    expect(c.wear.voters).toBe(0);
    expect(c.ratings).toEqual({ count: 0, average: null, distribution: [0, 0, 0, 0, 0] });
    expect(c.reviews).toEqual([]);
  });
});

describe("ratings and shelves", () => {
  it("aggregates member collection ratings and shelves", async () => {
    await upsertEntry(db, "c-ana", { productId: A, shelf: "owned", rating: 5 });
    await upsertEntry(db, "c-ben", { productId: A, shelf: "tried", rating: 4 });
    await upsertEntry(db, "c-cai", { productId: A, shelf: "wishlist" });
    const c = await getCommunity(db, A);
    expect(c.ratings).toEqual({ count: 2, average: 4.5, distribution: [0, 0, 0, 1, 1] });
    expect(c.shelves).toEqual({ owned: 1, tried: 1, wishlist: 1 });
  });

  it("charts only fragrances with enough ratings, weighted toward the mean", async () => {
    expect(await topRated(db, { productIds: [A] })).toEqual([]);
    await upsertEntry(db, "c-cai", { productId: A, shelf: "tried", rating: 3 });
    for (const [id, rating] of [["c-ana", 5], ["c-ben", 5], ["c-cai", 5], ["c-dee", 5]] as const) await upsertEntry(db, id, { productId: B, shelf: "owned", rating });
    const chart = await topRated(db, { productIds: [A, B] });
    expect(chart.map(e => e.productId)).toEqual([B, A]);
    expect(chart[0].value).toBeLessThan(5);
    expect((await mostOnShelf(db, "owned")).find(e => e.productId === B)?.count).toBe(4);
  });
});

describe("reviews", () => {
  it("validates, creates, edits and lists reviews with the author's rating", async () => {
    await expect(saveReview(db, "c-ana", { productId: A, body: "too short" })).rejects.toThrow();
    await expect(saveReview(db, "c-ana", { productId: A, body: `${body} Buy at https://spam.example` })).rejects.toThrow(/links/);
    await saveReview(db, "c-ana", { productId: A, body });
    await saveReview(db, "c-ana", { productId: A, body: `${body}  Lasts all evening.` });
    const c = await getCommunity(db, A);
    expect(c.reviewCount).toBe(1);
    expect(c.reviews[0]).toMatchObject({ author: "ANA", rating: 5, shelf: "owned", body: `${body} Lasts all evening.` });
  });

  it("counts helpful once per member and never for the author", async () => {
    const [review] = (await getCommunity(db, A)).reviews;
    expect(await toggleHelpful(db, "c-ana", review.id)).toBeNull();
    expect(await toggleHelpful(db, "c-ben", review.id)).toEqual({ productId: A, on: true });
    expect((await getCommunity(db, A)).reviews[0].helpful).toBe(1);
    expect(await toggleHelpful(db, "c-ben", review.id)).toEqual({ productId: A, on: false });
    expect((await getCommunity(db, A)).reviews[0].helpful).toBe(0);
  });

  it("hides a review after enough distinct reports and lets the owner restore it", async () => {
    const [review] = (await getCommunity(db, A)).reviews;
    expect(await reportReview(db, "c-ana", { reviewId: review.id, reason: "spam" })).toBeNull();
    for (const id of members.slice(1, 1 + REPORT_THRESHOLD)) {
      await reportReview(db, id, { reviewId: review.id, reason: "spam" });
      await reportReview(db, id, { reviewId: review.id, reason: "spam" });
    }
    expect((await getCommunity(db, A)).reviewCount).toBe(0);
    expect((await getMine(db, "c-ana", A)).review?.status).toBe("hidden");
    const queue = await moderationQueue(db);
    expect(queue.find(q => q.id === review.id)?.reports).toBe(REPORT_THRESHOLD);
    await setReviewStatus(db, review.id, "published", true);
    expect((await getCommunity(db, A)).reviewCount).toBe(1);
  });

  it("shows published reviews on the member page and removes them on delete", async () => {
    expect((await getMember(db, "c-ana"))?.reviews).toHaveLength(1);
    await deleteReview(db, "c-ana", A);
    expect((await getMember(db, "c-ana"))?.reviews).toHaveLength(0);
    expect(await getMember(db, "nobody")).toBeNull();
  });
});

describe("reminds me of", () => {
  it("counts distinct members and enforces limits", async () => {
    await addReminder(db, "c-ana", A, B);
    await addReminder(db, "c-ana", A, B);
    await addReminder(db, "c-ben", A, B);
    await addReminder(db, "c-ben", A, C);
    expect((await getCommunity(db, A)).reminds).toEqual([{ productId: B, members: 2 }, { productId: C, members: 1 }]);
    await expect(addReminder(db, "c-ana", A, A)).rejects.toThrow();
    for (let i = 0; i < REMINDS_LIMIT - 1; i++) await addReminder(db, "c-ana", A, `p9010${i}`);
    await expect(addReminder(db, "c-ana", A, `p9010${REMINDS_LIMIT}`)).rejects.toThrow(/up to/);
    await removeReminder(db, "c-ben", A, C);
    expect((await getMine(db, "c-ben", A)).reminds).toEqual([{ productId: B, name: "Cedar Two", brand: "Community House" }]);
  });

  it("reports community totals", async () => {
    const totals = await communityTotals(db);
    expect(totals.members).toBeGreaterThanOrEqual(4);
    expect(totals.ratings).toBeGreaterThanOrEqual(7);
  });
});
