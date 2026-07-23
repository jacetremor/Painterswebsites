export type OwnerMediaProject = {
  id: string;
  title: string;
  slug: string;
  category: "interior" | "exterior";
  status: "draft" | "review" | "scheduled" | "published" | "archived";
};

export type OwnerMediaItem = {
  id: string;
  projectId: string;
  projectTitle: string;
  projectSlug: string;
  src: string;
  storagePath: string;
  storageBucket: string;
  altText: string;
  caption: string;
  width: number;
  height: number;
  stage: "before" | "after" | "standalone";
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
};

export type OwnerMediaState = {
  configured: boolean;
  projects: OwnerMediaProject[];
  items: OwnerMediaItem[];
};
