"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton({ readOnly }: { readOnly: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return <button className="dashboard-signout" type="button" onClick={() => void signOut()} disabled={readOnly || busy} title={readOnly ? "Sign out activates after Supabase is connected" : "Sign out"}><LogOut size={16} aria-hidden="true" />{busy ? "Signing out..." : "Sign out"}</button>;
}
