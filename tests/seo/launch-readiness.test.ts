import { describe, expect, it } from "vitest";
import { TENANTS } from "@/lib/content/seeds";
import { auditTenantLaunchReadiness } from "@/lib/seo/audit";

describe("tenant launch readiness", () => {
  it("keeps demonstration tenants behind explicit launch blockers", () => {
    for (const tenant of TENANTS) {
      const codes = auditTenantLaunchReadiness(tenant).map((issue) => issue.code);
      expect(codes).toEqual(expect.arrayContaining([
        "launch-gate-closed",
        "placeholder-business-data",
        "primary-domain-unverified",
        "project-evidence-unverified",
        "first-party-images-required",
      ]));
    }
  });
});
