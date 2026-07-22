import { describe, expect, it } from "vitest";
import { TENANTS } from "@/lib/content/seeds";
import { pageSchema } from "@/lib/seo/structured-data";

describe("page structured data", () => {
  it("describes service pages and their visible FAQs", () => {
    const tenant = TENANTS[0]!;
    const service = tenant.services[0]!;
    const schema = pageSchema(tenant, service);

    expect(schema.filter((node) => node["@type"] === "Service")).toHaveLength(1);
    expect(schema.find((node) => node["@type"] === "FAQPage")).toMatchObject({
      mainEntity: expect.arrayContaining([
        expect.objectContaining({ name: service.faq[0]!.question }),
      ]),
    });
  });

  it("emits one local breadcrumb trail and a city service area", () => {
    const tenant = TENANTS[1]!;
    const location = tenant.locations[0]!;
    const schema = pageSchema(tenant, location);
    const service = schema.find((node) => node["@type"] === "Service");

    expect(schema.filter((node) => node["@type"] === "BreadcrumbList")).toHaveLength(1);
    expect(service).toMatchObject({
      areaServed: { "@type": "City", name: "Denver, Colorado" },
    });
  });
});
