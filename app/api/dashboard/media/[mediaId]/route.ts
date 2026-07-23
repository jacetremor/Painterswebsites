import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/content/repository";
import { onboardingWriteRequestIsAllowed } from "@/lib/onboarding/request-security";
import { requireDashboardAccess } from "@/lib/security/dashboard-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateOwnerMediaSchema } from "@/lib/validation/owner-media";

type RouteContext = { params: Promise<{ mediaId: string }> };

function unavailable() {
  return NextResponse.json({ message: "Connect Supabase before changing project photos." }, { status: 503 });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const security = onboardingWriteRequestIsAllowed(request, 32_000);
  if (!security.allowed) return NextResponse.json({ message: security.message }, { status: security.status });
  const tenant = await getCurrentTenant();
  const access = await requireDashboardAccess(tenant);
  if (access.readOnly) return unavailable();
  const parsed = updateOwnerMediaSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Add useful alt text and complete every photo field before saving." }, { status: 422 });
  }
  const { mediaId } = await context.params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return unavailable();

  const [{ data: current }, { data: project }] = await Promise.all([
    supabase.from("project_images").select("id,storage_path,storage_bucket,project_id,is_published").eq("tenant_id", tenant.id).eq("id", mediaId).maybeSingle(),
    supabase.from("projects").select("id,title,slug,status").eq("tenant_id", tenant.id).eq("id", parsed.data.projectId).maybeSingle(),
  ]);
  if (!current) return NextResponse.json({ message: "Photo not found." }, { status: 404 });
  if (!project) return NextResponse.json({ message: "Choose a valid project." }, { status: 404 });

  const publishedAt = parsed.data.isPublished ? new Date().toISOString() : null;
  const { data: image, error } = await supabase
    .from("project_images")
    .update({
      project_id: project.id,
      stage: parsed.data.stage,
      alt_text: parsed.data.altText,
      alt_decision: "descriptive",
      caption: parsed.data.caption || null,
      is_published: parsed.data.isPublished,
      published_at: publishedAt,
      updated_by: access.userId,
    })
    .eq("tenant_id", tenant.id)
    .eq("id", mediaId)
    .select("id,project_id,storage_path,storage_bucket,alt_text,caption,width,height,stage,sort_order,is_published,created_at")
    .single();
  if (error || !image) {
    return NextResponse.json({ message: error?.message ?? "The photo could not be saved." }, { status: 503 });
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
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const security = onboardingWriteRequestIsAllowed(request, 8_000);
  if (!security.allowed) return NextResponse.json({ message: security.message }, { status: security.status });
  const tenant = await getCurrentTenant();
  const access = await requireDashboardAccess(tenant);
  if (access.readOnly) return unavailable();
  const { mediaId } = await context.params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return unavailable();

  const { data: current } = await supabase
    .from("project_images")
    .select("id,storage_path,storage_bucket,project_id")
    .eq("tenant_id", tenant.id)
    .eq("id", mediaId)
    .maybeSingle();
  if (!current) return NextResponse.json({ message: "Photo not found." }, { status: 404 });
  const { error } = await supabase.from("project_images").delete().eq("tenant_id", tenant.id).eq("id", mediaId);
  if (error) return NextResponse.json({ message: error.message }, { status: 503 });
  await supabase.storage.from(current.storage_bucket).remove([current.storage_path]);

  revalidatePath("/");
  revalidatePath("/gallery");
  return NextResponse.json({ message: "Photo removed." }, { headers: { "Cache-Control": "no-store" } });
}
