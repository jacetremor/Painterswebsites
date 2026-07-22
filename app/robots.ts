import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getCurrentTenant } from "@/lib/content/repository";
import { canonicalUrl, hostnameFromHeaders, shouldNoIndexHostname } from "@/lib/tenant/host";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const [tenant, requestHeaders] = await Promise.all([getCurrentTenant(), headers()]);
  const preview = shouldNoIndexHostname(hostnameFromHeaders(requestHeaders));
  return {
    rules: preview
      ? [{ userAgent: "*", disallow: "/" }]
      : [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/login", "/api", "/preview"] }],
    sitemap: canonicalUrl(tenant, "/sitemap.xml"),
    host: `https://${tenant.primaryDomain}`,
  };
}
