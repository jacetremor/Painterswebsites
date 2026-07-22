import Link from "next/link";

export default function NotFound() {
  return <section className="section"><div className="narrow"><p className="eyebrow">404</p><h1>This page isn’t in the current paint plan.</h1><p className="lede">The address may have changed, or it may belong to a different company website.</p><div className="button-row"><Link className="button" href="/">Return home</Link><Link className="button button--ghost" href="/contact">Contact the company</Link></div></div></section>;
}
