export type SourceMetric = {
  score: number | null;
  category: string | null;
  n_records: number | null;
};

export const SEASONS = ["spring", "summer", "fall", "winter"] as const;
export type Season = (typeof SEASONS)[number];

export type ScentRevRecord = {
  slug: string;
  name: string;
  brand: string;
  year: number | null;
  concentration: string | null;
  rating: SourceMetric | null;
  longevity: SourceMetric | null;
  sillage: SourceMetric | null;
  seasons: Partial<Record<Season, SourceMetric>>;
};

export type ScentRevSnapshot = {
  capturedAt: string;
  source: string;
  sourceUrl: string;
  records: ScentRevRecord[];
};

/** Missing evidence stays missing. Zero is a valid score when records support it. */
export function supportedMetric(metric: SourceMetric | null | undefined) {
  if (!metric || typeof metric.score !== "number" || !Number.isFinite(metric.score)
    || metric.score < 0 || metric.score > 1
    || typeof metric.n_records !== "number" || !Number.isInteger(metric.n_records)
    || metric.n_records <= 0) return null;
  return { score: metric.score, count: metric.n_records, category: metric.category };
}

export function metricLabel(category: string | null) {
  if (!category) return "Not listed";
  const text = category.replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const countLabel = (count: number) => new Intl.NumberFormat("en-US").format(count);
