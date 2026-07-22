"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Check, ChevronLeft, ChevronRight, FileUp, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { ONBOARDING_SECTIONS, type OnboardingField, validateOnboardingSection } from "@/lib/onboarding/sections";
import type { OnboardingAnswerMap, OnboardingSession } from "@/lib/onboarding/types";
import { ClientPreviewReview } from "@/components/onboarding/client-preview-review";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
type UploadedFile = { id: string; storage_path: string; original_filename: string; mime_type: string; byte_size: number };

function emptyValue(field: OnboardingField): unknown {
  if (field.type === "checkbox") return false;
  if (field.type === "multiselect" || field.type === "file" || field.type === "repeater") return [];
  if (field.type === "number") return field.key === "radius_miles" ? 30 : field.key === "maximum_location_pages" ? 20 : "";
  if (field.type === "color") return field.key === "primary_color" ? "#17463d" : field.key === "secondary_color" ? "#eef3f0" : "#f2b84b";
  return "";
}

function initialAnswers(session: OnboardingSession): Record<string, OnboardingAnswerMap> {
  return Object.fromEntries(ONBOARDING_SECTIONS.map((section) => [section.key, Object.fromEntries(section.fields.map((field) => [field.key, session.answers[section.key]?.answerData[field.key] ?? emptyValue(field)]))]));
}

