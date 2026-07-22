import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { getCurrentTenant } from "@/lib/content/repository";

export const metadata: Metadata = { title: "Dashboard sign in", robots: { index: false, follow: false } };

export default async function LoginPage() {
  const tenant = await getCurrentTenant();
  return <section className="section"><div className="narrow"><p className="eyebrow">Tenant administration</p><h1>Sign in to {tenant.name}</h1><p className="lede">Accounts are tenant-scoped. Content, domains, users, submissions, and SEO reports remain isolated by membership and database policy.</p><LoginForm /></div></section>;
}
