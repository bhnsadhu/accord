import { db } from "@/db";
import { requestFingerprint, requestSchema, submitCatalogRequest } from "@/lib/catalog/requests";
import { BodyTooLarge, readBody } from "@/lib/security/request";
import { reportFailure } from "@/lib/observability";

export async function POST(request: Request) {
  const allowed = new Set([new URL(request.url).origin]);
  if (process.env.BETTER_AUTH_URL) allowed.add(new URL(process.env.BETTER_AUTH_URL).origin);
  if (!request.headers.get("origin") || !allowed.has(request.headers.get("origin")!)) return Response.json({ error: "Please send this request from Accord." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 4000) return Response.json({ error: "Please shorten the request." }, { status: 413 });
  let input: unknown;
  try {
    const body = new TextDecoder().decode(await readBody(request, 4000));
    input = JSON.parse(body);
  } catch (error) { return Response.json({ error: "Please check the fragrance name, brand and source link." }, { status: error instanceof BodyTooLarge ? 413 : 400 }); }
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: "Enter a fragrance name and brand. Source links must start with https:// or http://." }, { status: 400 });
  try {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) throw new Error("Missing request protection secret");
    const address = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const result = await submitCatalogRequest(db, parsed.data, requestFingerprint(address, secret));
    if (!result.ok) return Response.json({ error: "The request limit has been reached. Please try again tomorrow." }, { status: 429, headers: { "Retry-After": "86400" } });
    return Response.json({ ok: true });
  } catch { reportFailure("catalog_request_unavailable"); return Response.json({ error: "We could not save your request. Please try again shortly." }, { status: 503 }); }
}
