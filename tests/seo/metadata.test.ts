import { describe, expect, it } from "vitest";
import { TENANTS } from "@/lib/content/seeds";
import { buildMetadata } from "@/lib/seo/metadata";

const weakH1Phrases = /planned for the surface|painting services planned|helpful painting plan/i;

describe("tenant metadata", () => {
  it("never emits the other tenant's metadata or canonical host", () => {
    const summit = TENANTS[0]!;
    const heritage = TENANTS[1]!;
    const summitMetadata = buildMetadata({ host: summit.primaryDomain, tenant: summit, page: summit.pages[0]! });
    const heritageMetadata = buildMetadata({ host: heritage.primaryDomain, tenant: heritage, page: heritage.pages[0]! });
    expect(JSON.stringify(summitMetadata)).toContain("summitpainting.com");
    expect(JSON.stringify(summitMetadata)).not.toContain("heritagepaint.com");
    expect(JSON.stringify(heritageMetadata)).toContain("heritagepaint.com");
    expect(JSON.stringify(heritageMetadata)).not.toContain("summitpainting.com");
  });

  it("marks previews and localhost as noindex", () => {
    const tenant = TENANTS[0]!;
    const metadata = buildMetadata({ host: "summit.localhost", tenant, page: tenant.pages[0]! });
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("uses service and location search intent in every service H1", () => {
    for (const tenant of TENANTS) {
      const primaryLocation = tenant.theme === "summit" ? "Salt Lake City, UT" : "Denver, CO";
      for (const service of tenant.services) {
        expect(service.seo.h1).toContain(service.name);
        expect(service.seo.h1).toContain(primaryLocation);
        expect(service.seo.h1).not.toMatch(weakH1Phrases);
      }
    }
  });

  it("uses painter, city, and state intent in every location H1", () => {
    for (const tenant of TENANTS) {
      for (const location of tenant.locations) {
        expect(location.seo.h1).toContain("Painters");
        expect(location.seo.h1).toContain(location.city);
        expect(location.seo.h1).toContain(location.stateAbbr);
        expect(location.seo.h1).not.toMatch(weakH1Phrases);
      }
    }
  });
});
