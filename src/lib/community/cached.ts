import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { getFragrancesByIds } from "@/lib/catalog/queries";
import { alsoOnShelves, communityTotals, getCommunity, getMember, mostOnShelf, mostReviewed, ratingSummaries, recentReviews, topRated } from "./repo";

// Every member write calls updateTag on the fragrance's own tag (and on
// "community" for charts and member pages), so cached entries can live long:
// a fragrance page only re-renders when someone contributes to that fragrance.

export { communityTag } from "./rules";
import { communityTag } from "./rules";

export async function cachedCommunity(productId: string, sort: "helpful" | "newest" = "helpful") {
  "use cache";
  cacheLife("days");
  cacheTag(communityTag(productId));
  return getCommunity(db, productId, { sort, limit: 100 });
}

async function withFragrances<T extends { productId: string }>(entries: T[]) {
  const rows = await getFragrancesByIds(db, entries.map(e => e.productId));
  const byId = new Map(rows.map(r => [r.productId, r]));
  return entries.flatMap(e => {
    const fragrance = byId.get(e.productId);
    return fragrance ? [{ ...e, fragrance }] : [];
  });
}

export async function cachedCharts() {
  "use cache";
  cacheLife("hours");
  cacheTag("community", "catalog");
  const [rated, owned, wanted, reviewed, recent, totals] = await Promise.all([
    topRated(db, { limit: 20 }),
    mostOnShelf(db, "owned", 10),
    mostOnShelf(db, "wishlist", 10),
    mostReviewed(db, 10),
    recentReviews(db, 8),
    communityTotals(db),
  ]);
  const [ratedF, ownedF, wantedF, reviewedF, recentF] = await Promise.all([withFragrances(rated), withFragrances(owned), withFragrances(wanted), withFragrances(reviewed), withFragrances(recent)]);
  return { rated: ratedF, owned: ownedF, wanted: wantedF, reviewed: reviewedF, recent: recentF, totals };
}

/** Member favourites within one house; a single rating is enough to appear. */
export async function cachedHouseFavourites(brandSlug: string, limit = 6) {
  "use cache";
  cacheLife("hours");
  cacheTag("community");
  return withFragrances(await topRated(db, { brandSlug, limit, minRatings: 1 }));
}

export async function cachedReminders(productId: string, reminders: { productId: string; members: number }[]) {
  "use cache";
  cacheLife("days");
  cacheTag(communityTag(productId), "catalog");
  return withFragrances(reminders);
}

export async function cachedMember(userId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("community", `member:${userId}`);
  const member = await getMember(db, userId);
  if (!member) return null;
  return { ...member, reviews: await withFragrances(member.reviews) };
}

/** Member ratings for a page of results. Refreshed whenever any member writes. */
export async function cachedRatings(productIds: string[]) {
  "use cache";
  cacheLife("hours");
  cacheTag("community");
  return ratingSummaries(db, productIds);
}

/**
 * "Members who have this also have". Part of the fragrance page shell, so it
 * refreshes with that fragrance's own tag rather than every member write;
 * a few days of lag on other shelves is acceptable for a co-occurrence list.
 */
export async function cachedAlsoOnShelves(productId: string) {
  "use cache";
  cacheLife("days");
  cacheTag(communityTag(productId), "catalog");
  return withFragrances(await alsoOnShelves(db, productId));
}
