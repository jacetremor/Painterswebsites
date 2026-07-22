import type { CSSProperties, ReactNode } from "react";
import { getCurrentTenant } from "@/lib/content/repository";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const tenant = await getCurrentTenant();
  const style = {
    "--primary": tenant.branding.primary,
    "--secondary": tenant.branding.secondary,
    "--accent": tenant.branding.accent,
    "--surface": tenant.branding.surface,
    "--ink": tenant.branding.ink,
    "--radius": tenant.branding.radius,
    "--heading-font": tenant.theme === "summit" ? '"Arial Narrow", "Roboto Condensed", sans-serif' : 'Georgia, "Times New Roman", serif',
    "--body-font": tenant.theme === "summit" ? 'Inter, ui-sans-serif, system-ui, sans-serif' : 'Aptos, ui-sans-serif, system-ui, sans-serif',
  } as CSSProperties;

  return (
    <html lang="en" style={style}>
      <body data-theme={tenant.theme}>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <SiteHeader tenant={tenant} />
        <main id="main-content">{children}</main>
        <SiteFooter tenant={tenant} />
      </body>
    </html>
  );
}
