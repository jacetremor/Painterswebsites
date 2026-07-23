import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentTenant } from "@/lib/content/repository";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  return { title: `Painting Guide | ${tenant.name}`, description: `First-party painting planning guidance from ${tenant.name}.`, robots: { index: false, follow: true } };
}

export default async function BlogIndexPage() {
  const tenant = await getCurrentTenant();
  const posts = tenant.posts.filter((post) => post.status === "published");
  const heroImage = tenant.heroImage;
  return <><header className="page-hero">{heroImage ? <Image src={heroImage.src} alt={heroImage.alt} fill loading="eager" fetchPriority="high" sizes="100vw" /> : null}<div className="container page-hero__content"><div className="page-hero__frame"><p className="eyebrow">Painting guide</p><h1>Practical questions before paint day</h1><p className="lede">Demonstration articles structured for first-hand painter advice, real product observations, and useful internal links.</p></div></div></header><section className="section guide-section"><div className="container grid-3 guide-grid">{posts.map((post) => <article className="card" key={post.id}><Link className="card-link" href={`/blog/${post.slug}`}><div className="card-image"><Image src={post.featuredImage.src} alt={post.featuredImage.alt} fill sizes="(max-width: 620px) 100vw, 33vw" /></div><div className="card__body"><p className="eyebrow">Updated {new Date(post.updatedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</p><h2 className="guide-card-title">{post.name}</h2><p>{post.excerpt}</p><strong>Read the guide</strong></div></Link></article>)}</div></section></>;
}
