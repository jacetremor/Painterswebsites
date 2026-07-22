import type { CSSProperties, ReactNode } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { getCurrentTenant } from "@/lib/content/repository";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "@fontsource-variable/manrope";
import "@fontsource-variable/newsreader";
import "./globals.css";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-request-pathname") ?? "";
  const host = requestHeaders.get("x-tenant-host") ?? "";
  const isPlatformSurface = pathname.startsWith("/onboarding") || pathname.startsWith("/dashboard/onboarding") || pathname.startsWith("/preview") || pathname.startsWith("/live") || Boolean(requestHeaders.get("x-dynamic-tenant-id")) || (host.endsWith(".novasuite.io") && !host.startsWith("app."));
  if (isPlatformSurface) {
    const platformStyle = {
      "--primary": "#17463d", "--secondary": "#eef3f0", "--accent": "#f2b84b", "--surface": "#ffffff",
      "--ink": "#17221f", "--radius": "6px", "--heading-font": "Inter, ui-sans-serif, system-ui, sans-serif",
      "--body-font": "Inter, ui-sans-serif, system-ui, sans-serif",
    } as CSSProperties;
    return (
      <html lang="en" style={platformStyle} data-scroll-behavior="smooth">
        <body data-theme="platform">
          <a className="skip-link" href="#main-content">Skip to main content</a>
          <header className="platform-header"><Link className="platform-brand" href="/dashboard/onboarding"><span aria-hidden="true">NS</span> Nova Suite</Link></header>
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
    "--heading-font": tenant.theme === "summit" ? '"Manrope Variable", ui-sans-serif, system-ui, sans-serif' : '"Newsreader Variable", Georgia, serif',
    "--body-font": '"Manrope Variable", ui-sans-serif, system-ui, sans-serif',
  } as CSSProperties;

  return (
    <html lang="en" style={style} data-scroll-behavior="smooth">
      <body data-theme={tenant.theme}>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <SiteHeader tenant={tenant} />
        <main id="main-content">{children}</main>
        <SiteFooter tenant={tenant} />
      </body>
    </html>
  );
}
