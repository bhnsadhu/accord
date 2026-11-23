import { eq, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { brands, fragranceNotes, fragrances, notes } from "@/db/schema";
import type { FragranceFeatures } from "./catalog-index";

export async function loadFeatures(db: Database): Promise<FragranceFeatures[]> {
  return db
    .select({
      productId: fragrances.productId,
      name: fragrances.name,
      brand: brands.name,
      family: fragrances.family,
      subfamily: fragrances.subfamily,
      wheel: fragrances.wheel,
      character: fragrances.character,
      facets: fragrances.facets,
      gender: fragrances.gender,
      year: fragrances.year,
      notes: sql<string[]>`coalesce((
        select array_agg(n.key order by fn.position)
        from ${fragranceNotes} fn join ${notes} n on n.id = fn.note_id
        where fn.product_id = ${fragrances.productId}), '{}')`,
    })
    .from(fragrances)
    .innerJoin(brands, eq(brands.id, fragrances.brandId))
    .orderBy(fragrances.productId);
}

