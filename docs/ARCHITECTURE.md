# Painters Website Platform Architecture

Status: Accepted for Phase One

## 1. Architecture recommendation

Build one Next.js 16 App Router application deployed as one Vercel project. The incoming hostname resolves a tenant before public content is loaded. Public pages use Server Components and tenant-scoped repositories. Supabase provides Postgres, Auth, and Storage; Row Level Security (RLS) is the final authorization boundary. Tenant configuration controls branding and page composition without a drag-and-drop builder.

The application is split into four layers:

1. `app/` owns routes, metadata, sitemaps, robots responses, route handlers, and server actions.
2. `components/` owns shared public and dashboard presentation.
3. `lib/` owns tenant resolution, repositories, validation, SEO, security, and seed fallbacks.
4. `supabase/` owns migrations, RLS policies, storage policies, and database seed data.

Phase One can run without Supabase credentials by using immutable demonstration data. Production writes, authentication, uploads, submissions, and draft previews require Supabase. The fallback is deliberately read-only and is never selected when production environment variables are present.

## 2. Database schema

Every tenant-owned table has `tenant_id`, timestamps, and actor columns where a user can mutate the record. Content tables use an explicit status enum and independent SEO fields. Slugs are unique per tenant, not globally. Join tables model services on projects and locations. Redirects retain slug history.

Core tables: `tenants`, `domains`, `tenant_users`, `branding_settings`, `navigation_items`, `pages`, `services`, `locations`, `projects`, `project_services`, `project_images`, `testimonials`, `blog_posts`, `blog_generation_requests`, `seo_settings`, `seo_audits`, `seo_issues`, `contact_settings`, `contact_submissions`, `redirects`, `analytics_settings`, and `audit_logs`.

The migration is authoritative. TypeScript types mirror its public read model and Zod validates all write boundaries.

## 3. Tenant-routing approach

`proxy.ts` normalizes the request hostname, strips ports, removes a leading `www`, and marks preview/development hosts as noindex. A server-only resolver looks up `domains.hostname`; local aliases (`summit.localhost`, `heritage.localhost`) are available in seed mode. Secondary verified domains receive a permanent redirect to the verified primary domain. Unknown hosts and unknown slugs return 404.

Tenant IDs are never accepted from public URL parameters or request bodies. They are derived from the hostname for public requests and from the authenticated membership for dashboard requests.

## 4. SEO architecture

All indexable records implement one SEO document contract. A publication gate validates identity, status, title, description, H1, canonical host, slug, primary content, internal links, structured data, image-alt decisions, and duplicate conflicts. Critical failures block publication; warnings remain visible in the dashboard.

Public content is rendered on the server with semantic landmarks, crawlable anchors, one H1, breadcrumbs on interior pages, stable pagination, optimized images, and explicit 404 behavior. Tracking/filter parameters never participate in canonical generation.

## 5. Metadata-generation architecture

Route-level `generateMetadata` loads the tenant and page together, derives a self-referencing HTTPS canonical from the verified primary domain, and returns tenant-specific title, description, robots, favicon, Open Graph, and Twitter metadata. Custom canonicals are accepted only after same-tenant host validation. Preview, Vercel, localhost, draft, and noindex states receive `noindex, nofollow` as applicable.

## 6. Sitemap and robots architecture

`app/sitemap.ts` resolves the host and emits only that tenant's published, indexable, non-redirected canonical records with accurate update dates. `app/robots.ts` emits a tenant-specific sitemap reference, disallows dashboard/auth/API/preview paths, and defaults nonproduction hosts to noindex behavior. Isolation and draft exclusion are unit tested.

## 7. Structured-data architecture

Small schema builders produce `HomeAndConstructionBusiness`, `WebSite`, `WebPage`, `Service`, `BreadcrumbList`, `Article`, and `ImageObject` graphs from visible tenant data. Builders omit unknown claims and reject cross-tenant URLs. JSON-LD is serialized with `<` escaped to prevent script injection and is validated before a record can publish.

## 8. Internal-linking architecture

Relations define links rather than keyword injection. Home links to primary services, featured locations, projects, About, and Contact. Services link to related services, locations, and projects. Locations link to available services, nearby locations, and local projects. Projects and posts link back to their related entities. An audit graph reports broken and orphaned indexable nodes.

## 9. Content quality and duplicate detection

