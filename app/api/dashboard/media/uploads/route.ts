import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getCurrentTenant } from "@/lib/content/repository";
import { onboardingWriteRequestIsAllowed } from "@/lib/onboarding/request-security";
import { requireDashboardAccess } from "@/lib/security/dashboard-auth";
import { takeRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  completeOwnerMediaUploadSchema,
  OWNER_MEDIA_BUCKET,
  prepareOwnerMediaUploadSchema,
  safeOwnerMediaFilename,
} from "@/lib/validation/owner-media";

export const runtime = "nodejs";

function unavailable() {
  return NextResponse.json({ message: "Connect Supabase before uploading project photos." }, { status: 503 });
}

export async function POST(request: NextRequest) {
  const security = onboardingWriteRequestIsAllowed(request, 32_000);
  if (!security.allowed) return NextResponse.json({ message: security.message }, { status: security.status });
  const tenant = await getCurrentTenant();
  const access = await requireDashboardAccess(tenant);
  if (access.readOnly) return unavailable();
  if (!takeRateLimit(`owner-media:${tenant.id}:${access.userId}`, 40, 15 * 60 * 1000)) {
    return NextResponse.json({ message: "Upload limit reached. Wait a few minutes and try again." }, { status: 429 });
  }
  const parsed = prepareOwnerMediaUploadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Choose a JPG, PNG, WebP, or AVIF image under 10 MB." }, { status: 422 });
  }

  const path = `tenants/${tenant.id}/owner-uploads/${randomUUID()}-${safeOwnerMediaFilename(parsed.data.filename)}`;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return unavailable();
  const { data, error } = await supabase.storage.from(OWNER_MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    return NextResponse.json({ message: error?.message ?? "A secure upload URL could not be created." }, { status: 503 });
  }
  return NextResponse.json({ storagePath: path, signedUrl: data.signedUrl }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  const security = onboardingWriteRequestIsAllowed(request, 64_000);
  if (!security.allowed) return NextResponse.json({ message: security.message }, { status: security.status });
  const tenant = await getCurrentTenant();
  const access = await requireDashboardAccess(tenant);
  if (access.readOnly) return unavailable();
  const parsed = completeOwnerMediaUploadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Complete the project, image type, caption, and descriptive alt text." }, { status: 422 });
  }
  const expectedPrefix = `tenants/${tenant.id}/owner-uploads/`;
  if (!parsed.data.storagePath.startsWith(expectedPrefix)) {
    return NextResponse.json({ message: "The uploaded file does not belong to this tenant." }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return unavailable();
  const { data: project } = await supabase
    .from("projects")
    .select("id,title,slug")
    .eq("tenant_id", tenant.id)
    .eq("id", parsed.data.projectId)
    .maybeSingle();
  if (!project) return NextResponse.json({ message: "Choose a valid project for this website." }, { status: 404 });

  const { data: original, error: downloadError } = await supabase.storage.from(OWNER_MEDIA_BUCKET).download(parsed.data.storagePath);
  if (downloadError || !original) {
    return NextResponse.json({ message: "The uploaded photo could not be opened for processing." }, { status: 422 });
  }
  let processed: Buffer;
  let width: number;
  let height: number;
  try {
    const result = await sharp(Buffer.from(await original.arrayBuffer()))
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .avif({ quality: 82, effort: 5 })
      .toBuffer({ resolveWithObject: true });
    processed = result.data;
    width = result.info.width;
    height = result.info.height;
  } catch {
    await supabase.storage.from(OWNER_MEDIA_BUCKET).remove([parsed.data.storagePath]);
    return NextResponse.json({ message: "The file contents are not a readable supported image." }, { status: 422 });
  }
  const finalPath = `tenants/${tenant.id}/projects/${project.slug}/${randomUUID()}-${parsed.data.stage}.avif`;
  const { error: processedUploadError } = await supabase.storage.from(OWNER_MEDIA_BUCKET).upload(finalPath, processed, {
    contentType: "image/avif",
    cacheControl: "31536000",
    upsert: false,
  });
  if (processedUploadError) {
    await supabase.storage.from(OWNER_MEDIA_BUCKET).remove([parsed.data.storagePath]);
    return NextResponse.json({ message: `The optimized photo could not be stored: ${processedUploadError.message}` }, { status: 503 });
  }
  await supabase.storage.from(OWNER_MEDIA_BUCKET).remove([parsed.data.storagePath]);

  const { data: lastImage } = await supabase
    .from("project_images")
    .select("sort_order")
    .eq("tenant_id", tenant.id)
    .eq("project_id", project.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: image, error } = await supabase
    .from("project_images")
    .insert({
      tenant_id: tenant.id,
      project_id: project.id,
      storage_path: finalPath,
      storage_bucket: OWNER_MEDIA_BUCKET,
      descriptive_filename: `${safeOwnerMediaFilename(parsed.data.filename).replace(/\.[^.]+$/, "")}.avif`,
      alt_text: parsed.data.altText,
      alt_decision: "descriptive",
      caption: parsed.data.caption || null,
      width,
      height,
      stage: parsed.data.stage,
      sort_order: (lastImage?.sort_order ?? -1) + 1,
      is_published: false,
      created_by: access.userId,
      updated_by: access.userId,
    })
    .select("id,project_id,storage_path,storage_bucket,alt_text,caption,width,height,stage,sort_order,is_published,created_at")
    .single();
  if (error || !image) {
    await supabase.storage.from(OWNER_MEDIA_BUCKET).remove([finalPath]);
    return NextResponse.json({ message: error?.message ?? "The uploaded photo could not be registered." }, { status: 503 });
  }

  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath(`/projects/${project.slug}`);
  return NextResponse.json({
    id: image.id,
    projectId: image.project_id,
    projectTitle: project.title,
    projectSlug: project.slug,
    src: `/api/dashboard/media/${image.id}/asset`,
    storagePath: image.storage_path,
    storageBucket: image.storage_bucket,
    altText: image.alt_text,
    caption: image.caption ?? "",
    width: image.width,
    height: image.height,
    stage: image.stage,
    sortOrder: image.sort_order,
    isPublished: image.is_published,
    createdAt: image.created_at,
  }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
