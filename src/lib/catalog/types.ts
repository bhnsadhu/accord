import type { FragranceResearch } from "./research-schema";

export type FragranceSummary = {
  productId: string;
  bottleThumbnail?: string;
  slug: string;
  name: string;
  brand: string;
  brandSlug: string;
  family: string | null;
  subfamily: string | null;
  wheel: string | null;
  character: string | null;
  facets: string[];
  gender: "feminine" | "masculine" | "unisex" | null;
  year: number | null;
  notes: string[];
  concentration?: string | null;
  perfumers?: string[];
  editionGroup?: string | null;
  editionLabel?: string | null;
};

export type FragranceDetail = FragranceSummary & {
  accordsRaw: string;
  notes: string[];
  noteKeys: string[];
  research: FragranceResearch | null;
};

export type SearchParams = {
  q?: string;
  family?: string;
  wheel?: string;
  facet?: string;
  notes?: string[];
  excludeNotes?: string[];
  gender?: "feminine" | "masculine" | "unisex";
  brand?: string;
  concentration?: string;
  perfumer?: string;
  year?: number;
  sort?: "relevance" | "name" | "newest" | "oldest";
  page?: number;
  pageSize?: number;
};

export type SearchResult = { items: FragranceSummary[]; total: number; page: number; pageSize: number };

