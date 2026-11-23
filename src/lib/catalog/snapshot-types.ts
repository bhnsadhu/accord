import type { FragranceDetail } from "./types";
import type * as postgres from "./postgres-queries";

export type CatalogRecord = FragranceDetail & {
  searchText: string;
  aliasesText: string;
  featureYear: number | null;
};

/** Public catalog only. Account, session and collection tables never enter this file. */
export type CatalogSnapshot = {
  version: 1;
  sourceSha256: string;
  researchSha256: string;
  fragrances: CatalogRecord[];
  brands: Awaited<ReturnType<typeof postgres.listBrands>>;
  notes: Awaited<ReturnType<typeof postgres.listNotes>>;
  coverage: Awaited<ReturnType<typeof postgres.catalogCoverage>>;
  facets: Awaited<ReturnType<typeof postgres.facetCounts>>;
  noteFamilies: Awaited<ReturnType<typeof postgres.noteFamilyStats>>;
  perfumers: Awaited<ReturnType<typeof postgres.listPerfumers>>;
  years: Awaited<ReturnType<typeof postgres.yearCounts>>;
};
