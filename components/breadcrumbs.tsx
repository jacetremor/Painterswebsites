import Link from "next/link";

export function Breadcrumbs({ current, parent }: { current: string; parent?: { label: string; href: string } }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link href="/">Home</Link><span aria-hidden="true">/</span>
      {parent ? <><Link href={parent.href}>{parent.label}</Link><span aria-hidden="true">/</span></> : null}
      <span aria-current="page">{current}</span>
    </nav>
  );
}
