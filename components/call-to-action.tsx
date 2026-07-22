import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import type { Tenant } from "@/lib/types";

export function CallToAction({ tenant, heading = "Let’s define the right scope" }: { tenant: Tenant; heading?: string }) {
  return (
    <section className="section cta-band">
      <div className="container grid-2">
        <div><p className="eyebrow">Next step</p><h2>{heading}</h2></div>
        <div>
          <p className="lede">Share the surfaces, condition, location, and timing. We’ll turn those details into a clear estimate conversation.</p>
          <div className="button-row">
            <Link className="button" href="/contact">{tenant.primaryCta}<ArrowRight size={18} aria-hidden="true" /></Link>
            <a className="button button--ghost" href={`tel:${tenant.phone.replace(/\D/g, "")}`}><Phone size={18} aria-hidden="true" />{tenant.phone}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
