"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function ContactForm({ serviceArea }: { serviceArea: string }) {
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    const form = event.currentTarget;
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const body = (await response.json()) as { message?: string };
    setSubmitting(false);
    setStatus(body.message ?? (response.ok ? "Thanks. Your request was received." : "We could not send that request."));
    if (response.ok) form.reset();
  }

  return (
    <form className="form" onSubmit={submit} aria-describedby="contact-status">
      <div className="grid-2">
        <div className="field"><label htmlFor="name">Name</label><input id="name" name="name" autoComplete="name" required maxLength={100} /></div>
        <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={200} /></div>
      </div>
      <div className="grid-2">
        <div className="field"><label htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={40} /></div>
        <div className="field"><label htmlFor="postalCode">Project ZIP code</label><input id="postalCode" name="postalCode" inputMode="numeric" autoComplete="postal-code" maxLength={12} /></div>
      </div>
      <div className="field">
        <label htmlFor="projectType">Project type</label>
        <select id="projectType" name="projectType" defaultValue="">
          <option value="" disabled>Select one</option>
          <option>Interior painting</option><option>Exterior painting</option><option>Cabinets</option><option>Deck or fence</option><option>Commercial property</option><option>Other</option>
        </select>
      </div>
      <div className="field"><label htmlFor="message">What would you like painted?</label><textarea id="message" name="message" required minLength={20} maxLength={4000} placeholder={`Include the surfaces, current condition, and timing in ${serviceArea}.`} /></div>
      <div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
      <button className="button" type="submit" disabled={submitting}><Send size={18} aria-hidden="true" /> {submitting ? "Sending…" : "Send estimate request"}</button>
      <p id="contact-status" className="form-status" role="status">{status}</p>
    </form>
  );
}
