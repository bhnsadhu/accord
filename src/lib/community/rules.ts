import { z } from "zod";

/**
 * The words members vote with. Every scale describes what someone noticed on
 * their own skin; the public page shows how many members chose each option,
 * never a single invented verdict.
 */
export const LONGEVITY = ["Under an hour", "1 to 3 hours", "3 to 6 hours", "6 to 12 hours", "Over 12 hours"] as const;
export const SILLAGE = ["Close to skin", "Arm's length", "Fills a room", "Leaves a trail"] as const;
export const READS = ["Feminine", "Leans feminine", "Shared", "Leans masculine", "Masculine"] as const;
export const VALUE = ["Overpriced", "A little high", "Fair", "Good value", "Great value"] as const;
export const SEASONS = ["winter", "spring", "summer", "autumn"] as const;
export const OCCASIONS = ["day", "night"] as const;

export const SEASON_LABEL: Record<(typeof SEASONS)[number], string> = { winter: "Winter", spring: "Spring", summer: "Summer", autumn: "Autumn" };
export const OCCASION_LABEL: Record<(typeof OCCASIONS)[number], string> = { day: "Day", night: "Night" };

export const SHELF_LABEL = { owned: "Owns it", tried: "Tried it", wishlist: "Wants to try it" } as const;

/** A review or join date, the same on server and client. */
export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Cache tag for one fragrance's member data. */
export const communityTag = (productId: string) => `community:${productId}`;

export const productIdSchema = z.string().regex(/^(p\d{5}|a[0-9a-f]{12})$/);
const scale = (max: number) => z.number().int().min(1).max(max).nullable().default(null);

export const wearVoteSchema = z.object({
  productId: productIdSchema,
  longevity: scale(LONGEVITY.length),
  sillage: scale(SILLAGE.length),
  reads: scale(READS.length),
  value: scale(VALUE.length),
  seasons: z.array(z.enum(SEASONS)).max(SEASONS.length).default([]).transform(v => [...new Set(v)]),
  occasions: z.array(z.enum(OCCASIONS)).max(OCCASIONS.length).default([]).transform(v => [...new Set(v)]),
}).strict();
export type WearVote = z.infer<typeof wearVoteSchema>;

export const REVIEW_MIN = 30;
export const REVIEW_MAX = 3000;
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|shop|store|ly|xyz|ru|cn)\b)/i;

/** Normalises whitespace and refuses links, which are almost always spam on review sites. */
export const reviewBodySchema = z
  .string()
  .transform(v => v.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim())
  .pipe(
    z.string()
      .min(REVIEW_MIN, `Write at least ${REVIEW_MIN} characters.`)
      .max(REVIEW_MAX, `Keep it under ${REVIEW_MAX} characters.`)
      .refine(v => !LINK.test(v), "Reviews can't include links.")
      .refine(v => /\p{L}{2,}/u.test(v), "Write the review in words."),
  );

export const reviewSchema = z.object({ productId: productIdSchema, body: reviewBodySchema }).strict();

export const REPORT_REASONS = { spam: "Spam or advertising", abuse: "Abusive or hateful", "off-topic": "Not about this fragrance", personal: "Shares personal information" } as const;
export const reportSchema = z.object({ reviewId: z.number().int().positive(), reason: z.enum(Object.keys(REPORT_REASONS) as [keyof typeof REPORT_REASONS, ...(keyof typeof REPORT_REASONS)[]]) }).strict();

/** Reports from this many different members hide a review until the owner looks at it. */
export const REPORT_THRESHOLD = 3;
/** A member can link one fragrance to at most this many others. */
export const REMINDS_LIMIT = 6;

/** Ratings needed before a fragrance appears in the top-rated chart. */
export const CHART_MIN_RATINGS = 3;

/**
 * Bayesian average: pulls fragrances with few ratings toward the community
 * mean, so one 5-star rating never outranks fifty 4.6s.
 */
export function weightedRating(sum: number, count: number, mean: number, prior = CHART_MIN_RATINGS) {
  if (count <= 0) return mean;
  return (prior * mean + sum) / (prior + count);
}

/** The option most members chose, or null when nobody voted or the top choices tie. */
export function leading(counts: number[]): number | null {
  const max = Math.max(0, ...counts);
  if (max === 0) return null;
  const top = counts.flatMap((c, i) => (c === max ? [i] : []));
  return top.length === 1 ? top[0] : null;
}

export function percent(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}
