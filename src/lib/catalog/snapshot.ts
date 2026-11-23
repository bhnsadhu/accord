import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";
import type { CatalogSnapshot } from "./snapshot-types";

const unzip = promisify(gunzip);
let cached: Promise<CatalogSnapshot> | undefined;

/** Loaded from the deployment, never from a network database or the browser. */
export function getCatalogSnapshot(): Promise<CatalogSnapshot> {
  cached ??= readFile(join(process.cwd(), "data/catalog/snapshot.json.gz"))
    .then(unzip)
    .then(bytes => {
      const snapshot = JSON.parse(bytes.toString("utf8")) as CatalogSnapshot;
      if (snapshot.version !== 1 || !snapshot.fragrances.length || snapshot.coverage.total !== snapshot.fragrances.length) {
        throw new Error("Invalid bundled catalog. Run npm run catalog:bundle.");
      }
      return snapshot;
    })
    .catch(error => { cached = undefined; throw error; });
  return cached;
}
