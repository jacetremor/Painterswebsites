import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, Plus } from "lucide-react";
import { getDemoOnboardingToken } from "@/lib/onboarding/repository";
import { listInvitations } from "@/lib/onboarding/admin-repository";
import { requirePlatformAdmin } from "@/lib/security/dashboard-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Client onboarding | Nova Suite", robots: { index: false, follow: false } };

export default async function OnboardingAdminPage() {
  const access = await requirePlatformAdmin(); const invitations = await listInvitations();
  return <div className="admin-page"><header className="admin-page-header"><div><p className="eyebrow">Nova Suite operations</p><h1>Client onboarding</h1><p>Create secure invitations, review submissions, and control website generation.</p></div><Link className="button" href="/dashboard/onboarding/new"><Plus size={18}/> New invitation</Link></header>
    {access.readOnly && <div className="admin-notice">Read-only demonstration mode. <Link href={`/onboarding/${getDemoOnboardingToken()}`} target="_blank">Open the sample client form <ExternalLink size={14}/></Link></div>}
    <div className="admin-metrics"><div><strong>{invitations.length}</strong><span>Total invitations</span></div><div><strong>{invitations.filter((item) => item.status === "submitted").length}</strong><span>Awaiting review</span></div><div><strong>{invitations.filter((item) => item.status === "website_generating").length}</strong><span>Generating</span></div></div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Company</th><th>Client</th><th>Status</th><th>Progress</th><th>Preview</th><th><span className="visually-hidden">Open</span></th></tr></thead><tbody>{invitations.map((item) => <tr key={item.id}><td><strong>{item.companyName}</strong><small>{item.clientEmail}</small></td><td>{item.clientName}</td><td><span className={`status-badge status-badge--${item.status}`}>{item.status.replaceAll("_", " ")}</span></td><td>{item.completionPercent}%</td><td><code>{item.proposedPreviewSlug}.novasuite.io</code></td><td><Link className="icon-link" href={`/dashboard/onboarding/${item.id}`} aria-label={`Open ${item.companyName}`}><ArrowRight size={18}/></Link></td></tr>)}</tbody></table></div>
  </div>;
}

