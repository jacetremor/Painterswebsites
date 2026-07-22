import type { GenerationJobStatus, OnboardingStatus } from "@/lib/onboarding/types";

const TERMINAL = new Set<OnboardingStatus>(["launched", "expired", "revoked"]);
const TRANSITIONS: Record<OnboardingStatus, readonly OnboardingStatus[]> = {
  draft: ["sent", "revoked", "expired"],
  sent: ["opened", "revoked", "expired"],
  opened: ["in_progress", "revoked", "expired"],
  in_progress: ["submitted", "revoked", "expired"],
  submitted: ["changes_requested", "approved", "revoked", "expired"],
  changes_requested: ["in_progress", "revoked", "expired"],
  approved: ["website_generating", "revoked", "expired"],
  website_generating: ["preview_ready", "revoked"],
  preview_ready: ["ready_for_launch", "revoked"],
  ready_for_launch: ["launched", "revoked"],
  launched: [],
  expired: [],
  revoked: [],
};

const JOB_TRANSITIONS: Record<GenerationJobStatus, readonly GenerationJobStatus[]> = {
  queued: ["running", "failed"],
  running: ["waiting_for_input", "failed", "completed"],
  waiting_for_input: ["queued"],
  failed: ["queued"],
  completed: [],
};

export function canTransitionOnboarding(from: OnboardingStatus, to: OnboardingStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertOnboardingTransition(from: OnboardingStatus, to: OnboardingStatus): void {
  if (!canTransitionOnboarding(from, to)) throw new Error(`Invalid onboarding transition: ${from} -> ${to}`);
}

export function canTransitionGenerationJob(from: GenerationJobStatus, to: GenerationJobStatus): boolean {
  return JOB_TRANSITIONS[from].includes(to);
}

export function isInvitationUsable(status: OnboardingStatus, expiresAt: string | Date, now = new Date()): boolean {
  return !TERMINAL.has(status) && new Date(expiresAt).getTime() > now.getTime();
}

