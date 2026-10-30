import type { NextRequest } from "next/server";
import { cachedSearch } from "@/lib/catalog/cached";

/** Quick-find for the command palette: top matches by name or brand. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 80);
  if (!q.trim()) return Response.json({ items: [] });
  const result = await cachedSearch({ q, pageSize: 8 });
  return Response.json(
    { items: result.items.map(({ productId, slug, name, brand, wheel }) => ({ productId, slug, name, brand, wheel })) },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
