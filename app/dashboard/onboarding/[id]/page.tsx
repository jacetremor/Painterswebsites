import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminAnswerEditor } from "@/components/onboarding/admin-answer-editor";
import { InvitationActions } from "@/components/onboarding/invitation-actions";
import { LocationApproval } from "@/components/onboarding/location-approval";
import { DomainTracking } from "@/components/onboarding/domain-tracking";
import { GeneratedContentReview } from "@/components/onboarding/generated-content-review";
import { MediaReview } from "@/components/onboarding/media-review";
import { getInvitationDetail } from "@/lib/onboarding/admin-repository";
import { ONBOARDING_SECTIONS } from "@/lib/onboarding/sections";
import { requirePlatformAdmin } from "@/lib/security/dashboard-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Onboarding review | Nova Suite", robots: { index: false, follow: false } };
export default async function InvitationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requirePlatformAdmin(); const { id } = await params; const invitation = await getInvitationDetail(id); if (!invitation) notFound();
  return <div className="admin-page"><Link className="back-link" href="/dashboard/onboarding"><ArrowLeft size={16}/> All invitations</Link><header className="admin-page-header"><div><p className="eyebrow">Onboarding review</p><h1>{invitation.companyName}</h1><p>{invitation.clientName} · {invitation.clientEmail} · expires {new Date(invitation.expiresAt).toLocaleDateString()}</p></div><span className={`status-badge status-badge--${invitation.status}`}>{invitation.status.replaceAll("_", " ")}</span></header>
    <div className="admin-detail-grid"><div><section className="admin-panel"><h2>Progress</h2><div className="progress-track" role="progressbar" aria-valuenow={invitation.completionPercent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${invitation.completionPercent}%` }}/></div><p>{invitation.completionPercent}% complete · <code>{invitation.proposedPreviewSlug}.novasuite.io</code></p>{invitation.notes && <p>{invitation.notes}</p>}</section><InvitationActions id={id} status={invitation.status} readOnly={access.readOnly} hasGeneration={Boolean(invitation.generation)}/></div>
      <section className="admin-panel"><h2>Answers</h2>{ONBOARDING_SECTIONS.map((section) => { const answer = invitation.answers.find((item) => item.sectionKey === section.key); return <details key={section.key}><summary><span>{section.title}</span>{answer?.isComplete ? <strong className="complete"><Check size={15}/> Complete</strong> : <strong className="incomplete"><Clock3 size={15}/> Pending</strong>}</summary>{answer ? <AdminAnswerEditor invitationId={id} sectionKey={section.key} initialData={answer.answerData} readOnly={access.readOnly}/> : <p>No answers saved yet.</p>}</details>; })}</section>
    </div>
    {invitation.generation && <section className="admin-panel admin-generation"><div><h2>Website generation</h2><span className="status-badge">{invitation.generation.status}</span></div><ol>{invitation.generation.steps.map((step) => <li key={step.id}><span>{step.ordinal}</span><code>{step.stepKey}</code><strong>{step.status}</strong></li>)}</ol></section>}
    {invitation.locationCandidates.length > 0 && <LocationApproval invitationId={id} candidates={invitation.locationCandidates} readOnly={access.readOnly}/>} 
    {invitation.domains.length > 0 && <DomainTracking invitationId={id} initialDomains={invitation.domains} readOnly={access.readOnly}/>} 
    {invitation.generatedContent.length > 0 && <GeneratedContentReview invitationId={id} versions={invitation.generatedContent} readOnly={access.readOnly}/>} 
    {invitation.media.length > 0 && <MediaReview invitationId={id} media={invitation.media} readOnly={access.readOnly}/>} 
    <section className="admin-panel"><h2>Approval history</h2>{invitation.history.length ? <ul className="history-list">{invitation.history.map((event) => <li key={event.id}><div><strong>{event.scope.replaceAll("_", " ")} · {event.status.replaceAll("_", " ")}</strong><span>{event.actorName ?? event.actorType}</span></div><time>{new Date(event.createdAt).toLocaleString()}</time>{event.notes && <p>{event.notes}</p>}</li>)}</ul> : <p>No approval events yet.</p>}</section>
  </div>;
}