export function OnboardingWizard({ token, initialSession }: { token: string; initialSession: OnboardingSession }) {
  const initialIndex = Math.max(0, ONBOARDING_SECTIONS.findIndex((section) => section.key === initialSession.currentSection));
  const [sectionIndex, setSectionIndex] = useState(initialIndex);
  const [answers, setAnswers] = useState(() => initialAnswers(initialSession));
  const [completion, setCompletion] = useState(initialSession.invitation.completionPercent);
  const [completedSections, setCompletedSections] = useState(() => new Set(Object.values(initialSession.answers).filter((item) => item.isComplete).map((item) => item.sectionKey)));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(initialSession.invitation.status === "submitted");
  const [uploading, setUploading] = useState<string | null>(null);
  const dirtySection = useRef<string | null>(null);
  const section = ONBOARDING_SECTIONS[sectionIndex]!;
  const currentAnswers = answers[section.key] ?? {};
  const readOnly = submitted || ["approved", "website_generating", "preview_ready", "ready_for_launch", "launched", "revoked", "expired"].includes(initialSession.invitation.status);

  const saveSection = useCallback(async (sectionKey: string, requireComplete = false) => {
    if (initialSession.demoMode) {
      const result = validateOnboardingSection(sectionKey, answers[sectionKey] ?? {});
      if (requireComplete && !result.success) { setErrors(result.errors); setSaveState("error"); return false; }
      setSaveState("saved"); setMessage("Demo mode: connect Supabase to store progress securely.");
      if (result.success) setCompletedSections((previous) => new Set(previous).add(sectionKey));
      return true;
    }
    setSaveState("saving"); setMessage("");
    try {
      const response = await fetch(`/api/onboarding/${encodeURIComponent(token)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKey, answerData: answers[sectionKey] ?? {}, requireComplete }),
      });
      const body = await response.json() as { message?: string; isComplete?: boolean; completionPercent?: number };
      if (!response.ok) {
        const result = validateOnboardingSection(sectionKey, answers[sectionKey] ?? {});
        if (!result.success) setErrors(result.errors);
        throw new Error(body.message ?? "Progress could not be saved.");
      }
      if (body.isComplete) setCompletedSections((previous) => new Set(previous).add(sectionKey));
      else setCompletedSections((previous) => { const next = new Set(previous); next.delete(sectionKey); return next; });
      setCompletion(body.completionPercent ?? completion); setSaveState("saved"); dirtySection.current = null;
      return true;
    } catch (error) { setSaveState("error"); setMessage(error instanceof Error ? error.message : "Progress could not be saved."); return false; }
  }, [answers, completion, initialSession.demoMode, token]);

  useEffect(() => {
    if (saveState !== "dirty" || readOnly) return;
    const sectionKey = dirtySection.current;
    const timer = window.setTimeout(() => { if (sectionKey) void saveSection(sectionKey); }, 1200);
    return () => window.clearTimeout(timer);
  }, [readOnly, saveSection, saveState]);

  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => { if (saveState === "dirty" || saveState === "saving") event.preventDefault(); };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [saveState]);

  const updateValue = (key: string, value: unknown) => {
    setAnswers((previous) => ({ ...previous, [section.key]: { ...(previous[section.key] ?? {}), [key]: value } }));
    setErrors((previous) => { const next = { ...previous }; delete next[key]; return next; });
    dirtySection.current = section.key; setSaveState("dirty"); setMessage("");
  };

  const goTo = async (nextIndex: number, validate = false) => {
    if (readOnly || saveState === "dirty" || validate) {
      const saved = readOnly ? true : await saveSection(section.key, validate);
      if (!saved) return;
    }
    setErrors({}); setSectionIndex(Math.max(0, Math.min(ONBOARDING_SECTIONS.length - 1, nextIndex))); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadFiles = async (fieldKey: string, files: FileList, onComplete: (files: UploadedFile[]) => void) => {
    if (initialSession.demoMode) { setMessage("Uploads become available after Supabase is connected."); return; }
    setUploading(fieldKey); setMessage("");
    try {
      const uploaded: UploadedFile[] = [];
      for (const file of Array.from(files)) {
        const prepare = await fetch(`/api/onboarding/${encodeURIComponent(token)}/uploads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sectionKey: section.key, fieldKey, filename: file.name, mimeType: file.type, byteSize: file.size }) });
        const prepared = await prepare.json() as { storagePath?: string; signedUrl?: string; message?: string };
        if (!prepare.ok || !prepared.storagePath || !prepared.signedUrl) throw new Error(prepared.message ?? "Upload could not start.");
        const upload = await fetch(prepared.signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        if (!upload.ok) throw new Error(`Could not upload ${file.name}.`);
        const complete = await fetch(`/api/onboarding/${encodeURIComponent(token)}/uploads`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sectionKey: section.key, fieldKey, filename: file.name, mimeType: file.type, byteSize: file.size, storagePath: prepared.storagePath }) });
        const completed = await complete.json() as UploadedFile & { message?: string };
        if (!complete.ok) throw new Error(completed.message ?? "Upload could not be registered.");
        uploaded.push(completed);
      }
      onComplete(uploaded); setMessage(`${uploaded.length} file${uploaded.length === 1 ? "" : "s"} uploaded securely.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { setUploading(null); }
  };

  const submit = async () => {
    const saved = await saveSection(section.key, true); if (!saved) return;
    if (initialSession.demoMode) { setMessage("Demo mode cannot submit. Connect Supabase to enable the approval workflow."); return; }
    const confirmationName = String(answers.final_review?.confirmation_name ?? "");
    setSaveState("saving");
    const response = await fetch(`/api/onboarding/${encodeURIComponent(token)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmationName }) });
    const body = await response.json() as { message?: string };
    if (!response.ok) { setSaveState("error"); setMessage(body.message ?? "The form could not be submitted."); return; }
    setSubmitted(true); setCompletion(100); setSaveState("saved"); setMessage(body.message ?? "Submitted.");
  };

  if (submitted) return <section className="platform-message"><div><Check size={36} aria-hidden="true"/><p className="eyebrow">Submission received</p><h1>Thank you, {initialSession.invitation.clientName}.</h1><p>Nova Suite will review your facts and assets before any website generation begins. Nothing has been published or launched.</p></div></section>;
  if (["preview_ready", "ready_for_launch"].includes(initialSession.invitation.status)) return <ClientPreviewReview token={token} companyName={initialSession.invitation.companyName} previewSlug={initialSession.invitation.proposedPreviewSlug}/>;
  if (["approved", "website_generating"].includes(initialSession.invitation.status)) return <section className="platform-message"><div><LoaderCircle className={initialSession.invitation.status === "website_generating" ? "spin" : ""} size={36}/><p className="eyebrow">Nova Suite review</p><h1>Your website is being prepared.</h1><p>Your submitted facts are locked while Nova Suite reviews and generates the private draft. Nothing is published or launched automatically.</p></div></section>;

  return (
    <div className="onboarding-shell">
      <aside className="onboarding-sidebar" aria-label="Onboarding sections">
        <p className="eyebrow">Client onboarding</p><h2>{initialSession.invitation.companyName}</h2>
        <div className="progress-track" role="progressbar" aria-label="Onboarding completion" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${completion}%` }} /></div>
        <p className="progress-label">{completion}% complete</p>
        <ol>{ONBOARDING_SECTIONS.map((item, index) => <li key={item.key}><button type="button" className={index === sectionIndex ? "active" : ""} onClick={() => void goTo(index)} aria-current={index === sectionIndex ? "step" : undefined}><span>{completedSections.has(item.key) ? <Check size={14} aria-label="Complete"/> : index + 1}</span>{item.title}</button></li>)}</ol>
      </aside>
      <main className="onboarding-main">
        <div className="onboarding-mobile-progress"><label htmlFor="section-picker">Section {sectionIndex + 1} of {ONBOARDING_SECTIONS.length}</label><select id="section-picker" value={sectionIndex} onChange={(event) => void goTo(Number(event.target.value))}>{ONBOARDING_SECTIONS.map((item, index) => <option value={index} key={item.key}>{index + 1}. {item.title}</option>)}</select></div>
        <header className="onboarding-section-header"><p className="eyebrow">Section {sectionIndex + 1} of {ONBOARDING_SECTIONS.length}</p><h1>{section.title}</h1><p>{section.summary}</p></header>
        {section.key === "final_review" && <ReviewSummary completedSections={completedSections} onSelect={(index) => void goTo(index)} />}
        <div className="onboarding-form" aria-busy={saveState === "saving"}>
          {section.fields.map((field) => <Field key={field.key} field={field} value={currentAnswers[field.key]} error={errors[field.key]} disabled={readOnly} uploading={uploading} onChange={(value) => updateValue(field.key, value)} onUpload={(fieldKey, files, onComplete) => void uploadFiles(fieldKey, files, onComplete)} />)}
        </div>
        <div className={`autosave-status autosave-status--${saveState}`} aria-live="polite">{saveState === "saving" ? <><LoaderCircle className="spin" size={16}/> Saving securely...</> : saveState === "saved" ? <><Check size={16}/> Progress saved</> : saveState === "dirty" ? <><Save size={16}/> Unsaved changes</> : saveState === "error" ? <><AlertCircle size={16}/> Check this section</> : "Progress is saved to your secure invitation."}</div>
        {message && <p className="onboarding-message" role="status">{message}</p>}
        <div className="onboarding-actions">
          <button className="button button--ghost" type="button" onClick={() => void goTo(sectionIndex - 1)} disabled={sectionIndex === 0}><ChevronLeft size={18}/> Previous</button>
          {sectionIndex < ONBOARDING_SECTIONS.length - 1 ? <button className="button" type="button" onClick={() => void goTo(sectionIndex + 1, true)}>Save and continue <ChevronRight size={18}/></button> : <button className="button" type="button" onClick={() => void submit()}>Confirm and submit <Check size={18}/></button>}
        </div>
      </main>
    </div>
  );
}

function ReviewSummary({ completedSections, onSelect }: { completedSections: Set<string>; onSelect: (index: number) => void }) {
  return <section className="review-summary" aria-labelledby="review-heading"><h2 id="review-heading">Section review</h2><div>{ONBOARDING_SECTIONS.slice(0, -1).map((item, index) => <button type="button" key={item.key} onClick={() => onSelect(index)}><span>{item.title}</span><strong className={completedSections.has(item.key) ? "complete" : "incomplete"}>{completedSections.has(item.key) ? "Complete" : "Needs attention"}</strong></button>)}</div></section>;
}

function Field({ field, value, error, disabled, uploading, onChange, onUpload }: { field: OnboardingField; value: unknown; error?: string; disabled: boolean; uploading: string | null; onChange: (value: unknown) => void; onUpload: (fieldKey: string, files: FileList, done: (files: UploadedFile[]) => void) => void }) {
  const id = `field-${field.key}`;
  if (field.type === "checkbox") return <div className="onboarding-checkbox"><input id={id} type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} disabled={disabled}/><label htmlFor={id}>{field.label}{field.required && <span aria-label="required"> *</span>}</label>{field.help && <small>{field.help}</small>}{error && <small className="field-error">{error}</small>}</div>;
  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? value as string[] : [];
    return <fieldset className="onboarding-field onboarding-options"><legend>{field.label}{field.required && <span aria-label="required"> *</span>}</legend>{field.help && <small>{field.help}</small>}<div>{field.options?.map((option) => <label key={option}><input type="checkbox" checked={selected.includes(option)} disabled={disabled} onChange={(event) => onChange(event.target.checked ? [...selected, option] : selected.filter((item) => item !== option))}/><span>{option}</span></label>)}</div>{error && <small className="field-error">{error}</small>}</fieldset>;
  }
  if (field.type === "file") {
    const uploaded = Array.isArray(value) ? value as UploadedFile[] : [];
    return <div className="onboarding-field"><label htmlFor={id}>{field.label}{field.required && <span aria-label="required"> *</span>}</label>{field.help && <small>{field.help}</small>}<label className="upload-control" htmlFor={id}>{uploading === field.key ? <LoaderCircle className="spin"/> : <FileUp/>}<span>{uploading === field.key ? "Uploading..." : "Choose files"}</span></label><input className="visually-hidden" id={id} type="file" accept={field.accept} multiple={field.multiple} disabled={disabled || uploading !== null} onChange={(event) => { if (event.target.files?.length) onUpload(field.key, event.target.files, (files) => onChange(field.multiple ? [...uploaded, ...files] : files)); event.target.value = ""; }}/>{uploaded.length > 0 && <ul className="upload-list">{uploaded.map((file) => <li key={file.id ?? file.storage_path}>{file.original_filename}<button type="button" aria-label={`Remove ${file.original_filename}`} onClick={() => onChange(uploaded.filter((item) => item !== file))}><Trash2 size={16}/></button></li>)}</ul>}{error && <small className="field-error">{error}</small>}</div>;
  }
  if (field.type === "repeater") return <Repeater field={field} value={Array.isArray(value) ? value as OnboardingAnswerMap[] : []} disabled={disabled} error={error} onChange={onChange} onUpload={onUpload}/>;
  if (field.type === "select") return <div className="onboarding-field"><label htmlFor={id}>{field.label}{field.required && <span aria-label="required"> *</span>}</label>{field.help && <small>{field.help}</small>}<select id={id} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} disabled={disabled}><option value="">Select an option</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select>{error && <small className="field-error">{error}</small>}</div>;
  if (field.type === "textarea") return <div className="onboarding-field"><label htmlFor={id}>{field.label}{field.required && <span aria-label="required"> *</span>}</label>{field.help && <small>{field.help}</small>}<textarea id={id} value={String(value ?? "")} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} disabled={disabled}/>{error && <small className="field-error">{error}</small>}</div>;
  const inputType = field.type === "tel" ? "tel" : field.type === "number" ? "number" : field.type;
  return <div className="onboarding-field"><label htmlFor={id}>{field.label}{field.required && <span aria-label="required"> *</span>}</label>{field.help && <small>{field.help}</small>}<input id={id} type={inputType} value={String(value ?? "")} placeholder={field.placeholder} onChange={(event) => onChange(field.type === "number" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value)} disabled={disabled}/>{field.type === "color" && <span className="color-value">{String(value ?? "")}</span>}{error && <small className="field-error">{error}</small>}</div>;
}

function Repeater({ field, value, disabled, error, onChange, onUpload }: { field: OnboardingField; value: OnboardingAnswerMap[]; disabled: boolean; error?: string; onChange: (value: unknown) => void; onUpload: (fieldKey: string, files: FileList, done: (files: UploadedFile[]) => void) => void }) {
  const add = () => onChange([...value, Object.fromEntries((field.itemFields ?? []).map((item) => [item.key, emptyValue(item)]))]);
  return <fieldset className="onboarding-field repeater"><legend>{field.label}{field.required && <span aria-label="required"> *</span>}</legend>{value.map((item, index) => <section key={index}><header><h3>{field.label.replace(/s$/, "")} {index + 1}</h3><button type="button" aria-label={`Remove item ${index + 1}`} onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} disabled={disabled}><Trash2 size={17}/></button></header>{field.itemFields?.map((itemField) => <Field key={itemField.key} field={{ ...itemField, key: `${field.key}.${index}.${itemField.key}` }} value={item[itemField.key]} disabled={disabled} uploading={null} onChange={(nextValue) => onChange(value.map((entry, itemIndex) => itemIndex === index ? { ...entry, [itemField.key]: nextValue } : entry))} onUpload={onUpload}/>)}</section>)}<button className="button button--ghost repeater-add" type="button" onClick={add} disabled={disabled}><Plus size={18}/> Add {field.label.replace(/s$/, "").toLowerCase()}</button>{error && <small className="field-error">{error}</small>}</fieldset>;
}
