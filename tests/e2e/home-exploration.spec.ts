import { expect, test } from "@playwright/test";

test("a note reveals real connections, closes, and opens its catalog filter", async ({ page }) => {
  await page.goto("/");
  const sandalwood = page.getByRole("button", { name: "Sandalwood", exact: true });
  await sandalwood.focus();
  await page.keyboard.press("Enter");
  await expect(sandalwood).toHaveAttribute("aria-expanded", "true");
  const connections = page.getByRole("region", { name: "Sandalwood connections" });
  await expect(connections.getByRole("listitem")).toHaveCount(3);
  await expect(connections).toContainText("fragrances list sandalwood");
  await page.keyboard.press("Enter");
  await expect(sandalwood).toHaveAttribute("aria-expanded", "false");
  await expect(sandalwood).toBeFocused();
  await page.getByRole("button", { name: "Amber", exact: true }).click();
  await expect(page.getByRole("region", { name: "Amber connections" })).toBeVisible();
  await page.getByRole("link", { name: "Explore the note", exact: true }).click();
  await expect(page).toHaveURL(/\/discover\?note=amber$/);
  await expect(page.getByRole("link", { name: "Remove filter: with Amber" })).toBeVisible();
});

test("family strips disclose one at a time and still work without JavaScript", async ({ browser, baseURL }) => {
  const page = await browser.newPage({ javaScriptEnabled: false, baseURL });
  await page.goto("/");
  const families = page.locator(".family-disclosure");
  const first = families.nth(0);
  const second = families.nth(1);
  await first.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("open", "");
  await expect(first.getByRole("link", { name: "View fragrance" })).toBeVisible();
  await second.locator("summary").click();
  await expect(second).toHaveAttribute("open", "");
  await expect(first).not.toHaveAttribute("open");
  await second.getByRole("link", { name: /^Explore / }).click();
  await expect(page).toHaveURL(/\/discover\?wheel=/);
  await page.close();
});

test("scan entry opens the scanner and its frame preserves upload and error recovery", async ({ page }) => {
  // Intercept both methods so this test never calls the live recognition service.
  await page.route("**/api/scan", route => route.fulfill({
    status: route.request().method() === "GET" ? 200 : 400,
    json: route.request().method() === "GET"
      ? { enabled: true, mock: true, remaining: 2, signedIn: false }
      : { status: "invalid", error: "Try a clearer photo." },
  }));
  await page.goto("/");
  await page.getByRole("link", { name: "Scan a bottle Find your fragrance from a photo" }).click();
  await expect(page.getByRole("heading", { name: "Scan a bottle" })).toBeVisible();
  const input = page.locator('input[type="file"]');
  await input.focus();
  await expect(input).toBeFocused();
  await input.setInputFiles("tests/e2e/fixtures/photo.jpg");
  await expect(page.locator(".scanner-response").getByRole("alert")).toContainText("Try a clearer photo.");
  await expect(page.getByRole("button", { name: "Choose a photo again" })).toBeVisible();
  await expect(input).toBeEnabled();
});

test("reduced motion keeps exploration and quick find usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: /Preview Bergamote 22/ }).click();
  await expect(page.locator(".signature-selection h2")).toHaveText("Bergamote 22");
  expect(await page.locator(".signature-identity").evaluate(el => getComputedStyle(el).animationDuration)).toBe("0s");
  const find = page.getByRole("button", { name: "Find a fragrance", exact: true });
  await find.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(find).toBeFocused();
});
