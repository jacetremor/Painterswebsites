"use client";

import { useState } from "react";
import { LoaderCircle, Save } from "lucide-react";

export function AdminAnswerEditor({ invitationId, sectionKey, initialData, readOnly }: { invitationId: string; sectionKey: string; initialData: Record<string, unknown>; readOnly: boolean }) {
  const [value, setValue] = useState(() => JSON.stringify(initialData, null, 2)); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function save() {
    let answerData: Record<string, unknown>; try { answerData = JSON.parse(value) as Record<string, unknown>; } catch { setMessage("Fix the JSON format before saving."); return; }
    setBusy(true); const response = await fetch(`/api/platform/onboarding/invitations/${invitationId}/answers`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sectionKey, answerData }) });
    const body = await response.json() as { message?: string }; setBusy(false); setMessage(body.message ?? (response.ok ? "Answers saved." : "Answers could not be saved."));
  }
  return <div className="answer-editor"><textarea aria-label={`${sectionKey} answers as JSON`} value={value} onChange={(event) => setValue(event.target.value)} disabled={readOnly}/><div><button className="button button--ghost" type="button" disabled={readOnly || busy} onClick={() => void save()}>{busy ? <LoaderCircle className="spin" size={16}/> : <Save size={16}/>} Save answers</button><span role="status">{message}</span></div></div>;
}

