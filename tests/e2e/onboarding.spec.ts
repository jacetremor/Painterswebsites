import { expect, test } from "@playwright/test";

const demoToken = "demo_onboarding_token_123456789012345678901234";

test("shows platform onboarding administration without tenant chrome", async ({ page }) => {
  await page.goto("/dashboard/onboarding");
  await expect(page.getByRole("heading", { level: 1, name: "Client onboarding" })).toBeVisible();
  await expect(page.getByText("Northstar Painting Co.")).toBeVisible();
  await expect(page.getByRole("link", { name: "New invitation" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("renders the guided 17-section form and blocks incomplete navigation", async ({ page }) => {
  await page.goto(`/onboarding/${demoToken}`);
  await expect(page.getByRole("heading", { level: 1, name: "Business Information" })).toBeVisible();
  await expect(page.locator(".onboarding-sidebar ol > li")).toHaveCount(17);
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByText("This field is required.").first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Business Information" })).toBeVisible();
});

test("keeps onboarding and private previews responsive and noindex", async ({ page }) => {
  await page.goto(`/onboarding/${demoToken}`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.goto("/preview/northstarpainting");
  await expect(page.getByRole("heading", { level: 1, name: "A private website preview" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
