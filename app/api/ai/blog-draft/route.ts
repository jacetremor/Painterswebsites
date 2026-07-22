import { NextRequest, NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai/provider";
import { resolveSeedTenant, normalizeHostname } from "@/lib/tenant/host";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { blogGenerationSchema } from "@/lib/validation/blog-generation";

export async function POST(request: NextRequest) {
  const tenant = resolveSeedTenant(normalizeHostname(request.headers.get("x-forwarded-host") ?? request.headers.get("host")));
  if (!tenant) return NextResponse.json({ message: "Unknown tenant." }, { status: 404 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ message: "Connect Supabase before generating saved drafts." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in first." }, { status: 401 });
  const { data: membership } = await supabase.from("tenant_users").select("role").eq("tenant_id", tenant.id).eq("user_id", user.id).maybeSingle();
  if (!membership && user.app_metadata?.role !== "platform_admin") return NextResponse.json({ message: "Your account cannot access this tenant." }, { status: 403 });
  const input = blogGenerationSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ message: "Add enough first-hand information to ground the draft." }, { status: 422 });
  const provider = getAiProvider();
  if (!provider) return NextResponse.json({ message: "Configure an AI provider endpoint, key, and model." }, { status: 503 });

  const requestRow = {
    tenant_id: tenant.id,
    prompt_version: "phase-one-grounded-v1",
    input_facts: input.data,
    generation_status: "running",
    approval_status: "pending",
    created_by: user.id,
    updated_by: user.id,
  };
  const { data: generation, error: insertError } = await supabase.from("blog_generation_requests").insert(requestRow).select("id").single();
  if (insertError) return NextResponse.json({ message: "Could not create the generation record." }, { status: 500 });
  try {
    const result = await provider.generateBlogDraft(input.data, { companyName: tenant.name, serviceArea: tenant.serviceArea });
    await supabase.from("blog_generation_requests").update({ generation_status: "complete", provider: result.provider, model_metadata: { model: result.model, ...result.metadata }, generated_draft: { markdown: result.text } }).eq("id", generation.id);
    return NextResponse.json({ message: "Draft created for review. It has not been published.", draft: result.text });
  } catch (error) {
    await supabase.from("blog_generation_requests").update({ generation_status: "failed", error_details: error instanceof Error ? error.message : "Unknown provider error" }).eq("id", generation.id);
    return NextResponse.json({ message: "Draft generation failed and the error was recorded." }, { status: 502 });
  }
}
