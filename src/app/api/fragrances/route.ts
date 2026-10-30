import type { NextRequest } from "next/server";
import { cachedFragrancesByIds } from "@/lib/catalog/cached";
import { isProductId } from "@/lib/catalog/text";

/** Catalog rows for up to 60 product ids, in the order requested. */
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "").split(",").filter(isProductId).slice(0, 60);
  const items = ids.length ? await cachedFragrancesByIds(ids) : [];
  return Response.json({ items }, { headers: { "Cache-Control": "public, s-maxage=86400" } });
}
