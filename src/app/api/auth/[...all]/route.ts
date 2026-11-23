import { toNextJsHandler } from "better-auth/next-js";
import { accountsEnabled } from "@/lib/availability";

async function handlers() {
  const { auth } = await import("@/lib/auth");
  return toNextJsHandler(auth);
}
function paused() {
  return Response.json({ error: "Sign-in is temporarily paused. Collections save in this browser." }, { status: 503, headers: { "Cache-Control": "private, no-store", "Retry-After": "3600" } });
}
export async function GET(request: Request) {
  if (!accountsEnabled()) {
    // A stale session cookie must never block guest mode or appear signed in.
    if (new URL(request.url).pathname.endsWith("/get-session")) return Response.json(null, { headers: { "Cache-Control": "private, no-store" } });
    return paused();
  }
  return (await handlers()).GET(request);
}
export async function POST(request: Request) {
  return accountsEnabled() ? (await handlers()).POST(request) : paused();
}
