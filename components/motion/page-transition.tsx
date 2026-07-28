import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  return <main className="page-transition" id="main-content">{children}</main>;
}
