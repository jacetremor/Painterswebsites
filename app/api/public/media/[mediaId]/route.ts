import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(_: Request, { params }: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await params;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return new NextResponse(null, { status: 404 });
  const { data: image } = await supabase
    .from("project_images")
    .select("storage_path,storage_bucket,is_published,alt_decision,projects!inner(status)")
    .eq("id", mediaId)
    .eq("is_published", true)
    .eq("alt_decision", "descriptive")
    .eq("projects.status", "published")
    .maybeSingle();
  if (!image) return new NextResponse(null, { status: 404 });

  const { data: signed } = await supabase.storage.from(image.storage_bucket).createSignedUrl(image.storage_path, 3600);
  if (!signed?.signedUrl) return new NextResponse(null, { status: 404 });
  const response = NextResponse.redirect(signed.signedUrl, 307);
  response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=3600");
  return response;
}
