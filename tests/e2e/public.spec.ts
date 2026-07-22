import { expect, test } from "@playwright/test";

test("renders one H1 and crawlable tenant navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  expect(await page.locator('a[href="/residential-painting"]').count()).toBeGreaterThan(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("loads the public motion system without hiding content", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toHaveClass(/motion-enabled/);
  await expect(page.locator(".scroll-progress__bar")).toHaveCount(1);
  await expect(page.locator(".split-text")).toHaveCount(1);
  await expect(page.locator(".paint-marquee")).toHaveCount(1);
  const introduction = page.locator(".home-intro .motion-reveal");
  await introduction.scrollIntoViewIfNeeded();
  await expect(introduction).toHaveClass(/is-visible/);
});

test("navigates tenant pages without a reload loop", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toHaveClass(/motion-enabled/);
  const aboutLink = page.locator('.home-intro a[href="/about"]');
  await expect(aboutLink).toHaveCount(1);
  await aboutLink.scrollIntoViewIfNeeded();
  await expect(page.locator(".home-intro .motion-reveal")).toHaveCSS("opacity", "1");
  await aboutLink.click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator("h1")).toContainText("About Summit Painting Co.");
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
