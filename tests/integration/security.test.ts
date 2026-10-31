import { beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { requestBudgets } from "@/db/schema";
import { consumeBudget } from "@/lib/security/budget";
import { BodyTooLarge, matchesSecret, readBody, sameOrigin } from "@/lib/security/request";

beforeEach(async () => { await db.delete(requestBudgets); });

describe("request protection", () => {
  it("rejects cross-site writes and missing origins", () => {
    expect(sameOrigin(new Request("http://localhost:3000/api/scan", { headers: { Origin: "https://attacker.test" } }))).toBe(false);
    expect(sameOrigin(new Request("http://localhost:3000/api/scan"))).toBe(false);
    expect(sameOrigin(new Request("http://localhost:3000/api/scan", { headers: { Origin: "http://localhost:3000" } }))).toBe(true);
  });
  it("bounds streaming bodies even when no length is declared", async () => {
    const request = new Request("http://localhost/test", { method: "POST", body: new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(8)); controller.enqueue(new Uint8Array(8)); controller.close(); } }), duplex: "half" } as RequestInit);
    await expect(readBody(request, 10)).rejects.toBeInstanceOf(BodyTooLarge);
    expect(await readBody(new Request("http://localhost/test", { method: "POST", body: "hello" }), 10)).toEqual(new TextEncoder().encode("hello"));
  });
  it("fails closed if monitoring is not configured", () => {
    expect(matchesSecret("x", undefined)).toBe(false);
    expect(matchesSecret(null, "x")).toBe(false);
    expect(matchesSecret("wrong", "secret")).toBe(false);
    expect(matchesSecret("secret", "secret")).toBe(true);
  });
});

describe("distributed budgets", () => {
  it("cannot exceed its limit with competing requests", async () => {
    const results = await Promise.all(Array.from({ length: 12 }, () => consumeBudget(db, [{ scope: "test:race", limit: 5, seconds: 60 }])));
    expect(results.filter(Boolean)).toHaveLength(5);
  });
  it("rolls back all counters when a recipient is exhausted", async () => {
    await consumeBudget(db, [{ scope: "recipient", limit: 1, seconds: 3600 }]);
    expect(await consumeBudget(db, [{ scope: "0:global", limit: 10, seconds: 86400 }, { scope: "recipient", limit: 1, seconds: 3600 }])).toBe(false);
    expect((await db.execute(sql`select * from request_budgets where scope='0:global'`)).rows).toHaveLength(0);
  });
  it("uses UTC calendar months and rejects disabled budgets", async () => {
    expect(await consumeBudget(db, [{ scope: "monthly", limit: 1, seconds: 1, calendarMonth: true }])).toBe(true);
    expect(await consumeBudget(db, [{ scope: "monthly", limit: 1, seconds: 1, calendarMonth: true }])).toBe(false);
    const result = await db.execute(sql`select extract(day from window_start at time zone 'UTC')::int as day from request_budgets where scope='monthly'`);
    expect(result.rows[0].day).toBe(1);
    expect(await consumeBudget(db, [{ scope: "off", limit: 0, seconds: 60 }])).toBe(false);
  });
});
