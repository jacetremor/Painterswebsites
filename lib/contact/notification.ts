import "server-only";

import { buildContactNotification, type ContactNotificationInput } from "@/lib/contact/notification-content";

export type ContactNotificationResult =
  | { status: "sent"; providerId: string }
  | { status: "pending"; error: string }
  | { status: "failed"; error: string };

export async function sendContactNotification(input: ContactNotificationInput): Promise<ContactNotificationResult> {
  const apiKey = process.env.CONTACT_EMAIL_PROVIDER_API_KEY;
  const payload = buildContactNotification(input);
  if (!apiKey || !payload.from || input.recipients.length === 0) {
    return { status: "pending", error: "Email delivery is not configured." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `contact-${input.id}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await response.json() as { id?: string; message?: string };
    if (!response.ok || !body.id) {
      return { status: "failed", error: body.message ?? `Email provider returned ${response.status}.` };
    }
    return { status: "sent", providerId: body.id };
  } catch {
    return { status: "failed", error: "The email provider could not be reached." };
  }
}
