import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calculateCompletion, ONBOARDING_SECTIONS, validateOnboardingSection } from "@/lib/onboarding/sections";
import { hashOnboardingToken, isPlausibleOnboardingToken } from "@/lib/onboarding/token";
import { isInvitationUsable } from "@/lib/onboarding/state-machine";
import type { OnboardingAnswerMap, OnboardingInvitationSummary, OnboardingSectionAnswer, OnboardingSession, OnboardingStatus } from "@/lib/onboarding/types";

export class OnboardingAccessError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

type InvitationRow = {
  id: string; client_name: string; company_name: string; client_email: string;
  proposed_preview_slug: string; status: OnboardingStatus; expires_at: string; updated_at: string;
};

type SubmissionRow = {
  id: string; invitation_id: string; completion_percent: number; current_section: string;
  client_confirmed: boolean; confirmation_name: string | null;
};

type AnswerRow = { section_key: string; answer_data: OnboardingAnswerMap; is_complete: boolean; updated_at: string };

const DEMO_TOKEN = "demo_onboarding_token_123456789012345678901234";

function toSummary(invitation: InvitationRow, completionPercent = 0): OnboardingInvitationSummary {
  return {
    id: invitation.id, clientName: invitation.client_name, companyName: invitation.company_name,
    clientEmail: invitation.client_email, proposedPreviewSlug: invitation.proposed_preview_slug,
    status: invitation.status, expiresAt: invitation.expires_at, completionPercent, updatedAt: invitation.updated_at,
  };
}

function demoSession(): OnboardingSession {
  const now = new Date();
  return {
    invitation: {
      id: "demo-invitation", clientName: "Taylor Morgan", companyName: "Northstar Painting Co.",
      clientEmail: "taylor@example.com", proposedPreviewSlug: "northstarpainting", status: "in_progress",
      expiresAt: new Date(now.getTime() + 14 * 86400000).toISOString(), completionPercent: 0, updatedAt: now.toISOString(),
    },
    currentSection: ONBOARDING_SECTIONS[0]!.key, answers: {}, clientConfirmed: false, demoMode: true,
  };
}

export function getDemoOnboardingToken(): string { return DEMO_TOKEN; }

export async function getOnboardingContext(token: string, markOpened = true): Promise<{ invitation: InvitationRow; submission: SubmissionRow }> {
  if (!isPlausibleOnboardingToken(token)) throw new OnboardingAccessError("This onboarding link is invalid.", 404);
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new OnboardingAccessError("Onboarding storage is not configured.", 503);
  const tokenHash = hashOnboardingToken(token);
  const { data: invitationData, error } = await supabase.from("onboarding_invitations").select("id,client_name,company_name,client_email,proposed_preview_slug,status,expires_at,updated_at").eq("token_hash", tokenHash).maybeSingle();
  if (error || !invitationData) throw new OnboardingAccessError("This onboarding link is invalid.", 404);
  const invitation = invitationData as InvitationRow;
  if (!isInvitationUsable(invitation.status, invitation.expires_at)) {
    if (invitation.status !== "revoked" && invitation.status !== "launched" && new Date(invitation.expires_at) <= new Date()) {
      await supabase.from("onboarding_invitations").update({ status: "expired" }).eq("id", invitation.id);
    }
    throw new OnboardingAccessError("This onboarding link has expired or was revoked.", 410);
  }
  if (markOpened && invitation.status === "sent") {
    const openedAt = new Date().toISOString();
    await supabase.from("onboarding_invitations").update({ status: "opened", first_opened_at: openedAt, last_opened_at: openedAt }).eq("id", invitation.id).eq("status", "sent");
    invitation.status = "opened";
  } else if (markOpened) {
    await supabase.from("onboarding_invitations").update({ last_opened_at: new Date().toISOString() }).eq("id", invitation.id);
  }
  const { data: submissionData, error: submissionError } = await supabase.from("onboarding_submissions").select("id,invitation_id,completion_percent,current_section,client_confirmed,confirmation_name").eq("invitation_id", invitation.id).single();
  if (submissionError || !submissionData) throw new OnboardingAccessError("The onboarding form is not ready.", 503);
  return { invitation, submission: submissionData as SubmissionRow };
}

