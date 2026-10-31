import { createHmac } from "node:crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db";
import { catalogRequests } from "@/db/schema";

export const requestSchema = z.object({
  fragrance: z.string().trim().min(2).max(160),
  brand: z.string().trim().min(2).max(100),
  sourceUrl: z.union([z.literal(""), z.url().max(500).refine(v => /^https?:\/\//.test(v))]).optional(),
}).strict();

export function requestFingerprint(address: string, secret: string) {
  return createHmac("sha256", secret).update(address).digest("hex");
}

export async function submitCatalogRequest(db: Database, input: unknown, fingerprint: string) {
  const values = requestSchema.parse(input);
  return db.transaction(async tx => {
    // A global daily cap also bounds storage from rotating addresses. Serialize this tiny inbox.
    await tx.execute(sql`select pg_advisory_xact_lock(746821)`);
    const since = new Date(Date.now() - 86_400_000);
    const [counts] = await tx.select({
      total: sql<number>`count(*)`.mapWith(Number),
      own: sql<number>`count(*) filter (where ${catalogRequests.fingerprint} = ${fingerprint})`.mapWith(Number),
    }).from(catalogRequests).where(gte(catalogRequests.createdAt, since));
    if (counts.total >= 100 || counts.own >= 3) return { ok: false as const, reason: "limit" as const };
    const [duplicate] = await tx.select({ id: catalogRequests.id }).from(catalogRequests).where(and(
      eq(catalogRequests.fingerprint, fingerprint), eq(catalogRequests.fragrance, values.fragrance), eq(catalogRequests.brand, values.brand), gte(catalogRequests.createdAt, since),
    )).limit(1);
    if (!duplicate) await tx.insert(catalogRequests).values({ ...values, sourceUrl: values.sourceUrl || null, fingerprint });
    return { ok: true as const };
  });
}
