"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CircleUserRound,
  FileText,
  FilePenLine,
  Images,
  Inbox,
  LayoutDashboard,
  Mail,
  Phone,
  Search,
  UploadCloud,
} from "lucide-react";
import { BlogGeneratorForm } from "@/components/blog-generator-form";
import { OwnerMediaManager } from "@/components/dashboard/owner-media-manager";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { allTenantPages } from "@/lib/content/pages";
import type { OwnerLead } from "@/lib/contact/owner-leads";
import type { OwnerMediaState } from "@/lib/media/owner-media-types";
import { auditTenantLaunchReadiness } from "@/lib/seo/audit";
import type { DashboardAccess } from "@/lib/security/dashboard-auth";
import type { Tenant } from "@/lib/types";

const panelIds = ["overview", "leads", "upload", "library", "seo", "pages", "blog"] as const;
type PanelId = typeof panelIds[number];

const panelCopy: Record<PanelId, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: "Website overview",
    title: "Your website at a glance.",
    description: "Review publishing health, estimate activity, and the items that need attention.",
  },
  leads: {
    eyebrow: "Customer inquiries",
    title: "Estimate requests.",
    description: "Review new website leads and contact prospective customers from one focused view.",
  },
  upload: {
    eyebrow: "Project media",
    title: "Add project photos.",
    description: "Upload first-party work as a private draft and attach it to the correct project.",
  },
  library: {
    eyebrow: "Project media",
    title: "Photo library.",
    description: "Review drafts, update image details, and control what appears on the public website.",
  },
  seo: {
    eyebrow: "Search visibility",
    title: "SEO publishing audit.",
    description: "Resolve launch blockers and review page-level search recommendations.",
  },
  pages: {
    eyebrow: "Website content",
    title: "Page inventory.",
    description: "Review public pages, content types, publishing status, and indexing settings.",
  },
  blog: {
    eyebrow: "Content drafts",
    title: "Blog workspace.",
    description: "Prepare locally relevant article drafts for editorial review before publication.",
  },
};

