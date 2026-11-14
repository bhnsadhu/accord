import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/preview",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3210",
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], deviceScaleFactor: 1 } },
  ],
  webServer: {
    command: "npm run dev:preview",
    url: "http://127.0.0.1:3210/preview/scentrev",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
