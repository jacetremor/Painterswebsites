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

The migrations create all relational tables, indexes, RLS helpers and policies, the public generated-media bucket, and the private `owner-media` bucket. Review generated SQL and policy tests before applying changes to production.

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

### Owner project photos

The tenant dashboard at `/dashboard#projects` contains the post-launch owner workflow:

1. The authenticated owner chooses a database project and photo type.
2. The browser requests a tenant-scoped signed upload URL.
3. The original file is uploaded to the private `owner-media` bucket.
4. The server decodes it with Sharp, normalizes orientation, strips metadata, constrains oversized dimensions, and stores a clean AVIF variant.
5. The server registers verified dimensions, project assignment, stage, caption, alt text, and draft status in `project_images`.
6. Draft images are available only through the authenticated dashboard asset route.
7. Publishing the image makes its metadata eligible for the public site. The public asset route still verifies that both the image and its project are published before issuing a temporary storage URL.

Before owner testing:

1. Apply `202607230003_owner_media_portal.sql` with `supabase db push`.
2. Create or import the tenant's `pages` and `projects` rows. The project slug must match the public project slug.
3. Create the owner in Supabase Auth.
4. Insert that user into `tenant_users` as `tenant_admin`.
5. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the server-only `SUPABASE_SERVICE_ROLE_KEY`.
6. Sign in at the tenant hostname's `/login` page.

Published owner photos replace the seeded photos for the matching project. Finished-result photos drive gallery cards and project heroes; media on the featured project can also drive the homepage hero. Unpublished photos never resolve through the public media endpoint.
