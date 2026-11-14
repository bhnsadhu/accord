import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("saved evidence stays readable and switches without contacting the provider", async ({ page }, testInfo) => {
  const providerRequests: string[] = [];
  const errors: string[] = [];
  // These component-level journeys do not exercise the shared account system.
  await page.route("**/api/auth/get-session**", route => route.fulfill({ json: null }));
  page.on("request", request => {
    if (new URL(request.url()).hostname.endsWith("scentrev.com")) providerRequests.push(request.url());
  });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  const response = await page.goto("/preview/scentrev");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Santal 33", exact: true })).toBeVisible();
  await expect(page.locator(".scentrev-preview-detail")).toHaveCSS("background-color", "rgb(252, 251, 248)");
  await expect(page.getByLabel("Choose a fragrance")).toBeVisible({ visible: testInfo.project.name === "mobile" });
  await expect(page.getByLabel("Preview status")).toContainText("not live");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const detail = page.getByRole("article");
  await expect(detail).toContainText("3.75");
  await expect(detail).toContainText("12,333");
  await expect(page.getByRole("meter", { name: "Longevity score" })).toHaveAttribute("value", "0.67");

  if (testInfo.project.name === "mobile") {
    await page.getByLabel("Choose a fragrance").selectOption("chanel-bleu-de-chanel-eau-de-parfum");
  } else {
    const choice = page.getByRole("button", { name: "Bleu de Chanel Eau de Parfum by Chanel", exact: true });
    await choice.focus();
    await page.keyboard.press("Enter");
    await expect(choice).toBeFocused();
    await expect(choice).toHaveAttribute("aria-pressed", "true");
  }
  await expect(page.getByRole("heading", { name: "Bleu de Chanel Eau de Parfum", exact: true })).toBeVisible();
  await expect(detail).toContainText("4.43");
  await expect(detail).toContainText("20,712");
  await expect(detail).not.toContainText("12,333");
  await expect(page.getByRole("meter", { name: "Longevity score" })).toHaveAttribute("value", "0.594");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByText("About these figures", { exact: true }).click();
  await expect(page.getByText(/reported records have not been verified as unique voters/i)).toBeVisible();
  await expect(page.getByText(/multiples of 100/)).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(accessibility.violations.map(violation => ({ id: violation.id, targets: violation.nodes.map(node => node.target) }))).toEqual([]);
  expect(providerRequests).toEqual([]);
  expect(errors).toEqual([]);
  await page.getByText("About these figures", { exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath("scentrev-preview.png"), fullPage: true });
});
