"use client";

import { useState } from "react";
import { LoaderCircle, Save } from "lucide-react";

type Candidate = { id: string; city: string; stateAbbr: string; distanceMiles: number; population?: number; isPriority: boolean; isCrossState: boolean; clientApproved: boolean; novaSuiteApproved: boolean; noindex: boolean };

export function LocationApproval({ invitationId, candidates, readOnly }: { invitationId: string; candidates: Candidate[]; readOnly: boolean }) {
  const [approved, setApproved] = useState(() => new Set(candidates.filter((item) => item.novaSuiteApproved).map((item) => item.id))); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function save() { setBusy(true); const response = await fetch(`/api/platform/onboarding/invitations/${invitationId}/locations`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approvedIds: [...approved] }) }); const body = await response.json() as { message?: string }; setBusy(false); setMessage(body.message ?? (response.ok ? "Location approvals saved." : "Locations could not be saved.")); }
  return <section className="admin-panel location-approval"><div><h2>Location approval</h2><button className="button button--ghost" type="button" disabled={readOnly || busy} onClick={() => void save()}>{busy ? <LoaderCircle className="spin" size={16}/> : <Save size={16}/>} Save approvals</button></div><p>Coverage is the hard gate. Cross-state candidates require explicit approval and remain noindex until page review.</p><div className="location-list">{candidates.map((candidate) => <label key={candidate.id}><input type="checkbox" checked={approved.has(candidate.id)} disabled={readOnly || !candidate.clientApproved} onChange={(event) => setApproved((previous) => { const next = new Set(previous); if (event.target.checked) next.add(candidate.id); else next.delete(candidate.id); return next; })}/><span><strong>{candidate.city}, {candidate.stateAbbr}</strong><small>{candidate.distanceMiles.toFixed(1)} mi{candidate.population ? ` · population ${candidate.population.toLocaleString()}` : ""}{candidate.isPriority ? " · priority" : ""}{candidate.isCrossState ? " · cross-state" : ""}</small></span></label>)}</div><p role="status">{message}</p></section>;
}

