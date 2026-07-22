# Client Onboarding and Website Generation Architecture

Status: Accepted add-on design for Phase One

This module extends the existing multi-tenant platform. It does not add payments, per-client repositories, per-client Vercel projects, automatic domain purchases, automatic DNS mutation, automatic publication, or automatic production launch.

## 1. Updated architecture

The module adds three bounded surfaces to the existing Next.js and Supabase application:

1. Nova Suite administration under `/dashboard/onboarding` for invitation creation, review, approvals, generation control, domain readiness, and audit history.
2. Token-gated client onboarding under `/onboarding/{token}` for a resumable 17-section form and controlled uploads.
3. A durable server-side generation engine that turns an approved submission into one tenant inside the existing tables, content model, Supabase project, Vercel project, and application.

The public token identifies an invitation, not a tenant or sequential database record. The database stores only a SHA-256 token hash. Tenant creation happens only after submission approval and an explicit Nova Suite generation action. Generated content remains draft. Preview domains remain noindex. Production launch remains a separate explicit approval transition.

## 2. Database changes

Add `onboarding_invitations`, `onboarding_submissions`, `onboarding_answers`, `onboarding_files`, `website_generation_jobs`, `website_generation_steps`, `website_generation_errors`, `generated_content_versions`, and `approval_records`.

Add `preview_slug`, onboarding provenance, and launch-state fields to tenants/domains where required. Invitation rows track client/company identity, token hash, expiration, status, progress, and audit actors. Answers are section-scoped JSON documents with a schema version. Files store metadata and a tenant-independent onboarding Storage path until generation assigns them to the new tenant. Jobs and steps use unique idempotency keys. Content versions record prompt version, source fact IDs, model metadata, factual warnings, and approval state.

## 3. Onboarding form structure

The form is a server-authoritative wizard with 17 ordered sections:

1. Business Information
2. Contact Information
3. Domain Information
4. Branding
5. Services
6. Service Area
7. Company Story
8. Team and Owner Information
9. Business Differentiators
10. Painting Process
11. Reviews and Testimonials
12. Projects and Gallery
13. Contact Form Settings
14. Social Profiles
15. Content Preferences
16. Legal and Compliance
17. Final Review

Each section has a Zod schema, completion rules, help text, and optional fields. The client saves one section at a time through a token-authenticated route. The browser also autosaves debounced changes; the server timestamps the authoritative answer. Completion is computed from applicable required sections, not from arbitrary field count. Submission requires all critical sections, explicit truthfulness/publication confirmations, and a final server validation.

## 4. Invitation security model

- Generate 32 cryptographically random bytes and expose them once as base64url.
- Store only `SHA-256(token)` with a unique index; never log the token or include it in analytics.
- Use constant-time hash comparison through exact indexed lookup.
- Require unexpired, nonrevoked status for every answer/file/submission request.
- Rotate to a new token when an invitation is resent after suspected exposure.
- Mark first access as `opened`; successful answer writes move it to `in_progress`.
- Apply per-token and per-IP rate limits, body limits, same-origin checks for writes, and `Cache-Control: no-store`.
- Never expose sequential IDs; internal UUIDs remain server-side.
- Keep onboarding routes noindex through metadata and `X-Robots-Tag`.
- Nova Suite actions require authenticated `platform_admin`; tenant roles cannot create or approve invitations.

## 5. Website-generation state machine

Invitation states:

```text
draft -> sent -> opened -> in_progress -> submitted
submitted -> changes_requested -> in_progress
submitted -> approved -> website_generating -> preview_ready
preview_ready -> ready_for_launch -> launched
active states -> expired | revoked
```

Generation job states:

```text
queued -> running -> waiting_for_input | failed | completed
failed -> queued (explicit retry)
waiting_for_input -> queued (after approval/data correction)
```

Each of the 30 required generation operations is a named step with `pending`, `running`, `completed`, `failed`, `blocked`, or `skipped` status. A step claims a unique `(job_id, step_key)` row, writes output references transactionally, and can be retried without duplicating tenants, domains, services, pages, projects, or files.

## 6. Location-selection algorithm

1. Verify and geocode the submitted address through a configured geocoder.
2. Query a reputable geographic dataset, initially the current U.S. Census Gazetteer/place dataset imported into Postgres/PostGIS or a controlled provider adapter.
3. Filter places to the approved state set and configured radius, default 30 miles.
4. Exclude cross-state places unless the client confirmed the state and Nova Suite approved it.
5. Merge client-added places after geographic validation; never ask an AI model to invent candidates.
6. Score candidates using confirmed coverage as a hard gate, then client priority, distance, population as a secondary factor, linked projects, and linked testimonials.
7. Return at most the configured limit, default 20. Return fewer when fewer legitimate places qualify.
8. Require Nova Suite approval before page generation. Pages remain draft/noindex until local-quality validation passes.

