import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runInvitationAction } from "@/lib/onboarding/admin-repository";
import { onboardingWriteRequestIsAllowed } from "@/lib/onboarding/request-security";
import { requirePlatformAdmin } from "@/lib/security/dashboard-auth";

const actionSchema = z.object({
  action: z.enum(["resend", "extend", "revoke", "request_changes", "approve", "start_generation", "retry_generation", "approve_for_launch", "mark_launched"]),
  notes: z.string().trim().max(5000).optional(), expiresAt: z.string().datetime().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requirePlatformAdmin();
  if (access.readOnly) return NextResponse.json({ message: "Administrative actions are disabled in demo mode." }, { status: 503 });
  const security = onboardingWriteRequestIsAllowed(request, 32_000);
  if (!security.allowed) return NextResponse.json({ message: security.message }, { status: security.status });
  const parsed = actionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "The requested action is invalid." }, { status: 422 });
  const { id } = await params;
  try { return NextResponse.json(await runInvitationAction(id, parsed.data.action, access.userId, parsed.data), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "The action could not be completed." }, { status: 409 }); }
}
