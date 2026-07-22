import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isPreviewHostname, normalizeHostname, resolveSeedTenant, shouldNoIndexHostname } from "@/lib/tenant/host";

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
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser();
  }
  if (shouldNoIndexHostname(host)) response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
