# GitHub, Vercel, and Domain Deployment

## GitHub workflow

`main` is production. Create `codex/` or feature branches, open pull requests, and require the `Quality` workflow before merge. The workflow runs lint, strict type checking, unit/SEO tests, production build, and Lighthouse budgets. Protect `main` from direct pushes and require at least one review.

## Vercel project

1. Import `jacetremor/Painterswebsites` into one Vercel project.
2. Set the framework preset to Next.js and production branch to `main`.
3. Add Supabase, email, and AI variables separately for Development, Preview, and Production.
4. Never expose server-only values with a `NEXT_PUBLIC_` prefix.
5. Keep previews protected where appropriate. The app adds `X-Robots-Tag: noindex, nofollow, noarchive` and page-level noindex on preview hosts.
6. Confirm the Quality workflow passes before merging.
7. Add `*.novasuite.io` to this same Vercel project and point the wildcard DNS record to Vercel. Do not create a project per client.
8. Set `CRON_SECRET`; Vercel Cron calls `/api/internal/generation/run` every five minutes and processes a bounded number of durable steps.
9. Set `NEXT_PUBLIC_PLATFORM_APP_URL=https://app.novasuite.io`, `OPENAI_API_KEY`, `OPENAI_MODEL`, and the configured Census-backed geography adapter variables. Keep every key server-only.

## Custom-domain onboarding

For each customer domain:

1. Prove ownership and add the root domain plus its `www` variant in Vercel.
2. Add both hostnames to `domains` with exactly one verified primary.
3. Set the secondary hostname to permanent redirect mode.
4. Update DNS with the records Vercel supplies and wait for HTTPS issuance.
5. Confirm HTTP redirects to HTTPS, secondary redirects to primary in one hop, and unknown hosts do not receive another tenant's site.
6. Check canonical, Open Graph, JSON-LD, robots, and sitemap output on the real hostname.
7. Complete the tenant launch checklist before setting `production_ready`.

One merge deploys application code for both customer domains. Supabase content and Storage objects remain outside the deployment and are not erased.

## Preview and production behavior

Preview, `.localhost`, and development domains are noindex. Production domains may be crawlable only after domain verification, placeholder removal, first-party evidence review, RLS tests, form delivery, sitemap isolation, and the launch checklist pass.

`clientname.novasuite.io` always resolves through the preview-domain record and is never canonical. The app excludes it from production sitemaps and returns `noindex, nofollow, noarchive`. Set `PREVIEW_BYPASS_TOKEN` when the Vercel-level preview protection is not sufficient; reviewers then use the protected preview link supplied by Nova Suite.

## Manual DNS safety

Phase One records domain readiness but does not call a registrar, DNS provider, domain-purchase API, or Vercel Domains API. Add the hostname to the shared Vercel project manually, show the exact web record Vercel requests, and leave all unrelated records intact. In particular, preserve MX, SPF, DKIM, DMARC, provider verification, and mail-routing records. A nameserver change is prohibited unless the client has given explicit authorization and Nova Suite has separately reviewed the full zone.
