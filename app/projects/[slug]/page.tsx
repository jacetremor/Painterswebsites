import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { BeforeAfter } from "@/components/before-after";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CallToAction } from "@/components/call-to-action";
import { JsonLd } from "@/components/json-ld";
import { findProject, getCurrentTenant } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo/metadata";
import { pageSchema } from "@/lib/seo/structured-data";
import { hostnameFromHeaders } from "@/lib/tenant/host";

type Props = { params: Promise<{ slug: string }> };

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
  const before = project.images.find((item) => item.stage === "before");
  const after = project.images.find((item) => item.stage === "after");
  return <><JsonLd data={pageSchema(tenant, project)} /><header className="page-hero"><div className="container"><Breadcrumbs current={project.name} parent={{ label: "Gallery", href: "/gallery" }} /><p className="eyebrow">{project.category} project record</p><h1>{project.seo.h1}</h1><p className="lede">{project.intro}</p></div></header><section className="section"><div className="container grid-2"><div>{before && after ? <BeforeAfter before={before} after={after} title={project.name} /> : project.images.map((item) => <Image key={item.id} src={item.src} alt={item.alt} width={item.width} height={item.height} />)}</div><article><p className="eyebrow">Scope record</p><h2>What this example documents</h2>{project.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<dl><dt>Location</dt><dd>{location ? <Link href={`/${location.slug}`}>{location.city}, {location.stateAbbr}</Link> : "Not linked"}</dd><dt>Services</dt><dd>{services.map((service) => service ? <Link key={service.id} href={`/${service.slug}`}>{service.name}</Link> : null)}</dd><dt>Products considered</dt><dd>{project.products.join(", ")}</dd></dl></article></div></section><CallToAction tenant={tenant} heading="Discuss a comparable project" /></>;
}
