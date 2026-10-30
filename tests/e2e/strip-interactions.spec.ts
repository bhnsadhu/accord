import { expect, test } from "@playwright/test";

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({ path: testInfo.outputPath("failure.png"), fullPage: true });
  }
});

test("home: choosing a strip updates the notes and keeps its detail destination", async ({ page }) => {
  await page.goto("/");
  const selection = page.locator(".signature-selection");
  await expect(selection.getByRole("heading", { level: 2 })).toHaveText("Santal 33");
  await expect(selection.getByRole("link", { name: "View fragrance" })).toHaveAttribute("href", "/fragrance/le-labo-santal-33-p14487");

  const bergamote = page.getByRole("button", { name: /Preview Bergamote 22/ });
  await bergamote.click();
  await expect(bergamote).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("heading", { level: 1 }).hover();
  await expect(selection.getByRole("heading", { level: 2 })).toHaveText("Bergamote 22");
  await expect(selection.locator(".signature-notes")).toContainText("Bergamot");
  await expect(selection.getByRole("link", { name: "View fragrance" })).toHaveAttribute("href", "/fragrance/le-labo-bergamote-22-p14466");
  await selection.getByRole("link", { name: "View fragrance" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bergamote 22");
});

test("home: a keyboard selection survives leaving the fan", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".signature-bench")).toHaveAttribute("data-intro", "done");
  const another = page.getByRole("button", { name: /Preview Another 13/ });
  await another.focus();
  await page.keyboard.press("Enter");
  await expect(another).toHaveAttribute("aria-pressed", "true");
  const selection = page.locator(".signature-selection");
  await selection.getByRole("link", { name: "View fragrance" }).focus();
  await expect(selection.getByRole("heading", { level: 2 })).toHaveText("Another 13");
  await expect(selection.getByRole("link", { name: "View fragrance" })).toHaveAttribute("href", "/fragrance/le-labo-another-13-p14462");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Another 13");
});

test("discover: preview stays in the results and comparison opens the chosen pair", async ({ page }) => {
  await page.goto("/discover?q=santal");
  const items = page.getByRole("list", { name: "Fragrance results" }).locator(":scope > li");
  const first = items.nth(1);
  const second = items.nth(2);
  const firstName = (await first.locator(".archive-choice-name").textContent())!;
  const secondName = (await second.locator(".archive-choice-name").textContent())!;
  const firstHref = (await first.locator(".archive-open").getAttribute("href"))!;
  const secondHref = (await second.locator(".archive-open").getAttribute("href"))!;
  const firstId = firstHref.match(/(p\d+)$/)![1];
  const secondId = secondHref.match(/(p\d+)$/)![1];
  const preview = page.locator(".archive-preview");

  await first.getByRole("button", { name: /^Preview / }).click();
  await expect(first.getByRole("button", { name: /^Preview / })).toHaveAttribute("aria-pressed", "true");
  await expect(preview.getByRole("heading", { level: 2 })).toHaveText(firstName);
  await expect(preview.getByRole("link", { name: "View fragrance" })).toHaveAttribute("href", firstHref);
  await expect(page).toHaveURL(/\/discover\?q=santal$/);

  await preview.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cancel comparison", exact: true })).toBeVisible();
  await second.getByRole("button", { name: /^Preview / }).click();
  await expect(preview.getByRole("heading", { level: 2 })).toHaveText(secondName);
  const compare = preview.getByRole("link", { name: "Compare the two" });
  await expect(compare).toHaveAttribute("href", `/compare?a=${firstId}&b=${secondId}`);
  await compare.click();
  await expect(page).toHaveURL(new RegExp(`/compare\\?a=${firstId}&b=${secondId}$`));
  await expect(page.locator(`article a[href="${firstHref}"]`)).toHaveText(firstName);
  await expect(page.locator(`article a[href="${secondHref}"]`)).toHaveText(secondName);
});

test("discover: a new search clears the old comparison and single-result compare has a destination", async ({ page }) => {
  await page.goto("/discover?q=santal");
  await page.locator(".archive-preview").getByRole("button", { name: "Compare", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cancel comparison", exact: true })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search fragrances" }).fill("le labo santal 33");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/discover\?q=le\+labo\+santal\+33/);
  await expect(page.getByRole("button", { name: "Cancel comparison", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Preview Santal 33 Le Labo/ })).toHaveAttribute("aria-pressed", "true");
  const compare = page.locator(".archive-preview").getByRole("link", { name: "Find a similar fragrance to compare with Santal 33" });
  await expect(compare).toHaveAttribute("href", "/fragrance/le-labo-santal-33-p14487#similar-h");
  await compare.click();
  await expect(page.getByRole("heading", { name: "Smells similar" })).toBeInViewport();
});
