import type { Database } from "@/db";
import { getFragrancesByIds, listNotes, type FragranceSummary } from "@/lib/catalog/queries";
import type { CollectionEntry, TasteProfile } from "@/lib/profile";
import { reasonText } from "./explain";
import { recommendationsFor } from "./service";

export type PresentedRecommendation = {
  fragrance: FragranceSummary;
  /** Relative fit percentile; null for starter picks, which are not personal. */
  match: number | null;
  reasons: string[];
};

export type PresentedSet = { kind: "personal" | "starter"; items: PresentedRecommendation[] };

let noteLabels: Promise<Map<string, string>> | null = null;
function getNoteLabels(db: Database) {
  noteLabels ??= listNotes(db)
    .then((rows) => new Map(rows.map((n) => [n.key, n.label])))
    .catch((err) => {
      noteLabels = null;
      throw err;
    });
  return noteLabels;
}

/** Recommendations joined with catalog rows and rendered explanations. */
export async function presentRecommendations(
  db: Database,
  profile: TasteProfile,
  collection: CollectionEntry[],
  k = 24,
): Promise<PresentedSet> {
  const set = await recommendationsFor(db, profile, collection, k);
  if (set.kind === "starter") {
    const fragrances = await getFragrancesByIds(db, set.productIds);
    return { kind: "starter", items: fragrances.map((fragrance) => ({ fragrance, match: null, reasons: [] })) };
  }

  const referenced = new Set<string>();
  for (const r of set.items) {
    referenced.add(r.productId);
    for (const reason of r.reasons) {
      if (reason.kind === "shared-notes") reason.via.forEach((id) => referenced.add(id));
      if (reason.kind === "similar") referenced.add(reason.productId);
    }
  }
  const [rows, labels] = await Promise.all([getFragrancesByIds(db, [...referenced]), getNoteLabels(db)]);
  const byId = new Map(rows.map((f) => [f.productId, f]));
  const ctx = {
    noteLabel: (key: string) => labels.get(key) ?? key.replace(/-/g, " "),
    fragranceName: (id: string) => byId.get(id)?.name ?? "a fragrance you saved",
  };
  return {
    kind: "personal",
    items: set.items.flatMap((r) => {
      const fragrance = byId.get(r.productId);
      return fragrance ? [{ fragrance, match: r.match, reasons: r.reasons.map((reason) => reasonText(reason, ctx)) }] : [];
    }),
  };
}
