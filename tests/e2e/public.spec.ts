import { expect, test } from "@playwright/test";

test("renders one H1 and crawlable tenant navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  expect(await page.locator('a[href="/residential-painting"]').count()).toBeGreaterThan(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("navigates tenant pages without a reload loop", async ({ page }) => {
  await page.goto("/");
  const aboutLink = page.locator('.home-intro a[href="/about"]');
  await expect(aboutLink).toHaveCount(1);
  await aboutLink.click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator("h1")).toContainText("measured approach");
  await page.waitForTimeout(750);
  await expect(page).toHaveURL(/\/about$/);
});

test("renders the Salt Lake City location page", async ({ page }) => {
  await page.goto("/painters-salt-lake-city-ut");
  await expect(page.locator("h1")).toContainText("Salt Lake City");
  await expect(page.locator("main")).toContainText("Historic avenues");
});

test("returns a real 404 for an unknown page", async ({ request }) => {
  const response = await request.get("/definitely-not-a-page");
  expect(response.status()).toBe(404);
});

test("keeps the mobile layout free of horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/interior-painting");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
