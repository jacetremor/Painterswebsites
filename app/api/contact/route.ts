import { NextRequest, NextResponse } from "next/server";
import { resolveSeedTenant, normalizeHostname } from "@/lib/tenant/host";
import { takeRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { contactSchema } from "@/lib/validation/contact";

export async function POST(request: NextRequest) {
  const rawHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const host = normalizeHostname(rawHost);
  const tenant = resolveSeedTenant(host);
  if (!tenant) return NextResponse.json({ message: "Unknown company domain." }, { status: 404 });

  const origin = request.headers.get("origin");
  if (origin && normalizeHostname(new URL(origin).host) !== host) {
    return NextResponse.json({ message: "Request origin was not accepted." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_000) return NextResponse.json({ message: "Request is too large." }, { status: 413 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!takeRateLimit(`${tenant.id}:${ip}`)) return NextResponse.json({ message: "Please wait before sending another request." }, { status: 429 });

  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ message: "Invalid request body." }, { status: 400 }); }
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ message: "Please check the required contact details." }, { status: 422 });

  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const { error } = await supabase.from("contact_submissions").insert({
      tenant_id: tenant.id,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      postal_code: parsed.data.postalCode,
      project_type: parsed.data.projectType,
      message: parsed.data.message,
      source_path: request.nextUrl.pathname,
      status: "new",
    });
    if (error) return NextResponse.json({ message: "The request could not be stored. Please call instead." }, { status: 503 });
  }

  return NextResponse.json({ message: supabase ? `Thanks. ${tenant.name} received your request.` : "Demonstration mode validated your request; connect Supabase to deliver it." }, { status: 202 });
}
