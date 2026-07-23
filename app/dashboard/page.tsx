import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentTenant } from "@/lib/content/repository";
import { getOwnerMediaState } from "@/lib/media/owner-media-repository";
import { requireDashboardAccess } from "@/lib/security/dashboard-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tenant dashboard", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  const tenant = await getCurrentTenant();
  const access = await requireDashboardAccess(tenant);
  const mediaState = await getOwnerMediaState(tenant);
  return <DashboardShell tenant={tenant} access={access} mediaState={mediaState} />;
}