export async function loadOnboardingSession(token: string): Promise<OnboardingSession> {
  if (token === DEMO_TOKEN && !createSupabaseAdminClient()) return demoSession();
  const { invitation, submission } = await getOnboardingContext(token);
  const supabase = createSupabaseAdminClient()!;
  const { data, error } = await supabase.from("onboarding_answers").select("section_key,answer_data,is_complete,updated_at").eq("submission_id", submission.id);
  if (error) throw new OnboardingAccessError("The saved answers could not be loaded.", 503);
  const answers = Object.fromEntries((data as AnswerRow[]).map((row) => [row.section_key, {
    sectionKey: row.section_key, answerData: row.answer_data, isComplete: row.is_complete, updatedAt: row.updated_at,
  } satisfies OnboardingSectionAnswer]));
  return {
    invitation: toSummary(invitation, submission.completion_percent), currentSection: submission.current_section,
    answers, clientConfirmed: submission.client_confirmed, confirmationName: submission.confirmation_name ?? undefined,
  };
}

export async function saveOnboardingSection(token: string, sectionKey: string, answerData: OnboardingAnswerMap, requireComplete = false): Promise<{ isComplete: boolean; completionPercent: number; updatedAt: string }> {
  const validation = validateOnboardingSection(sectionKey, answerData);
  if (requireComplete && !validation.success) throw new OnboardingAccessError("Please complete the required fields in this section.", 422);
  const { invitation, submission } = await getOnboardingContext(token, false);
  if (!["sent", "opened", "in_progress", "changes_requested"].includes(invitation.status)) throw new OnboardingAccessError("This submission can no longer be edited.", 409);
  const supabase = createSupabaseAdminClient()!;
  const updatedAt = new Date().toISOString();
  const isComplete = validation.success;
  const { error } = await supabase.from("onboarding_answers").upsert({
    submission_id: submission.id, invitation_id: invitation.id, section_key: sectionKey,
    answer_data: answerData, is_complete: isComplete, schema_version: 1, last_saved_by: "client", updated_at: updatedAt,
  }, { onConflict: "submission_id,section_key" });
  if (error) throw new OnboardingAccessError("Your progress could not be saved.", 503);
  const { data: completionRows } = await supabase.from("onboarding_answers").select("section_key,is_complete").eq("submission_id", submission.id);
  const completion = calculateCompletion(Object.fromEntries((completionRows ?? []).map((row) => [row.section_key, { isComplete: row.is_complete }])));
  const nextStatus = invitation.status === "changes_requested" || invitation.status === "opened" || invitation.status === "sent" ? "in_progress" : invitation.status;
  await Promise.all([
    supabase.from("onboarding_submissions").update({ completion_percent: completion, current_section: sectionKey }).eq("id", submission.id),
    nextStatus !== invitation.status ? supabase.from("onboarding_invitations").update({ status: nextStatus }).eq("id", invitation.id) : Promise.resolve(),
  ]);
  return { isComplete, completionPercent: completion, updatedAt };
}

export async function submitOnboarding(token: string, confirmationName: string): Promise<void> {
  const { invitation, submission } = await getOnboardingContext(token, false);
  if (invitation.status !== "in_progress") throw new OnboardingAccessError("This form is not ready to submit.", 409);
  const supabase = createSupabaseAdminClient()!;
  const { data } = await supabase.from("onboarding_answers").select("section_key,is_complete").eq("submission_id", submission.id);
  const complete = new Set((data ?? []).filter((row) => row.is_complete).map((row) => row.section_key));
  const required = ONBOARDING_SECTIONS.map((section) => section.key);
  if (!required.every((key) => complete.has(key))) throw new OnboardingAccessError("Complete all required sections before submitting.", 422);
  const now = new Date().toISOString();
  const [submissionResult, invitationResult] = await Promise.all([
    supabase.from("onboarding_submissions").update({ completion_percent: 100, client_confirmed: true, confirmation_name: confirmationName, confirmed_at: now, submitted_at: now }).eq("id", submission.id),
    supabase.from("onboarding_invitations").update({ status: "submitted" }).eq("id", invitation.id).eq("status", "in_progress"),
  ]);
  if (submissionResult.error || invitationResult.error) throw new OnboardingAccessError("The form could not be submitted.", 503);
  await supabase.from("approval_records").insert({ invitation_id: invitation.id, submission_id: submission.id, scope: "submission", status: "pending", actor_type: "client", actor_name: confirmationName, snapshot: { submitted_at: now } });
}

