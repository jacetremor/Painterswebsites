import { describe, expect, it } from "vitest";
import { TENANTS } from "@/lib/content/seeds";
import { auditTenant, validateForPublication } from "@/lib/seo/audit";
import { isValidStructuredData, pageSchema } from "@/lib/seo/structured-data";

describe("SEO publishing gate", () => {
  it("has no critical seed-data conflicts", () => {
    for (const tenant of TENANTS) {
      expect(auditTenant(tenant).filter((issue) => issue.severity === "critical")).toEqual([]);
    }
  });

  it("blocks invalid slugs, missing titles, and cross-tenant ownership", () => {
    const tenant = TENANTS[0]!;
    const invalid = { ...tenant.pages[1]!, tenantId: "heritage", slug: "Bad Slug", seo: { ...tenant.pages[1]!.seo, title: "" } };
    const codes = validateForPublication(tenant, invalid).map((issue) => issue.code);
    expect(codes).toEqual(expect.arrayContaining(["tenant-mismatch", "missing-title", "invalid-slug"]));
  });

  it("validates required structured-data fields", () => {
    const tenant = TENANTS[0]!;
    expect(isValidStructuredData(pageSchema(tenant, tenant.pages[0]!))).toBe(true);
    expect(isValidStructuredData({ "@context": "https://schema.org" })).toBe(false);
  });
});
