/** Rebuild the public catalog entirely offline from the source CSV and reviewed research. */
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { parse } from "csv-parse/sync";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { seedCatalog, type CatalogRow } from "../src/lib/catalog/seed";
import { importResearch } from "../src/lib/catalog/import-research";
import * as query from "../src/lib/catalog/postgres-queries";
import type { CatalogSnapshot } from "../src/lib/catalog/snapshot-types";

const csv = await readFile(process.env.SCENTLENS_PRODUCTS_CSV ?? "../scent-lens/artifacts/export/products.csv");
const research = await readFile("data/research/fragrances.json");
const rows: CatalogRow[] = parse(csv, { columns: true, skip_empty_lines: true });
// No DATABASE_URL is read. Even with production credentials in the environment,
// this command can only connect to its own disposable local database.
const local = await PGlite.create({ extensions: { pg_trgm } });
const port = 55_000 + Math.floor(Math.random() * 5_000);
const server = new PGLiteSocketServer({ db: local, port, host: "127.0.0.1", maxConnections: 4 });
await server.start();
const pool = new Pool({ connectionString: `postgres://postgres@127.0.0.1:${port}/postgres`, max: 1 });
try {
  const db = drizzle(pool, { schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Preparing public catalog...");
  await seedCatalog(db, rows);
  await importResearch(db, JSON.parse(research.toString("utf8")), true);
  const snapshot: CatalogSnapshot = {
    version: 1,
    sourceSha256: createHash("sha256").update(csv).digest("hex"),
    researchSha256: createHash("sha256").update(research).digest("hex"),
    fragrances: await query.exportCatalogRows(db),
    brands: await query.listBrands(db, 100_000),
    notes: await query.listNotes(db),
    coverage: await query.catalogCoverage(db),
    facets: await query.facetCounts(db),
    noteFamilies: await query.noteFamilyStats(db),
    perfumers: await query.listPerfumers(db),
    years: await query.yearCounts(db),
  };
  if (snapshot.fragrances.length < 24_000 || new Set(snapshot.fragrances.map(f => f.productId)).size !== snapshot.fragrances.length) {
    throw new Error("Refusing to publish an incomplete or duplicated catalog.");
  }
  await mkdir("data/catalog", { recursive: true });
  const bytes = gzipSync(JSON.stringify(snapshot), { level: 9 });
  await writeFile("data/catalog/snapshot.json.gz", bytes);
  console.log(`Bundled ${snapshot.fragrances.length} fragrances, ${snapshot.notes.length} notes, ${bytes.length} bytes.`);
} finally {
  await pool.end();
  await server.stop();
  await local.close();
}
