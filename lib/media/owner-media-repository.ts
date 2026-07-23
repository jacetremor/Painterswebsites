import "server-only";

import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";
import type { Tenant } from "@/lib/types";
import type { OwnerMediaItem, OwnerMediaProject, OwnerMediaState } from "@/lib/media/owner-media-types";

function demoState(tenant: Tenant): OwnerMediaState {
  const projects: OwnerMediaProject[] = tenant.projects.map((project) => ({
    id: project.id,
    title: project.name,
    slug: project.slug,
    category: project.category,
    status: project.status,
  }));
  const items: OwnerMediaItem[] = tenant.projects.flatMap((project) => project.images.map((image, index) => ({
    id: image.id,
    projectId: project.id,
    projectTitle: project.name,
    projectSlug: project.slug,
    src: image.src,
    storagePath: image.src,
    storageBucket: "demo",
    altText: image.alt,
    caption: image.caption,
    width: image.width,
    height: image.height,
    stage: image.stage,
    sortOrder: index,
    isPublished: true,
    createdAt: project.updatedAt,
  })));
  return { configured: false, projects, items };
}

export async function getOwnerMediaState(tenant: Tenant): Promise<OwnerMediaState> {
  if (!hasSupabaseConfig()) return demoState(tenant);
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoState(tenant);

  const { data: projectRows, error: projectError } = await supabase
    .from("projects")
    .select("id,title,slug,category,status")
    .eq("tenant_id", tenant.id)
    .order("updated_at", { ascending: false });
  if (projectError) throw new Error(`Projects could not be loaded: ${projectError.message}`);

  const projects: OwnerMediaProject[] = (projectRows ?? []).map((project) => ({
    id: project.id,
    title: project.title,
    slug: project.slug,
    category: project.category,
    status: project.status,
  }));
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const { data: mediaRows, error: mediaError } = await supabase
    .from("project_images")
    .select("id,project_id,storage_path,storage_bucket,alt_text,caption,width,height,stage,sort_order,is_published,created_at")
    .eq("tenant_id", tenant.id)
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (mediaError) throw new Error(`Project media could not be loaded: ${mediaError.message}`);

  const items: OwnerMediaItem[] = (mediaRows ?? []).flatMap((media) => {
    const project = projectById.get(media.project_id);
    if (!project) return [];
    return [{
      id: media.id,
      projectId: media.project_id,
      projectTitle: project.title,
      projectSlug: project.slug,
      src: `/api/dashboard/media/${media.id}/asset`,
      storagePath: media.storage_path,
      storageBucket: media.storage_bucket,
      altText: media.alt_text ?? "",
      caption: media.caption ?? "",
      width: media.width,
      height: media.height,
      stage: media.stage,
      sortOrder: media.sort_order,
      isPublished: media.is_published,
      createdAt: media.created_at,
    }];
  });
  return { configured: true, projects, items };
}
