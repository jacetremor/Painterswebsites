import { z } from "zod";

export const blogGenerationSchema = z.object({
  topic: z.string().trim().min(8).max(180),
  targetService: z.string().trim().max(120).optional().default(""),
  targetCity: z.string().trim().max(100).optional().default(""),
  relatedProject: z.string().trim().max(160).optional().default(""),
  customerQuestions: z.string().trim().min(10).max(2000),
  painterAdvice: z.string().trim().min(20).max(3000),
  productsUsed: z.string().trim().max(1200).optional().default(""),
  techniquesUsed: z.string().trim().max(1200).optional().default(""),
  desiredCta: z.string().trim().min(5).max(180),
  firstHandObservations: z.string().trim().min(20).max(3000),
});

export type BlogGenerationInput = z.infer<typeof blogGenerationSchema>;
