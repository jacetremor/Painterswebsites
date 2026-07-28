import type { ContactInput } from "@/lib/validation/contact";
import type { Tenant } from "@/lib/types";

export type ContactNotificationInput = {
  id: string;
  tenant: Tenant;
  recipients: string[];
  contact: ContactInput;
};

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function buildContactNotification({ id, tenant, recipients, contact }: ContactNotificationInput) {
  const projectLabel = compact(contact.projectType) || "painting estimate";
  const lines = [
    `New estimate request for ${tenant.name}`,
    "",
    `Name: ${compact(contact.name)}`,
    `Email: ${compact(contact.email)}`,
    `Phone: ${compact(contact.phone) || "Not provided"}`,
    `ZIP code: ${compact(contact.postalCode) || "Not provided"}`,
    `Project type: ${projectLabel}`,
    "",
    "Project details:",
    contact.message.trim(),
    "",
    `Submission ID: ${id}`,
  ];

  return {
    from: process.env.CONTACT_FROM_EMAIL ?? "",
    to: recipients,
    reply_to: contact.email,
    subject: `[${tenant.name}] New ${projectLabel} request from ${compact(contact.name)}`,
    text: lines.join("\n"),
    tags: [
      { name: "tenant_id", value: tenant.id },
      { name: "submission_id", value: id },
    ],
  };
}
