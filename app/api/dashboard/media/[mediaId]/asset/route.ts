import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/content/repository";
import { requireDashboardAccess } from "@/lib/security/dashboard-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ mediaId: string }> }) {
  const tenant = await getCurrentTenant();
  const access = await requireDashboardAccess(tenant);
  if (access.readOnly) return new NextResponse(null, { status: 404 });
  const { mediaId } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return new NextResponse(null, { status: 404 });

  const { data: image } = await supabase
    .from("project_images")
    .select("storage_path,storage_bucket")
    .eq("tenant_id", tenant.id)
    .eq("id", mediaId)
    .maybeSingle();
  if (!image) return new NextResponse(null, { status: 404 });
  const { data: signed } = await supabase.storage.from(image.storage_bucket).createSignedUrl(image.storage_path, 300);
  if (!signed?.signedUrl) return new NextResponse(null, { status: 404 });
  const response = NextResponse.redirect(signed.signedUrl, 307);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
