import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const santal = "/fragrance/le-labo-santal-33-p14487";

test("the bottle enlarges with credits, traps focus, and returns it on Escape", async ({ page }) => {
  await page.goto(santal);
  const trigger = page.getByRole("button", { name: "Enlarge Santal 33 bottle photo" });
  await trigger.focus(); await page.keyboard.press("Enter");
  const viewer = page.getByRole("dialog", { name: /Santal 33/ });
  await expect(viewer).toBeVisible();
  await expect(viewer.getByRole("img")).toHaveAttribute("src", "/images/fragrances/p14487.webp");
  await expect(viewer.getByRole("link", { name: "Marie G." })).toHaveAttribute("href", /unsplash.com\/photos/);
  await expect(viewer.getByRole("link", { name: "Unsplash License" })).toHaveAttribute("href", "https://unsplash.com/license");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape"); await expect(viewer).not.toBeVisible(); await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe("hidden");
});

test("search identifies the exact photographed edition and retains unpictured entries", async ({ page }) => {
  await page.goto("/discover");
  await page.getByRole("button", { name: "Find a fragrance", exact: true }).click();
  await page.getByRole("combobox", { name: "Fragrance or brand" }).fill("sauvage edp");
  const hit = page.getByRole("option").filter({ hasText: /^Sauvage Eau de Parfum/ });
  await expect(hit).toBeVisible();
  await expect(hit.locator("img")).toHaveAttribute("src", "/images/fragrances/a7782dc120305-thumb.webp");
  await page.keyboard.press("Escape");
  await page.goto("/fragrance/dior-sauvage-eau-de-toilette-p07571");
  await expect(page.locator("main .bottle-photo")).toHaveCount(0);
  await expect(page.locator("main .detail-paper")).toBeVisible();
});

test("photographs and note routes fit a phone and unknown notes have a valid way onward", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(santal);
  const photo = page.locator(".reference-mobile-photo .bottle-photo-trigger img");
  await expect(photo).toBeVisible();
  expect(await photo.evaluate(im => getComputedStyle(im).objectFit)).toBe("contain");
  const note = page.locator("#notes > .visual-notes > .reference-note").filter({ hasText: "Sandalwood" });
  await note.locator("summary").click();
  await expect(note.locator("summary img")).toHaveAttribute("src", "/images/notes/sandalwood.webp");
  await note.getByRole("link", { name: "Explore sandalwood", exact: true }).click();
  await expect(page.locator(".note-photo-reference img")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sandalwood Australia", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("new editions are searchable, sourced and pictured without public reviews", async ({ page }) => {
  for (const [query, id, name] of [["Chanel No5 EDP", "aa271d375a3ad", "N°5 Eau de Parfum"], ["Ombre Leather EDP", "a09e1f2c0fabb", "Ombré Leather Eau de Parfum"]]) {
    const result = await (await page.request.get(`/api/search?q=${encodeURIComponent(query)}`)).json();
    const found = result.items.find((item: { productId: string }) => item.productId === id);
    expect(found).toBeTruthy(); await page.goto(`/fragrance/${found.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
    await expect(page.getByRole("button", { name: `Enlarge ${name} bottle photo`, exact: true })).toBeVisible();
    await expect(page.locator("#sources .research-source-list")).toContainText(/Chanel|Tom Ford/);
    await expect(page.getByRole("button", { name: /Write a review|Post a review/ })).toHaveCount(0);
  }
});
