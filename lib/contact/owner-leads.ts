import "server-only";

import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";
import type { Tenant } from "@/lib/types";

export type OwnerLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  postalCode: string;
  projectType: string;
  message: string;
  status: string;
  notificationStatus: string;
  createdAt: string;
};

export async function getOwnerLeads(tenant: Tenant): Promise<OwnerLead[]> {
  if (!hasSupabaseConfig()) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("contact_submissions")
    .select("id,name,email,phone,postal_code,project_type,message,status,notification_status,created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Estimate requests could not be loaded: ${error.message}`);

  return (data ?? []).map((lead) => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone ?? "",
    postalCode: lead.postal_code ?? "",
    projectType: lead.project_type ?? "",
    message: lead.message,
    status: lead.status,
    notificationStatus: lead.notification_status,
    createdAt: lead.created_at,
  }));
}
