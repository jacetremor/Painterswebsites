import "server-only";

import { randomUUID } from "node:crypto";
import { createOnboardingToken } from "@/lib/onboarding/token";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generationStepRows } from "@/lib/generation/steps";
import type { OnboardingInvitationSummary, OnboardingStatus } from "@/lib/onboarding/types";

type InvitationInput = { clientName: string; companyName: string; clientEmail: string; proposedPreviewSlug: string; notes: string; expiresAt: string };

export type AdminInvitationDetail = OnboardingInvitationSummary & {
  notes: string; createdAt: string; answers: Array<{ sectionKey: string; answerData: Record<string, unknown>; isComplete: boolean; updatedAt: string }>;
  history: Array<{ id: string; scope: string; status: string; actorType: string; actorName?: string; notes?: string; createdAt: string }>;
  generation?: { id: string; status: string; currentStep?: string; steps: Array<{ id: string; ordinal: number; stepKey: string; status: string; attemptCount: number }> };
  locationCandidates: Array<{ id: string; city: string; stateAbbr: string; distanceMiles: number; population?: number; score: number; isPriority: boolean; isCrossState: boolean; clientApproved: boolean; novaSuiteApproved: boolean; noindex: boolean }>;
  domains: Array<{ id: string; hostname: string; isPreview: boolean; isPrimary: boolean; isVerified: boolean; ownershipModel?: string; registrar?: string; dnsProvider?: string; vercelStatus: string; sslStatus: string; wwwRedirectVerified: boolean; canonicalVerified: boolean; emailRecordsPreserved: boolean; nameserverChangeAuthorized: boolean; launchStatus: string }>;
  generatedContent: Array<{ id: string; entityType: string; entityKey: string; version: number; provider: string; model: string; status: string; draftData: Record<string, unknown>; factualWarnings: unknown[]; createdAt: string }>;
  media: Array<{ id: string; originalFilename: string; sectionKey: string; fieldKey: string; suggestedAltText?: string; approvedAltText?: string; altDecision: string; permissionToPublish: boolean; metadataStripped: boolean; processedOutputs: unknown[] }>;
};

function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_PLATFORM_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://app.novasuite.io").replace(/\/$/, "");
}

export function invitationUrl(token: string): string { return `${appOrigin()}/onboarding/${token}`; }

export async function createInvitation(input: InvitationInput, actorId: string): Promise<{ id: string; url: string }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { token, tokenHash } = createOnboardingToken();
  const { data, error } = await supabase.from("onboarding_invitations").insert({
    token_hash: tokenHash, client_name: input.clientName, company_name: input.companyName, client_email: input.clientEmail,
    proposed_preview_slug: input.proposedPreviewSlug, notes: input.notes || null, expires_at: input.expiresAt,
    status: "sent", sent_at: new Date().toISOString(), created_by: actorId, updated_by: actorId,
  }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "Invitation could not be created.");
  const { error: submissionError } = await supabase.from("onboarding_submissions").insert({ invitation_id: data.id, created_by: actorId, updated_by: actorId });
  if (submissionError) { await supabase.from("onboarding_invitations").delete().eq("id", data.id); throw new Error("Invitation form could not be initialized."); }
  await supabase.from("audit_logs").insert({ actor_id: actorId, action: "onboarding.invitation_created", entity_type: "onboarding_invitation", entity_id: data.id, after_data: { company_name: input.companyName, expires_at: input.expiresAt } });
  return { id: data.id, url: invitationUrl(token) };
}

export async function listInvitations(): Promise<OnboardingInvitationSummary[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [{ id: "demo-invitation", clientName: "Taylor Morgan", companyName: "Northstar Painting Co.", clientEmail: "taylor@example.com", proposedPreviewSlug: "northstarpainting", status: "in_progress", expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(), completionPercent: 38, updatedAt: new Date().toISOString() }];
  const { data, error } = await supabase.from("onboarding_invitations").select("id,client_name,company_name,client_email,proposed_preview_slug,status,expires_at,updated_at,onboarding_submissions(completion_percent)").order("updated_at", { ascending: false });
  if (error) throw new Error("Invitations could not be loaded.");
  return (data ?? []).map((row) => ({
    id: row.id, clientName: row.client_name, companyName: row.company_name, clientEmail: row.client_email,
    proposedPreviewSlug: row.proposed_preview_slug, status: row.status as OnboardingStatus, expiresAt: row.expires_at,
    completionPercent: Array.isArray(row.onboarding_submissions) ? (row.onboarding_submissions[0]?.completion_percent ?? 0) : (row.onboarding_submissions as { completion_percent?: number } | null)?.completion_percent ?? 0, updatedAt: row.updated_at,
  }));
}

