import Link from "next/link";

export default function UnauthorizedPage() {
  return <section className="section"><div className="narrow"><p className="eyebrow">Access denied</p><h1>Your account does not belong to this tenant.</h1><p>Open the company domain associated with your membership or ask a tenant administrator to review access.</p><Link className="button" href="/">Return to the website</Link></div></section>;
}
