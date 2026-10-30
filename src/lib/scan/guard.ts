import { randomUUID } from "node:crypto";
import { and, eq, lt, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { scanCache, scanQuota, scanSlots } from "@/db/schema";

/**
 * Limits that bound what Accord can spend on ScentLens. Defaults are sized so
 * a worst case (every scan spaced out, each paying a cold start and the
 * five-minute idle window on Modal) stays inside the free monthly credit;
 * see COSTS.md for the arithmetic.
 */
export type ScanLimits = { globalDaily: number; userDaily: number; guestDaily: number; leaseSeconds: number };

export function scanLimits(env: NodeJS.ProcessEnv = process.env): ScanLimits {
  const n = (v: string | undefined, d: number) => {
    const x = Number.parseInt(v ?? "", 10);
    return Number.isFinite(x) && x >= 0 ? x : d;
  };
  return {
    globalDaily: n(env.SCAN_GLOBAL_DAILY, 3),
    userDaily: n(env.SCAN_USER_DAILY, 2),
    guestDaily: n(env.SCAN_GUEST_DAILY, 1),
    leaseSeconds: n(env.SCAN_LEASE_SECONDS, 150),
  };
}

export type QuotaScope = { scope: string; limit: number };

/**
 * Take one unit from every scope or none. Each counter is a single
 * conditional upsert, so concurrent requests on any number of serverless
 * instances cannot push a counter past its limit; the transaction rolls
 * back every increment if any scope is exhausted.
 */
export async function consumeQuota(db: Database, scopes: QuotaScope[]): Promise<{ ok: true } | { ok: false; scope: string }> {
  try {
    await db.transaction(async (tx) => {
      for (const { scope, limit } of scopes) {
        if (limit <= 0) throw new QuotaExhausted(scope);
        const rows = await tx
          .insert(scanQuota)
          .values({ scope, day: sql`current_date`, used: 1 })
          .onConflictDoUpdate({
            target: [scanQuota.scope, scanQuota.day],
            set: { used: sql`${scanQuota.used} + 1` },
            setWhere: lt(scanQuota.used, limit),
          })
          .returning({ used: scanQuota.used });
        if (rows.length === 0) throw new QuotaExhausted(scope);
      }
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof QuotaExhausted) return { ok: false, scope: err.scope };
    throw err;
  }
}

class QuotaExhausted extends Error {
  constructor(readonly scope: string) {
    super(`quota exhausted: ${scope}`);
  }
}

export async function remainingQuota(db: Database, scopes: QuotaScope[]): Promise<number> {
  let remaining = Infinity;
  for (const { scope, limit } of scopes) {
    const [row] = await db
      .select({ used: scanQuota.used })
      .from(scanQuota)
      .where(and(eq(scanQuota.scope, scope), eq(scanQuota.day, sql`current_date`)));
    remaining = Math.min(remaining, Math.max(0, limit - (row?.used ?? 0)));
  }
  return remaining === Infinity ? 0 : remaining;
}

/** Claim a free upstream slot, or null when every slot is busy. */
export async function acquireSlot(db: Database, leaseSeconds: number): Promise<string | null> {
  const leaseId = randomUUID();
  const result = await db.execute(sql`
    update ${scanSlots} set lease_id = ${leaseId}, leased_until = now() + make_interval(secs => ${leaseSeconds})
    where slot = (
      select slot from ${scanSlots} where leased_until < now() order by slot limit 1 for update skip locked
    )
    returning slot`);
  return result.rows.length ? leaseId : null;
}

export async function releaseSlot(db: Database, leaseId: string) {
  // Set into the past so the slot is free even to a request in the same instant.
  await db
    .update(scanSlots)
    .set({ leaseId: null, leasedUntil: sql`now() - interval '1 second'` })
    .where(eq(scanSlots.leaseId, leaseId));
}

const CACHE_HOURS = 24;

export async function cachedResult(db: Database, imageHash: string): Promise<unknown | null> {
  const [row] = await db
    .select({ result: scanCache.result })
    .from(scanCache)
    .where(and(eq(scanCache.imageHash, imageHash), sql`${scanCache.createdAt} > now() - make_interval(hours => ${CACHE_HOURS})`));
  return row?.result ?? null;
}

export async function storeResult(db: Database, imageHash: string, result: unknown) {
  await db
    .insert(scanCache)
    .values({ imageHash, result })
    .onConflictDoUpdate({ target: scanCache.imageHash, set: { result, createdAt: sql`now()` } });
  // Opportunistic cleanup keeps the table small without a cron job.
  await db.delete(scanCache).where(sql`${scanCache.createdAt} < now() - make_interval(hours => ${CACHE_HOURS})`);
}
