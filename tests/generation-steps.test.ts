import { describe, expect, it } from "vitest";
import { generationStepRows, WEBSITE_GENERATION_STEPS } from "@/lib/generation/steps";

describe("durable website generation", () => {
  it("records exactly 30 ordered, unique, idempotent steps", () => {
    expect(WEBSITE_GENERATION_STEPS).toHaveLength(30); expect(new Set(WEBSITE_GENERATION_STEPS).size).toBe(30);
    const rows = generationStepRows("job-123"); expect(rows[0]).toMatchObject({ ordinal: 1, step_key: "validate_submission", status: "pending" });
    expect(rows.at(-1)).toMatchObject({ ordinal: 30, step_key: "notify_nova_suite" }); expect(new Set(rows.map((row) => row.idempotency_key)).size).toBe(30);
  });
});