The audit normalizes titles, descriptions, H1s, slugs, and body text within a tenant. Exact conflicts are critical. Body similarity uses token shingles and Jaccard similarity to flag substantial duplication, while location validation also requires a meaningful local element such as a real project, testimonial, climate/surface note, or tenant-entered scheduling detail. There is no arbitrary word-count publishing rule. AI drafts remain `draft` until a human reviewer approves them.

## 10. Folder structure

```text
app/                 App Router public, dashboard, auth, API, metadata routes
components/          Shared theme-aware public and dashboard components
lib/content/         Tenant-scoped repositories and demonstration seeds
lib/seo/             Metadata, canonical, JSON-LD, audits, publishing gate
lib/supabase/        Browser, server, middleware, and admin clients
lib/tenant/          Host normalization and tenant resolution
lib/validation/      Zod input schemas
supabase/migrations/ Schema, indexes, RLS, storage policies
supabase/seed.sql    Two-tenant relational seed data
tests/               Unit and integration tests
docs/                Operations, content, security, and onboarding guides
```

## 11. Security model

Public reads require a resolved tenant and published status. Dashboard reads and writes require a valid Supabase session plus membership. Server actions determine `tenant_id` from membership, validate input with Zod, use same-origin checks, and write audit logs. Platform administrators may cross tenants through explicit platform-only server paths. Service-role credentials remain server-only. Contact endpoints use a honeypot, origin checks, per-IP/tenant rate limiting, payload limits, and tenant-specific recipients.

## 12. Row Level Security plan

RLS is enabled on every tenant-owned table. Helper functions expose the authenticated user's tenant memberships and role. Public policies permit reads only for published/indexable content intended for public display. Member policies require matching `tenant_id`; editor writes exclude users/domains/platform settings; tenant administrators may manage users for their own tenant; platform administrators have explicit policies. Storage object names begin with `tenants/{tenant_id}/`, and policies verify both path ownership and membership.

Tests exercise policies with separate tenant identities and prove cross-tenant denial for rows and objects.

## 13. Deployment architecture

GitHub `main` is production. Feature branches create Vercel previews. One Vercel project attaches all verified customer domains and one Supabase project. Merges deploy application code to every domain while content and images remain in Supabase. Preview and development hosts are noindex. CI runs format/lint, strict type checking, unit/integration tests, SEO validation, and Lighthouse budgets before merge.

## 14. Automated testing strategy

Vitest covers host normalization, tenant resolution, metadata isolation, canonical validation, publication gates, sitemap/robots isolation, duplicate detection, redirects, and contact validation. Database integration tests cover RLS when Supabase test credentials are available. Playwright covers valid/404 routes, dashboard authorization, forms, heading structure, mobile layouts, and crawlable links. Lighthouse CI tests representative home, service, location, gallery, and blog templates.

CI distinguishes deterministic release-blocking checks from credentialed integration suites. Production cannot be declared ready until both pass in the configured deployment environment.

## 15. Implementation phases

1. Foundation: scaffold, host resolution, schema/RLS, seed tenants, shared UI, core SEO primitives.
2. Public product: core pages, services, locations, projects/gallery, blog, contact, distinct themes.
3. Administration: auth, role-aware dashboard, content forms, uploads, redirects, SEO gate/audit views.
4. Hardening: integration/E2E/Lighthouse checks, accessibility/performance fixes, documentation, launch checklist.
5. Production onboarding: connect Supabase/Vercel, replace flagged claims and images, verify domains, complete each tenant launch checklist.

## 16. Major risks and assumptions

- The supplied company names, domains, contact details, projects, testimonials, and imagery are demonstrations and are labeled as requiring verification before production. No license, certification, award, review aggregate, or employee biography is invented.
- Real production launch requires Supabase and email-provider credentials, domain ownership, real first-party copy/images, and named administrators. Those credentials are intentionally absent from source control.
- Forty strong local pages require first-party local evidence. Seed pages demonstrate distinct structures and remain `noindex` when their local-evidence gate is not met.
- Edge middleware should not depend on a privileged database key. Domain resolution uses safe public data and cache-aware server resolution; RLS remains authoritative.
- In-memory rate limiting is a development fallback. Production uses the database-backed rate-limit function or a Vercel-compatible durable limiter.
- Automated similarity detection finds risk; editorial review makes the final quality judgment.
- One Phase One repository can establish all required contracts and representative complete workflows. A tenant is not marked production-ready until real credentials, evidence, images, and credentialed security tests pass.
