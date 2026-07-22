import { describe, expect, it } from "vitest";
import { TENANTS } from "@/lib/content/seeds";

describe("contextual public imagery", () => {
  it("gives every public page a subject-matched hero image", () => {
    for (const tenant of TENANTS) {
      const pages = [...tenant.pages, ...tenant.services, ...tenant.locations, ...tenant.projects, ...tenant.posts];
      for (const page of pages) {
        expect(page.heroImage?.src).toMatch(/^https:\/\//);
        expect(page.heroImage?.alt.length).toBeGreaterThan(24);
        expect(page.heroImage?.alt.toLowerCase()).not.toContain("placeholder");
      }
    }
  });

  it("keeps project and article images descriptive and loadable", () => {
    for (const tenant of TENANTS) {
      for (const project of tenant.projects) {
        expect(project.images).toHaveLength(2);
        expect(new Set(project.images.map((image) => image.src)).size).toBe(2);
        expect(project.images.every((image) => image.alt.length > 24 && !image.alt.toLowerCase().includes("placeholder"))).toBe(true);
      }

      for (const post of tenant.posts) {
        expect(post.featuredImage.src).toMatch(/^https:\/\//);
        expect(post.featuredImage.alt.toLowerCase()).not.toContain("placeholder");
      }
    }
  });

  it("does not reuse the tenant home hero for service pages", () => {
    for (const tenant of TENANTS) {
      expect(tenant.services.every((service) => service.heroImage?.src !== tenant.heroImage.src)).toBe(true);
      expect(new Set(tenant.services.map((service) => service.heroImage?.src)).size).toBeGreaterThan(8);
    }
  });
});
