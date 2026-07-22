import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ExternalLink, Phone } from "lucide-react";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Private website preview | Nova Suite", robots: { index: false, follow: false, nocache: true } };

type DraftPage = { page_name: string; nav_label: string; slug: string; h1: string; intro_copy: string; body_content: unknown; cta_text: string; page_type: string };
type Draft = { title?: string; summary?: string; sections?: Array<{ heading?: string; body?: string }> };

async function loadPreview(slug: string, path: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase && slug === "northstarpainting") return { tenant: { id: "demo", company_name: "Northstar Painting Co.", phone: "(555) 010-2200", email: "hello@example.com", service_area: "Confirmed local service areas", launch_status: "preview" }, branding: { primary_color: "#17463d", secondary_color: "#eef3f0", accent_color: "#f2b84b", theme: "Premium and Modern" }, pages: [{ page_name: "Home", nav_label: "Home", slug: "", h1: "A private website preview", intro_copy: "This demonstration shows the generated tenant preview surface. Connect Supabase to review real onboarding output.", body_content: [], cta_text: "Request an estimate", page_type: "core" }], page: { page_name: "Home", nav_label: "Home", slug: "", h1: "A private website preview", intro_copy: "This demonstration shows the generated tenant preview surface. Connect Supabase to review real onboarding output.", body_content: [], cta_text: "Request an estimate", page_type: "core" }, draft: undefined };
  if (!supabase) return null;
  const { data: tenant } = await supabase.from("tenants").select("id,company_name,phone,email,service_area,launch_status,onboarding_submission_id").eq("preview_slug", slug).maybeSingle(); if (!tenant) return null;
  const { data: domain } = await supabase.from("domains").select("tenant_id,is_preview").eq("hostname", `${slug}.novasuite.io`).eq("tenant_id", tenant.id).eq("is_preview", true).maybeSingle(); if (!domain) return null;
  const [{ data: branding }, { data: pages }] = await Promise.all([supabase.from("branding_settings").select("primary_color,secondary_color,accent_color,theme").eq("tenant_id", tenant.id).single(), supabase.from("pages").select("page_name,nav_label,slug,h1,intro_copy,body_content,cta_text,page_type").eq("tenant_id", tenant.id).order("page_type").order("page_name")]);
  const page = (pages as DraftPage[] | null)?.find((item) => item.slug === path); if (!page) return null;
  const entityKey = page.slug || "home"; const { data: version } = await supabase.from("generated_content_versions").select("draft_data").eq("tenant_id", tenant.id).eq("entity_type", "page").eq("entity_key", entityKey).order("version", { ascending: false }).limit(1).maybeSingle();
  const { data: mediaFiles } = tenant.onboarding_submission_id ? await supabase.from("onboarding_files").select("field_key,processed_outputs,approved_alt_text").eq("submission_id", tenant.onboarding_submission_id).in("section_key", ["projects_gallery", "branding"]) : { data: [] };
  const heroFile = (mediaFiles ?? []).find((file) => file.field_key.includes("photos") && Array.isArray(file.processed_outputs)) ?? (mediaFiles ?? []).find((file) => file.field_key === "brand_collateral" && Array.isArray(file.processed_outputs)); const outputs = heroFile?.processed_outputs as Array<{ storagePath?: string }> | undefined; const heroPath = outputs?.at(-1)?.storagePath; const heroImage = heroPath ? { src: supabase.storage.from("tenant-media").getPublicUrl(heroPath).data.publicUrl, alt: heroFile?.approved_alt_text ?? "" } : undefined;
  return { tenant, branding, pages: pages as DraftPage[], page, draft: version?.draft_data as Draft | undefined, heroImage };
}

export default async function PreviewPage({ params, searchParams }: { params: Promise<{ slug: string; path?: string[] }>; searchParams: Promise<{ previewKey?: string }> }) {
  const { slug, path: segments = [] } = await params; const query = await searchParams;
  if (process.env.PREVIEW_BYPASS_TOKEN && query.previewKey !== process.env.PREVIEW_BYPASS_TOKEN) notFound();
  const path = segments.join("/"); const data = await loadPreview(slug, path); if (!data) notFound();
  const style = { "--preview-primary": data.branding?.primary_color ?? "#17463d", "--preview-secondary": data.branding?.secondary_color ?? "#eef3f0", "--preview-accent": data.branding?.accent_color ?? "#f2b84b" } as CSSProperties;
  const sections = data.draft?.sections?.filter((item) => item.heading && item.body) ?? [];
  return <div className="tenant-preview" style={style}>
    <div className="preview-banner"><strong>Private draft preview</strong><span>Noindex · not published · launch requires Nova Suite approval</span></div>
    <header className="preview-header"><Link href={`/preview/${slug}${query.previewKey ? `?previewKey=${encodeURIComponent(query.previewKey)}` : ""}`}>{data.tenant.company_name}</Link><nav>{data.pages.filter((item) => item.page_type === "core").map((item) => <Link key={item.slug} href={`/preview/${slug}${item.slug ? `/${item.slug}` : ""}${query.previewKey ? `?previewKey=${encodeURIComponent(query.previewKey)}` : ""}`}>{item.nav_label}</Link>)}</nav><a href={`tel:${data.tenant.phone.replace(/\D/g, "")}`} aria-label={`Call ${data.tenant.phone}`}><Phone size={18}/></a></header>
    <main><section className="preview-hero">{data.heroImage && <Image src={data.heroImage.src} alt={data.heroImage.alt} fill unoptimized sizes="100vw"/>}<div><p className="eyebrow">Serving {data.tenant.service_area}</p><h1>{data.draft?.title || data.page.h1}</h1><p>{data.draft?.summary || data.page.intro_copy}</p><Link className="button" href={`/preview/${slug}/contact${query.previewKey ? `?previewKey=${encodeURIComponent(query.previewKey)}` : ""}`}>{data.page.cta_text}<ArrowRight size={18}/></Link></div></section>
      <section className="preview-content">{sections.length ? sections.map((section) => <article key={section.heading}><h2>{section.heading}</h2><p>{section.body}</p></article>) : <article><p className="eyebrow">Draft state</p><h2>Content generation is awaiting review.</h2><p>Verified business facts, selected services, approved locations, real projects, and permission-cleared reviews will appear here after their generation steps complete.</p></article>}</section>
      {path === "" && <section className="preview-inventory"><p className="eyebrow">Generated page inventory</p><h2>Draft pages inside this tenant</h2><div>{data.pages.map((item) => <Link key={item.slug} href={`/preview/${slug}${item.slug ? `/${item.slug}` : ""}${query.previewKey ? `?previewKey=${encodeURIComponent(query.previewKey)}` : ""}`}><span>{item.page_name}</span><small>{item.page_type} · noindex</small><ExternalLink size={16}/></Link>)}</div></section>}
    </main><footer className="preview-footer"><strong>{data.tenant.company_name}</strong><span>{data.tenant.phone} · {data.tenant.email}</span><small>Preview environment. Facts and content require human approval.</small></footer>
  </div>;
}
