begin;
select plan(12);

select ok((select relrowsecurity from pg_class where oid = 'public.pages'::regclass), 'pages has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.contact_submissions'::regclass), 'contact submissions has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.tenant_users'::regclass), 'tenant memberships have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.project_images'::regclass), 'project images have RLS enabled');
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'project_images' and policyname = 'project_images_public_read'),
  'published project images have an explicit public policy'
);
select ok(
  exists(select 1 from storage.buckets where id = 'owner-media' and public = false),
  'owner media uses a private storage bucket'
);
select isnt((select tenant_id from public.domains where hostname = 'summit.localhost'), (select tenant_id from public.domains where hostname = 'heritage.localhost'), 'development domains resolve to separate tenants');
select is((select count(*) from public.domains where is_primary), 2::bigint, 'each seeded tenant has one primary domain');
select ok((select relrowsecurity from pg_class where oid = 'public.onboarding_invitations'::regclass), 'onboarding invitations have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.onboarding_answers'::regclass), 'onboarding answers have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.website_generation_jobs'::regclass), 'generation jobs have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.generated_content_versions'::regclass), 'generated drafts have RLS enabled');

select * from finish();
rollback;
