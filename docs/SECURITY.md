# Security Model

## Trust boundaries

The incoming hostname selects the public tenant. The authenticated Supabase user plus `tenant_users` membership selects dashboard authority. Database RLS and Storage policies enforce isolation even if application code makes an incorrect query. Service-role credentials are limited to server-only ingestion and maintenance paths.

## Required controls

- Normalize hosts and reject unknown domains; never read tenant IDs from public forms or URL parameters.
- Validate every write with Zod and authorize again on the server.
- Use Supabase SSR cookie sessions and `auth.getUser()` for authorization-sensitive paths.
- Keep service-role, email-provider, and AI-provider keys out of browser bundles and source control.
- Restrict uploads by tenant path, membership, MIME/decode result, size, dimensions, and safe generated filename.
- Protect contact forms with same-origin checks, honeypot, payload limits, rate limiting, and tenant-specific recipients.
- Keep dashboard, auth, private API, and preview routes noindex; robots rules are not access control.
- Record content, user, domain, redirect, and publication changes in `audit_logs`.
- Escape JSON-LD and never render untrusted HTML without sanitization.

The in-memory contact limiter is for development only. Production should use a durable database or edge limiter. Run credentialed RLS tests using separate tenant users before launch.

## Backups and recovery

Enable Supabase point-in-time recovery appropriate to the business tier. Schedule database exports and test restoration to a nonproduction project. Configure Storage backups or source-image retention. Preserve DNS and Vercel environment documentation in an access-controlled system. Before migrations, record a restore point. Quarterly, rehearse restoration, verify tenant isolation after restore, rotate compromised credentials, and document recovery time and recovery point objectives.

If cross-tenant exposure is suspected, disable affected routes, rotate privileged keys, preserve audit evidence, identify impacted tenant IDs and records, restore policy enforcement, notify appropriate owners, and complete a written incident review before re-enabling access.
