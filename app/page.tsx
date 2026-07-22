import type { Metadata } from "next";
import { headers } from "next/headers";
import { HomePage } from "@/components/home-page";
import { getCurrentTenant } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo/metadata";
import { hostnameFromHeaders } from "@/lib/tenant/host";

export async function generateMetadata(): Promise<Metadata> {
  const [tenant, requestHeaders] = await Promise.all([getCurrentTenant(), headers()]);
  const page = tenant.pages.find((item) => item.slug === "")!;
  return buildMetadata({ host: hostnameFromHeaders(requestHeaders), tenant, page });
}

export default async function Page() {
  const tenant = await getCurrentTenant();
  const page = tenant.pages.find((item) => item.slug === "")!;
  return <HomePage tenant={tenant} page={page} />;
}
