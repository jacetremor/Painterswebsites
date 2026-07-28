import { expect, test } from "@playwright/test";

async function getContrastRatio(page: import("@playwright/test").Page, selector: string) {
  return page.locator(selector).first().evaluate((element) => {
    const parseColor = (value: string) => {
      const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return [channels[0] ?? 0, channels[1] ?? 0, channels[2] ?? 0] as const;
    };
    const luminance = (channels: readonly [number, number, number]) => {
      const toLinear = (channel: number) => {
        const value = channel / 255;
        return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
      };
      return .2126 * toLinear(channels[0])
        + .7152 * toLinear(channels[1])
        + .0722 * toLinear(channels[2]);
    };

    const foreground = parseColor(getComputedStyle(element).color);
    let backgroundElement: Element | null = element;
    let background: readonly [number, number, number] = [255, 255, 255];
    while (backgroundElement) {
      const style = getComputedStyle(backgroundElement);
      const channels = parseColor(style.backgroundColor);
      if (channels.length === 3 && style.backgroundColor !== "rgba(0, 0, 0, 0)") {
        background = channels;
        break;
      }
      backgroundElement = backgroundElement.parentElement;
    }

    const foregroundLuminance = luminance(foreground);
    const backgroundLuminance = luminance(background);
    return (Math.max(foregroundLuminance, backgroundLuminance) + .05)
      / (Math.min(foregroundLuminance, backgroundLuminance) + .05);
  });
}

test("renders one H1 and crawlable tenant navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  expect(await page.locator('a[href="/residential-painting"]').count()).toBeGreaterThan(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("loads the restrained motion and image-led service system without hiding content", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toHaveClass(/motion-enabled/);
  await expect(page.locator(".scroll-progress__bar")).toHaveCount(1);
  await expect(page.locator(".split-text")).toHaveCount(1);
  await expect(page.locator(".paint-marquee")).toHaveCount(0);
  await expect(page.locator(".service-feature__media img")).toHaveCount(3);
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

test("composes singleton commercial evidence without an empty grid slot", async ({ page }) => {
  await page.goto("/commercial-painting");
  const grid = page.locator(".overview-project-grid");
  const card = grid.locator(".card");
  await expect(grid).toHaveClass(/project-grid--single/);
  await expect(card).toHaveCount(1);
  const [gridBox, cardBox] = await Promise.all([grid.boundingBox(), card.boundingBox()]);
  expect(gridBox).not.toBeNull();
  expect(cardBox).not.toBeNull();
  expect(Math.abs(gridBox!.width - cardBox!.width)).toBeLessThan(2);
});

test("labels reference photography instead of presenting a false comparison", async ({ page }) => {
  await page.goto("/projects/foothill-stucco-color-study");
  await expect(page.locator(".comparison")).toHaveCount(0);
  await expect(page.locator(".reference-pair figure")).toHaveCount(2);
  await expect(page.locator(".reference-pair")).toContainText("Surface condition reference");
  await expect(page.locator(".reference-pair")).toContainText("Finish reference");
});

test("keeps footer navigation readable on both tenant themes", async ({ page }) => {
  for (const host of ["summit.localhost", "heritage.localhost"]) {
    await page.goto(`http://${host}:3000/`);
    await expect(page.locator(".site-footer .link-list a").first()).toBeVisible();
    expect(await getContrastRatio(page, ".site-footer .link-list a")).toBeGreaterThanOrEqual(4.5);
    await expect(page.locator(".site-footer nav h2").first()).toHaveCSS("font-size", "16px");
  }
});

test("links each tenant homepage to its owner portal", async ({ page }) => {
  for (const host of ["summit.localhost", "heritage.localhost"]) {
    await page.goto(`http://${host}:3000/`);
    const ownerLogin = page.locator(".site-footer .owner-login-link");
    await expect(ownerLogin).toBeVisible();
    await expect(ownerLogin).toHaveAttribute("href", "/login");

    await page.goto(`http://${host}:3000/about`);
    await expect(page.locator(".site-footer .owner-login-link")).toHaveCount(0);
  }
});

test("offers password and email-link owner sign in", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Email me a sign-in link" })).toBeVisible();
});

test("renders the tenant owner photo workflow in demo mode", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Website status" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent website leads" })).not.toBeVisible();

  await page.locator('.dashboard-nav a[href="/dashboard#leads"]').click();
  await expect(page).toHaveURL(/#leads$/);
  await expect(page.getByRole("heading", { name: "Recent website leads" })).toBeVisible();
  await expect(page.locator(".dashboard-empty-state")).toContainText("No estimate requests yet");
  await expect(page.getByRole("heading", { name: "Website status" })).not.toBeVisible();

  await page.locator('.dashboard-nav a[href="/dashboard#library"]').click();
  await expect(page).toHaveURL(/#library$/);
  await expect(page.getByRole("heading", { name: "Your project photo library" })).toBeVisible();
  await expect(page.locator(".owner-media__notice")).toContainText("Preview mode");
  expect(await page.locator(".owner-media-thumb").count()).toBeGreaterThan(0);

  await page.locator('.dashboard-nav a[href="/dashboard#upload"]').click();
  await expect(page).toHaveURL(/#upload$/);
  await expect(page.getByRole("heading", { name: "Upload project photos" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your project photo library" })).not.toBeVisible();
  await expect(page.locator('.owner-file-control input[type="file"]')).toBeDisabled();
  await expect(page.getByRole("button", { name: "Upload as draft" })).toBeDisabled();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test("keeps owner uploads closed until Supabase is configured", async ({ request }) => {
  const response = await request.post("/api/dashboard/media/uploads", {
    data: { filename: "project.jpg", mimeType: "image/jpeg", byteSize: 1024 },
  });
  expect(response.status()).toBe(503);
  expect(await response.json()).toEqual({ message: "Connect Supabase before uploading project photos." });
});
