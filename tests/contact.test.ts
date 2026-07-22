import { describe, expect, it } from "vitest";
import { contactSchema } from "@/lib/validation/contact";

describe("contact validation", () => {
  it("accepts a useful request and rejects spam or thin messages", () => {
    expect(contactSchema.safeParse({ name: "Jamie", email: "jamie@example.com", message: "Please estimate our kitchen and hallway walls.", website: "" }).success).toBe(true);
    expect(contactSchema.safeParse({ name: "J", email: "bad", message: "Hi", website: "spam.example" }).success).toBe(false);
  });
});
