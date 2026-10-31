import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { scanCache, scanQuota, scanSlots } from "@/db/schema";
import { acquireSlot, consumeQuota, releaseSlot, remainingQuota } from "@/lib/scan/guard";
import { ScanUpstreamError, type Identifier, type IdentifyResult } from "@/lib/scan/scentlens";
import { scan } from "@/lib/scan/service";

const jpeg = (seed: number) => {
  const b = new Uint8Array(4096);
  b.set([0xff, 0xd8, 0xff, 0xe0, seed]);
  return b;
};

const abstained: IdentifyResult = {
  answered: false,
  reason: "label disagrees",
  confidence: 0.3,
  product_id: null,
  matches: [{ product_id: "p00001", brand: "Chanel", name: "Chance Eau De Parfum", score: 0.7 }],
  text_read: ["SOMETHING"],
  box: null,
  seconds: 6,
  timings: {},
};

beforeEach(async () => {
  await db.delete(scanQuota);
  await db.delete(scanCache);
  await db.update(scanSlots).set({ leaseId: null, leasedUntil: sql`now() - interval '1 second'` });
  vi.unstubAllEnvs();
});

describe("quota", () => {
  it("never exceeds a limit under concurrent requests", async () => {
    const attempts = await Promise.all(Array.from({ length: 12 }, () => consumeQuota(db, [{ scope: "global", limit: 5 }])));
    expect(attempts.filter((a) => a.ok)).toHaveLength(5);
    expect(await remainingQuota(db, [{ scope: "global", limit: 5 }])).toBe(0);
  });

  it("takes from every scope or none", async () => {
    await consumeQuota(db, [{ scope: "user:a", limit: 1 }]);
    const result = await consumeQuota(db, [
      { scope: "global", limit: 10 },
      { scope: "user:a", limit: 1 },
    ]);
    expect(result).toEqual({ ok: false, scope: "user:a" });
    expect(await remainingQuota(db, [{ scope: "global", limit: 10 }])).toBe(10);
  });

  it("treats a zero limit as closed", async () => {
    expect(await consumeQuota(db, [{ scope: "global", limit: 0 }])).toEqual({ ok: false, scope: "global" });
  });

  it("keeps the monthly cap when daily counters are reset", async () => {
    const scopes = [{ scope: "global", limit: 3 }, { scope: "global:month", limit: 1, period: "month" as const }];
    expect((await consumeQuota(db, scopes)).ok).toBe(true);
    await db.execute(sql`delete from scan_quota where scope = 'global'`);
    expect(await consumeQuota(db, scopes)).toEqual({ ok: false, scope: "global:month" });
    expect(await remainingQuota(db, scopes)).toBe(0);
    expect((await db.execute(sql`select extract(day from day)::int as day from scan_quota where scope='global:month'`)).rows[0].day).toBe(1);
  });
});

describe("slots", () => {
  it("hands out at most two leases and frees them on release", async () => {
    const leases = await Promise.all([acquireSlot(db, 60), acquireSlot(db, 60), acquireSlot(db, 60)]);
    expect(leases.filter(Boolean)).toHaveLength(2);
    await releaseSlot(db, leases.find(Boolean)!);
    expect(await acquireSlot(db, 60)).not.toBeNull();
  });

  it("reclaims an expired lease from a crashed function", async () => {
    await acquireSlot(db, 60);
    await acquireSlot(db, 60);
    expect(await acquireSlot(db, 60)).toBeNull();
    await db.update(scanSlots).set({ leasedUntil: sql`now() - interval '1 second'` });
    expect(await acquireSlot(db, 60)).not.toBeNull();
  });
});

describe("scan", () => {
  const caller = { userId: "u-scan" };

  it("does nothing when the scanner is off", async () => {
    const identifier = vi.fn<Identifier>();
    expect(await scan({ db, identifier, mode: "off" }, caller, jpeg(1))).toEqual({ status: "disabled" });
    expect(identifier).not.toHaveBeenCalled();
  });

  it("rejects invalid images before spending quota or calling upstream", async () => {
    const identifier = vi.fn<Identifier>();
    const out = await scan({ db, identifier, mode: "live" }, caller, new Uint8Array(4096));
    expect(out.status).toBe("invalid");
    expect(identifier).not.toHaveBeenCalled();
    expect(await remainingQuota(db, [{ scope: "global", limit: 30 }])).toBe(30);
  });

  it("passes abstentions through unchanged and caches by image hash", async () => {
    const identifier = vi.fn<Identifier>().mockResolvedValue(abstained);
    const first = await scan({ db, identifier, mode: "live" }, caller, jpeg(2));
    expect(first).toMatchObject({ status: "done", cached: false, result: { answered: false, product_id: null } });
    const second = await scan({ db, identifier, mode: "live" }, caller, jpeg(2));
    expect(second).toMatchObject({ status: "done", cached: true });
    expect(identifier).toHaveBeenCalledTimes(1);
  });

  it("stops at the caller's daily limit without calling upstream", async () => {
    vi.stubEnv("SCAN_USER_DAILY", "1");
    const identifier = vi.fn<Identifier>().mockResolvedValue(abstained);
    expect((await scan({ db, identifier, mode: "live" }, caller, jpeg(3))).status).toBe("done");
    expect(await scan({ db, identifier, mode: "live" }, caller, jpeg(4))).toEqual({ status: "quota", scope: "caller" });
    expect(identifier).toHaveBeenCalledTimes(1);
  });

  it("stops everyone at the global limit", async () => {
    vi.stubEnv("SCAN_GLOBAL_DAILY", "1");
    const identifier = vi.fn<Identifier>().mockResolvedValue(abstained);
    await scan({ db, identifier, mode: "live" }, { guestKey: "g1" }, jpeg(5));
    expect(await scan({ db, identifier, mode: "live" }, { userId: "other" }, jpeg(6))).toEqual({ status: "quota", scope: "global" });
  });

  it("reports busy when every slot is leased", async () => {
    await acquireSlot(db, 60);
    await acquireSlot(db, 60);
    const identifier = vi.fn<Identifier>();
    expect(await scan({ db, identifier, mode: "live" }, caller, jpeg(7))).toEqual({ status: "busy" });
    expect(identifier).not.toHaveBeenCalled();
  });

  it("reports timeouts and failures, counts the attempt, frees the slot", async () => {
    const timeout = vi.fn<Identifier>().mockRejectedValue(new ScanUpstreamError("slow", "timeout"));
    expect(await scan({ db, identifier: timeout, mode: "live" }, caller, jpeg(8))).toEqual({ status: "failed", kind: "timeout" });
    const broken = vi.fn<Identifier>().mockRejectedValue(new Error("socket hang up"));
    expect(await scan({ db, identifier: broken, mode: "live" }, caller, jpeg(9))).toEqual({ status: "failed", kind: "unavailable" });
    expect(await remainingQuota(db, [{ scope: "user:u-scan", limit: 8 }])).toBe(6);
    expect(await acquireSlot(db, 60)).not.toBeNull();
    // Failures are not cached, so a retry can succeed.
    expect(await db.select().from(scanCache)).toHaveLength(0);
  });
});
