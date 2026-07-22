"use client";

import { useState } from "react";
import { Check, Clipboard, LoaderCircle, RefreshCw, RotateCcw, Send, ShieldCheck, ShieldX } from "lucide-react";
import type { OnboardingStatus } from "@/lib/onboarding/types";

type Action = "resend" | "extend" | "revoke" | "request_changes" | "approve" | "start_generation" | "retry_generation" | "approve_for_launch" | "mark_launched";

export function InvitationActions({ id, status, readOnly, hasGeneration }: { id: string; status: OnboardingStatus; readOnly: boolean; hasGeneration: boolean }) {
  const [busy, setBusy] = useState<Action | null>(null); const [message, setMessage] = useState(""); const [url, setUrl] = useState(""); const [copied, setCopied] = useState(false);
  async function act(action: Action) {
    let notes: string | undefined; let expiresAt: string | undefined;
    if (action === "request_changes") notes = window.prompt("What should the client change?") ?? undefined;
    if (action === "extend") { const value = window.prompt("New expiration date (YYYY-MM-DD):"); if (!value) return; expiresAt = new Date(`${value}T23:59:59`).toISOString(); }
    if (["revoke", "start_generation", "approve_for_launch", "mark_launched"].includes(action) && !window.confirm(action === "revoke" ? "Revoke this client link?" : action === "start_generation" ? "Create the durable website-generation job? Nothing will publish or launch." : action === "mark_launched" ? "Mark the verified production domain live and publish approved pages?" : "Record final Nova Suite approval for launch? Production will remain blocked.")) return;
    setBusy(action); setMessage(""); setUrl("");
    const response = await fetch(`/api/platform/onboarding/invitations/${id}/actions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, notes, expiresAt }) });
    const body = await response.json() as { message?: string; url?: string };
    setBusy(null); setMessage(body.message ?? (response.ok ? "Action completed." : "Action failed.")); if (body.url) setUrl(body.url); if (response.ok && !body.url) window.setTimeout(() => window.location.reload(), 700);
  }
  async function copy() { await navigator.clipboard.writeText(url); setCopied(true); }
  const button = (action: Action, label: string, icon: React.ReactNode, enabled = true) => <button className="button button--ghost" type="button" disabled={readOnly || busy !== null || !enabled} onClick={() => void act(action)}>{busy === action ? <LoaderCircle className="spin" size={17}/> : icon}{label}</button>;
  return <section className="admin-actions" aria-labelledby="actions-heading"><h2 id="actions-heading">Actions</h2><div>
    {button("resend", "Replacement link", <RefreshCw size={17}/>, ["draft", "sent", "opened", "in_progress", "changes_requested"].includes(status))}
    {button("extend", "Extend", <RotateCcw size={17}/>, !["launched", "revoked"].includes(status))}
    {button("request_changes", "Request changes", <Send size={17}/>, status === "submitted")}
    {button("approve", "Approve submission", <ShieldCheck size={17}/>, status === "submitted")}
    {button("start_generation", "Start generation", <ShieldCheck size={17}/>, status === "approved" && !hasGeneration)}
    {button("retry_generation", "Retry failed steps", <RefreshCw size={17}/>, hasGeneration)}
    {button("approve_for_launch", "Approve for launch", <ShieldCheck size={17}/>, status === "preview_ready")}
    {button("mark_launched", "Mark site live", <Check size={17}/>, status === "ready_for_launch")}
    {button("revoke", "Revoke", <ShieldX size={17}/>, !["launched", "revoked"].includes(status))}
  </div>{message && <p className="admin-notice" role="status">{message}</p>}{url && <div className="secure-link"><div><strong>Replacement URL</strong><code>{url}</code></div><button className="button button--ghost" onClick={() => void copy()}>{copied ? <Check size={18}/> : <Clipboard size={18}/>} {copied ? "Copied" : "Copy"}</button></div>}</section>;
}
