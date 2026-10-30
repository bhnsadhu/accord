/**
 * Seed the catalog from the ScentLens export. The CSV holds text metadata only
 * (no images, no descriptions) and is read from the ScentLens checkout; it is
 * never copied into this repository. See docs/ARCHITECTURE.md#catalog.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { seedCatalog, type CatalogRow } from "../src/lib/catalog/seed";

const path = process.env.SCENTLENS_PRODUCTS_CSV ?? "../scent-lens/artifacts/export/products.csv";
const rows: CatalogRow[] = parse(readFileSync(path), { columns: true, skip_empty_lines: true });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const started = Date.now();
const counts = await seedCatalog(drizzle(pool, { schema }), rows);
await pool.end();
console.log(`Seeded from ${path} in ${((Date.now() - started) / 1000).toFixed(1)}s`, counts);
