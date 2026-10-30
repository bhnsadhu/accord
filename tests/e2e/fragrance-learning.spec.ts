import { expect, test } from "@playwright/test";

const santal = "/fragrance/le-labo-santal-33-p14487";

test("a fragrance teaches a note, then follows it into the catalog", async ({ page }) => {
  await page.goto(santal);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Santal 33");
  await expect(page.locator("main .reference-introduction")).toContainText("Woods family");
  const sandalwood = page.locator("main .reference-note").filter({ has: page.locator("summary", { hasText: "Sandalwood" }) });
  await sandalwood.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(sandalwood).toHaveAttribute("open", "");
  await expect(sandalwood).toContainText("creamy wood");
  const iris = page.locator("main .reference-note").filter({ has: page.locator("summary", { hasText: "Iris / Orris" }) });
  await iris.locator("summary").click();
  await expect(sandalwood).not.toHaveAttribute("open", "");
  await expect(iris).toHaveAttribute("open", "");
  await iris.getByRole("link", { name: /Explore iris/ }).click();
  await expect(page).toHaveURL(/\/notes\/iris-orris$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Iris / Orris");
  await page.getByRole("link", { name: "Explore all", exact: true }).click();
  await expect(page).toHaveURL(/\/discover\?note=iris-orris$/);
  await expect(page.getByRole("link", { name: "Remove filter: with Iris / Orris" })).toBeVisible();
  await page.getByRole("link", { name: "About iris / orris" }).click();
  await expect(page).toHaveURL(/\/notes\/iris-orris$/);
});

test("note search, empty search, and an unannotated note remain useful", async ({ page }) => {
  await page.goto("/notes");
  await page.getByRole("searchbox", { name: "Search notes" }).fill("sandalwood");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".knowledge-index li")).toHaveCount(1);
  await page.getByRole("link", { name: /Sandalwood Smooth/ }).click();
  await expect(page).toHaveURL(/\/notes\/sandalwood$/);
  await expect(page.getByRole("heading", { name: "Find it in a fragrance" })).toBeVisible();
  await page.goto("/notes?q=no-such-material-abc");
  await expect(page.getByRole("main").getByText(/No notes match/)).toBeVisible();
  await page.getByRole("link", { name: "Browse all notes" }).click();
  await expect(page.locator(".knowledge-index li")).toHaveCount(285);
  await page.goto("/notes/genmai-cha-tea-accord");
  await expect(page.getByRole("main").getByText("A scent description is not yet included", { exact: false })).toBeVisible();
  await expect(page.locator("main .note-fragrance-list article").first()).toBeVisible();
  await page.goto("/notes/not-a-catalog-note");
  await expect(page.getByRole("heading", { name: "No strip by that name." })).toBeVisible();
  // Next streams this route, so an absent resource uses not-found UI and noindex.
  await expect(page.locator('meta[name="robots"][content="noindex"]').first()).toBeAttached();
});

test("note explanations and examples remain usable on a touch screen", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto(santal);
  const note = page.locator("main .reference-note").filter({ has: page.locator("summary", { hasText: "Sandalwood" }) });
  await note.locator("summary").tap();
  await expect(note).toHaveAttribute("open", "");
  await note.getByRole("link", { name: "Explore sandalwood" }).tap();
  await expect(page).toHaveURL(/\/notes\/sandalwood$/);
  const examples = page.locator("main .note-fragrance-list article");
  await expect(examples).toHaveCount(8);
  for (const example of await examples.all()) await expect(example.getByText("Lists sandalwood", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test("house browsing uses the exact brand and survives note filters", async ({ page }) => {
  await page.goto(santal);
  await page.getByRole("link", { name: "Le Labo", exact: true }).click();
  await expect(page).toHaveURL(/\/discover\?brand=le-labo$/);
  await expect(page.getByRole("link", { name: "Remove filter: Le Labo" })).toBeVisible();
  const names = await page.locator(".archive-choice").allTextContents();
  expect(names.length).toBeGreaterThan(0);
  expect(names.every(name => name.includes("Le Labo"))).toBe(true);
  await page.locator('select[name="note"]').selectOption("sandalwood");
  await expect(page).toHaveURL(/brand=le-labo/);
  await expect(page).toHaveURL(/note=sandalwood/);
  await page.getByRole("link", { name: "Remove filter: Le Labo" }).click();
  await expect(page).not.toHaveURL(/brand=/);
  await expect(page).toHaveURL(/note=sandalwood/);
});

test("the fragrance guide disclosures work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/learn");
  await page.locator(".guide-family summary").filter({ hasText: /^Woods$/ }).click();
  await page.getByRole("link", { name: "Explore woods", exact: true }).click();
  await expect(page).toHaveURL(/\/discover\?wheel=Woods$/);
  await context.close();
});
