import type { FragranceSummary } from "./catalog/queries";

// The shelf order is intentional. Coffee & Whiskey closes the row.
export const HOME_BOTTLE_IDS = ["p08355", "p14487", "p12527", "a09e1f2c0fabb", "p03345", "p03615"];

const labels: Record<string, string> = {
  p12527: "Cypress & Grapevine",
  a09e1f2c0fabb: "Ombré Leather",
};

export function homeBottleName(fragrance: Pick<FragranceSummary, "productId" | "name">) {
  return labels[fragrance.productId] ?? fragrance.name;
}
