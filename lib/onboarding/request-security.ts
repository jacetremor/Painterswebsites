import { NextRequest } from "next/server";
import { normalizeHostname } from "@/lib/tenant/host";

export function onboardingWriteRequestIsAllowed(request: NextRequest, maxBytes = 512_000): { allowed: true } | { allowed: false; status: number; message: string } {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) return { allowed: false, status: 413, message: "Request is too large." };
  const origin = request.headers.get("origin");
  const host = normalizeHostname(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  if (origin) {
    let originHost: string;
    try { originHost = normalizeHostname(new URL(origin).host); } catch { return { allowed: false, status: 403, message: "Request origin was not accepted." }; }
    if (originHost !== host) return { allowed: false, status: 403, message: "Request origin was not accepted." };
  }
  return { allowed: true };
}
