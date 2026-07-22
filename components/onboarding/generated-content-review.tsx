"use client";

import { useState } from "react";
import { Check, LoaderCircle, RefreshCw, Save, X } from "lucide-react";

type ContentVersion = { id: string; entityType: string; entityKey: string; version: number; provider: string; model: string; status: string; draftData: Record<string, unknown>; factualWarnings: unknown[]; createdAt: string };

function ContentItem({ invitationId, item, readOnly }: { invitationId: string; item: ContentVersion; readOnly: boolean }) {
  const [value, setValue] = useState(() => JSON.stringify(item.draftData, null, 2)); const [busy, setBusy] = useState<string | null>(null); const [message, setMessage] = useState("");
  async function act(action: "save" | "approve" | "request_changes" | "regenerate") { let draftData: Record<string, unknown> | undefined; if (action === "save") { try { draftData = JSON.parse(value) as Record<string, unknown>; } catch { setMessage("Fix the JSON format before saving."); return; } } setBusy(action); const response = await fetch(`/api/platform/onboarding/invitations/${invitationId}/content/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, draftData }) }); const body = await response.json() as { message?: string }; setBusy(null); setMessage(body.message ?? (response.ok ? "Content updated." : "Content could not be updated.")); if (response.ok && action !== "approve") window.setTimeout(() => window.location.reload(), 700); }
  const button = (action: "save" | "approve" | "request_changes" | "regenerate", label: string, icon: React.ReactNode) => <button className="button button--ghost" type="button" disabled={readOnly || busy !== null} onClick={() => void act(action)}>{busy === action ? <LoaderCircle className="spin" size={15}/> : icon}{label}</button>;
  return <details><summary><span>{item.entityKey === "home" ? "Homepage" : item.entityKey.replaceAll("-", " ")} <small>v{item.version} · {item.provider}/{item.model}</small></span><span className={`status-badge status-badge--${item.status}`}>{item.status.replaceAll("_", " ")}</span></summary><div className="content-review-editor">{item.factualWarnings.length > 0 && <div className="factual-warning"><strong>Factual warnings</strong><pre>{JSON.stringify(item.factualWarnings, null, 2)}</pre></div>}<textarea value={value} onChange={(event) => setValue(event.target.value)} aria-label={`Edit ${item.entityKey} generated content`}/><div>{button("save", "Save new version", <Save size={15}/>)}{button("regenerate", "Regenerate", <RefreshCw size={15}/>)}{button("request_changes", "Needs changes", <X size={15}/>)}{button("approve", "Approve version", <Check size={15}/>)}</div>{message && <p role="status">{message}</p>}</div></details>;
}

export function GeneratedContentReview({ invitationId, versions, readOnly }: { invitationId: string; versions: ContentVersion[]; readOnly: boolean }) {
  const latestByEntity = new Map<string, ContentVersion>();
  for (const item of versions) { const key = `${item.entityType}:${item.entityKey}`; if (!latestByEntity.has(key) || latestByEntity.get(key)!.version < item.version) latestByEntity.set(key, item); }
  const latest = [...latestByEntity.values()];
  return <section className="admin-panel generated-review"><h2>Generated content and metadata</h2><p>Review source warnings, edit the structured draft, regenerate one page, or approve the latest version. Approval never publishes it.</p>{latest.map((item) => <ContentItem key={item.id} invitationId={invitationId} item={item} readOnly={readOnly}/>)}</section>;
}
