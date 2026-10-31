import { defineConfig, devices } from "@playwright/test";

// End-to-end journeys against the local dev server and local database
// (`npm run db:server`, migrated and seeded). The scanner runs in mock mode;
// no test ever calls the live ScentLens endpoint.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  use: { baseURL: "http://localhost:3200", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    command: "npx next dev --port 3200",
    url: "http://localhost:3200/how-it-works",
    reuseExistingServer: false,
    timeout: 180_000,
    env: { SCANNER_MODE: "mock", SCAN_GUEST_DAILY: "50", SCAN_USER_DAILY: "50", SCAN_GLOBAL_DAILY: "500", SCAN_GLOBAL_MONTHLY: "5000", AUTH_EMAIL_ENABLED: "true", AUTH_EMAIL_TEST_INBOX: "output/reference-build/test-mail.jsonl", NEXT_DIST_DIR: ".next-e2e", BETTER_AUTH_URL: "http://localhost:3200" },
  },
});
