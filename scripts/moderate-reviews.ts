/**
 * Owner moderation for member reviews. Local tool only; there is no public
 * moderation route.
 *
 *   npm run community:moderate                 # list reported and hidden reviews
 *   npm run community:moderate -- hide 42      # hide review 42
 *   npm run community:moderate -- restore 42   # publish it again and clear its reports
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { moderationQueue, setReviewStatus } from "../src/lib/community/repo";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const db = drizzle(pool, { schema });
const [command, rawId] = process.argv.slice(2);
try {
  if (command === "hide" || command === "restore") {
    const id = Number(rawId);
    if (!Number.isInteger(id) || id < 1) throw new Error("Give a review id, for example: hide 42");
    await setReviewStatus(db, id, command === "hide" ? "hidden" : "published", command === "restore");
    console.log(`Review ${id} ${command === "hide" ? "hidden" : "restored"}. Redeploy to refresh cached fragrance pages.`);
  } else {
    const queue = await moderationQueue(db);
    console.log(JSON.stringify(queue.map(r => ({ id: r.id, status: r.status, reports: r.reports, reasons: r.reasons, productId: r.productId, author: r.author, body: r.body })), null, 2));
  }
} finally {
  await pool.end();
}
