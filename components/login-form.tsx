"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, LogIn } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm({ initialMessage = "" }: { initialMessage?: string }) {
  const [message, setMessage] = useState(initialMessage);
  const [busy, setBusy] = useState<"password" | "magic-link" | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("password");
    setMessage("");
    const values = new FormData(event.currentTarget);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setMessage("Supabase is not configured. The dashboard is available in read-only demonstration mode."); setBusy(null); return; }
    const { error } = await supabase.auth.signInWithPassword({ email: String(values.get("email")), password: String(values.get("password")) });
    if (error) { setMessage(error.message); setBusy(null); return; }
    router.push("/dashboard");
    router.refresh();
  }

  async function sendMagicLink() {
    const form = formRef.current;
    if (!form) return;
    const emailInput = form.elements.namedItem("email");
    if (!(emailInput instanceof HTMLInputElement) || !emailInput.reportValidity()) return;

    setBusy("magic-link");
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Supabase is not configured. The dashboard is available in read-only demonstration mode.");
      setBusy(null);
      return;
    }

    const callback = new URL("/auth/callback", window.location.origin);
    const { error } = await supabase.auth.signInWithOtp({
      email: emailInput.value,
      options: {
        emailRedirectTo: callback.toString(),
        shouldCreateUser: false,
      },
    });
    setBusy(null);
    setMessage(error ? error.message : "Check your email for a secure sign-in link.");
  }

  return (
    <form ref={formRef} className="form login-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="login-email">Email</label>
        <input id="login-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="login-password">Password</label>
        <input id="login-password" name="password" type="password" autoComplete="current-password" required minLength={8} />
      </div>
      <div className="login-actions">
        <button className="button" type="submit" disabled={busy !== null}>
          <LogIn size={18} aria-hidden="true" />
          {busy === "password" ? "Signing in..." : "Sign in"}
        </button>
        <button className="button button--ghost" type="button" disabled={busy !== null} onClick={() => void sendMagicLink()}>
          <Link2 size={18} aria-hidden="true" />
          {busy === "magic-link" ? "Sending link..." : "Email me a sign-in link"}
        </button>
      </div>
      <p role="status" className="form-status">{message}</p>
    </form>
  );
}
