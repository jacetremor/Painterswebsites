export const ONBOARDING_STATUSES = [
  "draft", "sent", "opened", "in_progress", "submitted", "changes_requested",
  "approved", "website_generating", "preview_ready", "ready_for_launch",
  "launched", "expired", "revoked",
] as const;

export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];
export type GenerationJobStatus = "queued" | "running" | "waiting_for_input" | "failed" | "completed";
export type GenerationStepStatus = "pending" | "running" | "completed" | "failed" | "blocked" | "skipped";

export type OnboardingAnswerMap = Record<string, unknown>;

export type OnboardingInvitationSummary = {
  id: string;
  clientName: string;
  companyName: string;
  clientEmail: string;
  proposedPreviewSlug: string;
  status: OnboardingStatus;
  expiresAt: string;
  completionPercent: number;
  updatedAt: string;
};

export type OnboardingSectionAnswer = {
  sectionKey: string;
  answerData: OnboardingAnswerMap;
  isComplete: boolean;
  updatedAt: string;
};

export type OnboardingSession = {
  invitation: OnboardingInvitationSummary;
  currentSection: string;
  answers: Record<string, OnboardingSectionAnswer>;
  clientConfirmed: boolean;
  confirmationName?: string;
  demoMode?: boolean;
};
