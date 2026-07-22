import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_BYTES = 32;

export function createOnboardingToken(): { token: string; tokenHash: string } {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  return { token, tokenHash: hashOnboardingToken(token) };
}

export function hashOnboardingToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isPlausibleOnboardingToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{32,128}$/.test(token);
}

export function tokenHashMatches(token: string, expectedHash: string): boolean {
  if (!isPlausibleOnboardingToken(token) || !/^[0-9a-f]{64}$/.test(expectedHash)) return false;
  const actual = Buffer.from(hashOnboardingToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

