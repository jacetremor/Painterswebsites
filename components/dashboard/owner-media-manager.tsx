"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  LoaderCircle,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";
import type { OwnerMediaItem, OwnerMediaProject, OwnerMediaState } from "@/lib/media/owner-media-types";

type Stage = OwnerMediaItem["stage"];

async function responseMessage(response: Response, fallback: string) {
  const body = await response.json().catch(() => null) as { message?: string } | null;
  return body?.message ?? fallback;
}

function projectLabel(project: OwnerMediaProject) {
  return `${project.title} · ${project.status}`;
}

export function OwnerMediaManager({ initialState, readOnly }: { initialState: OwnerMediaState; readOnly: boolean }) {
  const [items, setItems] = useState(initialState.items);
  const [selectedId, setSelectedId] = useState(initialState.items[0]?.id ?? "");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [busy, setBusy] = useState<"upload" | "save" | "delete" | null>(null);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [uploadProjectId, setUploadProjectId] = useState(initialState.projects[0]?.id ?? "");
  const [uploadStage, setUploadStage] = useState<Stage>("after");
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const [editProjectId, setEditProjectId] = useState(selected?.projectId ?? "");
  const [editStage, setEditStage] = useState<Stage>(selected?.stage ?? "after");
  const [editAlt, setEditAlt] = useState(selected?.altText ?? "");
  const [editCaption, setEditCaption] = useState(selected?.caption ?? "");
  const [editPublished, setEditPublished] = useState(selected?.isPublished ?? false);

  function selectPhoto(item: OwnerMediaItem) {
    setSelectedId(item.id);
    setEditProjectId(item.projectId);
    setEditStage(item.stage);
    setEditAlt(item.altText);
    setEditCaption(item.caption);
    setEditPublished(item.isPublished);
    setDeleteArmed(false);
  }

  const visibleItems = useMemo(() => items.filter((item) => {
    if (projectFilter !== "all" && item.projectId !== projectFilter) return false;
    if (statusFilter === "published" && !item.isPublished) return false;
    if (statusFilter === "draft" && item.isPublished) return false;
    return true;
  }), [items, projectFilter, statusFilter]);

  function showMessage(text: string, tone: "success" | "error" = "success") {
    setMessage(text);
    setMessageTone(tone);
  }

  async function uploadPhoto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadFile || !uploadProjectId) {
      showMessage("Choose a project and photo before uploading.", "error");
      return;
    }
    setBusy("upload");
    setMessage("");
    try {
      const prepare = await fetch("/api/dashboard/media/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: uploadFile.name, mimeType: uploadFile.type, byteSize: uploadFile.size }),
      });
      if (!prepare.ok) throw new Error(await responseMessage(prepare, "The upload could not start."));
      const prepared = await prepare.json() as { storagePath: string; signedUrl: string };
      const storageUpload = await fetch(prepared.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": uploadFile.type },
        body: uploadFile,
      });
      if (!storageUpload.ok) throw new Error("The photo could not be transferred to secure storage.");
      const complete = await fetch("/api/dashboard/media/uploads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: uploadProjectId,
          storagePath: prepared.storagePath,
          filename: uploadFile.name,
          mimeType: uploadFile.type,
          byteSize: uploadFile.size,
          stage: uploadStage,
          altText: uploadAlt,
          caption: uploadCaption,
        }),
      });
      if (!complete.ok) throw new Error(await responseMessage(complete, "The photo could not be registered."));
      const item = await complete.json() as OwnerMediaItem;
      setItems((current) => [item, ...current]);
      selectPhoto(item);
      setUploadFile(null);
      setUploadAlt("");
      setUploadCaption("");
      setFileInputKey((key) => key + 1);
      showMessage("Photo uploaded as a private draft. Review it, then publish when ready.");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "The photo could not be uploaded.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function savePhoto() {
    if (!selected) return;
    setBusy("save");
    setMessage("");
    try {
      const response = await fetch(`/api/dashboard/media/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: editProjectId,
          stage: editStage,
          altText: editAlt,
          caption: editCaption,
          isPublished: editPublished,
        }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, "The photo could not be saved."));
      const updated = await response.json() as OwnerMediaItem;
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      showMessage(updated.isPublished ? "Photo published to the website." : "Photo saved as a private draft.");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "The photo could not be saved.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function deletePhoto() {
    if (!selected) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }
    setBusy("delete");
    setMessage("");
    try {
      const response = await fetch(`/api/dashboard/media/${selected.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseMessage(response, "The photo could not be removed."));
      const remaining = items.filter((item) => item.id !== selected.id);
      setItems(remaining);
      if (remaining[0]) selectPhoto(remaining[0]);
      else setSelectedId("");
      showMessage("Photo removed from the project and storage.");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "The photo could not be removed.", "error");
    } finally {
      setBusy(null);
      setDeleteArmed(false);
    }
  }

  const selectedProject = initialState.projects.find((project) => project.id === editProjectId);
  const uploadDisabled = readOnly || !initialState.configured || initialState.projects.length === 0;

  return (
    <section className="owner-media" id="projects" aria-labelledby="owner-media-title">
      <header className="owner-media__header">
        <div>
          <p className="eyebrow">Projects &amp; media</p>
          <h2 id="owner-media-title">Your project photo library</h2>
          <p>Upload real work, attach it to the right project, and decide exactly when it appears on the public website.</p>
        </div>
        <div className="owner-media__counts" aria-label="Photo status summary">
          <span><strong>{items.length}</strong> total</span>
          <span><strong>{items.filter((item) => item.isPublished).length}</strong> live</span>
          <span><strong>{items.filter((item) => !item.isPublished).length}</strong> drafts</span>
        </div>
      </header>

      {!initialState.configured && (
        <div className="owner-media__notice">
          <AlertCircle size={20} aria-hidden="true" />
          <div><strong>Preview mode</strong><span>The complete owner workflow is visible below. Upload and publishing activate after Supabase is connected.</span></div>
        </div>
      )}
      {initialState.configured && initialState.projects.length === 0 && (
        <div className="owner-media__notice">
          <AlertCircle size={20} aria-hidden="true" />
          <div><strong>No database projects yet</strong><span>Import or create project records before owners upload photos.</span></div>
        </div>
      )}

      <form className="owner-upload" onSubmit={uploadPhoto}>
        <div className="owner-upload__intro">
          <ImagePlus size={24} aria-hidden="true" />
          <div><h3>Add a project photo</h3><p>JPG, PNG, WebP, or AVIF. Maximum 10 MB.</p></div>
        </div>
        <div className="owner-upload__fields">
          <label>Project<select value={uploadProjectId} onChange={(event) => setUploadProjectId(event.target.value)} disabled={uploadDisabled}>{initialState.projects.map((project) => <option key={project.id} value={project.id}>{projectLabel(project)}</option>)}</select></label>
          <label>Photo type<select value={uploadStage} onChange={(event) => setUploadStage(event.target.value as Stage)} disabled={uploadDisabled}><option value="after">Finished result</option><option value="before">Before work</option><option value="standalone">Project detail</option></select></label>
          <label className="owner-upload__wide">Alt text<span>Describe what is visible for customers using assistive technology.</span><input value={uploadAlt} onChange={(event) => setUploadAlt(event.target.value)} minLength={8} maxLength={180} required disabled={uploadDisabled} placeholder="Freshly painted white kitchen cabinets with brass hardware" /></label>
          <label className="owner-upload__wide">Caption<span>Optional context shown with the photo.</span><input value={uploadCaption} onChange={(event) => setUploadCaption(event.target.value)} maxLength={240} disabled={uploadDisabled} placeholder="Cabinet enamel finish in a Denver kitchen" /></label>
        </div>
        <div className="owner-upload__action">
          <label className="owner-file-control">
            <UploadCloud size={20} aria-hidden="true" />
            <span>{uploadFile ? uploadFile.name : "Choose project photo"}</span>
            <input key={fileInputKey} type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploadDisabled || busy !== null} onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} />
          </label>
          <button className="button" type="submit" disabled={uploadDisabled || busy !== null || !uploadFile}>
            {busy === "upload" ? <LoaderCircle className="spin" size={18} aria-hidden="true" /> : <UploadCloud size={18} aria-hidden="true" />}
            Upload private draft
          </button>
        </div>
      </form>

      <div className="owner-media__toolbar">
        <label>Project<select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="all">All projects</option>{initialState.projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
        <div className="segmented-control" aria-label="Filter photos by publishing status">
          {(["all", "published", "draft"] as const).map((status) => <button key={status} type="button" className={statusFilter === status ? "is-active" : ""} onClick={() => setStatusFilter(status)}>{status === "all" ? "All" : status === "published" ? "Live" : "Drafts"}</button>)}
        </div>
      </div>

      <div className="owner-media__workspace">
        <div className="owner-media__browser" aria-label="Project photos">
          {visibleItems.map((item) => (
            <button className={`owner-media-thumb ${selectedId === item.id ? "is-selected" : ""}`} type="button" key={item.id} onClick={() => selectPhoto(item)} aria-pressed={selectedId === item.id}>
              <span className="owner-media-thumb__image"><Image src={item.src} alt="" fill unoptimized sizes="(max-width: 680px) 50vw, 220px" /></span>
              <span className="owner-media-thumb__meta"><strong>{item.projectTitle}</strong><small>{item.stage === "after" ? "Finished result" : item.stage === "before" ? "Before work" : "Project detail"}</small></span>
              <span className={`owner-media-thumb__status ${item.isPublished ? "is-live" : ""}`}>{item.isPublished ? <Eye size={13} aria-hidden="true" /> : <EyeOff size={13} aria-hidden="true" />}{item.isPublished ? "Live" : "Draft"}</span>
            </button>
          ))}
          {!visibleItems.length && <div className="owner-media__empty"><ImagePlus size={28} aria-hidden="true" /><strong>No photos in this view</strong><span>Change the filters or upload the first project photo.</span></div>}
        </div>

        <aside className="owner-media__inspector" aria-label="Selected photo details">
          {selected ? (
            <>
              <div className="owner-media__preview"><Image src={selected.src} alt={selected.altText} fill unoptimized sizes="(max-width: 900px) 100vw, 360px" /></div>
              <div className="owner-media__inspector-heading"><div><span className={editPublished ? "status-live" : "status-draft"}>{editPublished ? "Published" : "Private draft"}</span><h3>{selected.projectTitle}</h3></div>{editPublished ? <Eye size={20} aria-label="Visible on website" /> : <EyeOff size={20} aria-label="Not visible on website" />}</div>
              <label>Project<select value={editProjectId} onChange={(event) => setEditProjectId(event.target.value)} disabled={readOnly || busy !== null}>{initialState.projects.map((project) => <option key={project.id} value={project.id}>{projectLabel(project)}</option>)}</select></label>
              <label>Photo type<select value={editStage} onChange={(event) => setEditStage(event.target.value as Stage)} disabled={readOnly || busy !== null}><option value="after">Finished result</option><option value="before">Before work</option><option value="standalone">Project detail</option></select></label>
              <label>Alt text<textarea value={editAlt} onChange={(event) => setEditAlt(event.target.value)} minLength={8} maxLength={180} disabled={readOnly || busy !== null} /></label>
              <label>Caption<textarea value={editCaption} onChange={(event) => setEditCaption(event.target.value)} maxLength={240} disabled={readOnly || busy !== null} /></label>
              <label className="owner-publish-toggle">
                <input type="checkbox" checked={editPublished} onChange={(event) => setEditPublished(event.target.checked)} disabled={readOnly || busy !== null} />
                <span><strong>Show on public website</strong><small>{selectedProject?.status === "published" ? "This photo will appear in the gallery and project page." : "The photo becomes visible when this project is published."}</small></span>
              </label>
              <div className="owner-media__inspector-actions">
                <button className="button" type="button" onClick={() => void savePhoto()} disabled={readOnly || busy !== null}><Save size={17} aria-hidden="true" />{busy === "save" ? "Saving..." : "Save changes"}</button>
                <button className={`button button--ghost ${deleteArmed ? "is-danger" : ""}`} type="button" onClick={() => void deletePhoto()} disabled={readOnly || busy !== null} title="Delete photo"><Trash2 size={17} aria-hidden="true" />{busy === "delete" ? "Deleting..." : deleteArmed ? "Confirm delete" : "Delete"}</button>
              </div>
            </>
          ) : <div className="owner-media__empty"><ImagePlus size={28} aria-hidden="true" /><strong>Select a photo</strong><span>Photo details and publishing controls appear here.</span></div>}
        </aside>
      </div>

      {message && <p className={`owner-media__message is-${messageTone}`} role="status">{messageTone === "success" ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertCircle size={18} aria-hidden="true" />}{message}</p>}
    </section>
  );
}
