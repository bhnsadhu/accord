import { expect, test } from "@playwright/test";

const photo = "tests/e2e/fixtures/photo.jpg";

test("search from the homepage, open a fragrance, see why others are similar", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Know the bottle. Find the next one.");
  await page.getByRole("searchbox", { name: "Search fragrances" }).first().fill("santal 33");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/discover\?q=santal\+33/);
  await page.getByRole("link", { name: "Santal 33", exact: true }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Santal 33" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sandalwood" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Smells similar" })).toBeVisible();
  await expect(page.getByText(/^Shares /).first()).toBeVisible();
});

test("filters narrow results and can be removed", async ({ page }) => {
  await page.goto("/discover?wheel=Amber&note=vanilla");
  await expect(page.getByRole("link", { name: "Remove filter: Amber" })).toBeVisible();
  const count = await page.getByText(/^[\d,]+ fragrances?$/).textContent();
  await page.getByRole("link", { name: "Remove filter: Amber" }).click();
  await expect(page).not.toHaveURL(/wheel=/);
  const wider = await page.getByText(/^[\d,]+ fragrances?$/).textContent();
  expect(Number(wider!.replace(/\D/g, ""))).toBeGreaterThan(Number(count!.replace(/\D/g, "")));
});

test("command palette finds a fragrance by keyboard", async ({ page }) => {
  await page.goto("/discover");
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByRole("dialog").getByRole("combobox").fill("baccarat rouge");
  await expect(page.getByRole("dialog").getByRole("option").first()).toContainText("Baccarat Rouge 540");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Baccarat Rouge 540");
});

test("guest profile drives explained recommendations, and feedback re-ranks them", async ({ page }) => {
  await page.goto("/for-you");
  await expect(page.getByText("Accord doesn’t know your taste yet.", { exact: false })).toBeVisible();

  await page.goto("/profile");
  await page.getByRole("button", { name: "Vanilla", exact: true }).first().click();
  await page.getByRole("button", { name: "Tonka Bean", exact: true }).first().click();
  await page.getByRole("button", { name: "Save and see recommendations" }).click();
  await expect(page).toHaveURL(/\/for-you/);
  await expect(page.getByText(/from your notes/).first()).toBeVisible();

  const first = page.locator("ol > li").first();
  const name = await first.getByRole("heading").textContent();
  await first.getByRole("button", { name: /not for me/ }).click();
  await expect(page.locator("ol > li").first().getByRole("heading")).not.toHaveText(name!);

  await page.goto("/collection");
  await page.getByRole("tab", { name: /Tried/ }).click();
  await expect(page.getByRole("heading", { name: name! })).toBeVisible();
});

test("collection: shelve, rate and favourite as a guest; it survives a reload", async ({ page }) => {
  await page.goto("/fragrance/chanel-chance-eau-de-parfum-p05819");
  await page.getByRole("button", { name: "Owned" }).click();
  await page.getByRole("radio", { name: "5 of 5" }).click();
  await page.getByRole("button", { name: "Add to favourites" }).click();
  await expect(page.getByText("Saved on this device.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Owned" })).toHaveAttribute("aria-pressed", "true");
  await page.goto("/collection");
  await expect(page.getByRole("heading", { name: "Chance Eau De Parfum" })).toBeVisible();
  await expect(page.getByText("What your shelves say")).toBeVisible();
});

test("scanner (mock mode) shows an answer or an honest abstention", async ({ page }) => {
  await page.goto("/scan");
  await expect(page.getByText("Development mode: results are fixed test data")).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles(photo);
  await expect(page.getByText(/^(Identified|Not sure\.)$/)).toBeVisible({ timeout: 20_000 });
  if (await page.getByText("Not sure.", { exact: true }).isVisible()) {
    await expect(page.getByText("These are candidates, not an answer.", { exact: false })).toBeVisible();
    await expect(page.getByText("Identified")).toHaveCount(0);
  } else {
    await expect(page.getByText(/not a guarantee/)).toBeVisible();
  }
});

test("account: sign up merges guest data, persists on the server, and can be deleted", async ({ page }) => {
  await page.goto("/fragrance/le-labo-santal-33-p14487");
  await page.getByRole("button", { name: "Wishlist" }).click();

  const email = `e2e-${Date.now()}@example.test`;
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Test Person");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/collection/);
  await page.getByRole("tab", { name: /Wishlist/ }).click();
  await expect(page.getByRole("heading", { name: "Santal 33" })).toBeVisible();

  // Server-side: a fresh context with no local storage still sees it after signing in.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("tab", { name: /Wishlist/ }).click();
  await expect(page.getByRole("heading", { name: "Santal 33" })).toBeVisible();

  await page.goto("/account");
  await page.getByLabel(/Type delete to confirm/).fill("delete");
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("That email and password don't match an account.")).toBeVisible();
});

test("private routes refuse guests", async ({ request }) => {
  expect((await request.get("/api/me")).status()).toBe(401);
  const scan = await request.post("/api/scan", { data: Buffer.from("not an image"), headers: { "Content-Type": "image/jpeg" } });
  expect(scan.status()).toBe(400);
});
