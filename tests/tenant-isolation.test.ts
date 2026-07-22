import { describe, expect, it } from "vitest";
import { TENANTS } from "@/lib/content/seeds";
import { allTenantPages } from "@/lib/content/pages";
import { normalizeHostname, resolveSeedTenant } from "@/lib/tenant/host";

describe("tenant isolation", () => {
  it("resolves each hostname to exactly one tenant", () => {
    expect(resolveSeedTenant("summit.localhost:3000")?.id).toBe("summit");
    expect(resolveSeedTenant("heritage.localhost:3000")?.id).toBe("heritage");
    expect(resolveSeedTenant("unknown.localhost")).toBeNull();
    expect(normalizeHostname("www.summitpainting.com:443")).toBe("summitpainting.com");
  });

  it("contains the complete and separate Phase One inventory", () => {
    for (const tenant of TENANTS) {
      expect(tenant.pages).toHaveLength(6);
      expect(tenant.services).toHaveLength(11);
      expect(tenant.locations).toHaveLength(20);
      expect(tenant.projects).toHaveLength(6);
      expect(tenant.testimonials).toHaveLength(5);
      expect(tenant.posts).toHaveLength(3);
      expect(allTenantPages(tenant).every((page) => page.tenantId === tenant.id)).toBe(true);
    }
  });

  it("does not reuse tenant page introductions", () => {
    const summit = new Set(allTenantPages(TENANTS[0]!).map((page) => page.intro.toLowerCase()));
    const heritage = allTenantPages(TENANTS[1]!).map((page) => page.intro.toLowerCase());
    expect(heritage.some((intro) => summit.has(intro))).toBe(false);
  });
});