The system describes service areas and never creates fake office locations.

## 7. OpenAI content-generation flow

OpenAI is the first provider behind the existing `AiProvider` interface. The provider receives a tenant-specific source-of-truth profile assembled from approved onboarding answers, approved files/documents, projects, testimonials, and administrator facts. Prompt payloads reference immutable source fact IDs.

The model may draft core pages, selected offered services, approved locations, projects, FAQs, metadata, alt-text suggestions, internal-link suggestions, and limited blogs. Output is parsed into a Zod-validated structured draft. Every factual statement must cite one or more source fact IDs or be emitted as a missing-information placeholder. Unsupported claims become blocking factual warnings. Drafts are stored in `generated_content_versions`; they never publish automatically. Alt text and all page content require human approval.

## 8. Preview-domain architecture

Nova Suite configures `*.novasuite.io` on the same Vercel project. The unique preview slug maps `clientname.novasuite.io` to the generated tenant through `domains` with `is_preview = true`, `is_primary = false`, and permanent noindex behavior. Preview hosts never become canonical and never enter production sitemaps. After launch they remain noindex and may remain available for review or redirect only through explicit configuration.

The same host resolver and RLS boundaries used by production domains apply to previews. Slug editing is platform-admin-only and uniqueness is enforced in Postgres.

## 9. Domain-connection workflow

The module records ownership model, requested domain, registrar, DNS provider, existing platform, email dependency, indexed URLs, Vercel-addition status, DNS verification, SSL, primary status, redirect status, and canonical status.

Phase One displays manual tasks and safe DNS instructions. It never purchases a domain, changes nameservers, or mutates DNS. Instructions preserve MX, SPF, DKIM, DMARC, verification, and other unrelated records. Nova Suite adds the domain to the shared Vercel project, displays only the required web records, verifies HTTPS and redirects, then promotes the verified domain to primary. A provider interface leaves room for later Vercel API automation with explicit authorization.

## 10. Approval workflow

Approval scopes are explicit records: `submission`, `generation`, `client_review`, `page`, `location`, `business_fact`, `domain_ready`, and `launch`. Submission approval permits tenant generation, not publication. Page/location approvals permit preview rendering while retaining draft/noindex as configured. Client approval records feedback but cannot launch. First production launch requires both client launch confirmation and a final Nova Suite `platform_admin` launch approval after SEO, accessibility, performance, domain, and factual gates pass.

Every approval, rejection, change request, retry, and launch transition writes an immutable audit event.

## 11. Failure and retry strategy

- A job obtains a database lease so only one worker runs a step at a time.
- Each step checks its durable output before acting and uses deterministic idempotency keys.
- External calls record provider request IDs, sanitized errors, attempt count, and next retry time.
- Transient failures use bounded exponential backoff; validation/factual failures become `blocked` and require input.
- Retrying one step invalidates only dependent steps and content versions.
- Tenant/domain creation uses unique constraints and upserts to prevent duplicates.
- The engine never rolls back by deleting an established tenant; compensating actions mark incomplete artifacts draft/inactive.
- A generation failure cannot alter launch state or make content indexable.

## 12. Implementation phases

1. Data and security: migration, RLS/Storage policies, invitation token helpers, schemas, status transitions, audits.
2. Client intake: responsive 17-step form, autosave, progress, validation, uploads, review, submission.
3. Nova Suite operations: invitation list/detail/create, copy/resend/extend/revoke, answer review/edit, change requests, approvals, history.
4. Generation engine: durable job/step runner, tenant/domain/branding/services/core content creation, source profile, retry controls.
5. Location and AI adapters: geocoder/geographic dataset contract, ranking/approval UI, OpenAI structured drafts with source traceability.
6. Preview and launch: wildcard preview resolution, private/noindex review, manual domain task tracking, final launch gate.
7. Hardening: token abuse tests, RLS tests, cross-tenant tests, idempotency/retry tests, accessibility/browser tests, SEO/Lighthouse checks, operator documentation.

Phase One implementation in this branch delivers the contracts, schema, secure token flow, guided form, administration workflow, deterministic generation worker, local image processing, preview and production routing, tests, and documentation. OpenAI and geographic-provider calls activate only when their server credentials are configured. Invitation email delivery, Census imports, Vercel domain mutation, domain purchase, DNS mutation, and nameserver changes remain manual. Production publication exists only behind the explicit Nova Suite launch action and all preceding content, client, domain, and quality gates.
