import { describe, expect, it } from "vitest";
import { TENANTS } from "@/lib/content/seeds";
import { mergePublishedProjectMedia } from "@/lib/media/public-project-media";
import {
  completeOwnerMediaUploadSchema,
  OWNER_MEDIA_MAX_BYTES,
  prepareOwnerMediaUploadSchema,
  safeOwnerMediaFilename,
  updateOwnerMediaSchema,
} from "@/lib/validation/owner-media";

describe("owner media validation", () => {
  it("accepts supported image uploads and rejects unsafe payloads", () => {
    expect(prepareOwnerMediaUploadSchema.safeParse({
      filename: "Kitchen Finish.JPG",
      mimeType: "image/jpeg",
      byteSize: 2_400_000,
    }).success).toBe(true);
    expect(prepareOwnerMediaUploadSchema.safeParse({
      filename: "scope.pdf",
      mimeType: "application/pdf",
      byteSize: 50_000,
    }).success).toBe(false);
    expect(prepareOwnerMediaUploadSchema.safeParse({
      filename: "large.jpg",
      mimeType: "image/jpeg",
      byteSize: OWNER_MEDIA_MAX_BYTES + 1,
    }).success).toBe(false);
  });

  it("requires project ownership metadata and useful alt text", () => {
    const valid = {
      projectId: "8fc6de4a-3f57-493d-985f-48cbecd27f56",
      storagePath: "tenants/summit/owner-uploads/photo.jpg",
      filename: "photo.jpg",
      mimeType: "image/jpeg",
      byteSize: 1000,
      stage: "after",
      altText: "Freshly painted white kitchen cabinets",
      caption: "Finished cabinet project",
    };
    expect(completeOwnerMediaUploadSchema.safeParse(valid).success).toBe(true);
    expect(updateOwnerMediaSchema.safeParse({
      projectId: valid.projectId,
      stage: "after",
      altText: "short",
      caption: "",
      isPublished: true,
    }).success).toBe(false);
    expect(safeOwnerMediaFilename(" My Client's Kitchen (Final).JPG ")).toBe("my-client-s-kitchen-final.jpg");
  });
});

describe("published owner media", () => {
  it("replaces seeded project photos only for matching published project rows", () => {
    const tenant = TENANTS[0]!;
    const target = tenant.projects.find((project) => project.featured)!;
    const merged = mergePublishedProjectMedia(tenant, [
      {
        id: "owner-after",
        projectSlug: target.slug,
        altText: "Finished owner-uploaded painting project",
        caption: "Uploaded by the business owner",
        width: 1800,
        height: 1200,
        stage: "after",
        sortOrder: 1,
      },
      {
        id: "owner-before",
        projectSlug: target.slug,
        altText: "Project surface before preparation and painting",
        caption: "Before work began",
        width: 1800,
        height: 1200,
        stage: "before",
        sortOrder: 0,
      },
    ]);

    const updated = merged.projects.find((project) => project.slug === target.slug)!;
    expect(updated.images.map((image) => image.id)).toEqual(["owner-before", "owner-after"]);
    expect(updated.images.every((image) => image.src.startsWith("/api/public/media/"))).toBe(true);
    expect(merged.heroImage.id).toBe("owner-after");
    expect(tenant.projects.find((project) => project.slug === target.slug)?.images[0]?.id).not.toBe("owner-before");
  });
});
