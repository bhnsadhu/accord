import { expect, test } from "@playwright/test";
import { mailLink } from "./mail";
import { randomInt } from "node:crypto";

// Keep real limits enabled, while independent test runs represent different clients.
test.use({ extraHTTPHeaders: { "x-forwarded-for": `198.18.${randomInt(256)}.${randomInt(1,255)}` } });

test("verification, private export, password reset and session revocation", async ({ page, browser }) => {
  const email = `recovery-${Date.now()}@example.test`;
  const password = "original safe test password";
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Recovery Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/verify-email/);
  expect((await page.request.get("/api/me")).status()).toBe(401);
  await page.goto(await mailLink(email, "verify"));
  await expect(page).toHaveURL(/collection/);
  const otherSession = await browser.newContext();
  const signedIn = await otherSession.request.post("http://localhost:3200/api/auth/sign-in/email", {
    headers: { Origin: "http://localhost:3200", "x-forwarded-for": "192.0.2.180" }, data: { email, password },
  });
  expect(signedIn.status()).toBe(200);
  expect((await otherSession.request.get("http://localhost:3200/api/me")).status()).toBe(200);
  await page.goto("/account");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download your data" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("accord-collection.json");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "If this address is eligible" })).toBeVisible();
  const resetUrl = await mailLink(email, "reset");
  await page.goto(resetUrl);
  await page.getByLabel("New password").fill("replacement safe test password");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByText("Your password has been changed.", { exact: false })).toBeVisible();
  expect((await otherSession.request.get("http://localhost:3200/api/me")).status()).toBe(401);
  await otherSession.close();
  await page.goto(resetUrl);
  if (await page.getByLabel("New password").isVisible()) {
    await page.getByLabel("New password").fill("another replacement password");
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("expired or already been used");
  } else await expect(page.getByText("This reset link is missing or has expired.").filter({ visible: true })).toBeVisible();
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("don't match");
  await page.getByLabel("Password").fill("replacement safe test password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/collection/);
  await page.goto("/account");
  await page.getByLabel(/Type delete to confirm/).fill("delete");
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expect(page).toHaveURL("/");
});

test("unrecognized addresses get the same recovery message", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(`missing-${Date.now()}@example.test`);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "If this address is eligible" })).toBeVisible();
});
