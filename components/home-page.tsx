import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Phone } from "lucide-react";
import { BeforeAfter } from "@/components/before-after";
import { ContactForm } from "@/components/contact-form";
import { JsonLd } from "@/components/json-ld";
import { ProjectCard } from "@/components/project-card";
import { pageSchema } from "@/lib/seo/structured-data";
import type { ContentPage, Tenant } from "@/lib/types";

export function HomePage({ tenant, page }: { tenant: Tenant; page: ContentPage }) {
  const featuredProject = tenant.projects[0]!;
  const before = featuredProject.images.find((image) => image.stage === "before")!;
  const after = featuredProject.images.find((image) => image.stage === "after")!;
  return (
    <>
      <JsonLd data={pageSchema(tenant, page)} />
      <section className="hero">
        <Image src={tenant.heroImage.src} alt={tenant.heroImage.alt} fill loading="eager" fetchPriority="high" sizes="100vw" />
        <div className="container hero__content">
          <p className="eyebrow">Serving {tenant.serviceArea}</p>
          <h1>{page.seo.h1}</h1>
          <p>{page.intro}</p>
          <div className="button-row">
            <Link className="button button--accent" href="/contact">{tenant.primaryCta}<ArrowRight size={18} aria-hidden="true" /></Link>
            <a className="button button--ghost" href={`tel:${tenant.phone.replace(/\D/g, "")}`}><Phone size={18} aria-hidden="true" />Call {tenant.phone}</a>
          </div>
        </div>
      </section>

      <div className="stat-row" aria-label="Service commitments">
        <div className="stat"><strong>11</strong><span>documented service scopes</span></div>
        <div className="stat"><strong>20</strong><span>local service-area guides</span></div>
        <div className="stat"><strong>1 plan</strong><span>from preparation to walkthrough</span></div>
      </div>

      <section className="section">
        <div className="container grid-2">
          <div><p className="eyebrow">Residential painting</p><h2>Finish choices made for real life</h2><p className="lede">Interior rooms, exteriors, cabinets, decks, fences, brick, siding, and stucco each need their own preparation and product logic.</p><Link className="button button--ghost" href="/residential-painting">Explore residential painting<ArrowRight size={18} aria-hidden="true" /></Link></div>
          <div><p className="eyebrow">Commercial painting</p><h2>Scheduling that respects operations</h2><p className="lede">Plan access, occupied spaces, low-odor needs, drying time, and turnover milestones before work reaches the calendar.</p><Link className="button button--ghost" href="/commercial-painting">Explore commercial painting<ArrowRight size={18} aria-hidden="true" /></Link></div>
        </div>
      </section>

      <section className="section band" id="services">
        <div className="container">
          <p className="eyebrow">Featured services</p><h2>A scope for the surface, not a generic package</h2>
          <div className="grid-3">
            {tenant.services.slice(0, 6).map((service) => <article className="card" key={service.id}><Link className="card-link card__body" href={`/${service.slug}`}><span className="pill">{service.category}</span><h3>{service.name}</h3><p>{service.intro}</p><strong>See the process</strong></Link></article>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2">
          <div><p className="eyebrow">Before and after</p><h2>Project evidence needs context</h2><p>{featuredProject.intro}</p><BeforeAfter before={before} after={after} title={featuredProject.name} /></div>
          <div><p className="eyebrow">Company introduction</p><h2>{tenant.theme === "summit" ? "Preparation is part of the finish" : "Clear guidance makes color easier"}</h2>{page.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<ul className="link-list"><li><CheckCircle2 size={18} aria-hidden="true" /> Surface-specific preparation</li><li><CheckCircle2 size={18} aria-hidden="true" /> Written scope and sequence</li><li><CheckCircle2 size={18} aria-hidden="true" /> Accessible final walkthrough</li></ul><div className="button-row"><Link className="button" href="/about">How the process works</Link><Link className="button button--ghost" href="/gallery">Browse project records</Link></div></div>
        </div>
      </section>

      <section className="section band" id="locations">
        <div className="container"><p className="eyebrow">Featured locations</p><h2>Painting guidance grounded in place</h2><div className="grid-4">{tenant.locations.slice(0, 8).map((location) => <article className="card" key={location.id}><Link className="card-link card__body" href={`/${location.slug}`}><h3>{location.city}</h3><p>{location.localDetail}</p><strong>Painting in {location.city}</strong></Link></article>)}</div></div>
      </section>

      <section className="section">
        <div className="container"><p className="eyebrow">Featured projects</p><h2>See the scope behind the image</h2><div className="grid-3">{tenant.projects.slice(0, 3).map((project) => <ProjectCard key={project.id} project={project} />)}</div></div>
      </section>

      <section className="section band">
        <div className="container grid-2">
          <div><p className="eyebrow">Customer evidence</p><h2>Testimonials need a real source</h2><p className="lede">The platform can publish testimonials with source links, but this demonstration does not invent them.</p>{tenant.testimonials.slice(0, 2).map((item) => <blockquote key={item.id}><p>“{item.quote}”</p><footer>{item.customerName}, {item.city}</footer></blockquote>)}</div>
          <div><p className="eyebrow">Questions</p><h2>Start with the practical details</h2><div className="faq"><details><summary>How far ahead should I request an estimate?</summary><p>Share your preferred timing early. Availability depends on scope, weather, product requirements, and current scheduling.</p></details><details><summary>Do I need to choose colors first?</summary><p>No. Color and sheen can be confirmed after scope, but selections and samples should be approved before materials are ordered.</p></details><details><summary>What makes an estimate accurate?</summary><p>Surface condition, repairs, access, protection, product system, number of colors, and sequencing all matter more than square footage alone.</p></details></div></div>
        </div>
      </section>

      <section className="section" id="estimate"><div className="container grid-2"><div><p className="eyebrow">Request an estimate</p><h2>Tell us what the space needs</h2><p className="lede">Your notes go only to {tenant.name}. Include photos later through the secure follow-up process.</p><p><strong>{tenant.phone}</strong><br />{tenant.email}<br />{tenant.businessHours}</p><p><Link href="/contact">View complete contact information</Link></p></div><ContactForm serviceArea={tenant.serviceArea} /></div></section>
    </>
  );
}
