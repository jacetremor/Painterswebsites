# Client Onboarding Operations

## Boundaries

This module starts after Nova Suite has handled payment elsewhere. It contains no Stripe, checkout, subscription, billing, invoicing, refund, pricing, or payment-webhook behavior. Every generated company remains one tenant in the existing application, Supabase project, Vercel project, and GitHub repository.

The system does not purchase domains, mutate DNS, change nameservers, add domains to Vercel, publish AI output, or launch a site without explicit Nova Suite action.

## Invitation workflow

1. Sign in with `app_metadata.role = platform_admin` and open `/dashboard/onboarding`.
2. Create the invitation. The URL contains 32 random bytes encoded as base64url; Postgres stores only its SHA-256 hash.
3. Copy the URL from the one-time result and send it through Nova Suite's approved communication channel.
4. To resend, generate a replacement link. Token rotation invalidates the prior URL while preserving saved answers.
5. Extend or revoke from the invitation detail page. Expired and revoked links cannot read, save, upload, submit, or review.

Client requests are rate-limited by token hash and IP, use no-store responses, enforce same-origin writes and body limits, and never accept a tenant ID from the browser.

## Review and generation

The client completes 17 sections and confirms the final review. Nova Suite can inspect or edit any section, return it for changes, or approve it. Submission approval does not start generation. `Start generation` creates one durable job and 30 ordered step records, then the bounded Vercel Cron worker processes them.

A blocked step moves the job to `waiting_for_input`. Typical blocks include missing provider credentials, no legitimate geographic matches, pending Nova Suite location approval, missing permission-cleared images, factual warnings, or duplicate content. Correct the source data or approval, then use `Retry failed steps`. Completed idempotency keys are retained.

OpenAI receives only the source-fact profile built from approved answers and records. Every returned draft stores provider/model metadata, source fact IDs, factual warnings, and a version. Editing creates a new human version. Regeneration creates a new AI version. Approval changes only the selected version's approval status; it does not publish.

## Location approval

The geocoder establishes the verified address coordinates. A configured reputable place-data adapter, normally backed by current U.S. Census place data, supplies candidates. Confirmed coverage is a hard gate. Client priority, distance, population, projects, and testimonials rank eligible places. Cross-state candidates stay excluded unless the client confirms the state and Nova Suite approves it.

The default radius is 30 miles and the maximum is 20 pages. The worker never enlarges the radius, invents a place, claims an office, or creates more pages when fewer legitimate candidates qualify.

## Media

Original uploads remain private in `onboarding-files`. The worker uses `sharp` to auto-rotate, strip metadata, resize, and create AVIF variants in tenant-prefixed `tenant-media` paths. Project uploads retain before, after, or standalone stage. Suggested alt text comes only from submitted project facts and remains `pending` until a human approves it.

## Domain and launch

The domain panel is a checklist and status record, not an automation client. Preserve MX, SPF, DKIM, DMARC, email verification, and unrelated records. Do not change nameservers without explicit client authorization.

Launch requires all of the following:

- the 30-step job completed;
- all latest generated page versions approved;
- client preview approval recorded;
- final Nova Suite launch approval recorded;
- a non-preview primary domain added and verified in the shared Vercel project;
- HTTPS issued;
- canonical and `www` redirect behavior verified;
- email records confirmed preserved;
- no blocking factual, SEO, accessibility, isolation, or duplicate-content issue.

`Approve for launch` records the Nova Suite decision but keeps `production_ready = false`. `Mark site live` is a separate, explicit action that publishes approved pages and enables the verified primary hostname. It never removes noindex from the preview hostname.

## Required environment

See `.env.example`. Supabase URL, publishable key, and service role are required for writes. `CRON_SECRET` protects the worker. OpenAI and geography credentials activate their adapters. `PREVIEW_BYPASS_TOKEN` is optional when preview access is protected at another layer. No client-visible environment variable may contain a service role, AI key, provider key, or cron secret.
