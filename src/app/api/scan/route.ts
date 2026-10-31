import { db } from "@/db";
import { getFragrancesByIds } from "@/lib/catalog/queries";
import { remainingQuota } from "@/lib/scan/guard";
import { MAX_SCAN_BYTES } from "@/lib/scan/image";
import { identifierFor, quotaScopes, scan, scannerMode, type Caller } from "@/lib/scan/service";
import { currentUser } from "@/lib/session";
import { BodyTooLarge, readBody, requestKey, sameOrigin } from "@/lib/security/request";
import { reportFailure } from "@/lib/observability";

// A cold ScentLens container takes about a minute to start.
export const maxDuration = 120;

/** Guests are counted by a salted daily hash of their IP; the IP itself is never stored. */
async function callerFor(request: Request): Promise<Caller> {
  const user = await currentUser();
  if (user) return { userId: user.id };
  return { guestKey: requestKey(request) };
}

const noStore = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const mode = scannerMode();
  if (mode === "off") return Response.json({ enabled: false }, { headers: noStore });
  try {
    const caller = await callerFor(request);
    const remaining = await remainingQuota(db, quotaScopes(caller));
    return Response.json({ enabled: true, mock: mode === "mock", remaining, signedIn: "userId" in caller }, { headers: noStore });
  } catch {
    reportFailure("scan_status_unavailable");
    return Response.json({ enabled: false }, { status: 503, headers: noStore });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ status: "invalid", error: "Please scan from Accord." }, { status: 403, headers: noStore });
  const mode = scannerMode();
  if (mode === "off") return Response.json({ status: "disabled" }, { status: 503, headers: noStore });

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_SCAN_BYTES) return Response.json({ status: "invalid", error: "That photo is too large." }, { status: 413, headers: noStore });
  let bytes: Uint8Array;
  try { bytes = await readBody(request, MAX_SCAN_BYTES); }
  catch (error) { return Response.json({ status: "invalid", error: "That photo could not be read." }, { status: error instanceof BodyTooLarge ? 413 : 400, headers: noStore }); }
  try {
  const outcome = await scan({ db, identifier: identifierFor(mode), mode }, await callerFor(request), bytes);

  switch (outcome.status) {
    case "done": {
      const ids = outcome.result.matches.map((m) => m.product_id);
      const fragrances = await getFragrancesByIds(db, ids);
      return Response.json({ ...outcome, fragrances, mock: mode === "mock" }, { headers: noStore });
    }
    case "invalid":
      return Response.json(outcome, { status: 400, headers: noStore });
    case "busy":
      return Response.json(outcome, { status: 429, headers: { ...noStore, "Retry-After": "20" } });
    case "quota":
      return Response.json(outcome, { status: 429, headers: noStore });
    case "failed":
      reportFailure("scan_failed", { kind: outcome.kind });
      return Response.json(outcome, { status: outcome.kind === "timeout" ? 504 : 502, headers: noStore });
    case "disabled":
      return Response.json(outcome, { status: 503, headers: noStore });
  }
  } catch { reportFailure("scan_unavailable"); return Response.json({ status: "failed", kind: "unavailable" }, { status: 503, headers: noStore }); }
}
