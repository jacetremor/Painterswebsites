import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { onboardingWriteRequestIsAllowed } from "@/lib/onboarding/request-security";
import { requirePlatformAdmin } from "@/lib/security/dashboard-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ approvedIds: z.array(z.string().uuid()).max(20) });
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requirePlatformAdmin(); if (access.readOnly) return NextResponse.json({ message: "Location approval is disabled in demo mode." }, { status: 503 });
  const security = onboardingWriteRequestIsAllowed(request, 32_000); if (!security.allowed) return NextResponse.json({ message: security.message }, { status: security.status });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ message: "Location selection is invalid." }, { status: 422 });
  const { id } = await params; const supabase = createSupabaseAdminClient()!; const { data: candidates } = await supabase.from("onboarding_location_candidates").select("id,is_cross_state").eq("invitation_id", id).eq("client_approved", true);
  const allowed = new Set((candidates ?? []).map((item) => item.id)); if (parsed.data.approvedIds.some((candidateId) => !allowed.has(candidateId))) return NextResponse.json({ message: "A location was not eligible for approval." }, { status: 403 });
  await supabase.from("onboarding_location_candidates").update({ nova_suite_approved: false }).eq("invitation_id", id);
  if (parsed.data.approvedIds.length) await supabase.from("onboarding_location_candidates").update({ nova_suite_approved: true }).eq("invitation_id", id).in("id", parsed.data.approvedIds);
  await supabase.from("approval_records").insert({ invitation_id: id, scope: "location", status: "approved", actor_type: "platform_admin", actor_id: access.userId, snapshot: { approved_ids: parsed.data.approvedIds } });
  return NextResponse.json({ message: `${parsed.data.approvedIds.length} location${parsed.data.approvedIds.length === 1 ? "" : "s"} approved. Retry the blocked generation step when ready.` });
}

