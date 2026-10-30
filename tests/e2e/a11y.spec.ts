import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = ["/", "/discover?q=santal", "/fragrance/le-labo-santal-33-p14487", "/profile", "/for-you", "/collection", "/scan", "/compare?a=p14487&b=p05819", "/sign-up", "/how-it-works", "/notes?q=wood", "/notes/sandalwood", "/learn"];

for (const path of pages) {
  test(`no WCAG A/AA violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const summary = results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")}`);
    expect(summary).toEqual([]);
  });
}
