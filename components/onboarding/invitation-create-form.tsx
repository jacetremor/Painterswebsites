"use client";

import { useState } from "react";
import { Check, Clipboard, LoaderCircle, Send } from "lucide-react";

function defaultExpiration() {
  const date = new Date(Date.now() + 14 * 86400000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function InvitationCreateForm({ readOnly }: { readOnly: boolean }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [url, setUrl] = useState(""); const [copied, setCopied] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setUrl("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/platform/onboarding/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      clientName: form.get("clientName"), companyName: form.get("companyName"), clientEmail: form.get("clientEmail"),
      proposedPreviewSlug: form.get("proposedPreviewSlug"), notes: form.get("notes"), expiresAt: new Date(String(form.get("expiresAt"))).toISOString(),
    }) });
    const body = await response.json() as { message?: string; url?: string };
    setBusy(false); if (!response.ok) { setMessage(body.message ?? "Invitation could not be created."); return; }
    setUrl(body.url ?? ""); setMessage("Invitation created. This secure link is shown once.");
  }
  async function copy() { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  return <div className="admin-form-wrap">
    <form className="admin-form" onSubmit={submit}>
      <div className="onboarding-field"><label htmlFor="clientName">Client name *</label><input id="clientName" name="clientName" required maxLength={120}/></div>
      <div className="onboarding-field"><label htmlFor="companyName">Company name *</label><input id="companyName" name="companyName" required maxLength={180}/></div>
      <div className="onboarding-field"><label htmlFor="clientEmail">Client email *</label><input id="clientEmail" name="clientEmail" type="email" required/></div>
      <div className="onboarding-field"><label htmlFor="proposedPreviewSlug">Proposed preview slug *</label><div className="input-suffix"><input id="proposedPreviewSlug" name="proposedPreviewSlug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required/><span>.novasuite.io</span></div></div>
      <div className="onboarding-field"><label htmlFor="expiresAt">Expiration *</label><input id="expiresAt" name="expiresAt" type="datetime-local" defaultValue={defaultExpiration()} required/></div>
      <div className="onboarding-field admin-form-full"><label htmlFor="notes">Internal notes</label><textarea id="notes" name="notes" maxLength={5000}/></div>
      <div className="admin-form-full"><button className="button" disabled={readOnly || busy} type="submit">{busy ? <LoaderCircle className="spin" size={18}/> : <Send size={18}/>} Create invitation</button></div>
    </form>
    {readOnly && <p className="admin-notice">Demo mode is read-only. Connect Supabase and sign in with the `platform_admin` role to create invitations.</p>}
    {message && <p className="admin-notice" role="status">{message}</p>}
    {url && <div className="secure-link"><div><strong>Secure onboarding URL</strong><code>{url}</code></div><button className="button button--ghost" type="button" onClick={() => void copy()}>{copied ? <Check size={18}/> : <Clipboard size={18}/>} {copied ? "Copied" : "Copy"}</button></div>}
  </div>;
}

