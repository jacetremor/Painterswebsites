import { describe, expect, it } from "vitest";
import { createOnboardingToken, hashOnboardingToken, isPlausibleOnboardingToken, tokenHashMatches } from "@/lib/onboarding/token";

describe("onboarding invitation tokens", () => {
  it("creates unguessable URL-safe tokens and stores only deterministic hashes", () => {
    const first = createOnboardingToken(); const second = createOnboardingToken();
    expect(first.token).not.toBe(second.token); expect(first.token).toMatch(/^[A-Za-z0-9_-]+$/); expect(first.token.length).toBeGreaterThanOrEqual(43);
    expect(first.tokenHash).toHaveLength(64); expect(first.tokenHash).toBe(hashOnboardingToken(first.token)); expect(tokenHashMatches(first.token, first.tokenHash)).toBe(true);
    expect(tokenHashMatches(second.token, first.tokenHash)).toBe(false); expect(isPlausibleOnboardingToken("short")).toBe(false);
  });
});

