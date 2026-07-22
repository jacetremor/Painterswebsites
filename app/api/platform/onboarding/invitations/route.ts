import { NextRequest, NextResponse } from "next/server";
import { createInvitation, listInvitations } from "@/lib/onboarding/admin-repository";
import { onboardingWriteRequestIsAllowed } from "@/lib/onboarding/request-security";
import { requirePlatformAdmin } from "@/lib/security/dashboard-auth";
import { createInvitationSchema } from "@/lib/validation/onboarding";

export async function GET() {
  await requirePlatformAdmin();
  try { return NextResponse.json(await listInvitations(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "Invitations could not be loaded." }, { status: 503 }); }
}

export async function POST(request: NextRequest) {
  const access = await requirePlatformAdmin();
  if (access.readOnly) return NextResponse.json({ message: "Connect Supabase and sign in as a platform administrator to create invitations." }, { status: 503 });
  const security = onboardingWriteRequestIsAllowed(request, 32_000);
  if (!security.allowed) return NextResponse.json({ message: security.message }, { status: security.status });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid request body." }, { status: 400 }); }
  const parsed = createInvitationSchema.safeParse(body);
  if (!parsed.success || new Date(parsed.data.expiresAt) <= new Date()) return NextResponse.json({ message: "Check the invitation fields and choose a future expiration." }, { status: 422 });
  try { return NextResponse.json(await createInvitation(parsed.data, access.userId), { status: 201, headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "Invitation could not be created." }, { status: 503 }); }
}

