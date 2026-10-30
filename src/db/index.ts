import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

declare global {
  var __accordPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }
  // node-postgres already treats prefer/require/verify-ca as verify-full;
  // say so explicitly so it doesn't log a warning on every cold start.
  const url = connectionString.replace(/sslmode=(prefer|require|verify-ca)\b/, "sslmode=verify-full");
  const pool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10_000 });
  // Lets Vercel Fluid compute close idle clients before a function suspends.
  attachDatabasePool(pool);
  return pool;
}

// Reuse one pool across hot reloads in development.
const pool = (globalThis.__accordPool ??= createPool());

export const db: Database = drizzle(pool, { schema });
