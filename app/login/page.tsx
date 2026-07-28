import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { getCurrentTenant } from "@/lib/content/repository";

export const metadata: Metadata = { title: "Dashboard sign in", robots: { index: false, follow: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const tenant = await getCurrentTenant();
  const { error } = await searchParams;
  const initialMessage = error === "expired"
    ? "That sign-in link is invalid or has expired. Request a new link below."
    : "";
  return (
    <section className="login-shell">
      <aside className="login-intro">
        <span className="login-intro__mark" aria-hidden="true">{tenant.branding.logoMark}</span>
        <div>
          <p className="eyebrow">Owner workspace</p>
          <h1>Your website, kept current.</h1>
          <p>Manage project photos, publishing, and search readiness for {tenant.name} in one secure place.</p>
        </div>
        <p className="login-intro__security"><ShieldCheck size={18} aria-hidden="true" /> Tenant-scoped access protects each company&apos;s content.</p>
      </aside>
      <div className="login-panel">
        <div className="login-panel__heading">
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in to {tenant.name}</h2>
          <p>Use your owner email and password, or request a secure email link.</p>
        </div>
        <LoginForm initialMessage={initialMessage} />
      </div>
    </section>
  );
}
