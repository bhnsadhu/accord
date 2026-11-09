// Legacy data access for maintenance and retention checks only. No public routes use this module.
import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { brands, collectionItems, fragrances, remindsOf, reviewHelpful, reviewReports, reviews, user, wearVotes } from "@/db/schema";
import {
  CHART_MIN_RATINGS,
  LONGEVITY,
  OCCASIONS,
  READS,
  REMINDS_LIMIT,
  REPORT_THRESHOLD,
  SEASONS,
  SILLAGE,
  VALUE,
  productIdSchema,
  reportSchema,
  reviewSchema,
  wearVoteSchema,
  weightedRating,
  type WearVote,
} from "./rules";

/**
 * Community reads return aggregates and published reviews only. Writes take
 * the member id from the verified session and scope every statement by it.
 */

export type ReviewItem = {
  id: number;
  productId: string;
  authorId: string;
  author: string;
  body: string;
  rating: number | null;
  shelf: "owned" | "tried" | "wishlist" | null;
  helpful: number;
  createdAt: string;
  edited: boolean;
};

export type CommunitySummary = {
  ratings: { count: number; average: number | null; distribution: number[] };
  shelves: { owned: number; tried: number; wishlist: number };
  wear: {
    voters: number;
    longevity: number[];
    sillage: number[];
    reads: number[];
    value: number[];
    seasons: Record<(typeof SEASONS)[number], number>;
    occasions: Record<(typeof OCCASIONS)[number], number>;
  };
  reviewCount: number;
  reviews: ReviewItem[];
  reminds: { productId: string; members: number }[];
};

const zeros = (n: number) => Array.from({ length: n }, () => 0);

