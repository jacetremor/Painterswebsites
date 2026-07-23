import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileText, ImageIcon, Search } from "lucide-react";
import { BlogGeneratorForm } from "@/components/blog-generator-form";
import { OwnerMediaManager } from "@/components/dashboard/owner-media-manager";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { allTenantPages } from "@/lib/content/pages";
import type { OwnerMediaState } from "@/lib/media/owner-media-types";
import { auditTenant } from "@/lib/seo/audit";
import type { DashboardAccess } from "@/lib/security/dashboard-auth";
import type { Tenant } from "@/lib/types";

export function DashboardShell({ tenant, access, mediaState }: { tenant: Tenant; access: DashboardAccess; mediaState: OwnerMediaState }) {
  const pages = allTenantPages(tenant);
  const issues = auditTenant(tenant);
  const critical = issues.filter((issue) => issue.severity === "critical");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  const metrics = [
    ["Published", pages.filter((page) => page.status === "published").length, FileText],
    ["Indexable", pages.filter((page) => page.status === "published" && page.seo.index).length, Search],
    ["Critical", critical.length, AlertTriangle],
    ["Warnings", warnings.length, AlertTriangle],
  ] as const;
  const nav = [["Overview", "/dashboard", CheckCircle2], ["Projects & media", "/dashboard#projects", ImageIcon], ["SEO audit", "/dashboard#seo", Search], ["Pages", "/dashboard#pages", FileText]] as const;
  return <div className="dashboard"><aside className="dashboard-nav"><strong>{tenant.branding.logoMark} Admin</strong><p>{tenant.name}</p><nav aria-label="Dashboard">{nav.map(([label, href, Icon]) => <Link key={label} href={href}><Icon size={16} aria-hidden="true" /> {label}</Link>)}</nav><SignOutButton readOnly={access.readOnly} /></aside><div className="dashboard-main"><p className="eyebrow">Tenant dashboard</p><h1>Content and search readiness</h1><p>Signed in as {access.email} · {access.role.replaceAll("_", " ")}</p>{access.readOnly ? <div className="card card__body"><strong>Read-only demonstration mode</strong><p>Connect Supabase to enable authentication, publishing, uploads, submissions, and tenant-scoped editing.</p></div> : null}<div className="grid-4">{metrics.map(([label, value, Icon]) => <div className="card card__body" key={label}><Icon size={20} aria-hidden="true" /><strong style={{ display: "block", fontSize: "2rem" }}>{value}</strong><span>{label}</span></div>)}</div><OwnerMediaManager initialState={mediaState} readOnly={access.readOnly} /><section className="section-compact" id="seo"><h2>SEO publishing audit</h2><p>Critical issues block publication. Warnings require editorial review but may not block.</p><table className="audit-table"><thead><tr><th>Severity</th><th>Issue</th><th>Page</th></tr></thead><tbody>{issues.slice(0, 30).map((issue, index) => <tr key={`${issue.code}-${issue.pageId}-${index}`}><td className={`status-${issue.severity}`}>{issue.severity}</td><td><strong>{issue.code}</strong><br />{issue.message}</td><td>{issue.pageId ?? "Tenant-wide"}</td></tr>)}</tbody></table></section><section className="section-compact" id="pages"><h2>Page inventory</h2><table className="audit-table"><thead><tr><th>Page</th><th>Type</th><th>Status</th><th>Indexing</th></tr></thead><tbody>{pages.slice(0, 50).map((page) => <tr key={page.id}><td><Link href={page.kind === "project" ? `/projects/${page.slug}` : page.kind === "blog" ? `/blog/${page.slug}` : `/${page.slug}`}>{page.name}</Link></td><td>{page.kind}</td><td>{page.status}</td><td>{page.seo.index ? "index" : "noindex"}</td></tr>)}</tbody></table></section><section className="section-compact" id="blog-generator"><BlogGeneratorForm readOnly={access.readOnly} /></section></div></div>;
}
