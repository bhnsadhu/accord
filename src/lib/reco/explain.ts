import type { Reason } from "./recommend";

export type ExplainContext = {
  noteLabel: (key: string) => string;
  fragranceName: (productId: string) => string;
};

function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function ratingPhrase(weight: number): string {
  if (weight >= 1) return "one of your favourites";
  if (weight >= 0.6) return "which you own";
  if (weight >= 0.4) return "on your wishlist";
  return "which you liked";
}

/** Plain-language evidence for one reason. Only states what the reason carries. */
export function reasonText(reason: Reason, ctx: ExplainContext): string {
  const notes = (keys: string[]) => list(keys.map((k) => ctx.noteLabel(k).toLowerCase()));
  switch (reason.kind) {
    case "liked-notes":
      return `Has ${notes(reason.notes)}, from your notes`;
    case "shared-notes":
      return `Shares ${notes(reason.notes)} with ${list(reason.via.map(ctx.fragranceName))}`;
    case "similar":
      return `Close to ${ctx.fragranceName(reason.productId)}, ${ratingPhrase(reason.weight)}`;
    case "accord":
      return `Matches your taste for ${reason.accord}`;
    case "family":
      return `In the ${reason.family} family you chose`;
  }
}
