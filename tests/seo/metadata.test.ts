import { describe, expect, it } from "vitest";
import { TENANTS } from "@/lib/content/seeds";
import { buildMetadata } from "@/lib/seo/metadata";

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
});
