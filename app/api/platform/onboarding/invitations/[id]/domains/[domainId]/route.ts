import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { onboardingWriteRequestIsAllowed } from "@/lib/onboarding/request-security";
import { requirePlatformAdmin } from "@/lib/security/dashboard-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ isPrimary: z.boolean(), isVerified: z.boolean(), vercelStatus: z.enum(["not_added", "added", "verified"]), sslStatus: z.enum(["pending", "issued", "failed"]), wwwRedirectVerified: z.boolean(), canonicalVerified: z.boolean(), emailRecordsPreserved: z.boolean() }).passthrough();
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; domainId: string }> }) {
  const access = await requirePlatformAdmin(); if (access.readOnly) return NextResponse.json({ message: "Domain tracking is disabled in demo mode." }, { status: 503 }); const security = onboardingWriteRequestIsAllowed(request, 32_000); if (!security.allowed) return NextResponse.json({ message: security.message }, { status: security.status }); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ message: "Domain status is invalid." }, { status: 422 });
  const { id, domainId } = await params; const supabase = createSupabaseAdminClient()!; const { data: job } = await supabase.from("website_generation_jobs").select("tenant_id").eq("invitation_id", id).order("created_at", { ascending: false }).limit(1).single(); if (!job?.tenant_id) return NextResponse.json({ message: "Tenant not found." }, { status: 404 });
  const ready = parsed.data.isVerified && parsed.data.vercelStatus === "verified" && parsed.data.sslStatus === "issued" && parsed.data.wwwRedirectVerified && parsed.data.canonicalVerified && parsed.data.emailRecordsPreserved;
  const { error } = await supabase.from("domains").update({ is_primary: parsed.data.isPrimary, is_verified: parsed.data.isVerified, vercel_status: parsed.data.vercelStatus, ssl_status: parsed.data.sslStatus, www_redirect_verified: parsed.data.wwwRedirectVerified, canonical_verified: parsed.data.canonicalVerified, email_records_preserved: parsed.data.emailRecordsPreserved, launch_status: ready ? "ready" : "not_ready", updated_by: access.userId }).eq("id", domainId).eq("tenant_id", job.tenant_id).eq("is_preview", false); if (error) return NextResponse.json({ message: error.message }, { status: 409 });
  await supabase.from("audit_logs").insert({ tenant_id: job.tenant_id, actor_id: access.userId, action: "domain.manual_status_updated", entity_type: "domain", entity_id: domainId, after_data: { ...parsed.data, ready } }); return NextResponse.json({ message: ready ? "Domain checks complete and ready for final launch review." : "Manual domain status saved. Production remains blocked." });
}

