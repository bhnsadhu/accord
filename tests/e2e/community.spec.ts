import { expect, test } from "@playwright/test";
import { mailLink } from "./mail";

const santal = "/fragrance/le-labo-santal-33-p14487";

test("guests see member totals and an invitation, never vote controls", async ({ page }) => {
  await page.goto(santal);
  await expect(page.getByRole("heading", { name: "Accord profile" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What members say" })).toBeVisible();
  await expect(page.getByText("Member rating")).toBeVisible();
  await expect(page.getByRole("link", { name: "Create a free account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Over 12 hours" })).toHaveCount(0);
});

test("a member votes, reviews, links a similar fragrance and appears on their public page", async ({ page }) => {
  const stamp = Date.now();
  const email = `community-${stamp}@example.test`;
  const name = `Community Tester ${stamp}`;
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/verify-email/);
  await page.goto(await mailLink(email, "verify"));
  await expect(page).toHaveURL(/\/collection/);

  await page.goto(santal);
  await page.getByRole("radio", { name: "4 of 5" }).click();
  const vote = page.locator(".community-vote");
  await vote.getByRole("button", { name: "6 to 12 hours" }).click();
  await expect(vote.getByRole("button", { name: "6 to 12 hours" })).toHaveAttribute("aria-pressed", "true");
  await expect(vote.getByRole("status")).toHaveText("Saved");
  await vote.getByRole("button", { name: "Autumn" }).click();
  await expect(vote.getByRole("status")).toHaveText("Saved");

  await page.getByRole("button", { name: "Write a review" }).click();
  await page.getByLabel("Review Santal 33").fill("Too short");
  await expect(page.getByRole("button", { name: "Publish review" })).toBeDisabled();
  await page.getByLabel("Review Santal 33").fill("Dry sandalwood with a soft leather edge. It settles into a creamy skin scent after two hours.");
  await page.getByRole("button", { name: "Publish review" }).click();
  const review = page.locator(".community-review").filter({ hasText: name });
  await expect(review).toBeVisible();
  await expect(review.getByRole("img", { name: "Rated 4 of 5" })).toBeVisible();

  await page.getByPlaceholder("Search by name or house").fill("tam dao");
  await page.locator(".community-remind-search li button").first().click();
  await expect(page.locator(".community-remind-picked li")).toHaveCount(1);

  await page.reload();
  await expect(page.locator(".community-scale").filter({ hasText: "Longevity" }).locator("li[data-leading]")).not.toHaveCount(0);

  await review.getByRole("link", { name }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.locator('section[aria-labelledby="member-reviews-h"]').getByText("Dry sandalwood with a soft leather edge.")).toBeVisible();

  await page.goto(santal);
  await page.getByRole("button", { name: "Edit review" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.locator(".community-review").filter({ hasText: name })).toHaveCount(0);

  await page.goto("/account");
  await page.getByLabel(/Type delete to confirm/).fill("delete");
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expect(page).toHaveURL("/");
});

test("houses, perfumers and charts are reachable from the fragrance page", async ({ page }) => {
  await page.goto(santal);
  await page.getByRole("link", { name: "Frank Voelkl" }).first().click();
  await expect(page).toHaveURL(/\/perfumers\/frank-voelkl$/);
  await expect(page.getByRole("heading", { level: 1, name: "Frank Voelkl" })).toBeVisible();
  await page.getByRole("link", { name: "All perfumers" }).click();
  await page.goto("/brands?q=labo");
  await page.getByRole("link", { name: /^Le Labo/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Le Labo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /The full line/ })).toBeVisible();
  await page.goto("/charts");
  await expect(page.getByRole("heading", { name: "Top rated by members" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Newest in the catalog" })).toBeVisible();
});
