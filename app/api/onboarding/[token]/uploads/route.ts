import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getOnboardingContext, OnboardingAccessError } from "@/lib/onboarding/repository";
import { onboardingWriteRequestIsAllowed } from "@/lib/onboarding/request-security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { completeUploadSchema, prepareUploadSchema } from "@/lib/validation/onboarding";

type RouteContext = { params: Promise<{ token: string }> };

function safeFilename(filename: string): string {
  const extension = filename.includes(".") ? `.${filename.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")}` : "";
  const stem = filename.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "upload";
  return `${stem}${extension}`;
}

function errorResponse(error: unknown) {
  if (error instanceof OnboardingAccessError) return NextResponse.json({ message: error.message }, { status: error.status });
  return NextResponse.json({ message: "The upload request could not be completed." }, { status: 500 });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const security = onboardingWriteRequestIsAllowed(request, 32_000);
  if (!security.allowed) return NextResponse.json({ message: security.message }, { status: security.status });
  try {
    const parsed = prepareUploadSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Choose a supported image or PDF under 20 MB." }, { status: 422 });
    const { token } = await context.params;
    const { invitation, submission } = await getOnboardingContext(token, false);
    const path = `invitations/${invitation.id}/${submission.id}/${parsed.data.sectionKey}/${randomUUID()}-${safeFilename(parsed.data.filename)}`;
    const supabase = createSupabaseAdminClient()!;
    const { data, error } = await supabase.storage.from("onboarding-files").createSignedUploadUrl(path);
    if (error || !data) return NextResponse.json({ message: "A secure upload URL could not be created." }, { status: 503 });
    return NextResponse.json({ storagePath: path, signedUrl: data.signedUrl, token: data.token }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const security = onboardingWriteRequestIsAllowed(request, 32_000);
  if (!security.allowed) return NextResponse.json({ message: security.message }, { status: security.status });
  try {
    const parsed = completeUploadSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "The uploaded file metadata is invalid." }, { status: 422 });
    const { token } = await context.params;
    const { invitation, submission } = await getOnboardingContext(token, false);
    const expectedPrefix = `invitations/${invitation.id}/${submission.id}/${parsed.data.sectionKey}/`;
    if (!parsed.data.storagePath.startsWith(expectedPrefix)) return NextResponse.json({ message: "The upload path was not accepted." }, { status: 403 });
    const supabase = createSupabaseAdminClient()!;
    const { data, error } = await supabase.from("onboarding_files").insert({
      invitation_id: invitation.id, submission_id: submission.id, section_key: parsed.data.sectionKey,
      field_key: parsed.data.fieldKey, storage_path: parsed.data.storagePath, original_filename: parsed.data.filename,
      mime_type: parsed.data.mimeType, byte_size: parsed.data.byteSize,
    }).select("id,storage_path,original_filename,mime_type,byte_size").single();
    if (error || !data) return NextResponse.json({ message: "The uploaded file could not be registered." }, { status: 503 });
    return NextResponse.json(data, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
