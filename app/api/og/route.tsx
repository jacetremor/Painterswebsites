import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { normalizeHostname, resolveSeedTenant } from "@/lib/tenant/host";

export const runtime = "edge";

export function GET(request: NextRequest) {
  const tenant = resolveSeedTenant(normalizeHostname(request.headers.get("x-forwarded-host") ?? request.headers.get("host")));
  if (!tenant) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: tenant.branding.secondary, color: tenant.branding.ink, padding: "70px", borderTop: `22px solid ${tenant.branding.accent}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "24px", color: tenant.branding.primary, fontSize: 34, fontWeight: 800 }}><div style={{ display: "flex", width: 66, height: 66, border: `3px solid ${tenant.branding.primary}`, alignItems: "center", justifyContent: "center" }}>{tenant.branding.logoMark}</div>{tenant.name}</div>
      <div style={{ display: "flex", flexDirection: "column" }}><div style={{ fontSize: 76, lineHeight: 1.05, fontWeight: 800, maxWidth: 940 }}>{tenant.pages[0]?.seo.h1}</div><div style={{ marginTop: 28, fontSize: 30, color: tenant.branding.primary }}>{tenant.serviceArea}</div></div>
      <div style={{ display: "flex", fontSize: 24 }}>Residential · Commercial · Project planning</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
