import { z } from "zod";

export const OWNER_MEDIA_BUCKET = "owner-media";
export const OWNER_MEDIA_MAX_BYTES = 10 * 1024 * 1024;
export const OWNER_MEDIA_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

export const prepareOwnerMediaUploadSchema = z.object({
  filename: z.string().trim().min(1).max(180),
  mimeType: z.enum(OWNER_MEDIA_MIME_TYPES),
  byteSize: z.number().int().positive().max(OWNER_MEDIA_MAX_BYTES),
});

export const completeOwnerMediaUploadSchema = z.object({
  projectId: z.string().uuid(),
  storagePath: z.string().trim().min(1).max(500),
  filename: z.string().trim().min(1).max(180),
  mimeType: z.enum(OWNER_MEDIA_MIME_TYPES),
  byteSize: z.number().int().positive().max(OWNER_MEDIA_MAX_BYTES),
  stage: z.enum(["before", "after", "standalone"]),
  altText: z.string().trim().min(8).max(180),
  caption: z.string().trim().max(240).default(""),
});

export const updateOwnerMediaSchema = z.object({
  projectId: z.string().uuid(),
  stage: z.enum(["before", "after", "standalone"]),
  altText: z.string().trim().min(8).max(180),
  caption: z.string().trim().max(240),
  isPublished: z.boolean(),
});

export function safeOwnerMediaFilename(filename: string): string {
  const extension = filename.includes(".")
    ? `.${filename.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")}`
    : "";
  const stem = filename
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "project-photo";
  return `${stem}${extension}`;
}
