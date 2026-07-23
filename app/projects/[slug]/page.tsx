import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CallToAction } from "@/components/call-to-action";
import { JsonLd } from "@/components/json-ld";
import { findProject, getCurrentTenant } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo/metadata";
import { pageSchema } from "@/lib/seo/structured-data";
import { hostnameFromHeaders } from "@/lib/tenant/host";

type Props = { params: Promise<{ slug: string }> };

function imageStageLabel(stage: "before" | "after" | "standalone") {
  return stage === "before" ? "Surface condition reference" : stage === "after" ? "Finish reference" : "Project detail";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, tenant, requestHeaders] = await Promise.all([params, getCurrentTenant(), headers()]);
  const project = findProject(tenant, slug);
  return project ? buildMetadata({ host: hostnameFromHeaders(requestHeaders), tenant, page: project }) : {};
}

export default async function ProjectPage({ params }: Props) {
  const [{ slug }, tenant] = await Promise.all([params, getCurrentTenant()]);
  const project = findProject(tenant, slug);
  if (!project || project.status !== "published") notFound();
  const location = tenant.locations.find((item) => item.slug === project.locationSlug);
  const services = project.serviceSlugs.map((serviceSlug) => tenant.services.find((service) => service.slug === serviceSlug)).filter(Boolean);
  const after = project.images.find((item) => item.stage === "after");
  const heroImage = after ?? project.images[0];
  return <><JsonLd data={pageSchema(tenant, project)} /><header className="page-hero">{heroImage ? <Image src={heroImage.src} alt={heroImage.alt} fill loading="eager" fetchPriority="high" sizes="100vw" /> : null}<div className="container page-hero__content"><div className="page-hero__frame"><Breadcrumbs current={project.name} parent={{ label: "Gallery", href: "/gallery" }} /><p className="eyebrow">{project.category} project record</p><h1>{project.seo.h1}</h1><p className="lede">{project.intro}</p></div></div></header><section className="section project-detail"><div className="container project-detail-grid"><div className="project-detail-media reference-pair">{project.images.map((image, index) => <figure key={image.id}><div><Image src={image.src} alt={image.alt} fill loading={index < 2 ? "eager" : "lazy"} sizes="(max-width: 980px) 50vw, 32vw" /></div><figcaption><strong>{imageStageLabel(image.stage)}</strong>{image.caption ? <span>{image.caption}</span> : null}</figcaption></figure>)}</div><article className="project-summary"><p className="eyebrow">Scope record</p><h2>What this example documents</h2>{project.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<dl><dt>Location</dt><dd>{location ? <Link href={`/${location.slug}`}>{location.city}, {location.stateAbbr}</Link> : "Not linked"}</dd><dt>Services</dt><dd>{services.map((service) => service ? <Link key={service.id} href={`/${service.slug}`}>{service.name}</Link> : null)}</dd><dt>Products considered</dt><dd>{project.products.join(", ")}</dd></dl></article></div></section><CallToAction tenant={tenant} heading="Discuss a comparable project" /></>;
}
