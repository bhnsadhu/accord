import "dotenv/config";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../src/db/schema";
import { importResearch } from "../src/lib/catalog/import-research";
import { catalogManifestSchema } from "../src/lib/catalog/research-schema";

const filename = process.argv.find(a => a.endsWith(".json")) ?? "data/research/fragrances.json";
const manifest = catalogManifestSchema.parse(JSON.parse(await readFile(filename, "utf8")));
for (const entry of manifest.entries) if (entry.research.image) await access(resolve("public", `.${entry.research.image.path}`));
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL, max: 1 });
try {
  console.log(JSON.stringify(await importResearch(drizzle(pool, { schema }), manifest, process.argv.includes("--apply")), null, 2));
} finally { await pool.end(); }
