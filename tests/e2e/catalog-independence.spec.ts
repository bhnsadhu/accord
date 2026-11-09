import { expect, test } from "@playwright/test";

const santal = "/fragrance/le-labo-santal-33-p14487";

test("fragrance research works without contributions and personal ratings still persist", async ({ page }) => {
  await page.goto(santal);
  await expect(page.getByRole("heading", { name: "Accord profile" })).toBeVisible();
  await expect(page.locator("#wear")).toContainText("Scento’s editorial guide");
  await expect(page.locator("#wear a[href='https://www.scento.com/perfumes/santal-33-le-labo']")).toBeVisible();
  await expect(page.locator("#community, #reviews, #also-h")).toHaveCount(0);
  await expect(page.getByText(/No member ratings|No votes|No reviews|What members say/)).toHaveCount(0);
  await page.getByRole("button", { name: "Wishlist", exact: true }).click();
  await page.getByRole("radio", { name: "4 of 5" }).click();
  await page.reload();
  await expect(page.getByRole("radio", { name: "4 of 5" })).toBeChecked();
  await expect(page.getByRole("button", { name: "Tried", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.goto("/collection");
  await page.getByRole("tab", { name: /^Tried/ }).click();
  await expect(page.getByRole("heading", { name: "Santal 33", exact: true })).toBeVisible();
});

test("discovery and quick find expose catalog facts without public ratings", async ({ page }) => {
  // Existing links with the retired sort still produce normal catalog results.
  await page.goto("/discover?q=santal&sort=rated");
  await expect(page.locator(".archive-choice").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Top rated", exact: true })).toHaveCount(0);
  await expect(page.getByText(/Member rating|Not rated yet/)).toHaveCount(0);
  const result = await (await page.request.get("/api/search?q=santal")).json();
  expect(result.items.length).toBeGreaterThan(0);
  for (const item of result.items) expect(item).not.toHaveProperty("rating");
});

test("houses, perfumers and releases remain useful without member activity", async ({ page }) => {
  await page.goto(santal);
  await page.getByRole("link", { name: "Frank Voelkl", exact: true }).first().click();
  await expect(page).toHaveURL(/\/perfumers\/frank-voelkl$/);
  await expect(page.getByRole("heading", { level: 1, name: "Frank Voelkl" })).toBeVisible();
  await page.goto("/brands/le-labo");
  await expect(page.getByRole("heading", { name: /The full line/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Member favourites" })).toHaveCount(0);
  await page.goto("/charts");
  await expect(page).toHaveURL(/\/releases$/);
  await expect(page.getByRole("heading", { name: "Fragrance releases", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Newest in the catalog" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Browse by release year" })).toBeVisible();
  await expect(page.getByText(/Top rated|Most reviewed|Most owned|Most wanted|Latest reviews/)).toHaveCount(0);
  const year = page.locator(".chip-links a").first();
  const href = await year.getAttribute("href");
  await year.click();
  await expect(page).toHaveURL(new RegExp(href!.replace("?", "\\?") + "$"));
  await expect(page.locator(".archive-choice").first()).toBeVisible();
});

test("unsupported wear sections and retired public member pages stay absent", async ({ page }) => {
  await page.goto("/fragrance/chanel-chance-eau-de-parfum-p05819");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("#wear, a[href='#wear']")).toHaveCount(0);
  const response = await page.goto("/members/retired-member");
  expect(response?.status()).toBe(404);
});
