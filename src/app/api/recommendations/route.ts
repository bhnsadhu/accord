import { z } from "zod";
import { db } from "@/db";
import { getCollection, getProfile } from "@/lib/collection/repo";
import { guestStateSchema } from "@/lib/profile";
import { presentRecommendations } from "@/lib/reco/present";
import { currentUser } from "@/lib/session";

const bodySchema = z.object({ guest: guestStateSchema.optional(), k: z.number().int().min(1).max(48).default(24) });

/**
 * Signed-in users get recommendations from their stored profile and
 * collection; the request body is ignored for them. Guests send the state
 * they keep in local storage, validated and size-capped here.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 64_000) return Response.json({ error: "Request too large" }, { status: 413 });
  let json: unknown = {};
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const body = bodySchema.safeParse(json);
  if (!body.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const user = await currentUser();
  const [profile, collection] = user
    ? await Promise.all([getProfile(db, user.id), getCollection(db, user.id)])
    : [body.data.guest?.profile, body.data.guest?.collection ?? []];

  const result = await presentRecommendations(db, profile ?? guestStateSchema.shape.profile.parse({}), collection, body.data.k);
  return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
}
