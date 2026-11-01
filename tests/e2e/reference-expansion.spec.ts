import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const edp = "/fragrance/dior-sauvage-eau-de-parfum-a7782dc120305";

test("exact edition lookup leads to sourced notes, versions, comparison and collection", async ({ page }) => {
  await page.goto("/discover?q=sauvage+edp");
  await expect(page.locator(".archive-choice").first()).toBeVisible();
  for (const row of await page.locator(".archive-choice").all()) await expect(row).toContainText("Eau de parfum");
  await page.getByRole("link", { name: "View fragrance: Sauvage Eau de Parfum by Dior", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(edp+"$"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sauvage Eau de Parfum");
  await expect(page.locator(".research-facts")).toContainText("Eau de parfum");
  await expect(page.locator(".visual-note-stages")).toContainText("Opening");
  await expect(page.locator(".research-wear")).toContainText("Brand guidance");
  await page.getByRole("button", { name: "Owned", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Owned", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.locator("main #sources > summary").click();
  await expect(page.locator("main #sources .research-source-list a").first()).toHaveAttribute("href", /^https:\/\/www.dior.com/);
  await page.locator("main #editions").getByRole("link", { name: "Compare", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "The details, side by side" })).toBeVisible();
  await expect(page.locator(".research-comparison")).toContainText("Sauvage Eau de Parfum");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("multiple note filters persist and can be removed independently", async ({ page }) => {
  await page.goto("/discover?brand=le-labo");
  const include = page.getByRole("combobox", { name: "Add a note to has every note" });
  await include.selectOption("sandalwood");
  await include.selectOption("cardamom");
  await page.getByRole("combobox", { name: "Add a note to without these notes" }).selectOption("vanilla");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/note=sandalwood&note=cardamom/);
  await expect(page.locator(".archive-choice")).not.toHaveCount(0);
  await expect(page.getByRole("link", { name: "Remove filter: without Vanilla" })).toBeVisible();
  await page.getByRole("link", { name: "Remove filter: with Cardamom" }).click();
  await expect(page).toHaveURL(/note=sandalwood/);
  await expect(page).not.toHaveURL(/note=cardamom/);
  await expect(page).toHaveURL(/without=vanilla/);
  await expect(page).toHaveURL(/brand=le-labo/);
});

test("a private missing-fragrance request saves with feedback", async ({ page }) => {
  await page.goto("/discover?q=unlisted-fixture-reference");
  await expect(page.getByText("No fragrance matches all of that.")).toBeVisible();
  await page.locator(".catalog-request summary").click();
  await page.getByLabel("Fragrance and version").fill("Private reference test");
  await page.getByLabel("Brand", { exact: true }).fill("Browser fixture");
  await page.getByRole("button", { name: "Request fragrance" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Request saved" })).toBeVisible();
  expect((await page.request.get("/api/catalog-requests")).status()).toBe(405);
});

test("enriched pages remain accessible and fit a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 840 });
  for (const route of [edp, "/compare?a=p07571&b=a7782dc120305", "/learn"]) {
    await page.goto(route); await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(result.violations.map(v => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
  }
});
