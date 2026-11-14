import { afterEach, describe, expect, it, vi } from "vitest";
import snapshot from "../../../../data/research/scentrev-preview.json";
import trial from "../../../../docs/research/scentrev-trial-2026-11-13.json";
import { SEASONS, supportedMetric } from "./model";

describe("ScentRev preview evidence", () => {
  it("preserves the ten trial scores and record counts without joining catalog identities", () => {
    const comparison = trial.officialPlayground.results.find(result => result.tool === "compare_fragrances")!;
    expect(snapshot.records).toHaveLength(10);
    for (const sample of snapshot.records) {
      const source = comparison.records!.find(record => record.slug === sample.slug)!;
      expect(source).toBeDefined();
      for (const metric of ["rating", "longevity", "sillage"] as const) {
        expect(sample[metric].score).toBe(source[metric].score);
        expect(sample[metric].n_records).toBe(source[metric].n_records);
        expect(supportedMetric(sample[metric])).not.toBeNull();
      }
      for (const season of SEASONS) {
        expect(sample.seasons[season].n_records).toBe(source.seasonRecordCounts[season]);
        expect(supportedMetric(sample.seasons[season])).not.toBeNull();
      }
      expect(sample).not.toHaveProperty("productId");
      expect(sample).not.toHaveProperty("projection");
    }
  });

  it("keeps absent or unsupported evidence missing, while retaining genuine zero scores", () => {
    expect(supportedMetric(null)).toBeNull();
    expect(supportedMetric(undefined)).toBeNull();
    for (const [score, n_records] of [[null, 4], [0.8, null], [0.8, 0], [0.8, -1], [0.8, 1.5], [NaN, 4], [1.1, 4], [-0.1, 4]]) {
      expect(supportedMetric({ score, n_records, category: null })).toBeNull();
    }
    expect(supportedMetric({ score: 0, n_records: 4, category: null })).toEqual({ score: 0, count: 4, category: null });
  });
});

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_HTTP_ERROR_FALLBACK;404"); } }));
afterEach(() => vi.unstubAllEnvs());

it("blocks the preview in production before loading its snapshot", async () => {
  vi.stubEnv("NODE_ENV", "production");
  const { default: page } = await import("./page");
  await expect(page()).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
});
