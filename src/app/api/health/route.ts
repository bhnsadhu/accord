import { sql } from "drizzle-orm";
import { db } from "@/db";
import { matchesSecret } from "@/lib/security/request";
import { reportFailure } from "@/lib/observability";

/** Owner monitor only. An unauthenticated probe never wakes the database. */
export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!matchesSecret(request.headers.get("authorization"), process.env.MONITOR_SECRET ? `Bearer ${process.env.MONITOR_SECRET}` : undefined)) return Response.json({ status: "unauthorized" }, { status: 401, headers });
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok" }, { headers });
  } catch { reportFailure("health_database_failed"); return Response.json({ status: "unavailable" }, { status: 503, headers }); }
}
