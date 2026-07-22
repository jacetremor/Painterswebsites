"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const values = new FormData(event.currentTarget);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setMessage("Supabase is not configured. The dashboard is available in read-only demonstration mode."); setBusy(false); return; }
    const { error } = await supabase.auth.signInWithPassword({ email: String(values.get("email")), password: String(values.get("password")) });
    if (error) { setMessage(error.message); setBusy(false); return; }
    router.push("/dashboard");
    router.refresh();
  }
  return <form className="form" onSubmit={submit}><div className="field"><label htmlFor="login-email">Email</label><input id="login-email" name="email" type="email" autoComplete="email" required /></div><div className="field"><label htmlFor="login-password">Password</label><input id="login-password" name="password" type="password" autoComplete="current-password" required minLength={8} /></div><button className="button" type="submit" disabled={busy}><LogIn size={18} aria-hidden="true" />{busy ? "Signing in…" : "Sign in"}</button><p role="status" className="form-status">{message}</p></form>;
}
