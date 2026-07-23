"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { safeNextPath } from "@/lib/security/safe-next-path";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Finishing your secure sign-in...");

  useEffect(() => {
    async function finishSignIn() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        window.location.replace("/login?error=expired");
        return;
      }

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const hash = new URLSearchParams(url.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const nextPath = safeNextPath(url.searchParams.get("next"));

      const result = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : accessToken && refreshToken
          ? await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          : { error: new Error("Missing sign-in credentials.") };

      if (result.error) {
        setMessage("That sign-in link is invalid or has expired.");
        window.location.replace("/login?error=expired");
        return;
      }

      window.location.replace(nextPath);
    }

    void finishSignIn();
  }, []);

  return (
    <section className="section">
      <div className="narrow auth-callback">
        <LoaderCircle className="spin" size={28} aria-hidden="true" />
        <p role="status">{message}</p>
      </div>
    </section>
  );
}
