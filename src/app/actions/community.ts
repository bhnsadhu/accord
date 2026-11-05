"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { communityTag } from "@/lib/community/cached";
import { addReminder, deleteReview, getMine, removeReminder, reportReview, saveReview, saveVote, toggleHelpful, type MyCommunity } from "@/lib/community/repo";
import { productIdSchema, type WearVote } from "@/lib/community/rules";
import { authEmailEnabled } from "@/lib/email";
import { consumeBudget } from "@/lib/security/budget";
import { currentUser } from "@/lib/session";

export type CommunityResult<T> = { ok: true; data: T } | { ok: false; error: string };

class Refused extends Error {}

async function member(kind: string, limit: number, seconds: number) {
  const user = await currentUser();
  if (!user) throw new Refused("Sign in to take part.");
  if (authEmailEnabled() && !user.emailVerified) throw new Refused("Verify your email address to take part.");
  if (!(await consumeBudget(db, [{ scope: `community:${kind}:${user.id}`, limit, seconds }, { scope: `0:community:${kind}`, limit: limit * 200, seconds }]))) {
    throw new Refused("That's a lot at once. Try again a little later.");
  }
  return user;
}

async function run<T>(fn: () => Promise<T>): Promise<CommunityResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof Refused) return { ok: false, error: err.message };
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? "Check what you entered." };
    if (err instanceof Error && /^(A fragrance|You can link)/.test(err.message)) return { ok: false, error: err.message };
    return { ok: false, error: "That didn't save. Try again." };
  }
}

function refresh(productId: string, userId?: string) {
  updateTag(communityTag(productId));
  updateTag("community");
  if (userId) updateTag(`member:${userId}`);
}

/** The signed-in member's own votes and review for one fragrance. Guests get null. */
export async function myCommunityAction(productId: string): Promise<MyCommunity | null> {
  const user = await currentUser();
  if (!user || !productIdSchema.safeParse(productId).success) return null;
  return getMine(db, user.id, productId);
}

export async function saveVoteAction(vote: WearVote): Promise<CommunityResult<WearVote | null>> {
  return run(async () => {
    const user = await member("vote", 120, 3600);
    const saved = await saveVote(db, user.id, vote);
    refresh(vote.productId);
    return saved;
  });
}

export async function saveReviewAction(productId: string, body: string): Promise<CommunityResult<{ status: "published" | "hidden" }>> {
  return run(async () => {
    const user = await member("review", 10, 86_400);
    const row = await saveReview(db, user.id, { productId, body });
    refresh(productId, user.id);
    return { status: row.status };
  });
}

export async function deleteReviewAction(productId: string): Promise<CommunityResult<null>> {
  return run(async () => {
    const user = await currentUser();
    if (!user) throw new Refused("Sign in to take part.");
    await deleteReview(db, user.id, productId);
    refresh(productId, user.id);
    return null;
  });
}

export async function helpfulAction(reviewId: number): Promise<CommunityResult<boolean>> {
  return run(async () => {
    const user = await member("helpful", 200, 86_400);
    const result = await toggleHelpful(db, user.id, reviewId);
    if (!result) throw new Refused("You can't mark this review.");
    refresh(result.productId);
    return result.on;
  });
}

export async function reportAction(reviewId: number, reason: string): Promise<CommunityResult<null>> {
  return run(async () => {
    const user = await member("report", 20, 86_400);
    const result = await reportReview(db, user.id, { reviewId, reason });
    if (!result) throw new Refused("You can't report this review.");
    if (result.hidden) refresh(result.productId);
    return null;
  });
}

export async function reminderAction(productId: string, otherId: string, on: boolean): Promise<CommunityResult<null>> {
  return run(async () => {
    const user = await member("reminds", 60, 86_400);
    if (on) await addReminder(db, user.id, productId, otherId);
    else await removeReminder(db, user.id, productId, otherId);
    refresh(productId);
    return null;
  });
}
