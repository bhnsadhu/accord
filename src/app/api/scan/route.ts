import { createHash } from "node:crypto";
import { ipAddress } from "@vercel/functions";
import { db } from "@/db";
import { getFragrancesByIds } from "@/lib/catalog/queries";
import { remainingQuota } from "@/lib/scan/guard";
import { MAX_SCAN_BYTES } from "@/lib/scan/image";
import { identifierFor, quotaScopes, scan, scannerMode, type Caller } from "@/lib/scan/service";
import { currentUser } from "@/lib/session";

// A cold ScentLens container takes about a minute to start.
export const maxDuration = 120;

/** Guests are counted by a salted daily hash of their IP; the IP itself is never stored. */
async function callerFor(request: Request): Promise<Caller> {
  const user = await currentUser();
  if (user) return { userId: user.id };
  const ip = ipAddress(request) ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.BETTER_AUTH_SECRET ?? "accord";
  return { guestKey: createHash("sha256").update(`${salt}:${day}:${ip}`).digest("hex").slice(0, 32) };
}

const noStore = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const mode = scannerMode();
  if (mode === "off") return Response.json({ enabled: false }, { headers: noStore });
  const caller = await callerFor(request);
  const remaining = await remainingQuota(db, quotaScopes(caller));
  return Response.json({ enabled: true, mock: mode === "mock", remaining, signedIn: "userId" in caller }, { headers: noStore });
}

export async function POST(request: Request) {
  const mode = scannerMode();
  if (mode === "off") return Response.json({ status: "disabled" }, { status: 503, headers: noStore });

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_SCAN_BYTES) return Response.json({ status: "invalid", error: "That photo is too large." }, { status: 413, headers: noStore });
  const bytes = new Uint8Array(await request.arrayBuffer());

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
      return Response.json(outcome, { status: outcome.kind === "timeout" ? 504 : 502, headers: noStore });
    case "disabled":
      return Response.json(outcome, { status: 503, headers: noStore });
  }
}
