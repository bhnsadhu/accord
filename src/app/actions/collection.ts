"use server";

import { updateTag } from "next/cache";
import { db } from "@/db";
import { communityTag } from "@/lib/community/cached";
import { getCollection, mergeGuestState, removeEntry, saveProfile, upsertEntry } from "@/lib/collection/repo";
import { guestStateSchema, type CollectionEntry, type TasteProfile } from "@/lib/profile";
import { currentUser } from "@/lib/session";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHENTICATED") return { ok: false, error: "Sign in to save this." };
    return { ok: false, error: "That didn't save. Try again." };
  }
}

export async function saveEntryAction(entry: CollectionEntry): Promise<ActionResult<CollectionEntry>> {
  return run(async () => {
    const saved = await upsertEntry(db, (await requireUser()).id, entry);
    // Ratings and shelves feed each fragrance's anonymous member totals.
    updateTag(communityTag(saved.productId));
    updateTag("community");
    return saved;
  });
}

export async function removeEntryAction(productId: string): Promise<ActionResult<null>> {
  return run(async () => {
    await removeEntry(db, (await requireUser()).id, String(productId));
    updateTag(communityTag(String(productId)));
    updateTag("community");
    return null;
  });
}

export async function saveProfileAction(profile: TasteProfile): Promise<ActionResult<TasteProfile>> {
  return run(async () => saveProfile(db, (await requireUser()).id, profile));
}

export async function mergeGuestAction(state: unknown): Promise<ActionResult<{ added: number; collection: CollectionEntry[] }>> {
  return run(async () => {
    const user = await requireUser();
    const parsed = guestStateSchema.parse(state);
    const { added } = await mergeGuestState(db, user.id, parsed);
    if (added) {
      for (const entry of parsed.collection) updateTag(communityTag(entry.productId));
      updateTag("community");
    }
    return { added, collection: await getCollection(db, user.id) };
  });
}
