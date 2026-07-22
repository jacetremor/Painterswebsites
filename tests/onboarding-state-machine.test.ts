import { describe, expect, it } from "vitest";
import { assertOnboardingTransition, canTransitionGenerationJob, canTransitionOnboarding, isInvitationUsable } from "@/lib/onboarding/state-machine";

describe("onboarding state machine", () => {
  it("requires review and explicit generation/launch transitions", () => {
    expect(canTransitionOnboarding("submitted", "approved")).toBe(true);
    expect(canTransitionOnboarding("approved", "preview_ready")).toBe(false);
    expect(canTransitionOnboarding("approved", "website_generating")).toBe(true);
    expect(canTransitionOnboarding("preview_ready", "launched")).toBe(false);
    expect(canTransitionOnboarding("ready_for_launch", "launched")).toBe(true);
    expect(() => assertOnboardingTransition("in_progress", "launched")).toThrow(/Invalid onboarding transition/);
  });

  it("permits only explicit retry and rejects expired links", () => {
    expect(canTransitionGenerationJob("failed", "queued")).toBe(true);
    expect(canTransitionGenerationJob("failed", "running")).toBe(false);
    expect(isInvitationUsable("in_progress", new Date(Date.now() + 60_000))).toBe(true);
    expect(isInvitationUsable("in_progress", new Date(Date.now() - 1))).toBe(false);
    expect(isInvitationUsable("revoked", new Date(Date.now() + 60_000))).toBe(false);
  });
});

