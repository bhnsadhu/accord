import { sql } from "drizzle-orm";
import type { Database } from "@/db";

export type Budget = { scope: string; limit: number; seconds: number; calendarMonth?: boolean };
class Exhausted extends Error {}

/** All scopes succeed together or consume nothing. Postgres serializes each counter. */
export async function consumeBudget(db: Database, budgets: Budget[]) {
  try {
    await db.transaction(async tx => {
      for (const rule of [...budgets].sort((a, b) => a.scope.localeCompare(b.scope))) {
        if (!Number.isInteger(rule.limit) || rule.limit < 1 || !Number.isInteger(rule.seconds) || rule.seconds < 1) throw new Exhausted();
        const start = rule.calendarMonth ? sql`date_trunc('month', now() at time zone 'UTC') at time zone 'UTC'` : sql`to_timestamp(floor(extract(epoch from now()) / ${rule.seconds}) * ${rule.seconds})`;
        const expiry = rule.calendarMonth ? sql`(date_trunc('month', now() at time zone 'UTC') + interval '1 month') at time zone 'UTC'` : sql`to_timestamp((floor(extract(epoch from now()) / ${rule.seconds}) + 1) * ${rule.seconds})`;
        const result = await tx.execute(sql`
          insert into request_budgets(scope, window_start, used, expires_at)
          values (${rule.scope}, ${start}, 1, ${expiry})
          on conflict (scope, window_start) do update set used = request_budgets.used + 1
          where request_budgets.used < ${rule.limit} returning used`);
        if (!result.rows.length) throw new Exhausted();
      }
      await tx.execute(sql`delete from request_budgets where expires_at < now() - interval '1 day'`);
    });
    return true;
  } catch (error) { if (error instanceof Exhausted) return false; throw error; }
}

export function limitedResponse(seconds = 60) {
  return Response.json({ error: "Please wait a moment before trying again." }, { status: 429, headers: { "Retry-After": String(seconds), "Cache-Control": "private, no-store" } });
}
