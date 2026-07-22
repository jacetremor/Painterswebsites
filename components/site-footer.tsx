import Link from "next/link";
import type { Tenant } from "@/lib/types";

export function SiteFooter({ tenant }: { tenant: Tenant }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <section>
            <div className="footer-brand"><span className="brand__mark" aria-hidden="true">{tenant.branding.logoMark}</span><h2>{tenant.name}</h2></div>
            <p>{tenant.serviceArea}</p>
            <p><a href={`tel:${tenant.phone.replace(/\D/g, "")}`}>{tenant.phone}</a><br /><a href={`mailto:${tenant.email}`}>{tenant.email}</a></p>
          </section>
          <nav aria-label="Services">
            <h2>Services</h2>
            <ul className="link-list">
              {tenant.services.slice(0, 5).map((service) => <li key={service.id}><Link href={`/${service.slug}`}>{service.name}</Link></li>)}
            </ul>
          </nav>
          <nav aria-label="Company">
            <h2>Company</h2>
            <ul className="link-list">
              <li><Link href="/about">About us</Link></li>
              <li><Link href="/gallery">Project gallery</Link></li>
              <li><Link href="/blog">Painting guide</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </nav>
        </div>
        <p className="fine-print">© {new Date().getFullYear()} {tenant.legalName}. Demonstration data and images require verification or replacement before production launch.</p>
      </div>
    </footer>
  );
}
