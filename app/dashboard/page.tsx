import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { getOwnerLeads } from "@/lib/contact/owner-leads";
import { getCurrentTenant } from "@/lib/content/repository";
import { getOwnerMediaState } from "@/lib/media/owner-media-repository";
import { requireDashboardAccess } from "@/lib/security/dashboard-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tenant dashboard", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  const tenant = await getCurrentTenant();
  const access = await requireDashboardAccess(tenant);
  const [mediaState, leads] = await Promise.all([
    getOwnerMediaState(tenant),
    getOwnerLeads(tenant),
  ]);
  return <DashboardShell tenant={tenant} access={access} mediaState={mediaState} leads={leads} />;
}
