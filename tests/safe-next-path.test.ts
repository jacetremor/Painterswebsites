import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/security/safe-next-path";

describe("auth callback destination", () => {
  it("permits same-origin paths", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/dashboard#projects")).toBe("/dashboard#projects");
  });

  it("rejects external and protocol-relative destinations", () => {
    expect(safeNextPath("https://example.com")).toBe("/dashboard");
    expect(safeNextPath("//example.com")).toBe("/dashboard");
    expect(safeNextPath("/\\example.com")).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
  });
});
