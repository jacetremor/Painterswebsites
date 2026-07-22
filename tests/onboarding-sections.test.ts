import { describe, expect, it } from "vitest";
import { calculateCompletion, ONBOARDING_SECTIONS, PAINTING_SERVICES, validateOnboardingSection } from "@/lib/onboarding/sections";

describe("guided onboarding form", () => {
  it("keeps the required 17 ordered sections and 11 controlled services", () => {
    expect(ONBOARDING_SECTIONS).toHaveLength(17); expect(new Set(ONBOARDING_SECTIONS.map((section) => section.key)).size).toBe(17);
    expect(ONBOARDING_SECTIONS.at(-1)?.key).toBe("final_review"); expect(PAINTING_SERVICES).toHaveLength(11);
  });

  it("applies conditional domain and per-service validation", () => {
    const missingDomain = validateOnboardingSection("domain_information", { domain_model: "Client already owns a domain", preserve_email_confirmation: true });
    expect(missingDomain.success).toBe(false); if (!missingDomain.success) expect(missingDomain.errors.domain_name).toBeTruthy();
    const missingDetail = validateOnboardingSection("services", { selected_services: ["Interior Painting"], service_details: [{ service: "Exterior Painting", market: "Both", description: "Exterior work" }] });
    expect(missingDetail.success).toBe(false); if (!missingDetail.success) expect(missingDetail.errors.service_details).toBeTruthy();
  });

  it("computes progress from completed sections rather than arbitrary fields", () => {
    const answers = Object.fromEntries(ONBOARDING_SECTIONS.slice(0, 8).map((section) => [section.key, { isComplete: true }]));
    expect(calculateCompletion(answers)).toBe(50);
  });
});

