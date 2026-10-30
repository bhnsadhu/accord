import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import type { TestProject } from "vitest/node";

/** One throwaway in-memory Postgres per test run, reached over the real driver. */
export default async function setup(project: TestProject) {
  const db = await PGlite.create({ extensions: { pg_trgm } });
  const port = 55_000 + Math.floor(Math.random() * 5_000);
  const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 8 });
  await server.start();
  const url = `postgres://postgres@127.0.0.1:${port}/postgres`;
  const pool = new Pool({ connectionString: url, max: 1 });
  await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
  await pool.end();
  project.provide("databaseUrl", url);
  return async () => {
    await server.stop();
    await db.close();
  };
}

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}
