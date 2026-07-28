import type { Metadata } from "next";
import { canonicalUrl, shouldNoIndexHostname } from "@/lib/tenant/host";
import type { ContentPage, Tenant } from "@/lib/types";

type MetadataOptions = {
  host: string;
  tenant: Tenant;
  page: ContentPage;
};

export function buildMetadata({ host, tenant, page }: MetadataOptions): Metadata {
  const canonical = canonicalUrl(tenant, page.seo.canonicalPath);
  const launchApproved = tenant.productionReady || process.env.LHCI_ALLOW_INDEXING === "true";
  const noindex = !launchApproved || shouldNoIndexHostname(host) || !page.seo.index || page.status !== "published";
  const image = page.seo.ogImage ?? page.heroImage?.src ?? tenant.heroImage.src;

  return {
    metadataBase: new URL(`https://${tenant.primaryDomain}`),
    title: page.seo.title,
    description: page.seo.description,
    alternates: { canonical },
    robots: {
      index: !noindex,
      follow: !noindex && page.seo.follow,
      googleBot: { index: !noindex, follow: !noindex && page.seo.follow },
    },
    icons: { icon: "/api/favicon" },
    openGraph: {
      type: page.kind === "blog" ? "article" : "website",
      siteName: tenant.name,
      title: page.seo.ogTitle,
      description: page.seo.ogDescription,
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: page.heroImage?.alt ?? `${tenant.name} painting services` }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.seo.ogTitle,
      description: page.seo.ogDescription,
      images: [image],
    },
  };
}
