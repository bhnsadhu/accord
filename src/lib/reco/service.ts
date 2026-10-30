import type { Database } from "@/db";
import type { CollectionEntry, TasteProfile } from "@/lib/profile";
import { archetypes, similarTo } from "./discover";
import { getCatalogIndex } from "./load";
import { hasSignals, itemWeightFromCollection, recommend, type Recommendation, type TasteSignals } from "./recommend";

export function signalsFrom(profile: TasteProfile, collection: CollectionEntry[]): TasteSignals {
  return {
    likedNotes: profile.likedNotes,
    dislikedNotes: profile.dislikedNotes,
    likedAccords: profile.likedAccords,
    families: profile.families,
    gender: profile.gender,
    items: collection.map((entry) => ({ productId: entry.productId, weight: itemWeightFromCollection(entry) })),
  };
}

export type RecommendationSet =
  | { kind: "personal"; items: Recommendation[] }
  | { kind: "starter"; productIds: string[] };

/** Personal recommendations when there is any signal; otherwise a tour of the wheel. */
export async function recommendationsFor(
  db: Database,
  profile: TasteProfile,
  collection: CollectionEntry[],
  k = 24,
): Promise<RecommendationSet> {
  const index = await getCatalogIndex(db);
  const signals = signalsFrom(profile, collection);
  if (!hasSignals(signals)) return { kind: "starter", productIds: archetypes(index, 3) };
  return { kind: "personal", items: recommend(index, signals, { k }) };
}

export async function similarFragrances(db: Database, productId: string, k = 12) {
  return similarTo(await getCatalogIndex(db), productId, k);
}
