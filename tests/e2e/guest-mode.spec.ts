import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "better-auth.session_token", value: "expired-account-session", domain: "localhost", path: "/" }]);
});

test("search, sourced details and comparison work with the database offline", async ({ page }) => {
  const failures: string[] = [];
  page.on("pageerror", error => failures.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("link", { name: "View Santal 33 by Le Labo" })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search fragrances" }).first().fill("santal 33");
  await page.keyboard.press("Enter");
  await page.getByRole("link", { name: "View fragrance: Santal 33 by Le Labo", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Santal 33");
  await expect(page.getByRole("heading", { name: "Smells similar" })).toBeVisible();
  await page.goto("/compare?a=p14487&b=p05819");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Compare");
  await expect(page.getByRole("heading", { level: 2, name: "Santal 33", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Chance Eau De Parfum", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(failures).toEqual([]);
});

test("shelves, ratings and taste survive reload and drive personal recommendations", async ({ page }) => {
  const sessionRequests: string[] = [];
  page.on("request", request => { if (request.url().includes("/api/auth") || request.url().endsWith("/api/me")) sessionRequests.push(request.url()); });
  await page.goto("/fragrance/le-labo-santal-33-p14487");
  await page.getByRole("button", { name: "Owned", exact: true }).click();
  await page.getByRole("radio", { name: "5 of 5" }).click();
  await page.getByRole("button", { name: "Add to favourites" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Owned", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("radio", { name: "5 of 5" })).toHaveAttribute("aria-checked", "true");
  await page.goto("/collection");
  await expect(page.getByRole("heading", { name: "Santal 33", exact: true })).toBeVisible();
  await expect(page.getByText("Account sync is temporarily paused.", { exact: false })).toBeVisible();
  await page.goto("/profile");
  await page.getByRole("button", { name: "Vanilla", exact: true }).first().click();
  await page.getByRole("button", { name: "Save and see recommendations" }).click();
  await expect(page).toHaveURL(/\/for-you/);
  await expect(page.locator("ol > li").first()).toBeVisible();
  await expect(page.getByText(/from your notes/).first()).toBeVisible();
  await page.reload();
  await expect(page.locator("ol > li").first()).toBeVisible();
  expect(sessionRequests).toEqual([]);
});

test("paused account and scanner routes are honest and preserve the old session", async ({ page, context, request }) => {
  for (const route of ["/sign-in", "/sign-up", "/account"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: "Sign-in is temporarily paused" })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  }
  expect((await context.cookies()).some(cookie => cookie.name === "better-auth.session_token")).toBe(true);
  expect((await request.get("/api/me")).status()).toBe(401);
  expect(await (await request.get("/api/auth/get-session")).json()).toBeNull();
  expect(await (await request.get("/api/scan")).json()).toEqual({ enabled: false });
  const response = await request.post("/api/auth/sign-in/email", { data: { email: "unused@example.test", password: "not-sent-to-db" } });
  expect(response.status()).toBe(503);
});
