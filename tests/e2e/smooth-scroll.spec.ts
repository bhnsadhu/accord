import { expect, test } from "@playwright/test";

// Lenis eases the wheel. These checks pin the three places it must stay out of
// the way: the entrance gate, modal dialogs, and reduced motion.

const scrollY = (page: import("@playwright/test").Page) => page.evaluate(() => Math.round(window.scrollY));

test("the wheel is eased, not jumped", async ({ page }) => {
  await page.goto("/how-it-works");
  await expect(page.locator("html")).toHaveClass(/lenis/);
  const room = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  test.skip(room < 700, "page is not tall enough to scroll 600px here");
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 600);
  const seen = new Set<number>();
  for (let i = 0; i < 14; i++) { seen.add(await scrollY(page)); await page.waitForTimeout(80); }
  expect(seen.size).toBeGreaterThan(3);
  expect(await scrollY(page)).toBe(600);
});

test("the page does not scroll while the entrance plays", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".signature-bench")).toHaveAttribute("data-intro", "playing");
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(150);
  expect(await scrollY(page)).toBe(0);
  // Once the entrance hands over, the wheel works again.
  await expect(page.locator("html")).not.toHaveClass(/accord-intro-active/, { timeout: 4000 });
  await page.mouse.wheel(0, 600);
  await expect.poll(() => scrollY(page), { timeout: 3000 }).toBeGreaterThan(0);
});

test("a modal dialog scrolls its own list, not the page", async ({ page }) => {
  await page.goto("/discover");
  await page.getByRole("button", { name: "Find a fragrance", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Find a fragrance" });
  await dialog.getByRole("combobox").fill("a");
  await expect(dialog.getByRole("option").nth(3)).toBeVisible();
  const list = dialog.locator(".quick-find-content");
  const before = await list.evaluate(el => ({ top: el.scrollTop, room: el.scrollHeight - el.clientHeight }));
  test.skip(before.room < 20, "results list is not tall enough to scroll here");
  const box = (await list.boundingBox())!;
  await page.mouse.move(box.x + 60, box.y + 60);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(500);
  expect(await list.evaluate(el => el.scrollTop)).toBeGreaterThan(before.top);
  expect(await scrollY(page)).toBe(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("leaves scrolling to the browser", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.locator("html")).not.toHaveClass(/lenis/);
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(400);
    expect(await scrollY(page)).toBeGreaterThan(0);
  });
});
