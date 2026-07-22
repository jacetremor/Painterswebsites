import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Brush, Check, ClipboardCheck, Phone, ShieldCheck } from "lucide-react";
import { BeforeAfter } from "@/components/before-after";
import { ContactForm } from "@/components/contact-form";
import { JsonLd } from "@/components/json-ld";
import { PaintMarquee } from "@/components/motion/paint-marquee";
import { SplitText } from "@/components/motion/split-text";
import { SpotlightCard } from "@/components/motion/spotlight-card";
import { ProjectCard } from "@/components/project-card";
import { pageSchema } from "@/lib/seo/structured-data";
import type { ContentPage, Tenant } from "@/lib/types";

export function HomePage({ tenant, page }: { tenant: Tenant; page: ContentPage }) {
  const featuredProject = tenant.projects[0]!;
  const before = featuredProject.images.find((image) => image.stage === "before")!;
  const after = featuredProject.images.find((image) => image.stage === "after")!;
  const region = tenant.theme === "summit" ? "Salt Lake City" : "Denver";

  return (
    <>
      <JsonLd data={pageSchema(tenant, page)} />
      <section className="hero">
        <Image src={tenant.heroImage.src} alt={tenant.heroImage.alt} fill loading="eager" fetchPriority="high" sizes="100vw" />
        <div className="container hero__content">
          <p className="eyebrow">Painting {region} with purpose</p>
          <SplitText text={page.seo.h1} tag="h1" delay={tenant.theme === "summit" ? 0.05 : 0.075} duration={tenant.theme === "summit" ? 1 : 1.2} />
          <p className="hero__lede">{page.intro}</p>
          <div className="button-row">
            <Link className="button button--accent" href="/contact">Request an estimate <ArrowRight size={18} aria-hidden="true" /></Link>
            <a className="button button--ghost" href={`tel:${tenant.phone.replace(/\D/g, "")}`}><Phone size={18} aria-hidden="true" />{tenant.phone}</a>
          </div>
        </div>
        <div className="container hero__trust" aria-label="Project commitments">
          <span><ShieldCheck size={18} aria-hidden="true" /> Protected spaces</span>
          <span><Brush size={18} aria-hidden="true" /> Surface-specific prep</span>
          <span><ClipboardCheck size={18} aria-hidden="true" /> Written project plan</span>
        </div>
      </section>

      <section className="section home-intro home-section--quiet">
        <div className="container intro-grid">
          <div><p className="eyebrow">Built around the surface</p><h2>{tenant.theme === "summit" ? "A sharper standard for every room and elevation." : "A calmer way to bring new color home."}</h2></div>
          <div className="prose intro-copy">{page.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<Link className="text-link" href="/about">See how we approach the work <ArrowRight size={17} aria-hidden="true" /></Link></div>
        </div>
      </section>

      <PaintMarquee warm={tenant.theme === "heritage"} />

      <section className="section band services-band" id="services">
        <div className="container">
          <div className="section-heading"><div><p className="eyebrow">Painting services</p><h2>Preparation and finishes matched to the job.</h2></div><p>From occupied interiors to weather-exposed exteriors, each scope starts with the material, condition, and way the space is used.</p></div>
          <div className="service-feature-grid">
            {tenant.services.slice(0, 3).map((service, index) => <SpotlightCard className="service-feature" spotlightColor={tenant.theme === "summit" ? "rgba(225, 93, 63, 0.18)" : "rgba(231, 169, 47, 0.2)"} key={service.id}><span className="service-number">0{index + 1}</span><p className="eyebrow">{service.category}</p><h3>{service.name}</h3><p>{service.useCases.slice(0, 2).join(" and ")}.</p><Link className="text-link" href={`/${service.slug}`}>Explore the service <ArrowRight size={16} aria-hidden="true" /></Link></SpotlightCard>)}
          </div>
          <div className="service-directory">{tenant.services.slice(3).map((service) => <Link key={service.id} href={`/${service.slug}`}><span>{service.name}</span><ArrowRight size={16} aria-hidden="true" /></Link>)}</div>
        </div>
      </section>

      <section className="section project-feature home-section--feature">
        <div className="container feature-grid">
          <div className="feature-media"><BeforeAfter before={before} after={after} title={featuredProject.name} /></div>
          <div className="feature-copy"><p className="eyebrow">Project approach</p><h2>A beautiful finish starts well before the first coat.</h2><p className="lede">{featuredProject.intro}</p><ol className="clean-process"><li><span>01</span><div><strong>Walk and document</strong><p>Review surfaces, repairs, access, protection, and the desired finish.</p></div></li><li><span>02</span><div><strong>Prepare with intention</strong><p>Build the coating system around the substrate and real site conditions.</p></div></li><li><span>03</span><div><strong>Inspect the details</strong><p>Check coverage, edges, cleanup, and closeout together.</p></div></li></ol><Link className="button" href="/gallery">View project gallery <ArrowRight size={18} aria-hidden="true" /></Link></div>
        </div>
      </section>

      <section className="section locations-band" id="locations">
        <div className="container location-grid">
          <div className="location-intro"><p className="eyebrow">Local service area</p><h2>{region} painting guidance, neighborhood by neighborhood.</h2><p>Local building styles, elevation, sun, weather, and access all shape a responsible painting plan.</p><Link className="button button--ghost" href={`/${tenant.locations[0]!.slug}`}>Explore {region} services</Link></div>
          <nav className="location-directory" aria-label="Featured service locations">{tenant.locations.slice(0, 10).map((location) => <Link key={location.id} href={`/${location.slug}`}><span>{location.city}</span><small>{location.stateAbbr}</small><ArrowRight size={17} aria-hidden="true" /></Link>)}</nav>
        </div>
      </section>

      <section className="section projects-band home-section--gallery">
        <div className="container"><div className="section-heading"><div><p className="eyebrow">Selected work</p><h2>Look beyond the color.</h2></div><p>Useful project records explain the surface, preparation, finish choices, and constraints behind the photograph.</p></div><div className="grid-3 project-grid">{tenant.projects.slice(0, 3).map((project) => <ProjectCard key={project.id} project={project} />)}</div></div>
      </section>

      <section className="section planning-band home-section--quiet">
        <div className="container grid-2">
          <div><p className="eyebrow">A straightforward process</p><h2>Know what happens next.</h2><ul className="expectation-list"><li><Check size={18} aria-hidden="true" /><span><strong>Clear scope</strong> Surface condition, repairs, products, protection, and sequence.</span></li><li><Check size={18} aria-hidden="true" /><span><strong>Thoughtful scheduling</strong> Access, weather, drying time, pets, and occupied rooms.</span></li><li><Check size={18} aria-hidden="true" /><span><strong>Documented walkthrough</strong> Finish review, touch-ups, cleanup, and care notes.</span></li></ul></div>
          <div><p className="eyebrow">Common questions</p><div className="faq"><details><summary>How far ahead should I request an estimate?</summary><p>Share your preferred timing early. Availability depends on scope, weather, product requirements, and current scheduling.</p></details><details><summary>Do I need to choose colors first?</summary><p>No. Color and sheen can be confirmed after scope, but selections and samples should be approved before materials are ordered.</p></details><details><summary>What makes an estimate accurate?</summary><p>Surface condition, repairs, access, protection, product system, number of colors, and sequencing all matter more than square footage alone.</p></details></div></div>
        </div>
      </section>

      <section className="section estimate-section" id="estimate">
        <div className="container estimate-grid"><div><p className="eyebrow">Request an estimate</p><h2>Tell us what you want to change.</h2><p className="lede">Share the space, surface, timing, and any concerns. We’ll use those details to shape a useful first conversation.</p><div className="estimate-contact"><a href={`tel:${tenant.phone.replace(/\D/g, "")}`}>{tenant.phone}</a><span>{tenant.businessHours}</span><span>{tenant.serviceArea}</span></div></div><ContactForm serviceArea={tenant.serviceArea} /></div>
      </section>
    </>
  );
}