export async function getInvitationDetail(id: string): Promise<AdminInvitationDetail | null> {
  if (id === "demo-invitation" && !createSupabaseAdminClient()) return { ...(await listInvitations())[0]!, notes: "Demonstration invitation. Connect Supabase for durable administration.", createdAt: new Date().toISOString(), answers: [], history: [], generation: undefined, locationCandidates: [], domains: [], generatedContent: [], media: [] };
  const supabase = createSupabaseAdminClient(); if (!supabase) return null;
  const { data: invitation, error } = await supabase.from("onboarding_invitations").select("id,client_name,company_name,client_email,proposed_preview_slug,status,expires_at,notes,created_at,updated_at,onboarding_submissions(id,completion_percent)").eq("id", id).maybeSingle();
  if (error || !invitation) return null;
  const submissions = Array.isArray(invitation.onboarding_submissions) ? invitation.onboarding_submissions : invitation.onboarding_submissions ? [invitation.onboarding_submissions] : [];
  const submission = submissions[0];
  const [{ data: answerRows }, { data: historyRows }, { data: jobRows }, { data: candidateRows }, { data: auditRows }] = await Promise.all([
    supabase.from("onboarding_answers").select("section_key,answer_data,is_complete,updated_at").eq("invitation_id", id).order("section_key"),
    supabase.from("approval_records").select("id,scope,status,actor_type,actor_name,notes,created_at").eq("invitation_id", id).order("created_at", { ascending: false }),
    supabase.from("website_generation_jobs").select("id,status,current_step,tenant_id,website_generation_steps(id,ordinal,step_key,status,attempt_count)").eq("invitation_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("onboarding_location_candidates").select("id,city,state_abbr,distance_miles,population,score,is_priority,is_cross_state,client_approved,nova_suite_approved,noindex").eq("invitation_id", id).order("sort_order"),
    supabase.from("audit_logs").select("id,action,actor_id,after_data,created_at").eq("entity_type", "onboarding_invitation").eq("entity_id", id).order("created_at", { ascending: false }),
  ]);
  const job = jobRows?.[0];
  const { data: domainRows } = job?.tenant_id ? await supabase.from("domains").select("id,hostname,is_preview,is_primary,is_verified,ownership_model,registrar,dns_provider,vercel_status,ssl_status,www_redirect_verified,canonical_verified,email_records_preserved,nameserver_change_authorized,launch_status").eq("tenant_id", job.tenant_id).order("is_preview", { ascending: false }) : { data: [] };
  const { data: contentRows } = job?.id ? await supabase.from("generated_content_versions").select("id,entity_type,entity_key,version,provider,model,status,draft_data,factual_warnings,created_at").eq("job_id", job.id).order("entity_key").order("version", { ascending: false }) : { data: [] };
  const { data: mediaRows } = submission?.id ? await supabase.from("onboarding_files").select("id,original_filename,section_key,field_key,suggested_alt_text,approved_alt_text,alt_decision,permission_to_publish,metadata_stripped,processed_outputs").eq("submission_id", submission.id).order("created_at") : { data: [] };
  return {
    id: invitation.id, clientName: invitation.client_name, companyName: invitation.company_name, clientEmail: invitation.client_email,
    proposedPreviewSlug: invitation.proposed_preview_slug, status: invitation.status as OnboardingStatus, expiresAt: invitation.expires_at,
    completionPercent: submission?.completion_percent ?? 0, updatedAt: invitation.updated_at, notes: invitation.notes ?? "", createdAt: invitation.created_at,
    answers: (answerRows ?? []).map((row) => ({ sectionKey: row.section_key, answerData: row.answer_data as Record<string, unknown>, isComplete: row.is_complete, updatedAt: row.updated_at })),
    history: [...(historyRows ?? []).map((row) => ({ id: row.id, scope: row.scope, status: row.status, actorType: row.actor_type, actorName: row.actor_name ?? undefined, notes: row.notes ?? undefined, createdAt: row.created_at })), ...(auditRows ?? []).map((row) => ({ id: `audit-${row.id}`, scope: "audit", status: row.action, actorType: "platform_admin", actorName: row.actor_id ?? undefined, notes: undefined, createdAt: row.created_at }))].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    generation: job ? { id: job.id, status: job.status, currentStep: job.current_step ?? undefined, steps: (Array.isArray(job.website_generation_steps) ? job.website_generation_steps : []).map((step) => ({ id: step.id, ordinal: step.ordinal, stepKey: step.step_key, status: step.status, attemptCount: step.attempt_count })).sort((a, b) => a.ordinal - b.ordinal) } : undefined,
    locationCandidates: (candidateRows ?? []).map((row) => ({ id: row.id, city: row.city, stateAbbr: row.state_abbr, distanceMiles: Number(row.distance_miles), population: row.population ?? undefined, score: Number(row.score), isPriority: row.is_priority, isCrossState: row.is_cross_state, clientApproved: row.client_approved, novaSuiteApproved: row.nova_suite_approved, noindex: row.noindex })),
    domains: (domainRows ?? []).map((row) => ({ id: row.id, hostname: row.hostname, isPreview: row.is_preview, isPrimary: row.is_primary, isVerified: row.is_verified, ownershipModel: row.ownership_model ?? undefined, registrar: row.registrar ?? undefined, dnsProvider: row.dns_provider ?? undefined, vercelStatus: row.vercel_status, sslStatus: row.ssl_status, wwwRedirectVerified: row.www_redirect_verified, canonicalVerified: row.canonical_verified, emailRecordsPreserved: row.email_records_preserved, nameserverChangeAuthorized: row.nameserver_change_authorized, launchStatus: row.launch_status })),
    generatedContent: (contentRows ?? []).map((row) => ({ id: row.id, entityType: row.entity_type, entityKey: row.entity_key, version: row.version, provider: row.provider, model: row.model, status: row.status, draftData: row.draft_data as Record<string, unknown>, factualWarnings: Array.isArray(row.factual_warnings) ? row.factual_warnings : [], createdAt: row.created_at })),
    media: (mediaRows ?? []).map((row) => ({ id: row.id, originalFilename: row.original_filename, sectionKey: row.section_key, fieldKey: row.field_key, suggestedAltText: row.suggested_alt_text ?? undefined, approvedAltText: row.approved_alt_text ?? undefined, altDecision: row.alt_decision, permissionToPublish: row.permission_to_publish, metadataStripped: row.metadata_stripped, processedOutputs: Array.isArray(row.processed_outputs) ? row.processed_outputs : [] })),
  };
}

export type InvitationAction = "resend" | "extend" | "revoke" | "request_changes" | "approve" | "start_generation" | "retry_generation" | "approve_for_launch" | "mark_launched";

export async function runInvitationAction(id: string, action: InvitationAction, actorId: string, input: { notes?: string; expiresAt?: string }): Promise<{ url?: string; message: string }> {
  const supabase = createSupabaseAdminClient(); if (!supabase) throw new Error("Supabase is not configured.");
  const { data: invitation, error } = await supabase.from("onboarding_invitations").select("id,status").eq("id", id).single();
  if (error || !invitation) throw new Error("Invitation was not found.");
  const status = invitation.status as OnboardingStatus;
  const audit = (actionName: string, afterData: Record<string, unknown> = {}) => supabase.from("audit_logs").insert({ actor_id: actorId, action: actionName, entity_type: "onboarding_invitation", entity_id: id, after_data: afterData });
  if (action === "resend") {
    if (["submitted", "approved", "website_generating", "preview_ready", "ready_for_launch", "launched", "expired", "revoked"].includes(status)) throw new Error("This invitation can no longer be resent.");
    const { token, tokenHash } = createOnboardingToken();
    const nextStatus = ["draft", "sent", "opened"].includes(status) ? "sent" : status;
    const { error: updateError } = await supabase.from("onboarding_invitations").update({ token_hash: tokenHash, status: nextStatus, sent_at: new Date().toISOString(), updated_by: actorId }).eq("id", id);
    if (updateError) throw new Error("A replacement link could not be created.");
    await supabase.from("audit_logs").insert({ actor_id: actorId, action: "onboarding.invitation_resent", entity_type: "onboarding_invitation", entity_id: id, after_data: { token_rotated: true } });
    return { url: invitationUrl(token), message: "A replacement link was created. The previous link is now invalid." };
  }
  if (action === "extend") {
    if (!input.expiresAt || new Date(input.expiresAt) <= new Date()) throw new Error("Choose a future expiration date.");
    await supabase.from("onboarding_invitations").update({ expires_at: input.expiresAt, updated_by: actorId }).eq("id", id);
    await audit("onboarding.invitation_extended", { expires_at: input.expiresAt });
    return { message: "Invitation expiration extended." };
  }
  if (action === "revoke") {
    if (status === "launched") throw new Error("A launched record cannot be revoked.");
    await supabase.from("onboarding_invitations").update({ status: "revoked", revoked_at: new Date().toISOString(), updated_by: actorId }).eq("id", id);
    await audit("onboarding.invitation_revoked");
    return { message: "Invitation revoked." };
  }
  const { data: submission } = await supabase.from("onboarding_submissions").select("id").eq("invitation_id", id).single();
  if (!submission) throw new Error("Submission was not found.");
  if (action === "request_changes") {
    if (status !== "submitted") throw new Error("Only a submitted form can be returned for changes.");
    await supabase.from("onboarding_invitations").update({ status: "changes_requested", updated_by: actorId }).eq("id", id);
    await supabase.from("approval_records").insert({ invitation_id: id, submission_id: submission.id, scope: "submission", status: "changes_requested", actor_type: "platform_admin", actor_id: actorId, notes: input.notes ?? null });
    await audit("onboarding.changes_requested");
    return { message: "Changes requested. The client can edit the form again." };
  }
  if (action === "approve") {
    if (status !== "submitted") throw new Error("Only a submitted form can be approved.");
    await supabase.from("onboarding_invitations").update({ status: "approved", updated_by: actorId }).eq("id", id);
    await supabase.from("approval_records").insert({ invitation_id: id, submission_id: submission.id, scope: "submission", status: "approved", actor_type: "platform_admin", actor_id: actorId, notes: input.notes ?? null });
    await audit("onboarding.submission_approved");
    return { message: "Submission approved. Website generation still requires a separate action." };
  }
  if (action === "start_generation") {
    if (status !== "approved") throw new Error("Approve the submission before starting generation.");
    const jobId = randomUUID();
    const { error: jobError } = await supabase.from("website_generation_jobs").insert({ id: jobId, invitation_id: id, submission_id: submission.id, status: "queued", idempotency_key: `submission:${submission.id}:v1`, created_by: actorId, updated_by: actorId });
    if (jobError) throw new Error(jobError.code === "23505" ? "A generation job already exists for this submission." : "Generation job could not be created.");
    const { error: stepError } = await supabase.from("website_generation_steps").insert(generationStepRows(jobId));
    if (stepError) { await supabase.from("website_generation_jobs").delete().eq("id", jobId); throw new Error("Generation steps could not be initialized."); }
    await supabase.from("onboarding_invitations").update({ status: "website_generating", updated_by: actorId }).eq("id", id);
    await supabase.from("approval_records").insert({ invitation_id: id, submission_id: submission.id, job_id: jobId, scope: "generation", status: "approved", actor_type: "platform_admin", actor_id: actorId, notes: input.notes ?? null });
    await audit("onboarding.generation_started", { job_id: jobId });
    return { message: "Durable generation job created with 30 pending steps." };
  }
  if (action === "retry_generation") {
    const { data: job } = await supabase.from("website_generation_jobs").select("id,status").eq("invitation_id", id).order("created_at", { ascending: false }).limit(1).single();
    if (!job || !["failed", "waiting_for_input"].includes(job.status)) throw new Error("No failed or blocked generation job is ready to retry.");
    await supabase.from("website_generation_steps").update({ status: "pending", next_retry_at: null }).eq("job_id", job.id).in("status", ["failed", "blocked"]);
    await supabase.from("website_generation_jobs").update({ status: "queued", lease_owner: null, lease_expires_at: null, updated_by: actorId }).eq("id", job.id);
    await audit("onboarding.generation_retried", { job_id: job.id });
    return { message: "Failed generation steps were queued for retry." };
  }
  if (action === "approve_for_launch") {
    if (status !== "preview_ready") throw new Error("The private preview must be ready before final launch approval.");
    const { data: job } = await supabase.from("website_generation_jobs").select("id,tenant_id,status").eq("invitation_id", id).order("created_at", { ascending: false }).limit(1).single();
    if (!job?.tenant_id || job.status !== "completed") throw new Error("Website generation and its validation steps must be complete.");
    const { data: clientApproval } = await supabase.from("approval_records").select("id,status").eq("invitation_id", id).eq("scope", "client_review").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (clientApproval?.status !== "approved") throw new Error("Client preview approval is required.");
    const { data: versions } = await supabase.from("generated_content_versions").select("entity_type,entity_key,version,status").eq("job_id", job.id).order("version", { ascending: false });
    const latest = new Map<string, string>(); for (const version of versions ?? []) { const key = `${version.entity_type}:${version.entity_key}`; if (!latest.has(key)) latest.set(key, version.status); }
    if ([...latest.values()].some((value) => value !== "approved")) throw new Error("Every latest generated content version must be approved.");
    await Promise.all([supabase.from("onboarding_invitations").update({ status: "ready_for_launch", updated_by: actorId }).eq("id", id), supabase.from("tenants").update({ launch_status: "ready_for_launch", production_ready: false }).eq("id", job.tenant_id), supabase.from("approval_records").insert({ invitation_id: id, submission_id: submission.id, job_id: job.id, tenant_id: job.tenant_id, scope: "launch", status: "approved", actor_type: "platform_admin", actor_id: actorId, notes: input.notes ?? null, snapshot: { content_versions: latest.size, production_ready: false } })]);
    await audit("onboarding.final_launch_approved", { job_id: job.id, production_ready: false });
    return { message: "Final Nova Suite launch approval recorded. Production remains blocked until the domain checks pass and launch is explicitly marked." };
  }
  if (action === "mark_launched") {
    if (status !== "ready_for_launch") throw new Error("Final Nova Suite launch approval is required.");
    const { data: job } = await supabase.from("website_generation_jobs").select("id,tenant_id").eq("invitation_id", id).order("created_at", { ascending: false }).limit(1).single(); if (!job?.tenant_id) throw new Error("Generated tenant not found.");
    const { data: domain } = await supabase.from("domains").select("id").eq("tenant_id", job.tenant_id).eq("is_preview", false).eq("is_primary", true).eq("is_verified", true).eq("vercel_status", "verified").eq("ssl_status", "issued").eq("www_redirect_verified", true).eq("canonical_verified", true).eq("email_records_preserved", true).eq("launch_status", "ready").maybeSingle();
    if (!domain) throw new Error("The production domain, SSL, redirects, canonicals, and preserved email records must all be verified.");
    const [{ data: branding }, { count: pendingAlt }, { count: criticalSeo }] = await Promise.all([supabase.from("branding_settings").select("logo_path").eq("tenant_id", job.tenant_id).single(), supabase.from("project_images").select("id", { count: "exact", head: true }).eq("tenant_id", job.tenant_id).eq("alt_decision", "pending"), supabase.from("seo_issues").select("id", { count: "exact", head: true }).eq("tenant_id", job.tenant_id).eq("severity", "critical").is("resolved_at", null)]);
    if (!branding?.logo_path?.startsWith(`tenants/${job.tenant_id}/`)) throw new Error("The processed tenant logo is missing.");
    if ((pendingAlt ?? 0) > 0) throw new Error("Every generated image needs an approved alt-text or decorative decision.");
    if ((criticalSeo ?? 0) > 0) throw new Error("Critical SEO issues must be resolved before launch.");
    const now = new Date().toISOString();
    await Promise.all([supabase.from("pages").update({ status: "published", is_indexable: true, is_follow: true, published_at: now, reviewed_by: actorId, reviewed_at: now }).eq("tenant_id", job.tenant_id), supabase.from("tenants").update({ launch_status: "launched", production_ready: true, updated_by: actorId }).eq("id", job.tenant_id), supabase.from("domains").update({ launch_status: "launched" }).eq("id", domain.id), supabase.from("onboarding_invitations").update({ status: "launched", updated_by: actorId }).eq("id", id), supabase.from("audit_logs").insert({ tenant_id: job.tenant_id, actor_id: actorId, action: "tenant.explicit_first_launch", entity_type: "tenant", entity_id: job.tenant_id, after_data: { domain_id: domain.id, launched_at: now } })]);
    return { message: "The explicitly approved production site is now marked live. The preview remains noindex." };
  }
  throw new Error("Unsupported invitation action.");
}
