import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InvitationCreateForm } from "@/components/onboarding/invitation-create-form";
import { requirePlatformAdmin } from "@/lib/security/dashboard-auth";

export const metadata: Metadata = { title: "New onboarding invitation | Nova Suite", robots: { index: false, follow: false } };
export default async function NewInvitationPage() { const access = await requirePlatformAdmin(); return <div className="admin-page admin-page--narrow"><Link className="back-link" href="/dashboard/onboarding"><ArrowLeft size={16}/> All invitations</Link><header className="admin-page-header"><div><p className="eyebrow">Secure client intake</p><h1>New invitation</h1><p>Payment remains outside this system. Creating this invitation starts onboarding only.</p></div></header><InvitationCreateForm readOnly={access.readOnly}/></div>; }

