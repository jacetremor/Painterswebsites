import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isPreviewHostname, normalizeHostname, previewSlugFromHostname, resolveSeedTenant, shouldNoIndexHostname } from "@/lib/tenant/host";

export async function proxy(request: NextRequest) {
  const rawHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const host = normalizeHostname(rawHost);
  const tenant = resolveSeedTenant(host);

  if (tenant && !isPreviewHostname(host) && host !== normalizeHostname(tenant.primaryDomain)) {
    const primaryHosts = tenant.secondaryDomains.map(normalizeHostname);
    if (primaryHosts.includes(host)) {
      const destination = request.nextUrl.clone();
      destination.protocol = "https";
      destination.host = tenant.primaryDomain;
      return NextResponse.redirect(destination, 308);
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-host", host);
  requestHeaders.set("x-request-pathname", request.nextUrl.pathname);
  const previewSlug = previewSlugFromHostname(host);
  const rewriteUrl = previewSlug ? request.nextUrl.clone() : null;
  if (rewriteUrl) rewriteUrl.pathname = `/preview/${previewSlug}${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
  let targetRewrite = rewriteUrl;
  const pendingCookies: Array<{ name: string; value: string; options: Parameters<NextResponse["cookies"]["set"]>[2] }> = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          pendingCookies.push(...cookiesToSet);
        },
      },
    });
    await supabase.auth.getUser();
    if (!tenant && !previewSlug && host && host !== "localhost" && host !== "127.0.0.1") {
      const { data: dynamicDomain } = await supabase.from("domains").select("tenant_id,is_primary,is_verified,is_preview,launch_status").eq("hostname", host).eq("is_preview", false).maybeSingle();
      if (dynamicDomain?.tenant_id && dynamicDomain.is_primary && dynamicDomain.is_verified && dynamicDomain.launch_status === "launched") {
        requestHeaders.set("x-dynamic-tenant-id", dynamicDomain.tenant_id);
        targetRewrite = request.nextUrl.clone();
        targetRewrite.pathname = `/live/${dynamicDomain.tenant_id}${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
      }
    }
  }
  const response = targetRewrite ? NextResponse.rewrite(targetRewrite, { request: { headers: requestHeaders } }) : NextResponse.next({ request: { headers: requestHeaders } });
  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  if (shouldNoIndexHostname(host) || request.nextUrl.pathname.startsWith("/onboarding") || request.nextUrl.pathname.startsWith("/dashboard/onboarding")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
