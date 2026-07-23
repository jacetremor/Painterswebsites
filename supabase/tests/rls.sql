begin;
create function pg_temp.tap_ok(condition boolean, test_number integer, label text)
returns text
language sql
immutable
as $$
  select format(
    '%s %s - %s',
    case when condition then 'ok' else 'not ok' end,
    test_number,
    label
  );
$$;

select '1..12';
select pg_temp.tap_ok((select relrowsecurity from pg_class where oid = 'public.pages'::regclass), 1, 'pages has RLS enabled');
select pg_temp.tap_ok((select relrowsecurity from pg_class where oid = 'public.contact_submissions'::regclass), 2, 'contact submissions has RLS enabled');
select pg_temp.tap_ok((select relrowsecurity from pg_class where oid = 'public.tenant_users'::regclass), 3, 'tenant memberships have RLS enabled');
select pg_temp.tap_ok((select relrowsecurity from pg_class where oid = 'public.project_images'::regclass), 4, 'project images have RLS enabled');
select pg_temp.tap_ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'project_images' and policyname = 'project_images_public_read'),
  5,
  'published project images have an explicit public policy'
);
select pg_temp.tap_ok(
  (select count(*) from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'owner_media_member_read',
        'owner_media_member_insert',
        'owner_media_member_update',
        'owner_media_member_delete'
      )) = 4,
  6,
  'owner media has tenant-scoped storage policies'
);
select pg_temp.tap_ok(
  (select relrowsecurity from pg_class where oid = 'public.domains'::regclass),
  7,
  'domains has RLS enabled'
);
select pg_temp.tap_ok(
  exists(
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'domains'
      and indexname = 'one_primary_domain_per_tenant'
  ),
  8,
  'domains enforce one primary hostname per tenant'
);
select pg_temp.tap_ok((select relrowsecurity from pg_class where oid = 'public.onboarding_invitations'::regclass), 9, 'onboarding invitations have RLS enabled');
select pg_temp.tap_ok((select relrowsecurity from pg_class where oid = 'public.onboarding_answers'::regclass), 10, 'onboarding answers have RLS enabled');
select pg_temp.tap_ok((select relrowsecurity from pg_class where oid = 'public.website_generation_jobs'::regclass), 11, 'generation jobs have RLS enabled');
select pg_temp.tap_ok((select relrowsecurity from pg_class where oid = 'public.generated_content_versions'::regclass), 12, 'generated drafts have RLS enabled');

rollback;
