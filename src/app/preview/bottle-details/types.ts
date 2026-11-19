import type { FragranceSummary } from "@/lib/catalog/queries";

export type PreviewBottle = FragranceSummary & {
  bottleImage?: string;
  description: string;
  keyNotes: string[];
  source: string;
  related: { fragrance: FragranceSummary; sharedNotes: string[] }[];
};
