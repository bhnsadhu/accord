import { defineConfig, devices } from "@playwright/test";

/** Exercise the deployed catalog with an unreachable database, including stale cookies. */
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "guest-mode.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: { baseURL: "http://localhost:3218", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: process.env.GUEST_TEST_PRODUCTION === "true" ? "npx next start --port 3218" : "npx next dev --port 3218",
    url: "http://localhost:3218/how-it-works",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      ACCORD_ACCOUNTS_ENABLED: "false", DATABASE_URL: "postgres://unavailable@127.0.0.1:1/offline",
      NEXT_DIST_DIR: ".next-catalog", BETTER_AUTH_URL: "http://localhost:3218",
      BETTER_AUTH_SECRET: "guest-mode-local-test-secret-not-production",
    },
  },
});
