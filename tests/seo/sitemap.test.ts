import { describe, expect, it } from "vitest";
import { TENANTS } from "@/lib/content/seeds";
import { allTenantPages } from "@/lib/content/pages";
import { buildSitemapEntries } from "@/lib/seo/sitemap";

describe("tenant sitemaps", () => {
  it("contains only the resolved tenant's canonical host", () => {
    const summit = { ...TENANTS[0]!, productionReady: true };
    const heritage = { ...TENANTS[1]!, productionReady: true };
    const summitUrls = buildSitemapEntries(summit, allTenantPages(summit)).map((entry) => entry.url);
    const heritageUrls = buildSitemapEntries(heritage, allTenantPages(heritage)).map((entry) => entry.url);
    expect(summitUrls.every((url) => url.startsWith("https://summitpainting.com/"))).toBe(true);
    expect(summitUrls.some((url) => url.includes("heritage"))).toBe(false);
    expect(heritageUrls.every((url) => url.startsWith("https://heritagepaint.com/"))).toBe(true);
  });

  it("excludes drafts and noindex records", () => {
    const tenant = { ...TENANTS[0]!, productionReady: true };
    const pages = allTenantPages(tenant).map((page, index) => index === 0 ? { ...page, status: "draft" as const } : page);
    const urls = buildSitemapEntries(tenant, pages);
    expect(urls.some((entry) => entry.url === "https://summitpainting.com/")).toBe(false);
    expect(urls.some((entry) => entry.url.includes("/projects/"))).toBe(false);
  });

  it("returns no production URLs while the launch gate is closed", () => {
    const tenant = TENANTS[0]!;
    expect(buildSitemapEntries(tenant, allTenantPages(tenant))).toEqual([]);
  });
});
