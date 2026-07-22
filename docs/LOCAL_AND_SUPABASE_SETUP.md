# Local Development and Supabase Setup

## Local development

1. Install Node.js 22 or newer and run `npm install`.
2. Copy `.env.example` to `.env.local`. Leave values empty for read-only demonstration mode.
3. Run `npm run dev`.
4. Open `http://summit.localhost:3000` and `http://heritage.localhost:3000`.
5. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before pushing.

If a browser or network policy does not resolve `.localhost` subdomains, map both names to `127.0.0.1` in `/etc/hosts`. Do not add hosts entries to source control.

## Create the Supabase project

1. Create one Supabase project for the platform.
2. Install and authenticate the Supabase CLI.
3. Link the local repository with `supabase link --project-ref YOUR_PROJECT_REF`.
4. Apply migrations with `supabase db push`.
5. Seed base tenant/domain/branding settings with `supabase db seed`.
6. Add the project URL and publishable key to `.env.local`.
7. Add the service-role key only to local server environment and Vercel encrypted environment variables.

The migration creates all relational tables, indexes, RLS helpers and policies, and the `tenant-media` Storage bucket policies. Review generated SQL and policy tests before applying changes to production.

## Authentication and users

Create users through Supabase Auth. Add each user to `tenant_users` with one role:

- `platform_admin`: platform-wide access via an app-metadata role set only by a trusted server process.
- `tenant_admin`: content, users, tenant settings, and domains for one tenant.
- `tenant_editor`: content, media, redirects, and SEO work for one tenant; no domain or user administration.

Never accept `tenant_id` from an editor form. Server code derives it from the hostname and authenticated membership. Test two distinct users before launch and verify each receives zero rows from the other tenant's private tables.

## Database migrations

Create a new timestamped SQL file in `supabase/migrations/` for every change. Do not edit an already-applied production migration. Test locally with `supabase db reset`, run `supabase test db`, inspect the diff, and back up production before a destructive migration.

## Storage

Upload objects beneath `tenants/{tenant_id}/...`; for example:

```text
tenants/summit/projects/foothill-stucco/before/west-elevation-before.webp
tenants/heritage/projects/sunny-kitchen/after/painted-cabinets-after.webp
```

The database stores dimensions, stage, caption, descriptive filename, sort order, and an explicit alt-text decision. Validate MIME type, decoded image type, size, and ownership server-side before persisting metadata.
