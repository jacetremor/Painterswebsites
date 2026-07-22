"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

export function BlogGeneratorForm({ readOnly }: { readOnly: boolean }) {
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch("/api/ai/blog-draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const body = await response.json() as { message?: string; draft?: string };
    setMessage(body.message ?? "Generation finished.");
    setDraft(body.draft ?? "");
  }
  return <form className="form card card__body" onSubmit={submit}><p className="eyebrow">AI-assisted draft</p><h2>Ground a blog draft in real work</h2><div className="grid-2"><div className="field"><label htmlFor="topic">Topic</label><input id="topic" name="topic" required minLength={8} disabled={readOnly} /></div><div className="field"><label htmlFor="targetService">Target service</label><input id="targetService" name="targetService" disabled={readOnly} /></div></div><div className="grid-2"><div className="field"><label htmlFor="targetCity">Target city</label><input id="targetCity" name="targetCity" disabled={readOnly} /></div><div className="field"><label htmlFor="relatedProject">Related completed project</label><input id="relatedProject" name="relatedProject" disabled={readOnly} /></div></div><div className="field"><label htmlFor="customerQuestions">Real customer questions</label><textarea id="customerQuestions" name="customerQuestions" required minLength={10} disabled={readOnly} /></div><div className="field"><label htmlFor="painterAdvice">Painter advice</label><textarea id="painterAdvice" name="painterAdvice" required minLength={20} disabled={readOnly} /></div><div className="grid-2"><div className="field"><label htmlFor="productsUsed">Products actually used</label><textarea id="productsUsed" name="productsUsed" disabled={readOnly} /></div><div className="field"><label htmlFor="techniquesUsed">Techniques actually used</label><textarea id="techniquesUsed" name="techniquesUsed" disabled={readOnly} /></div></div><div className="field"><label htmlFor="firstHandObservations">First-hand observations</label><textarea id="firstHandObservations" name="firstHandObservations" required minLength={20} disabled={readOnly} /></div><div className="field"><label htmlFor="desiredCta">Desired call to action</label><input id="desiredCta" name="desiredCta" required minLength={5} disabled={readOnly} /></div><button className="button" type="submit" disabled={readOnly}><Sparkles size={18} aria-hidden="true" />Generate review draft</button><p className="form-status" role="status">{message}</p>{draft ? <details><summary>Generated draft preview</summary><pre style={{ whiteSpace: "pre-wrap" }}>{draft}</pre></details> : null}</form>;
}
