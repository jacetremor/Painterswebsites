import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { normalizeHostname, resolveSeedTenant } from "@/lib/tenant/host";

export const runtime = "edge";

export function GET(request: NextRequest) {
  const tenant = resolveSeedTenant(normalizeHostname(request.headers.get("x-forwarded-host") ?? request.headers.get("host")));
  if (!tenant) return new Response("Not found", { status: 404 });
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: tenant.branding.primary, color: "white", fontSize: 34, fontWeight: 900 }}>{tenant.branding.logoMark}</div>, { width: 64, height: 64 });
}
