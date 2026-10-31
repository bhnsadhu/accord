import "dotenv/config";
import { Pool } from "pg";

// Local owner tool only. Never expose the private inbox through a public route.
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  const result = await pool.query("select id, fragrance, brand, source_url, created_at from catalog_requests order by created_at desc limit 100");
  console.log(JSON.stringify(result.rows, null, 2));
} finally { await pool.end(); }
