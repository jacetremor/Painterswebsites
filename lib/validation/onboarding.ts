import { z } from "zod";

export const saveOnboardingSectionSchema = z.object({
  sectionKey: z.string().trim().regex(/^[a-z_]+$/),
  answerData: z.record(z.string(), z.unknown()),
  requireComplete: z.boolean().optional().default(false),
});

export const submitOnboardingSchema = z.object({
  confirmationName: z.string().trim().min(2).max(120),
});

export const createInvitationSchema = z.object({
  clientName: z.string().trim().min(2).max(120),
  companyName: z.string().trim().min(2).max(180),
  clientEmail: z.string().trim().email().max(254),
  proposedPreviewSlug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(63),
  notes: z.string().trim().max(5000).optional().default(""),
  expiresAt: z.string().datetime(),
});

export const prepareUploadSchema = z.object({
  sectionKey: z.string().trim().regex(/^[a-z_]+$/),
  fieldKey: z.string().trim().regex(/^[a-zA-Z0-9_.-]+$/),
  filename: z.string().trim().min(1).max(240),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"]),
  byteSize: z.number().int().positive().max(20 * 1024 * 1024),
});

export const completeUploadSchema = prepareUploadSchema.extend({
  storagePath: z.string().trim().min(10).max(500),
});
