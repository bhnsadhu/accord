import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({ path: testInfo.outputPath("failure.png"), fullPage: true });
  }
});

test("mobile: one tap opens a signature fragrance", async ({ page }) => {
  await page.goto("/");
  const coffee = page.getByRole("link", { name: "View Coffee & Whiskey by Bath & Body Works" });
  await expect(coffee).toHaveAttribute("href", "/fragrance/bath-and-body-works-coffee-and-whiskey-p03615");
  await coffee.tap();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Coffee & Whiskey");
});

test("mobile: a result reveals its notes beside the selected bottle and can be closed", async ({ page }) => {
  await page.goto("/discover?q=santal");
  const row = page.getByRole("list", { name: "Fragrance results" }).locator(":scope > li").nth(1);
  const choice = row.getByRole("button", { name: /^Preview / });
  const detailHref = (await row.locator(".archive-open").getAttribute("href"))!;
  await expect(choice).toHaveAttribute("aria-expanded", "false");
  await choice.tap();
  await expect(choice).toHaveAttribute("aria-expanded", "true");
  const preview = row.locator(".archive-mobile-preview");
  await expect(preview).toBeVisible();
  await expect(preview.getByRole("heading", { name: "Notes" })).toBeInViewport();
  await expect(preview.getByRole("link", { name: "View fragrance" })).toHaveAttribute("href", detailHref);
  await expect(page).toHaveURL(/\/discover\?q=santal$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);

  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.map(v => `${v.id}: ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);

  await preview.getByRole("button", { name: /^Close preview for / }).tap();
  await expect(choice).toHaveAttribute("aria-expanded", "false");
  await expect(preview).toHaveCount(0);
  await expect(choice).toBeFocused();
  await choice.tap();
  await row.locator(".archive-mobile-preview").getByRole("link", { name: "View fragrance" }).tap();
  await expect(page).toHaveURL(new RegExp(`${detailHref}$`));
});

test("mobile: filters are available in a disclosure without crowding the results", async ({ page }) => {
  await page.goto("/discover?q=santal");
  const disclosure = page.locator(".archive-filter-disclosure");
  await expect(disclosure).not.toHaveAttribute("open");
  await disclosure.locator("summary").tap();
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(disclosure.getByRole("combobox", { name: "Add a note to has every note" })).toBeVisible();
  await disclosure.locator("summary").tap();
  await expect(disclosure).not.toHaveAttribute("open");
  await expect(page.getByRole("list", { name: "Fragrance results" })).toBeVisible();
});
