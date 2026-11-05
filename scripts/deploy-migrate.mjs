/**
 * Applies pending Drizzle migrations during a Vercel production build, before
 * `next build` prerenders pages against the database. Runs only when
 * VERCEL_ENV is "production", so previews and local builds never touch the
 * production schema. A failure stops the build, so the previous deployment
 * stays live. Migrations must stay additive (see docs/OPERATIONS.md).
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

if (process.env.VERCEL_ENV !== "production") {
  console.log("deploy-migrate: not a Vercel production build, skipping.");
} else {
  const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("deploy-migrate: no database URL in the production build environment.");
    process.exit(1);
  }
  const pool = new pg.Pool({ connectionString, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
    console.log("deploy-migrate: migrations applied.");
  } finally {
    await pool.end();
  }
}
