import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CallToAction } from "@/components/call-to-action";
import { JsonLd } from "@/components/json-ld";
import { findPost, getCurrentTenant } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo/metadata";
import { pageSchema } from "@/lib/seo/structured-data";
import { hostnameFromHeaders } from "@/lib/tenant/host";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, tenant, requestHeaders] = await Promise.all([params, getCurrentTenant(), headers()]);
  const post = findPost(tenant, slug);
  return post ? buildMetadata({ host: hostnameFromHeaders(requestHeaders), tenant, page: post }) : {};
}

export default async function BlogPostPage({ params }: Props) {
  const [{ slug }, tenant] = await Promise.all([params, getCurrentTenant()]);
  const post = findPost(tenant, slug);
  if (!post || post.status !== "published") notFound();
  const service = tenant.services.find((item) => item.slug === post.relatedServiceSlug);
  const location = tenant.locations.find((item) => item.slug === post.relatedLocationSlug);
  const project = tenant.projects.find((item) => item.slug === post.relatedProjectSlug);
  return <><JsonLd data={pageSchema(tenant, post)} /><header className="page-hero"><div className="narrow"><Breadcrumbs current={post.name} parent={{ label: "Painting guide", href: "/blog" }} /><p className="eyebrow">{new Date(post.publishedAt).toLocaleDateString("en-US", { dateStyle: "long" })} · {post.author.name}</p><h1>{post.seo.h1}</h1><p className="lede">{post.excerpt}</p></div></header><article className="section"><div className="narrow"><Image src={post.featuredImage.src} alt={post.featuredImage.alt} width={post.featuredImage.width} height={post.featuredImage.height} priority /><div className="prose">{post.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><aside className="card card__body"><h2>Related planning</h2><ul className="link-list">{service ? <li><Link href={`/${service.slug}`}>{service.name}</Link></li> : null}{location ? <li><Link href={`/${location.slug}`}>Painting in {location.city}</Link></li> : null}{project ? <li><Link href={`/projects/${project.slug}`}>{project.name}</Link></li> : null}</ul></aside></div></article><CallToAction tenant={tenant} heading={post.cta} /></>;
}
