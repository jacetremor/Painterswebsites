import { afterEach, describe, expect, it } from "vitest";
import { TENANTS } from "@/lib/content/seeds";
import { buildContactNotification } from "@/lib/contact/notification-content";

describe("contact notifications", () => {
  const previousFrom = process.env.CONTACT_FROM_EMAIL;

  afterEach(() => {
    process.env.CONTACT_FROM_EMAIL = previousFrom;
  });

  it("builds a tenant-specific owner notification without HTML", () => {
    process.env.CONTACT_FROM_EMAIL = "Nova Suite <leads@novasuite.io>";
    const payload = buildContactNotification({
      id: "submission-123",
      tenant: TENANTS[0]!,
      recipients: ["owner@example.com"],
      contact: {
        name: "Jamie Homeowner",
        email: "jamie@example.com",
        phone: "(801) 555-0100",
        postalCode: "84103",
        projectType: "Interior painting",
        message: "We would like an estimate for the kitchen and hallway walls.",
        website: "",
      },
    });

    expect(payload.to).toEqual(["owner@example.com"]);
    expect(payload.reply_to).toBe("jamie@example.com");
    expect(payload.subject).toContain("Summit Painting Co.");
    expect(payload.text).toContain("Submission ID: submission-123");
    expect(payload).not.toHaveProperty("html");
  });
});
