import { getCatalogSnapshot } from "@/lib/catalog/snapshot";
import { buildCatalogIndex, type CatalogIndex } from "./catalog-index";

let cached: Promise<CatalogIndex> | null = null;

/**
 * The catalog is read-only at runtime, so one index per server instance is
 * enough. A failed load is not cached.
 */
export function getCatalogIndex(): Promise<CatalogIndex> {
  cached ??= getCatalogSnapshot()
    .then(snapshot => buildCatalogIndex(snapshot.fragrances.map(f => ({ ...f, year: f.featureYear, notes: f.noteKeys }))))
    .catch((err) => {
      cached = null;
      throw err;
    });
  return cached;
}
