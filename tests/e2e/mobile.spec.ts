import { expect, test } from "@playwright/test";

test("mobile: the bench fits, search works, and the tab bar navigates", async ({ page }) => {
  await page.goto("/");
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await expect(page.getByRole("searchbox", { name: "Search fragrances" }).first()).toBeVisible();
  await page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Discover" }).click();
  await expect(page).toHaveURL(/\/discover/);
  await page.getByRole("searchbox", { name: "Search fragrances" }).fill("aventus");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("link", { name: /Aventus/ }).first()).toBeVisible();
});
