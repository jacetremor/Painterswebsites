import { canonicalUrl } from "@/lib/tenant/host";
import type { ContentPage, Tenant } from "@/lib/types";

export type SitemapEntry = { url: string; lastModified: Date; changeFrequency: "monthly" | "yearly"; priority: number };

export function buildSitemapEntries(tenant: Tenant, pages: ContentPage[]): SitemapEntry[] {
  if (!tenant.productionReady && process.env.LHCI_ALLOW_INDEXING !== "true") return [];
  return pages
    .filter((page) => page.tenantId === tenant.id && page.status === "published" && page.seo.index)
    .map((page) => ({
      url: canonicalUrl(tenant, page.seo.canonicalPath),
      lastModified: new Date(page.updatedAt),
      changeFrequency: page.kind === "core" ? "monthly" : "yearly",
      priority: page.slug === "" ? 1 : page.kind === "service" || page.kind === "location" ? 0.8 : 0.6,
    }));
}
