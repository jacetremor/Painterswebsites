import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { loadOnboardingSession, OnboardingAccessError } from "@/lib/onboarding/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Client onboarding | Nova Suite", robots: { index: false, follow: false, nocache: true } };

export default async function OnboardingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let session;
  let errorMessage = "";
  try {
    session = await loadOnboardingSession(token);
  } catch (error) {
    errorMessage = error instanceof OnboardingAccessError ? error.message : "This onboarding form is unavailable.";
  }
  if (session) return <OnboardingWizard token={token} initialSession={session} />;
  return <section className="platform-message"><div><p className="eyebrow">Nova Suite onboarding</p><h1>We could not open this form.</h1><p>{errorMessage}</p><p>Contact Nova Suite for a fresh invitation link.</p></div></section>;
}
