import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { POST as recommend } from "@/app/api/recommendations/route";
import { GET as session, POST as authenticate } from "@/app/api/auth/[...all]/route";
import { GET as scanStatus, POST as scan } from "@/app/api/scan/route";
import { GET as me } from "@/app/api/me/route";
import { GET as health } from "@/app/api/health/route";
import { saveEntryAction } from "@/app/actions/collection";

vi.mock("@/db", () => ({ db: new Proxy({}, { get() { throw new Error("Database is offline"); } }) }));
beforeAll(() => { vi.stubEnv("ACCORD_ACCOUNTS_ENABLED", "false"); vi.stubEnv("MONITOR_SECRET", "guest-mode-health-test"); });
afterAll(() => vi.unstubAllEnvs());

const request = (path: string, body?: string) => new Request(`http://localhost:3000${path}`, {
  method: body === undefined ? "GET" : "POST",
  headers: { origin: "http://localhost:3000", cookie: "better-auth.session_token=stale-session", "Content-Type": "application/json" }, body,
});

it("serves guest suggestions despite an existing account cookie and unavailable database", async () => {
  const response = await recommend(request("/api/recommendations", JSON.stringify({ guest: { version: 1, profile: { likedNotes: ["vanilla"] }, collection: [] }, k: 6 })));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.kind).toBe("personal");
  expect(body.items).toHaveLength(6);
  expect((await recommend(request("/api/recommendations", "invalid"))).status).toBe(400);
  expect((await recommend(new Request("http://localhost:3000/api/recommendations", { method: "POST", body: "{}" }))).status).toBe(403);
});

it("pauses every account and scanner entry point without touching the database", async () => {
  expect(await (await session(request("/api/auth/get-session"))).json()).toBeNull();
  expect((await authenticate(request("/api/auth/sign-in/email", "{}"))).status).toBe(503);
  expect((await session(request("/api/auth/callback/github"))).status).toBe(503);
  expect((await me()).status).toBe(401);
  expect((await saveEntryAction({ productId: "p14487", shelf: "owned", rating: null, favorite: false })).ok).toBe(false);
  expect(await (await scanStatus(request("/api/scan"))).json()).toEqual({ enabled: false });
  expect((await scan(request("/api/scan", "unused"))).status).toBe(503);
  const response = await health(new Request("http://localhost:3000/api/health", { headers: { Authorization: "Bearer guest-mode-health-test" } }));
  expect(await response.json()).toMatchObject({ status: "ok", accounts: "paused" });
});
