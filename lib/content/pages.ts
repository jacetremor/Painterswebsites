import type { BlogPost, ContentPage, Location, Project, Service, Tenant } from "@/lib/types";

export function allTenantPages(tenant: Tenant): Array<ContentPage | Service | Location | Project | BlogPost> {
  return [...tenant.pages, ...tenant.services, ...tenant.locations, ...tenant.projects, ...tenant.posts];
}
