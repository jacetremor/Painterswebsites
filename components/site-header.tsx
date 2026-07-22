import Link from "next/link";
import { Menu, Phone } from "lucide-react";
import type { Tenant } from "@/lib/types";

export function SiteHeader({ tenant }: { tenant: Tenant }) {
  const links = [
    ["Residential", "/residential-painting"],
    ["Commercial", "/commercial-painting"],
    ["Gallery", "/gallery"],
    [tenant.theme === "heritage" ? "Our Story" : "About", "/about"],
    ["Blog", "/blog"],
  ] as const;
  const navigation = links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>);
  return (
    <header className="site-header">
      <div className="container site-header__bar">
        <Link className="brand" href="/" aria-label={`${tenant.name} home`}>
          <span className="brand__mark" aria-hidden="true">{tenant.branding.logoMark}</span>
          <span className="brand__text"><strong>{tenant.name}</strong><small>{tenant.theme === "summit" ? "Salt Lake City" : "Denver, Colorado"}</small></span>
        </Link>
        <nav className="nav desktop-nav" aria-label="Primary navigation">
          {navigation}
          <a className="header-phone" href={`tel:${tenant.phone.replace(/\D/g, "")}`}><Phone size={16} aria-hidden="true" /> {tenant.phone}</a>
          <Link className="button" href="/contact">{tenant.primaryCta}</Link>
        </nav>
        <details className="mobile-menu">
          <summary className="menu-summary"><Menu size={21} aria-hidden="true" /><span className="visually-hidden">Open menu</span></summary>
          <nav className="nav" aria-label="Mobile navigation">
            {navigation}
            <a className="header-phone" href={`tel:${tenant.phone.replace(/\D/g, "")}`}><Phone size={16} aria-hidden="true" /> {tenant.phone}</a>
            <Link className="button" href="/contact">{tenant.primaryCta}</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
