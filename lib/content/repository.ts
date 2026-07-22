import "server-only";

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TENANTS } from "@/lib/content/seeds";
import { hostnameFromHeaders, resolveSeedTenant } from "@/lib/tenant/host";
import type { BlogPost, ContentPage, Location, Project, Service, Tenant } from "@/lib/types";

export async function getCurrentTenant(): Promise<Tenant> {
  const requestHeaders = await headers();
  const tenant = resolveSeedTenant(hostnameFromHeaders(requestHeaders));
  if (!tenant) notFound();
  return tenant;
}

export function getTenantBySlug(slug: string): Tenant | undefined {
  return TENANTS.find((tenant) => tenant.slug === slug);
}

export function findRootPage(tenant: Tenant, slug: string): ContentPage | Service | Location | null {
  return (
    tenant.pages.find((item) => item.slug === slug) ??
    tenant.services.find((item) => item.slug === slug) ??
    tenant.locations.find((item) => item.slug === slug) ??
    null
  );
}

export function findProject(tenant: Tenant, slug: string): Project | null {
  return tenant.projects.find((item) => item.slug === slug) ?? null;
}

export function findPost(tenant: Tenant, slug: string): BlogPost | null {
  return tenant.posts.find((item) => item.slug === slug) ?? null;
}
