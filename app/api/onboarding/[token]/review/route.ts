import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOnboardingContext, OnboardingAccessError } from "@/lib/onboarding/repository";
import { onboardingWriteRequestIsAllowed } from "@/lib/onboarding/request-security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ status: z.enum(["approved", "changes_requested"]), notes: z.string().trim().max(5000).optional().default("") });
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const security = onboardingWriteRequestIsAllowed(request, 32_000); if (!security.allowed) return NextResponse.json({ message: security.message }, { status: security.status });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success || (parsed.data.status === "changes_requested" && parsed.data.notes.length < 5)) return NextResponse.json({ message: "Add useful review notes." }, { status: 422 });
  try { const { token } = await params; const { invitation, submission } = await getOnboardingContext(token, false); if (!["preview_ready", "ready_for_launch"].includes(invitation.status)) return NextResponse.json({ message: "The preview is not ready for review." }, { status: 409 }); const supabase = createSupabaseAdminClient()!; await supabase.from("approval_records").insert({ invitation_id: invitation.id, submission_id: submission.id, scope: "client_review", status: parsed.data.status, actor_type: "client", actor_name: invitation.client_name, notes: parsed.data.notes || null, snapshot: { preview_slug: invitation.proposed_preview_slug } }); return NextResponse.json({ message: parsed.data.status === "approved" ? "Preview approval recorded. Nova Suite must still complete final launch approval." : "Change request sent to Nova Suite." }, { status: 201 }); }
  catch (error) { if (error instanceof OnboardingAccessError) return NextResponse.json({ message: error.message }, { status: error.status }); return NextResponse.json({ message: "Review could not be saved." }, { status: 503 }); }
}