const reviewColumns = {
  id: reviews.id,
  productId: reviews.productId,
  authorId: reviews.userId,
  author: user.name,
  body: reviews.body,
  rating: collectionItems.rating,
  shelf: collectionItems.shelf,
  helpful: reviews.helpful,
  createdAt: sql<string>`to_char(${reviews.createdAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
  edited: sql<boolean>`${reviews.updatedAt} > ${reviews.createdAt} + interval '5 minutes'`,
};

function reviewQuery(db: Database) {
  return db
    .select(reviewColumns)
    .from(reviews)
    .innerJoin(user, eq(user.id, reviews.userId))
    .leftJoin(collectionItems, and(eq(collectionItems.userId, reviews.userId), eq(collectionItems.productId, reviews.productId)));
}

export async function getCommunity(db: Database, productId: string, opts: { sort?: "helpful" | "newest"; limit?: number } = {}): Promise<CommunitySummary> {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
  const [ratingRows, shelfRows, wearRow, reviewRows, reviewCount, remindRows] = await Promise.all([
    db
      .select({ rating: collectionItems.rating, n: sql<number>`count(*)`.mapWith(Number) })
      .from(collectionItems)
      .where(and(eq(collectionItems.productId, productId), sql`${collectionItems.rating} is not null`))
      .groupBy(collectionItems.rating),
    db
      .select({ shelf: collectionItems.shelf, n: sql<number>`count(*)`.mapWith(Number) })
      .from(collectionItems)
      .where(eq(collectionItems.productId, productId))
      .groupBy(collectionItems.shelf),
    db.execute<{ voters: number; longevity: number[]; sillage: number[]; reads: number[]; value: number[]; seasons: Record<string, number> | null; occasions: Record<string, number> | null }>(sql`
      select count(*)::int as voters,
        array[${sql.join(LONGEVITY.map((_, i) => sql`count(*) filter (where longevity = ${i + 1})::int`), sql`, `)}] as longevity,
        array[${sql.join(SILLAGE.map((_, i) => sql`count(*) filter (where sillage = ${i + 1})::int`), sql`, `)}] as sillage,
        array[${sql.join(READS.map((_, i) => sql`count(*) filter (where reads = ${i + 1})::int`), sql`, `)}] as reads,
        array[${sql.join(VALUE.map((_, i) => sql`count(*) filter (where value = ${i + 1})::int`), sql`, `)}] as value,
        (select jsonb_object_agg(s, n) from (select s, count(*)::int n from ${wearVotes} w2, unnest(w2.seasons) s where w2.product_id = ${productId} group by s) x) as seasons,
        (select jsonb_object_agg(o, n) from (select o, count(*)::int n from ${wearVotes} w3, unnest(w3.occasions) o where w3.product_id = ${productId} group by o) y) as occasions
      from ${wearVotes} where product_id = ${productId}`),
    reviewQuery(db)
      .where(and(eq(reviews.productId, productId), eq(reviews.status, "published")))
      .orderBy(...(opts.sort === "newest" ? [desc(reviews.createdAt)] : [desc(reviews.helpful), desc(reviews.createdAt)]), desc(reviews.id))
      .limit(limit),
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.status, "published"))),
    db
      .select({ productId: remindsOf.otherId, members: sql<number>`count(*)`.mapWith(Number) })
      .from(remindsOf)
      .where(eq(remindsOf.productId, productId))
      .groupBy(remindsOf.otherId)
      .orderBy(sql`2 desc`, remindsOf.otherId)
      .limit(12),
  ]);

  const distribution = zeros(5);
  for (const r of ratingRows) if (r.rating) distribution[r.rating - 1] = r.n;
  const count = distribution.reduce((a, b) => a + b, 0);
  const sum = distribution.reduce((a, n, i) => a + n * (i + 1), 0);
  const shelves = { owned: 0, tried: 0, wishlist: 0 };
  for (const r of shelfRows) shelves[r.shelf] = r.n;
  const w = wearRow.rows[0];

  return {
    ratings: { count, average: count ? Math.round((sum / count) * 100) / 100 : null, distribution },
    shelves,
    wear: {
      voters: w?.voters ?? 0,
      longevity: w?.longevity ?? zeros(LONGEVITY.length),
      sillage: w?.sillage ?? zeros(SILLAGE.length),
      reads: w?.reads ?? zeros(READS.length),
      value: w?.value ?? zeros(VALUE.length),
      seasons: Object.fromEntries(SEASONS.map(s => [s, w?.seasons?.[s] ?? 0])) as CommunitySummary["wear"]["seasons"],
      occasions: Object.fromEntries(OCCASIONS.map(o => [o, w?.occasions?.[o] ?? 0])) as CommunitySummary["wear"]["occasions"],
    },
    reviewCount: reviewCount[0]?.n ?? 0,
    reviews: reviewRows,
    reminds: remindRows,
  };
}

export type MyCommunity = {
  vote: WearVote | null;
  review: { body: string; status: "published" | "hidden" } | null;
  reminds: { productId: string; name: string; brand: string }[];
  helpful: number[];
  reported: number[];
};

export async function getMine(db: Database, userId: string, productId: string): Promise<MyCommunity> {
  productIdSchema.parse(productId);
  const [vote, review, reminds, helpful, reported] = await Promise.all([
    db.select().from(wearVotes).where(and(eq(wearVotes.userId, userId), eq(wearVotes.productId, productId))),
    db.select({ body: reviews.body, status: reviews.status }).from(reviews).where(and(eq(reviews.userId, userId), eq(reviews.productId, productId))),
    db.select({ productId: remindsOf.otherId, name: fragrances.name, brand: brands.name }).from(remindsOf).innerJoin(fragrances, eq(fragrances.productId, remindsOf.otherId)).innerJoin(brands, eq(brands.id, fragrances.brandId)).where(and(eq(remindsOf.userId, userId), eq(remindsOf.productId, productId))),
    db.select({ id: reviewHelpful.reviewId }).from(reviewHelpful).innerJoin(reviews, eq(reviews.id, reviewHelpful.reviewId)).where(and(eq(reviewHelpful.userId, userId), eq(reviews.productId, productId))),
    db.select({ id: reviewReports.reviewId }).from(reviewReports).innerJoin(reviews, eq(reviews.id, reviewReports.reviewId)).where(and(eq(reviewReports.userId, userId), eq(reviews.productId, productId))),
  ]);
  const v = vote[0];
  return {
    vote: v ? { productId, longevity: v.longevity, sillage: v.sillage, reads: v.reads, value: v.value, seasons: v.seasons as WearVote["seasons"], occasions: v.occasions as WearVote["occasions"] } : null,
    review: review[0] ?? null,
    reminds,
    helpful: helpful.map(r => r.id),
    reported: reported.map(r => r.id),
  };
}

/** Saves the member's wear vote; clearing every answer removes it. */
export async function saveVote(db: Database, userId: string, input: unknown): Promise<WearVote | null> {
  const vote = wearVoteSchema.parse(input);
  const empty = vote.longevity === null && vote.sillage === null && vote.reads === null && vote.value === null && !vote.seasons.length && !vote.occasions.length;
  if (empty) {
    await db.delete(wearVotes).where(and(eq(wearVotes.userId, userId), eq(wearVotes.productId, vote.productId)));
    return null;
  }
  const { productId, ...fields } = vote;
  await db
    .insert(wearVotes)
    .values({ userId, productId, ...fields })
    .onConflictDoUpdate({ target: [wearVotes.userId, wearVotes.productId], set: { ...fields, updatedAt: sql`now()` } });
  return vote;
}

/** Creates or edits the member's review. Editing keeps a hidden review hidden. */
export async function saveReview(db: Database, userId: string, input: unknown) {
  const { productId, body } = reviewSchema.parse(input);
  const [row] = await db
    .insert(reviews)
    .values({ userId, productId, body })
    .onConflictDoUpdate({ target: [reviews.userId, reviews.productId], set: { body, updatedAt: sql`now()` } })
    .returning({ id: reviews.id, status: reviews.status });
  return row;
}

export async function deleteReview(db: Database, userId: string, productId: string) {
  productIdSchema.parse(productId);
  await db.delete(reviews).where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)));
}

/** Toggles "helpful" on someone else's published review. Returns the new state, or null when not allowed. */
export async function toggleHelpful(db: Database, userId: string, reviewId: number): Promise<{ productId: string; on: boolean } | null> {
  if (!Number.isInteger(reviewId) || reviewId < 1) return null;
  return db.transaction(async tx => {
    const [target] = await tx.select({ authorId: reviews.userId, productId: reviews.productId, status: reviews.status }).from(reviews).where(eq(reviews.id, reviewId)).for("update");
    if (!target || target.authorId === userId || target.status !== "published") return null;
    const removed = await tx.delete(reviewHelpful).where(and(eq(reviewHelpful.reviewId, reviewId), eq(reviewHelpful.userId, userId))).returning();
    if (removed.length) {
      await tx.update(reviews).set({ helpful: sql`greatest(${reviews.helpful} - 1, 0)` }).where(eq(reviews.id, reviewId));
      return { productId: target.productId, on: false };
    }
    await tx.insert(reviewHelpful).values({ reviewId, userId });
    await tx.update(reviews).set({ helpful: sql`${reviews.helpful} + 1` }).where(eq(reviews.id, reviewId));
    return { productId: target.productId, on: true };
  });
}

/** Records one report per member; enough distinct reports hide the review. */
export async function reportReview(db: Database, userId: string, input: unknown): Promise<{ productId: string; hidden: boolean } | null> {
  const { reviewId, reason } = reportSchema.parse(input);
  return db.transaction(async tx => {
    const [target] = await tx.select({ authorId: reviews.userId, productId: reviews.productId }).from(reviews).where(eq(reviews.id, reviewId)).for("update");
    if (!target || target.authorId === userId) return null;
    const inserted = await tx.insert(reviewReports).values({ reviewId, userId, reason }).onConflictDoNothing().returning();
    if (!inserted.length) return { productId: target.productId, hidden: false };
    const [row] = await tx
      .update(reviews)
      .set({ reports: sql`${reviews.reports} + 1`, status: sql`case when ${reviews.reports} + 1 >= ${REPORT_THRESHOLD} then 'hidden'::review_status else ${reviews.status} end` })
      .where(eq(reviews.id, reviewId))
      .returning({ status: reviews.status });
    return { productId: target.productId, hidden: row.status === "hidden" };
  });
}

export async function addReminder(db: Database, userId: string, productId: string, otherId: string) {
  productIdSchema.parse(productId);
  productIdSchema.parse(otherId);
  if (productId === otherId) throw new Error("A fragrance can't remind you of itself.");
  const [{ n }] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(remindsOf).where(and(eq(remindsOf.userId, userId), eq(remindsOf.productId, productId)));
  if (n >= REMINDS_LIMIT) throw new Error(`You can link up to ${REMINDS_LIMIT} fragrances.`);
  await db.insert(remindsOf).values({ userId, productId, otherId }).onConflictDoNothing();
}

export async function removeReminder(db: Database, userId: string, productId: string, otherId: string) {
  await db.delete(remindsOf).where(and(eq(remindsOf.userId, userId), eq(remindsOf.productId, productId), eq(remindsOf.otherId, otherId)));
}

// ---------------------------------------------------------------------------
// Charts and member pages
// ---------------------------------------------------------------------------

export type ChartEntry = { productId: string; value: number; count: number };

/** Highest weighted member rating among fragrances with enough ratings. */
export async function topRated(db: Database, opts: { limit?: number; productIds?: string[]; brandSlug?: string; minRatings?: number } = {}): Promise<ChartEntry[]> {
  const min = opts.minRatings ?? CHART_MIN_RATINGS;
  const scope = opts.productIds
    ? sql`and product_id = any(${sql.param(opts.productIds)}::text[])`
    : opts.brandSlug
      ? sql`and product_id in (select f.product_id from ${fragrances} f join ${brands} b on b.id = f.brand_id where b.slug = ${opts.brandSlug})`
      : sql``;
  const result = await db.execute<{ product_id: string; sum: number; n: number; mean: number }>(sql`
    with rated as (select product_id, rating from ${collectionItems} where rating is not null ${scope}),
    mean as (select coalesce(avg(rating), 0)::float as m from rated)
    select product_id, sum(rating)::int as sum, count(*)::int as n, (select m from mean) as mean
    from rated group by product_id having count(*) >= ${min}`);
  return result.rows
    .map(r => ({ productId: r.product_id, value: Math.round(weightedRating(r.sum, r.n, r.mean, min) * 100) / 100, count: r.n }))
    .sort((a, b) => b.value - a.value || b.count - a.count || a.productId.localeCompare(b.productId))
    .slice(0, opts.limit ?? 20);
}

export async function mostOnShelf(db: Database, shelf: "owned" | "wishlist" | "tried", limit = 20): Promise<ChartEntry[]> {
  const rows = await db
    .select({ productId: collectionItems.productId, count: sql<number>`count(*)`.mapWith(Number) })
    .from(collectionItems)
    .where(eq(collectionItems.shelf, shelf))
    .groupBy(collectionItems.productId)
    .orderBy(sql`2 desc`, collectionItems.productId)
    .limit(limit);
  return rows.map(r => ({ ...r, value: r.count }));
}

export async function mostReviewed(db: Database, limit = 20): Promise<ChartEntry[]> {
  const rows = await db
    .select({ productId: reviews.productId, count: sql<number>`count(*)`.mapWith(Number) })
    .from(reviews)
    .where(eq(reviews.status, "published"))
    .groupBy(reviews.productId)
    .orderBy(sql`2 desc`, reviews.productId)
    .limit(limit);
  return rows.map(r => ({ ...r, value: r.count }));
}

export async function recentReviews(db: Database, limit = 12): Promise<ReviewItem[]> {
  return reviewQuery(db).where(eq(reviews.status, "published")).orderBy(desc(reviews.createdAt), desc(reviews.id)).limit(limit);
}

export async function communityTotals(db: Database) {
  const result = await db.execute<{ members: number; ratings: number; reviews: number; votes: number }>(sql`
    select
      (select count(distinct user_id)::int from (select user_id from ${collectionItems} union select user_id from ${reviews} union select user_id from ${wearVotes}) m) as members,
      (select count(*)::int from ${collectionItems} where rating is not null) as ratings,
      (select count(*)::int from ${reviews} where status = 'published') as reviews,
      (select count(*)::int from ${wearVotes}) as votes`);
  return result.rows[0];
}

/** A member's public page: their name and published reviews. Collections stay private. */
export async function getMember(db: Database, userId: string) {
  const [member] = await db.select({ id: user.id, name: user.name, joined: sql<string>`to_char(${user.createdAt}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')` }).from(user).where(eq(user.id, userId));
  if (!member) return null;
  const items = await reviewQuery(db).where(and(eq(reviews.userId, userId), eq(reviews.status, "published"))).orderBy(desc(reviews.createdAt)).limit(100);
  return { ...member, reviews: items };
}

/** Owner moderation: reported or hidden reviews, most reported first. */
export async function moderationQueue(db: Database) {
  return db
    .select({ ...reviewColumns, status: reviews.status, reports: reviews.reports, reasons: sql<string[]>`(select array_agg(reason) from ${reviewReports} r where r.review_id = ${reviews.id})` })
    .from(reviews)
    .innerJoin(user, eq(user.id, reviews.userId))
    .leftJoin(collectionItems, and(eq(collectionItems.userId, reviews.userId), eq(collectionItems.productId, reviews.productId)))
    .where(sql`${reviews.reports} > 0 or ${reviews.status} = 'hidden'`)
    .orderBy(desc(reviews.reports), desc(reviews.createdAt));
}

export async function setReviewStatus(db: Database, reviewId: number, status: "published" | "hidden", clearReports = false) {
  await db.transaction(async tx => {
    if (clearReports) await tx.delete(reviewReports).where(eq(reviewReports.reviewId, reviewId));
    await tx.update(reviews).set({ status, ...(clearReports ? { reports: 0 } : {}) }).where(eq(reviews.id, reviewId));
  });
}

/** Every fragrance whose public totals include this member, for cache refresh when the account goes. */
export async function memberFootprint(db: Database, userId: string): Promise<string[]> {
  const result = await db.execute<{ product_id: string }>(sql`
    select product_id from ${collectionItems} where user_id = ${userId}
    union select product_id from ${reviews} where user_id = ${userId}
    union select product_id from ${wearVotes} where user_id = ${userId}
    union select product_id from ${remindsOf} where user_id = ${userId}`);
  return result.rows.map(r => r.product_id);
}

export type RatingSummary = { average: number; count: number };

/** Member rating per fragrance, for result lists. Fragrances without ratings are absent. */
export async function ratingSummaries(db: Database, productIds: string[]): Promise<Record<string, RatingSummary>> {
  const ids = [...new Set(productIds.filter(id => productIdSchema.safeParse(id).success))].slice(0, 200);
  if (!ids.length) return {};
  const rows = await db
    .select({ productId: collectionItems.productId, average: sql<number>`round(avg(${collectionItems.rating})::numeric, 1)::float`, count: sql<number>`count(*)`.mapWith(Number) })
    .from(collectionItems)
    .where(and(sql`${collectionItems.productId} = any(${sql.param(ids)}::text[])`, sql`${collectionItems.rating} is not null`))
    .groupBy(collectionItems.productId);
  return Object.fromEntries(rows.map(r => [r.productId, { average: Number(r.average), count: r.count }]));
}

/**
 * Fragrances most often on the same members' owned or tried shelves as this
 * one. Only pairs shared by at least `minMembers` members are returned, so a
 * single collection never shows up as a public pattern.
 */
export async function alsoOnShelves(db: Database, productId: string, opts: { limit?: number; minMembers?: number } = {}) {
  const min = opts.minMembers ?? 2;
  const result = await db.execute<{ product_id: string; members: number }>(sql`
    select other.product_id, count(distinct other.user_id)::int as members
    from ${collectionItems} mine
    join ${collectionItems} other on other.user_id = mine.user_id and other.product_id <> mine.product_id and other.shelf in ('owned', 'tried')
    where mine.product_id = ${productId} and mine.shelf in ('owned', 'tried') and coalesce(other.rating, 3) >= 3
    group by other.product_id having count(distinct other.user_id) >= ${min}
    order by 2 desc, 1 limit ${opts.limit ?? 6}`);
  return result.rows.map(r => ({ productId: r.product_id, members: r.members }));
}
