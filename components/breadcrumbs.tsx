import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ current, parent }: { current: string; parent?: { label: string; href: string } }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link href="/">Home</Link><ChevronRight size={14} aria-hidden="true" />
      {parent ? <><Link href={parent.href}>{parent.label}</Link><ChevronRight size={14} aria-hidden="true" /></> : null}
      <span aria-current="page">{current}</span>
    </nav>
  );
}
