import { expect, test } from "@playwright/test";

test("the entrance never blocks navigation, even if an animation stalls", async ({ page }) => {
  await page.addInitScript(() => {
    const attach = () => {
      const style = document.createElement("style");
      style.textContent = ".hero-bottle > .bottle-thumbnail { animation-duration: 60s !important; }";
      document.documentElement.appendChild(style);
    };
    if (document.documentElement) attach();
    else document.addEventListener("DOMContentLoaded", attach, { once: true });
  });
  await page.goto("/");
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.getByRole("dialog", { name: "Find a fragrance" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "View Another 13 by Le Labo" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Another 13");
});

test("the bottle links navigate without JavaScript", async ({ browser, baseURL }) => {
  const page = await browser.newPage({ javaScriptEnabled: false, baseURL });
  await page.goto("/");
  await page.getByRole("link", { name: "View Bergamote 22 by Le Labo" }).click();
  await expect(page).toHaveURL(/\/fragrance\/le-labo-bergamote-22-p\d+$/);
  await page.close();
});
