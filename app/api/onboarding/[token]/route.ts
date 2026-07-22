import { NextRequest, NextResponse } from "next/server";
import { takeRateLimit } from "@/lib/security/rate-limit";
import { loadOnboardingSession, OnboardingAccessError, saveOnboardingSection, submitOnboarding } from "@/lib/onboarding/repository";
import { onboardingWriteRequestIsAllowed } from "@/lib/onboarding/request-security";
import { saveOnboardingSectionSchema, submitOnboardingSchema } from "@/lib/validation/onboarding";
import { hashOnboardingToken } from "@/lib/onboarding/token";

type RouteContext = { params: Promise<{ token: string }> };

function errorResponse(error: unknown) {
  if (error instanceof OnboardingAccessError) return NextResponse.json({ message: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ message: "The onboarding request could not be completed." }, { status: 500, headers: { "Cache-Control": "no-store" } });
}

function rateLimitKey(request: NextRequest, token: string) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return `onboarding:${hashOnboardingToken(token)}:${ip}`;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { token } = await context.params;
  if (!takeRateLimit(rateLimitKey(request, token), 120, 15 * 60 * 1000)) return NextResponse.json({ message: "Please wait before trying again." }, { status: 429 });
  try {
    const session = await loadOnboardingSession(token);
    return NextResponse.json(session, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow, noarchive" } });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const security = onboardingWriteRequestIsAllowed(request);
  if (!security.allowed) return NextResponse.json({ message: security.message }, { status: security.status });
  const { token } = await context.params;
  if (!takeRateLimit(rateLimitKey(request, token), 90, 15 * 60 * 1000)) return NextResponse.json({ message: "Please wait before saving again." }, { status: 429 });
  try {
    const parsed = saveOnboardingSectionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Check the form fields and try again." }, { status: 422 });
    const result = await saveOnboardingSection(token, parsed.data.sectionKey, parsed.data.answerData, parsed.data.requireComplete);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const security = onboardingWriteRequestIsAllowed(request, 32_000);
  if (!security.allowed) return NextResponse.json({ message: security.message }, { status: security.status });
  const { token } = await context.params;
  if (!takeRateLimit(rateLimitKey(request, token), 10, 60 * 60 * 1000)) return NextResponse.json({ message: "Please wait before trying again." }, { status: 429 });
  try {
    const parsed = submitOnboardingSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Enter your full name before submitting." }, { status: 422 });
    await submitOnboarding(token, parsed.data.confirmationName);
    return NextResponse.json({ message: "Your onboarding form was submitted to Nova Suite." }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

