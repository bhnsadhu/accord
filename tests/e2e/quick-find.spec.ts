import { expect, test } from "@playwright/test";

test("quick find opens catalog starting points and restores focus on close", async ({ page }) => {
  await page.goto("/discover");
  const trigger = page.getByRole("button", { name: "Find a fragrance", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Find a fragrance" });
  const input = dialog.getByRole("combobox");
  await expect(input).toBeFocused();
  await expect(dialog.getByRole("option")).toHaveCount(5);
  await expect(dialog.getByRole("option").first()).toContainText("Lys 41");
  await dialog.getByRole("button", { name: "Close search" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("ControlOrMeta+k");
  await input.fill("rose");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.keyboard.press("ControlOrMeta+k");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lys 41");
});

test("typing a new query never opens a stale fragrance while results load", async ({ page }) => {
  await page.goto("/discover");
  await page.keyboard.press("ControlOrMeta+k");
  const dialog = page.getByRole("dialog", { name: "Find a fragrance" });
  const input = dialog.getByRole("combobox");
  await input.fill("baccarat rouge");
  await expect(dialog.getByRole("option").first()).toContainText("Baccarat Rouge 540");
  await page.route("**/api/search?q=santal", async (route) => { await route.abort(); });
  await input.fill("santal");
  await expect(dialog.getByRole("option", { name: /Baccarat Rouge/ })).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/discover\?q=santal$/);
});

test("empty matches and failed search retain a working catalog path", async ({ page }) => {
  await page.goto("/discover");
  await page.keyboard.press("ControlOrMeta+k");
  const dialog = page.getByRole("dialog", { name: "Find a fragrance" });
  const input = dialog.getByRole("combobox");
  await input.fill("zzznosuchfragrance");
  await expect(dialog.getByRole("status")).toContainText("No matching fragrance yet");
  await expect(dialog.getByRole("option")).toHaveCount(1);
  await expect(input).toHaveAttribute("aria-activedescendant", (await dialog.getByRole("option").getAttribute("id"))!);
  await input.fill("");
  await expect(dialog.getByRole("option")).toHaveCount(5);
  await page.route("**/api/search?q=unavailable", route => route.fulfill({ status: 503, body: "{}" }));
  await input.fill("unavailable");
  await expect(dialog.getByRole("status")).toContainText("Search is unavailable");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/discover\?q=unavailable$/);
});

test("a short touch viewport keeps search and close visible while results scroll", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 430 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/discover");
  await page.getByRole("button", { name: "Find a fragrance", exact: true }).tap();
  const dialog = page.getByRole("dialog", { name: "Find a fragrance" });
  await dialog.getByRole("combobox").fill("Le Labo");
  await expect(dialog.getByRole("option")).toHaveCount(9);
  for (let i = 0; i < 8; i++) await page.keyboard.press("ArrowDown");
  await expect(dialog.getByRole("option", { name: "See all results for “Le Labo”" })).toBeInViewport();
  await expect(dialog.getByRole("combobox")).toBeInViewport();
  const close = dialog.getByRole("button", { name: "Close search" });
  await expect(close).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await close.tap();
  await expect(dialog).not.toBeVisible();
  await context.close();
});
