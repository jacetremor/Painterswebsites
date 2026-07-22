import type { MetadataRoute } from "next";
import { allTenantPages } from "@/lib/content/pages";
import { getCurrentTenant } from "@/lib/content/repository";
import { buildSitemapEntries } from "@/lib/seo/sitemap";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenant = await getCurrentTenant();
  return buildSitemapEntries(tenant, allTenantPages(tenant));
}
