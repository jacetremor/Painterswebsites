import "server-only";

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TENANTS } from "@/lib/content/seeds";
import { mergePublishedProjectMedia, type PublishedProjectMediaRow } from "@/lib/media/public-project-media";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { hostnameFromHeaders, resolveSeedTenant } from "@/lib/tenant/host";
import type { BlogPost, ContentPage, Location, Project, Service, Tenant } from "@/lib/types";

async function addPublishedOwnerMedia(tenant: Tenant): Promise<Tenant> {
  if (!hasSupabaseConfig()) return tenant;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return tenant;

  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("id,slug")
    .eq("tenant_id", tenant.id)
    .eq("status", "published");
  if (projectError || !projects?.length) return tenant;

  const projectById = new Map(projects.map((project) => [project.id, project.slug]));
  const { data: images, error: imageError } = await supabase
    .from("project_images")
    .select("id,project_id,alt_text,caption,width,height,stage,sort_order")
    .eq("tenant_id", tenant.id)
    .eq("is_published", true)
    .eq("alt_decision", "descriptive")
    .in("project_id", projects.map((project) => project.id))
    .order("sort_order");
  if (imageError || !images?.length) return tenant;

  const rows: PublishedProjectMediaRow[] = images.flatMap((image) => {
    const projectSlug = projectById.get(image.project_id);
    if (!projectSlug || !image.alt_text) return [];
    return [{
      id: image.id,
      projectSlug,
      altText: image.alt_text,
      caption: image.caption ?? "",
      width: image.width,
      height: image.height,
      stage: image.stage,
      sortOrder: image.sort_order,
    }];
  });
  return mergePublishedProjectMedia(tenant, rows);
}

export async function getCurrentTenant(): Promise<Tenant> {
  const requestHeaders = await headers();
  const tenant = resolveSeedTenant(hostnameFromHeaders(requestHeaders));
  if (!tenant) notFound();
  return addPublishedOwnerMedia(tenant);
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
