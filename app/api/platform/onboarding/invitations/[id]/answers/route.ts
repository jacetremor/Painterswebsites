import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { onboardingWriteRequestIsAllowed } from "@/lib/onboarding/request-security";
import { validateOnboardingSection } from "@/lib/onboarding/sections";
import { requirePlatformAdmin } from "@/lib/security/dashboard-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ sectionKey: z.string().regex(/^[a-z_]+$/), answerData: z.record(z.string(), z.unknown()) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requirePlatformAdmin(); if (access.readOnly) return NextResponse.json({ message: "Answer editing is disabled in demo mode." }, { status: 503 });
  const security = onboardingWriteRequestIsAllowed(request, 512_000); if (!security.allowed) return NextResponse.json({ message: security.message }, { status: security.status });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ message: "Answer data is invalid." }, { status: 422 });
  const { id } = await params; const supabase = createSupabaseAdminClient()!;
  const { data: submission } = await supabase.from("onboarding_submissions").select("id").eq("invitation_id", id).single(); if (!submission) return NextResponse.json({ message: "Submission not found." }, { status: 404 });
  const validation = validateOnboardingSection(parsed.data.sectionKey, parsed.data.answerData);
  const { error } = await supabase.from("onboarding_answers").upsert({ invitation_id: id, submission_id: submission.id, section_key: parsed.data.sectionKey, answer_data: parsed.data.answerData, is_complete: validation.success, last_saved_by: "platform_admin", updated_by: access.userId }, { onConflict: "submission_id,section_key" });
  if (error) return NextResponse.json({ message: "Answers could not be saved." }, { status: 503 });
  await supabase.from("audit_logs").insert({ actor_id: access.userId, action: "onboarding.answers_edited", entity_type: "onboarding_invitation", entity_id: id, after_data: { section_key: parsed.data.sectionKey, is_complete: validation.success } });
  return NextResponse.json({ message: validation.success ? "Answers saved and section marked complete." : "Answers saved; this section still has missing required fields." });
}

