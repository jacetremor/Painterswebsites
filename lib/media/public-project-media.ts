import type { ProjectImage, Tenant } from "@/lib/types";

export type PublishedProjectMediaRow = {
  id: string;
  projectSlug: string;
  altText: string;
  caption: string;
  width: number;
  height: number;
  stage: ProjectImage["stage"];
  sortOrder: number;
};

export function mergePublishedProjectMedia(tenant: Tenant, rows: PublishedProjectMediaRow[]): Tenant {
  if (!rows.length) return tenant;
  const mediaByProject = new Map<string, ProjectImage[]>();

  for (const row of [...rows].sort((left, right) => left.sortOrder - right.sortOrder)) {
    const images = mediaByProject.get(row.projectSlug) ?? [];
    images.push({
      id: row.id,
      src: `/api/public/media/${row.id}`,
      alt: row.altText,
      caption: row.caption,
      width: row.width,
      height: row.height,
      stage: row.stage,
    });
    mediaByProject.set(row.projectSlug, images);
  }

  const projects = tenant.projects.map((project) => {
    const ownerImages = mediaByProject.get(project.slug);
    return ownerImages?.length ? { ...project, images: ownerImages, heroImage: ownerImages.find((image) => image.stage === "after") ?? ownerImages[0] } : project;
  });

  const featuredProject = projects.find((project) => project.featured && mediaByProject.has(project.slug));
  return {
    ...tenant,
    projects,
    heroImage: featuredProject?.images.find((image) => image.stage === "after") ?? tenant.heroImage,
  };
}
