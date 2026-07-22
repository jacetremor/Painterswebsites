begin;
select plan(5);

select ok((select relrowsecurity from pg_class where oid = 'public.pages'::regclass), 'pages has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.contact_submissions'::regclass), 'contact submissions has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.tenant_users'::regclass), 'tenant memberships have RLS enabled');
select isnt((select tenant_id from public.domains where hostname = 'summit.localhost'), (select tenant_id from public.domains where hostname = 'heritage.localhost'), 'development domains resolve to separate tenants');
select is((select count(*) from public.domains where is_primary), 2::bigint, 'each seeded tenant has one primary domain');

select * from finish();
rollback;
