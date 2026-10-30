/**
 * Local Postgres for development: PGlite (Postgres compiled to WASM) behind a
 * wire-protocol socket, so the app uses the same node-postgres driver locally
 * as it does against Neon in production. No Docker or credentials needed.
 *
 *   npm run db:server            # persists to .data/pglite
 *   DATABASE_URL=postgres://postgres@127.0.0.1:5433/postgres
 */
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const port = Number(process.env.PGLITE_PORT ?? 5433);
const dataDir = process.env.PGLITE_DIR ?? ".data/pglite";

const db = await PGlite.create({ dataDir, extensions: { pg_trgm } });
const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 16 });
await server.start();
console.log(`PGlite listening on postgres://postgres@127.0.0.1:${port}/postgres (${dataDir})`);

const shutdown = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
