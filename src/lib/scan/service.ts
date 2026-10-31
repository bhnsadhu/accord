import type { Database } from "@/db";
import { acquireSlot, cachedResult, consumeQuota, releaseSlot, remainingQuota, scanLimits, storeResult, type QuotaScope } from "./guard";
import { checkImage, sha256Hex } from "./image";
import { gradioIdentifier, privateIdentifier, identifyResultSchema, ScanUpstreamError, type Identifier, type IdentifyResult } from "./scentlens";

export type ScannerMode = "off" | "live" | "mock";

/**
 * Scanning is off unless explicitly enabled. "mock" exists for local
 * development and end-to-end tests and is refused in production builds, so a
 * deployed Accord can never show a made-up recognition.
 */
export function scannerMode(env: NodeJS.ProcessEnv = process.env): ScannerMode {
  const mode = env.SCANNER_MODE;
  if (mode === "live" && env.SCENTLENS_URL && (env.SCENTLENS_PROTOCOL !== "private" || (env.MODAL_PROXY_KEY && env.MODAL_PROXY_SECRET))) return "live";
  if (mode === "mock" && env.NODE_ENV !== "production") return "mock";
  return "off";
}

export type Caller = { userId: string } | { guestKey: string };

export function quotaScopes(caller: Caller, limits = scanLimits()): QuotaScope[] {
  return [
    { scope: "global", limit: limits.globalDaily },
    { scope: "global:month", limit: limits.globalMonthly, period: "month" },
    "userId" in caller
      ? { scope: `user:${caller.userId}`, limit: limits.userDaily }
      : { scope: `guest:${caller.guestKey}`, limit: limits.guestDaily },
  ];
}

export type ScanOutcome =
  | { status: "done"; result: IdentifyResult; cached: boolean; remaining: number }
  | { status: "disabled" }
  | { status: "invalid"; error: string }
  | { status: "busy" }
  | { status: "quota"; scope: "global" | "month" | "caller" }
  | { status: "failed"; kind: ScanUpstreamError["kind"] };

export type ScanDeps = { db: Database; identifier: Identifier; mode: ScannerMode; timeoutMs?: number };

export async function scan(deps: ScanDeps, caller: Caller, bytes: Uint8Array): Promise<ScanOutcome> {
  const { db, identifier, mode } = deps;
  if (mode === "off") return { status: "disabled" };

  const check = checkImage(bytes);
  if (!check.ok) return { status: "invalid", error: check.error };

  const scopes = quotaScopes(caller);
  const hash = await sha256Hex(bytes);

  // The same photo again: answer from the recent result, free.
  const hit = await cachedResult(db, hash);
  const cached = hit ? identifyResultSchema.safeParse(hit) : null;
  if (cached?.success) return { status: "done", result: cached.data, cached: true, remaining: await remainingQuota(db, scopes) };

  const limits = scanLimits();
  const lease = await acquireSlot(db, limits.leaseSeconds);
  if (!lease) return { status: "busy" };
  try {
    const quota = await consumeQuota(db, scopes);
    if (!quota.ok) return { status: "quota", scope: quota.scope === "global:month" ? "month" : quota.scope === "global" ? "global" : "caller" };
    try {
      const result = await identifier(new Blob([bytes as BlobPart], { type: check.type }), { timeoutMs: deps.timeoutMs ?? 100_000 });
      await storeResult(db, hash, result);
      return { status: "done", result, cached: false, remaining: await remainingQuota(db, scopes) };
    } catch (err) {
      // The upstream call was made, so it stays counted: compute was spent.
      return { status: "failed", kind: err instanceof ScanUpstreamError ? err.kind : "unavailable" };
    }
  } finally {
    await releaseSlot(db, lease);
  }
}

/**
 * Development stand-in for ScentLens. It never runs in production (see
 * scannerMode) and its answers are fixed: an even first hash byte "answers"
 * Chanel Chance, an odd one abstains with three candidates.
 */
export const mockIdentifier: Identifier = async (image) => {
  const bytes = new Uint8Array(await image.arrayBuffer());
  const even = parseInt((await sha256Hex(bytes)).slice(0, 2), 16) % 2 === 0;
  const matches = [
    { product_id: "p05819", brand: "Chanel", name: "Chance Eau De Parfum", score: 1.04 },
    { product_id: "p05820", brand: "Chanel", name: "Chance Eau Fraîche Eau De Parfum", score: 0.98 },
    { product_id: "p05821", brand: "Chanel", name: "Chance Eau Tendre Eau De Parfum", score: 0.95 },
  ];
  await new Promise((r) => setTimeout(r, 1200));
  return even
    ? { answered: true, reason: "confident", confidence: 0.81, product_id: "p05819", matches, text_read: ["CHANCE", "CHANEL"], box: [120, 40, 610, 980], seconds: 1.2, timings: {} }
    : { answered: false, reason: "low confidence", confidence: 0.41, product_id: null, matches, text_read: [], box: null, seconds: 1.2, timings: {} };
};

export function identifierFor(mode: ScannerMode, env: NodeJS.ProcessEnv = process.env): Identifier {
  if (mode === "live") return env.SCENTLENS_PROTOCOL === "private"
    ? privateIdentifier(env.SCENTLENS_URL!, env.MODAL_PROXY_KEY!, env.MODAL_PROXY_SECRET!)
    : gradioIdentifier(env.SCENTLENS_URL!);
  return mockIdentifier;
}
