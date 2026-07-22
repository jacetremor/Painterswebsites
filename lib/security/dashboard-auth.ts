import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";
import type { Tenant } from "@/lib/types";

export type DashboardAccess = {
  userId: string;
  email: string;
  role: "platform_admin" | "tenant_admin" | "tenant_editor" | "demo_readonly";
  readOnly: boolean;
};

export async function requireDashboardAccess(tenant: Tenant): Promise<DashboardAccess> {
  if (!hasSupabaseConfig()) {
    return { userId: "demo", email: "demo@local.invalid", role: "demo_readonly", readOnly: true };
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase!
    .from("tenant_users")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const platformRole = user.app_metadata?.role === "platform_admin";
  if (!membership && !platformRole) redirect("/unauthorized");
  return {
    userId: user.id,
    email: user.email ?? "Authenticated user",
    role: platformRole ? "platform_admin" : membership!.role,
    readOnly: false,
  };
}

export async function requirePlatformAdmin(): Promise<DashboardAccess> {
  if (!hasSupabaseConfig()) {
    return { userId: "demo", email: "demo@local.invalid", role: "demo_readonly", readOnly: true };
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) redirect("/login");
  if (user.app_metadata?.role !== "platform_admin") redirect("/unauthorized");
  return { userId: user.id, email: user.email ?? "Authenticated user", role: "platform_admin", readOnly: false };
}
