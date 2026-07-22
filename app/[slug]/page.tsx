import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ContentPageView } from "@/components/content-page";
import { findRootPage, getCurrentTenant } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo/metadata";
import { hostnameFromHeaders } from "@/lib/tenant/host";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, query, tenant, requestHeaders] = await Promise.all([params, searchParams, getCurrentTenant(), headers()]);
  const page = findRootPage(tenant, slug);
  if (!page || page.status !== "published") return {};
  const hasFilter = Object.keys(query).length > 0;
  const metadataPage = hasFilter ? { ...page, seo: { ...page.seo, index: false } } : page;
  return buildMetadata({ host: hostnameFromHeaders(requestHeaders), tenant, page: metadataPage });
}

export default async function DynamicRootPage({ params, searchParams }: Props) {
  const [{ slug }, query, tenant] = await Promise.all([params, searchParams, getCurrentTenant()]);
  const page = findRootPage(tenant, slug);
  if (!page || page.status !== "published") notFound();
  const rawFilter = query.filter;
  const filter = Array.isArray(rawFilter) ? rawFilter[0] : rawFilter;
  return <ContentPageView tenant={tenant} page={page} galleryFilter={filter} />;
}
