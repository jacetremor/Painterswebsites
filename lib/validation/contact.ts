import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  phone: z.string().trim().max(40).optional().default(""),
  postalCode: z.string().trim().max(12).optional().default(""),
  projectType: z.string().trim().max(80).optional().default(""),
  message: z.string().trim().min(20).max(4000),
  website: z.string().max(0).optional().default(""),
});

export type ContactInput = z.infer<typeof contactSchema>;
