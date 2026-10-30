import { and, eq, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { collectionItems, tasteProfiles } from "@/db/schema";
import {
  collectionEntrySchema,
  emptyProfile,
  tasteProfileSchema,
  type CollectionEntry,
  type GuestState,
  type TasteProfile,
} from "@/lib/profile";

/**
 * Every function takes the user id from the verified session, never from the
 * request body, and scopes every statement by it. There is no code path that
 * reads or writes another user's rows.
 */

export async function getProfile(db: Database, userId: string): Promise<TasteProfile> {
  const [row] = await db.select().from(tasteProfiles).where(eq(tasteProfiles.userId, userId));
  if (!row) return emptyProfile;
  const parsed = tasteProfileSchema.safeParse(row.profile);
  return parsed.success ? parsed.data : emptyProfile;
}

export async function saveProfile(db: Database, userId: string, input: unknown): Promise<TasteProfile> {
  const profile = tasteProfileSchema.parse(input);
  await db
    .insert(tasteProfiles)
    .values({ userId, profile })
    .onConflictDoUpdate({ target: tasteProfiles.userId, set: { profile, updatedAt: sql`now()` } });
  return profile;
}

export async function getCollection(db: Database, userId: string): Promise<CollectionEntry[]> {
  const rows = await db
    .select({
      productId: collectionItems.productId,
      shelf: collectionItems.shelf,
      rating: collectionItems.rating,
      favorite: collectionItems.favorite,
    })
    .from(collectionItems)
    .where(eq(collectionItems.userId, userId))
    .orderBy(sql`${collectionItems.updatedAt} desc`);
  return rows;
}

export async function upsertEntry(db: Database, userId: string, input: unknown): Promise<CollectionEntry> {
  const entry = collectionEntrySchema.parse(input);
  await db
    .insert(collectionItems)
    .values({ userId, ...entry })
    .onConflictDoUpdate({
      target: [collectionItems.userId, collectionItems.productId],
      set: { shelf: entry.shelf, rating: entry.rating, favorite: entry.favorite, updatedAt: sql`now()` },
    });
  return entry;
}

export async function removeEntry(db: Database, userId: string, productId: string): Promise<void> {
  await db
    .delete(collectionItems)
    .where(and(eq(collectionItems.userId, userId), eq(collectionItems.productId, productId)));
}

/**
 * Bring a guest's local state into their account on first sign-in. Server
 * data wins on conflicts for the collection (it may be newer); explicit
 * profile choices are unioned so nothing a guest picked is lost.
 */
export async function mergeGuestState(db: Database, userId: string, guest: GuestState) {
  const [profile, existing] = await Promise.all([getProfile(db, userId), getCollection(db, userId)]);
  const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];
  const merged = tasteProfileSchema.parse({
    likedNotes: union(profile.likedNotes, guest.profile.likedNotes).slice(0, 30),
    dislikedNotes: union(profile.dislikedNotes, guest.profile.dislikedNotes).slice(0, 30),
    likedAccords: union(profile.likedAccords, guest.profile.likedAccords).slice(0, 20),
    families: union(profile.families, guest.profile.families).slice(0, 15),
    gender: profile.gender !== "any" ? profile.gender : guest.profile.gender,
  });
  await saveProfile(db, userId, merged);

  const known = new Set(existing.map((e) => e.productId));
  const fresh = guest.collection.filter((e) => !known.has(e.productId));
  if (fresh.length) {
    await db
      .insert(collectionItems)
      .values(fresh.map((e) => ({ userId, ...e })))
      .onConflictDoNothing();
  }
  return { profile: merged, added: fresh.length };
}
