import { z } from "zod";
import { db } from "@/db";
import { getCollection, getProfile } from "@/lib/collection/repo";
import { guestStateSchema } from "@/lib/profile";
import { presentRecommendations } from "@/lib/reco/present";
import { currentUser } from "@/lib/session";
import { BodyTooLarge, readBody, requestKey, sameOrigin } from "@/lib/security/request";
import { consumeBudget, limitedResponse } from "@/lib/security/budget";
import { reportFailure } from "@/lib/observability";

const bodySchema = z.object({ guest: guestStateSchema.optional(), k: z.number().int().min(1).max(48).default(24) });

/**
 * Signed-in users get recommendations from their stored profile and
 * collection; the request body is ignored for them. Guests send the state
 * they keep in local storage, validated and size-capped here.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Please use Accord to request suggestions." }, { status: 403 });
  let raw: string;
  try { raw = new TextDecoder().decode(await readBody(request, 64_000)); }
  catch (error) { return Response.json({ error: error instanceof BodyTooLarge ? "Request too large" : "Could not read request" }, { status: error instanceof BodyTooLarge ? 413 : 400 }); }
  let json: unknown = {};
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const body = bodySchema.safeParse(json);
  if (!body.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  try {
  if (!await consumeBudget(db, [{ scope: "0:recommend:global", limit: 240, seconds: 60 }, { scope: `recommend:${requestKey(request)}`, limit: 30, seconds: 60 }])) return limitedResponse();
  const user = await currentUser();
  const [profile, collection] = user
    ? await Promise.all([getProfile(db, user.id), getCollection(db, user.id)])
    : [body.data.guest?.profile, body.data.guest?.collection ?? []];

  const result = await presentRecommendations(db, profile ?? guestStateSchema.shape.profile.parse({}), collection, body.data.k);
  return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch { reportFailure("recommendations_unavailable"); return Response.json({ error: "Suggestions are temporarily unavailable. Please try again shortly." }, { status: 503, headers: { "Retry-After": "30", "Cache-Control": "private, no-store" } }); }
}
