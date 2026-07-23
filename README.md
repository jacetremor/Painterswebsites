# Painters Websites Platform

A hostname-routed, multi-tenant Next.js platform for painting companies. One application serves Summit Painting Co. and Heritage Paint & Finish with separate brands, content, URLs, metadata, sitemaps, robots rules, structured data, media namespaces, submissions, memberships, and SEO audits.

The repository is Phase One infrastructure. The supplied businesses, contact details, project records, testimonials, domains, and images are demonstrations and are not approved production claims. The launch gate keeps each tenant non-ready until verified first-party evidence and credentials are supplied.

## Quick start

Requirements: Node.js 22+, npm, and optionally the Supabase CLI.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://summit.localhost:3000](http://summit.localhost:3000) and [http://heritage.localhost:3000](http://heritage.localhost:3000). `.localhost` subdomains resolve to the local computer in modern browsers.

Nova Suite onboarding administration is at [http://localhost:3000/dashboard/onboarding](http://localhost:3000/dashboard/onboarding). Tenant owners use `/login` and `/dashboard#projects` on their own hostname to upload project photos, manage alt text and captions, keep drafts private, and publish approved media to the homepage, gallery, and project pages. Without Supabase these surfaces show realistic read-only demonstration data.

Without Supabase variables the two public sites and dashboard audit run from immutable demonstration data. The dashboard is read-only and contact requests are validated but not delivered. Production writes require Supabase.

## Commands

```bash
npm run dev          # local development
npm run lint         # release-blocking lint
npm run typecheck    # strict TypeScript
npm test             # tenant and SEO unit tests
npm run test:e2e     # browser tests
npm run build        # production build
npm run lhci         # Lighthouse budgets
```

## Architecture

- Next.js 16 App Router, strict TypeScript, Tailwind CSS 4
- Server Components for public content; Client Components only for forms and the comparison control
- Hostname-derived tenant resolution; tenant IDs are not accepted from public inputs
- Supabase Postgres, Auth, Storage, RLS, and tenant-prefixed media paths
- Dynamic Metadata API, canonical URLs, JSON-LD, sitemaps, robots, and social images
- Zod write validation and critical SEO publication gates
- One GitHub repository, one Vercel project, one Supabase project, multiple domains
- Secure 17-section client onboarding with durable 30-step tenant generation
- Tenant owner project-photo workflow with private drafts and explicit public publishing
- Shared `*.novasuite.io` private previews that remain permanently noindex

Read [the architecture decision record](docs/ARCHITECTURE.md), [onboarding architecture](docs/ONBOARDING_ARCHITECTURE.md), [onboarding operations guide](docs/ONBOARDING_OPERATIONS.md), [local and Supabase setup](docs/LOCAL_AND_SUPABASE_SETUP.md), [deployment guide](docs/DEPLOYMENT.md), and [security model](docs/SECURITY.md).

## Environment variables

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` enable Supabase SSR and browser authentication. `SUPABASE_SERVICE_ROLE_KEY` is server-only and supports contact ingestion and controlled operations. Email and AI provider keys are server-only. Never expose a service-role or provider key with a `NEXT_PUBLIC_` prefix.

See [.env.example](.env.example) and [the setup guide](docs/LOCAL_AND_SUPABASE_SETUP.md).

## Production readiness

Run automated checks, then complete the tenant-specific checklist in `launch-checklists/`. A tenant is not production-ready while domains are unverified, placeholders remain, permission for project images/testimonials is absent, or credentialed RLS and Lighthouse checks have not passed.
