import "server-only";

import sharp from "sharp";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ProcessedImage = { storagePath: string; width: number; height: number; mimeType: "image/avif" };

function safeStem(value: string): string { return value.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "image"; }

export async function processOnboardingImage(sourcePath: string, tenantId: string, descriptiveName: string): Promise<ProcessedImage[]> {
  const supabase = createSupabaseAdminClient(); if (!supabase) throw new Error("Supabase is not configured.");
  const { data: signed, error: signError } = await supabase.storage.from("onboarding-files").createSignedUrl(sourcePath, 120);
  if (signError || !signed?.signedUrl) throw new Error("Source image could not be opened.");
  const response = await fetch(signed.signedUrl, { cache: "no-store", signal: AbortSignal.timeout(30_000) }); if (!response.ok) throw new Error("Source image download failed.");
  const input = Buffer.from(await response.arrayBuffer()); const metadata = await sharp(input).metadata(); if (!metadata.width || !metadata.height) throw new Error("Image dimensions could not be read.");
  const widths = [...new Set([480, 960, 1600, metadata.width].filter((width) => width <= metadata.width!))].sort((a, b) => a - b); const stem = safeStem(descriptiveName); const outputs: ProcessedImage[] = [];
  for (const width of widths) {
    const result = await sharp(input).rotate().resize({ width, withoutEnlargement: true }).avif({ quality: 72, effort: 5 }).toBuffer({ resolveWithObject: true });
    const path = `tenants/${tenantId}/generated/${stem}-${result.info.width}w.avif`; const { error } = await supabase.storage.from("tenant-media").upload(path, result.data, { contentType: "image/avif", cacheControl: "31536000", upsert: true }); if (error) throw new Error(`Processed image upload failed: ${error.message}`);
    outputs.push({ storagePath: path, width: result.info.width, height: result.info.height, mimeType: "image/avif" });
  }
  return outputs;
}

