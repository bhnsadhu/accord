import { z } from "zod";

const productId = z.string().regex(/^(p\d{5}|a[0-9a-f]{12})$/);
const key = z.string().min(1).max(60).regex(/^[a-z0-9-]+$/);
const label = z.string().min(1).max(40);

/** The explicit half of a person's taste: what they told Accord directly. */
export const tasteProfileSchema = z.object({
  likedNotes: z.array(key).max(30).default([]),
  dislikedNotes: z.array(key).max(30).default([]),
  likedAccords: z.array(label).max(20).default([]),
  families: z.array(label).max(15).default([]),
  gender: z.enum(["any", "feminine", "masculine", "unisex"]).default("any"),
});
export type TasteProfile = z.infer<typeof tasteProfileSchema>;

export const emptyProfile: TasteProfile = tasteProfileSchema.parse({});

export const shelfSchema = z.enum(["owned", "tried", "wishlist"]);
export type Shelf = z.infer<typeof shelfSchema>;

export const collectionEntrySchema = z.object({
  productId,
  shelf: shelfSchema,
  rating: z.number().int().min(1).max(5).nullable().default(null),
  favorite: z.boolean().default(false),
});
export type CollectionEntry = z.infer<typeof collectionEntrySchema>;

/** Everything a guest keeps in local storage, and what is merged on sign-in. */
export const guestStateSchema = z.object({
  version: z.literal(1),
  profile: tasteProfileSchema,
  collection: z.array(collectionEntrySchema).max(500),
});
export type GuestState = z.infer<typeof guestStateSchema>;
