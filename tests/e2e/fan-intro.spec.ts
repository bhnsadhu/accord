import { expect, test, type Page } from "@playwright/test";

/** Simulate a stalled animation to exercise the gate's recovery, not a slow server. */
async function stallArrival(page: Page) {
  await page.addInitScript(() => {
    const attach = () => {
      if (!document.documentElement) return false;
      const style = document.createElement("style");
      style.textContent = ".signature-bench .hero-strip { animation-duration: 60s !important; }";
      document.documentElement.appendChild(style);
      return true;
    };
    if (!attach()) {
      const observer = new MutationObserver(() => { if (attach()) observer.disconnect(); });
      observer.observe(document, { childList: true, subtree: true });
    }
  });
}

test("intro blocks clicks and scrolling, and releases even if motion stalls", async ({ page }) => {
  await stallArrival(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const intro = page.getByRole("dialog", { name: "Welcome to Accord" });
  await expect(page.locator(".signature-bench")).toHaveAttribute("data-intro", "playing");
  await expect(intro).toBeVisible();
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.getByRole("dialog", { name: "Find a fragrance" })).not.toBeVisible();
  const nav = await page.locator('.desktop-sections a[href="/discover"]').boundingBox();
  await page.mouse.click(nav!.x + nav!.width / 2, nav!.y + nav!.height / 2);
  await expect(page).toHaveURL(/\/$/);
  await page.mouse.wheel(0, 500);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(await page.evaluate(() => document.querySelector(".fan-intro-gate")?.contains(document.activeElement))).toBe(true);
  await expect(intro).not.toBeVisible({ timeout: 3000 });
  await expect(page.locator("html")).not.toHaveClass(/accord-intro-active/);
  await page.locator('.desktop-sections a[href="/discover"]').click();
  await expect(page).toHaveURL(/\/discover$/);
});

test("skip settles every strip and navigation back does not replay the intro", async ({ page }) => {
  await stallArrival(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(page.locator(".signature-bench")).toHaveAttribute("data-intro", "done");
  await expect(page.locator(".bench-rail, .blotter-stand")).toHaveCount(0);
  await page.getByRole("button", { name: /Preview Bergamote 22/ }).click();
  await expect(page.locator(".signature-selection h2")).toHaveText("Bergamote 22");
  await page.locator('.desktop-sections a[href="/discover"]').click();
  await page.getByRole("link", { name: "Accord", exact: true }).click();
  await expect(page.locator(".signature-bench")).toHaveAttribute("data-intro", "done");
  await expect(page.getByRole("dialog", { name: "Welcome to Accord" })).not.toBeVisible();
});

test("reduced motion skips the gate and Escape can dismiss the normal intro", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".signature-bench")).toHaveAttribute("data-intro", "done");
  await expect(page.getByRole("dialog", { name: "Welcome to Accord" })).not.toBeVisible();
  await page.getByRole("button", { name: /Preview Another 13/ }).click();
  await expect(page.locator(".signature-selection h2")).toHaveText("Another 13");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await stallArrival(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".signature-bench")).toHaveAttribute("data-intro", "playing");
  await page.keyboard.press("Escape");
  await expect(page.locator(".signature-bench")).toHaveAttribute("data-intro", "done");
  await expect(page.locator("html")).not.toHaveClass(/accord-intro-active/);
});
