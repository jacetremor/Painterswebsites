import type { CSSProperties, ReactNode } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { getCurrentTenant } from "@/lib/content/repository";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PageTransition } from "@/components/motion/page-transition";
import { PublicMotion } from "@/components/motion/public-motion";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/instrument-serif";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-platform" });

export default async function RootLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-request-pathname") ?? "";
  const host = requestHeaders.get("x-tenant-host") ?? "";
  const isOwnerPortalSurface = pathname === "/dashboard" || pathname === "/login" || pathname === "/unauthorized" || pathname.startsWith("/auth/callback");
  const isPlatformSurface = pathname.startsWith("/onboarding") || pathname.startsWith("/dashboard") || pathname.startsWith("/preview") || pathname.startsWith("/live") || isOwnerPortalSurface || Boolean(requestHeaders.get("x-dynamic-tenant-id")) || (host.endsWith(".novasuite.io") && !host.startsWith("app."));
  if (isPlatformSurface) {
    const platformStyle = {
      "--primary": "#48b889",
      "--secondary": "#292d29",
      "--accent": "#48b889",
      "--surface": "#171918",
      "--ink": "#f4f6f4",
      "--radius": "8px",
      "--heading-font": "var(--font-platform), ui-sans-serif, system-ui, sans-serif",
      "--body-font": "var(--font-platform), ui-sans-serif, system-ui, sans-serif",
    } as CSSProperties;
    return (
      <html lang="en" style={platformStyle} data-scroll-behavior="smooth" className={cn("font-sans", geist.variable)}>
        <body data-theme="platform">
          <a className="skip-link" href="#main-content">Skip to main content</a>
          <header className="platform-header">
            <Link className="platform-brand" href={isOwnerPortalSurface ? "/dashboard" : "/dashboard/onboarding"}><span className="platform-brand__mark" aria-hidden="true">NS</span><span className="platform-brand__name">Nova Suite</span></Link>
            <span className="platform-context">{isOwnerPortalSurface ? "Owner portal" : "Website operations"}</span>
          </header>
          <main id="main-content">{children}</main>
        </body>
      </html>
    );
  }
  const tenant = await getCurrentTenant();
  const style = {
    "--primary": tenant.branding.primary,
    "--secondary": tenant.branding.secondary,
    "--accent": tenant.branding.accent,
    "--surface": tenant.branding.surface,
    "--ink": tenant.branding.ink,
    "--radius": tenant.branding.radius,
    "--heading-font": tenant.theme === "summit"
      ? '"Plus Jakarta Sans Variable", ui-sans-serif, system-ui, sans-serif'
      : '"Instrument Serif", Georgia, serif',
    "--body-font": tenant.theme === "summit"
      ? '"Plus Jakarta Sans Variable", ui-sans-serif, system-ui, sans-serif'
      : '"DM Sans Variable", ui-sans-serif, system-ui, sans-serif',
  } as CSSProperties;

  return (
    <html lang="en" style={style} data-scroll-behavior="smooth">
      <body data-theme={tenant.theme}>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <PublicMotion />
        <SiteHeader tenant={tenant} />
        <PageTransition>{children}</PageTransition>
        <SiteFooter tenant={tenant} showOwnerLogin={pathname === "/"} />
      </body>
    </html>
  );
}