function panelFromHash(hash: string): PanelId {
  const candidate = hash.replace(/^#/, "") as PanelId;
  return panelIds.includes(candidate) ? candidate : "overview";
}

export function DashboardShell({
  tenant,
  access,
  mediaState,
  leads,
}: {
  tenant: Tenant;
  access: DashboardAccess;
  mediaState: OwnerMediaState;
  leads: OwnerLead[];
}) {
  const pages = allTenantPages(tenant);
  const issues = auditTenantLaunchReadiness(tenant);
  const critical = issues.filter((issue) => issue.severity === "critical");
  const published = pages.filter((page) => page.status === "published").length;
  const indexable = pages.filter((page) => page.status === "published" && page.seo.index).length;
  const newLeads = leads.filter((lead) => lead.status === "new").length;
  const [activePanel, setActivePanel] = useState<PanelId>("overview");
  const activeCopy = panelCopy[activePanel];

  useEffect(() => {
    const syncPanel = () => setActivePanel(panelFromHash(window.location.hash));
    syncPanel();
    window.addEventListener("hashchange", syncPanel);
    window.addEventListener("popstate", syncPanel);
    return () => {
      window.removeEventListener("hashchange", syncPanel);
      window.removeEventListener("popstate", syncPanel);
    };
  }, []);

  function showPanel(panel: PanelId) {
    if (window.location.hash !== `#${panel}`) {
      window.history.pushState(null, "", `/dashboard#${panel}`);
    }
    setActivePanel(panel);
    document.querySelector<HTMLElement>(".dashboard-main")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  const metrics = [
    { label: "Published pages", value: published, detail: `${pages.length} total pages`, Icon: FileText, tone: "default" },
    { label: "Search ready", value: indexable, detail: "Pages open to indexing", Icon: Search, tone: "default" },
    { label: "Critical issues", value: critical.length, detail: critical.length ? "Needs attention" : "Nothing blocking launch", Icon: AlertTriangle, tone: critical.length ? "critical" : "success" },
    { label: "New estimate requests", value: newLeads, detail: leads.length ? `${leads.length} recent requests` : "No requests yet", Icon: Inbox, tone: newLeads ? "warning" : "success" },
  ] as const;

  const nav = [
    { id: "overview", label: "Overview", detail: "Site status", Icon: LayoutDashboard },
    { id: "leads", label: "Leads", detail: "Estimate requests", Icon: Inbox },
    { id: "upload", label: "Add photos", detail: "Upload a draft", Icon: UploadCloud },
    { id: "library", label: "Photo library", detail: "Review and publish", Icon: Images },
    { id: "seo", label: "SEO audit", detail: "Find search issues", Icon: Search },
    { id: "pages", label: "Pages", detail: "Review inventory", Icon: FileText },
    { id: "blog", label: "Blog drafts", detail: "Create an article", Icon: FilePenLine },
  ] as const;

  return (
    <div className="dashboard">
      <aside className="dashboard-nav">
        <div className="dashboard-nav__brand">
          <span className="dashboard-nav__mark" aria-hidden="true">{tenant.branding.logoMark}</span>
          <span>
            <small>Owner portal</small>
            <strong>{tenant.name}</strong>
          </span>
        </div>

        <nav aria-label="Owner portal">
          <p className="dashboard-nav__label">Workspace</p>
          {nav.map(({ id, label, detail, Icon }) => (
            <a
              key={id}
              href={`/dashboard#${id}`}
              className={activePanel === id ? "is-active" : undefined}
              aria-current={activePanel === id ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                showPanel(id);
              }}
            >
              <Icon size={18} aria-hidden="true" />
              <span><strong>{label}</strong><small>{detail}</small></span>
            </a>
          ))}
        </nav>

        <div className="dashboard-nav__footer">
          <Link href="/" target="_blank">
            <ArrowUpRight size={17} aria-hidden="true" />
            View public website
          </Link>
          <SignOutButton readOnly={access.readOnly} />
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">{activeCopy.eyebrow}</p>
            <h1>{activeCopy.title}</h1>
            <p>{activeCopy.description}</p>
          </div>
          <div className="dashboard-account">
            <CircleUserRound size={20} aria-hidden="true" />
            <span><small>Signed in as</small><strong>{access.email}</strong></span>
            <span className="dashboard-account__role">{access.role.replaceAll("_", " ")}</span>
          </div>
        </header>

        {access.readOnly ? (
          <div className="dashboard-notice">
            <AlertTriangle size={20} aria-hidden="true" />
            <div><strong>Read-only demonstration mode</strong><p>Connect Supabase to enable authentication, publishing, uploads, submissions, and tenant-scoped editing.</p></div>
          </div>
        ) : null}

        <div className="dashboard-workspace">
        <section className="dashboard-overview dashboard-workspace-panel" id="overview" aria-labelledby="overview-title" hidden={activePanel !== "overview"}>
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">At a glance</p>
              <h2 id="overview-title">Website status</h2>
            </div>
            <div className="dashboard-quick-actions">
              <button className="dashboard-action" type="button" onClick={() => showPanel("upload")}><UploadCloud size={17} aria-hidden="true" /> Add project photos</button>
              <Link className="dashboard-action dashboard-action--secondary" href="/gallery" target="_blank">Preview gallery <ArrowUpRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
          <div className="dashboard-metrics">
            {metrics.map(({ label, value, detail, Icon, tone }) => (
              <article className={`dashboard-metric is-${tone}`} key={label}>
                <span className="dashboard-metric__icon"><Icon size={19} aria-hidden="true" /></span>
                <strong>{value}</strong>
                <span>{label}</span>
                <small>{detail}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel dashboard-leads dashboard-workspace-panel" id="leads" aria-labelledby="leads-title" hidden={activePanel !== "leads"}>
          <header className="dashboard-panel__heading">
            <div><p className="eyebrow">Estimate requests</p><h2 id="leads-title">Recent website leads</h2></div>
            <p>Requests are tenant-scoped and shown newest first. Contact the customer directly using the details they submitted.</p>
          </header>
          {leads.length ? (
            <div className="dashboard-table-wrap">
              <table className="audit-table">
                <thead><tr><th>Customer</th><th>Project</th><th>Details</th><th>Received</th></tr></thead>
                <tbody>{leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <strong>{lead.name}</strong>
                      <span className="dashboard-lead-contact"><a href={`mailto:${lead.email}`}><Mail size={13} aria-hidden="true" />{lead.email}</a>{lead.phone ? <a href={`tel:${lead.phone.replace(/\D/g, "")}`}><Phone size={13} aria-hidden="true" />{lead.phone}</a> : null}</span>
                    </td>
                    <td><strong>{lead.projectType || "Painting estimate"}</strong><br />{lead.postalCode || "ZIP not provided"}</td>
                    <td><span className="dashboard-lead-message">{lead.message}</span><small className={`delivery-${lead.notificationStatus}`}>Email {lead.notificationStatus}</small></td>
                    <td>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(lead.createdAt))}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : (
            <div className="dashboard-empty-state"><Inbox size={24} aria-hidden="true" /><strong>No estimate requests yet</strong><span>New website requests will appear here automatically.</span></div>
          )}
        </section>

        <div className="dashboard-workspace-panel" hidden={activePanel !== "upload" && activePanel !== "library"}>
          <OwnerMediaManager initialState={mediaState} readOnly={access.readOnly} view={activePanel === "library" ? "library" : "upload"} />
        </div>

        <section className="dashboard-panel dashboard-workspace-panel" id="seo" aria-labelledby="seo-title" hidden={activePanel !== "seo"}>
          <header className="dashboard-panel__heading">
            <div><p className="eyebrow">Search health</p><h2 id="seo-title">SEO publishing audit</h2></div>
            <p>Critical issues block publication. Review notes identify content that may need editorial attention.</p>
          </header>
          <div className="dashboard-table-wrap">
            <table className="audit-table">
              <thead><tr><th>Severity</th><th>Issue</th><th>Page</th></tr></thead>
              <tbody>{issues.slice(0, 30).map((issue, index) => <tr key={`${issue.code}-${issue.pageId}-${index}`}><td><span className={`status-${issue.severity}`}>{issue.severity}</span></td><td><strong>{issue.code}</strong><br />{issue.message}</td><td>{issue.pageId ?? "Tenant-wide"}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-panel dashboard-workspace-panel" id="pages" aria-labelledby="pages-title" hidden={activePanel !== "pages"}>
          <header className="dashboard-panel__heading">
            <div><p className="eyebrow">Content inventory</p><h2 id="pages-title">Published and draft pages</h2></div>
            <p>Open a page to review the customer-facing result, publishing state, and search visibility.</p>
          </header>
          <div className="dashboard-table-wrap">
            <table className="audit-table">
              <thead><tr><th>Page</th><th>Type</th><th>Status</th><th>Indexing</th></tr></thead>
              <tbody>{pages.slice(0, 50).map((page) => <tr key={page.id}><td><Link href={page.kind === "project" ? `/projects/${page.slug}` : page.kind === "blog" ? `/blog/${page.slug}` : `/${page.slug}`} target="_blank">{page.name} <ArrowUpRight size={13} aria-hidden="true" /></Link></td><td>{page.kind}</td><td>{page.status}</td><td>{page.seo.index ? "Index" : "No index"}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-panel dashboard-panel--generator dashboard-workspace-panel" id="blog" hidden={activePanel !== "blog"}>
          <BlogGeneratorForm readOnly={access.readOnly} />
        </section>
        </div>
      </div>
    </div>
  );
}
