create extension if not exists pgcrypto;

create type public.tenant_role as enum ('platform_admin', 'tenant_admin', 'tenant_editor');
create type public.publish_status as enum ('draft', 'review', 'scheduled', 'published', 'archived');
create type public.page_type as enum ('core', 'service', 'location', 'project', 'blog');
create type public.issue_severity as enum ('critical', 'warning');

create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = timezone('utc', now()); return new; end;
$$;

create table public.tenants (
  id text primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  company_name text not null,
  legal_business_name text not null,
  phone text not null,
  email text not null,
  physical_address text,
  business_hours text,
  founded_year int check (founded_year between 1700 and extract(year from now())::int),
  service_area text not null,
  license_information text,
  insurance_information text,
  social_links jsonb not null default '[]',
  review_links jsonb not null default '[]',
  primary_cta text not null,
  production_ready boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  hostname text not null unique check (hostname = lower(hostname) and hostname !~ '[:/]'),
  is_primary boolean not null default false,
  is_development boolean not null default false,
  is_verified boolean not null default false,
  redirect_to_primary boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);
create unique index one_primary_domain_per_tenant on public.domains(tenant_id) where is_primary;
create index domains_hostname_lookup on public.domains(hostname) include (tenant_id, is_primary, is_verified);

create table public.tenant_users (
  tenant_id text not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.tenant_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  primary key (tenant_id, user_id)
);

create table public.branding_settings (
  tenant_id text primary key references public.tenants(id) on delete cascade,
  logo_path text,
  favicon_path text,
  primary_color text not null check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  secondary_color text not null check (secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  accent_color text not null check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  heading_font text not null,
  body_font text not null,
  button_style text not null,
  border_radius text not null,
  header_style text not null,
  footer_style text not null,
  hero_layout text not null,
  gallery_layout text not null,
  theme text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create table public.navigation_items (
  id uuid primary key default gen_random_uuid(), tenant_id text not null references public.tenants(id) on delete cascade,
  label text not null, href text not null, location text not null default 'header', sort_order int not null default 0,
  is_visible boolean not null default true, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id), updated_by uuid references auth.users(id)
);

create table public.pages (
  id uuid primary key default gen_random_uuid(), tenant_id text not null references public.tenants(id) on delete cascade,
  page_type public.page_type not null default 'core', page_name text not null, nav_label text not null, slug text not null,
  primary_topic text not null, primary_search_intent text not null, geographic_target text, secondary_topics text[] not null default '{}',
  seo_title text not null, meta_description text not null, h1 text not null, intro_copy text not null, body_content jsonb not null default '[]', cta_text text not null,
  canonical_path text not null, is_indexable boolean not null default true, is_follow boolean not null default true,
  og_title text not null, og_description text not null, og_image_path text, twitter_metadata jsonb not null default '{}', featured_image_path text, featured_image_alt text,
  breadcrumb_label text not null, structured_data_config jsonb not null default '{}', status public.publish_status not null default 'draft',
  published_at timestamptz, reviewed_by uuid references auth.users(id), reviewed_at timestamptz, internal_link_targets text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), created_by uuid references auth.users(id), updated_by uuid references auth.users(id),
  unique (tenant_id, slug), check (slug = '' or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), check (canonical_path like '/%')
);
create index pages_public_lookup on public.pages(tenant_id, slug, status, is_indexable);

create table public.services (
  id uuid primary key default gen_random_uuid(), tenant_id text not null references public.tenants(id) on delete cascade, page_id uuid not null unique references public.pages(id) on delete cascade,
  category text not null check (category in ('interior','exterior')), use_cases jsonb not null default '[]', benefits jsonb not null default '[]',
  preparation jsonb not null default '[]', process jsonb not null default '[]', materials jsonb not null default '[]', concerns jsonb not null default '[]', faq jsonb not null default '[]',
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), created_by uuid references auth.users(id), updated_by uuid references auth.users(id)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(), tenant_id text not null references public.tenants(id) on delete cascade, page_id uuid not null unique references public.pages(id) on delete cascade,
  city text not null, state_name text not null, state_abbr text not null check (state_abbr ~ '^[A-Z]{2}$'), local_detail text not null,
  neighborhood_notes jsonb not null default '[]', housing_styles jsonb not null default '[]', climate_notes jsonb not null default '[]', common_surfaces jsonb not null default '[]',
  local_questions jsonb not null default '[]', local_service_limitations text, travel_notes text, quality_approved boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), created_by uuid references auth.users(id), updated_by uuid references auth.users(id),
  unique (tenant_id, city, state_abbr)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(), tenant_id text not null references public.tenants(id) on delete cascade, page_id uuid not null unique references public.pages(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null, title text not null, slug text not null, description text not null, completion_date date,
  paint_products jsonb not null default '[]', category text not null check (category in ('interior','exterior')), is_featured boolean not null default false, status public.publish_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), created_by uuid references auth.users(id), updated_by uuid references auth.users(id), unique (tenant_id, slug)
);

create table public.project_services (
  tenant_id text not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade, created_at timestamptz not null default timezone('utc', now()), created_by uuid references auth.users(id), primary key (project_id, service_id)
);

create table public.project_images (
  id uuid primary key default gen_random_uuid(), tenant_id text not null references public.tenants(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null, descriptive_filename text not null, alt_text text, alt_decision text not null check (alt_decision in ('descriptive','decorative','pending')),
  caption text, width int not null check (width > 0), height int not null check (height > 0), stage text not null check (stage in ('before','after','standalone')), sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), created_by uuid references auth.users(id), updated_by uuid references auth.users(id), unique (tenant_id, storage_path)
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(), tenant_id text not null references public.tenants(id) on delete cascade, quote text not null, customer_name text not null,
  city text, source_url text, permission_verified boolean not null default false, status public.publish_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), created_by uuid references auth.users(id), updated_by uuid references auth.users(id)
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(), tenant_id text not null references public.tenants(id) on delete cascade, page_id uuid not null unique references public.pages(id) on delete cascade,
  author_id uuid references auth.users(id), author_name text not null, author_bio text, related_service_id uuid references public.services(id), related_location_id uuid references public.locations(id), related_project_id uuid references public.projects(id),
  featured_image_id uuid references public.project_images(id), status public.publish_status not null default 'draft', scheduled_for timestamptz, published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), created_by uuid references auth.users(id), updated_by uuid references auth.users(id)
);

create table public.blog_generation_requests (
  id uuid primary key default gen_random_uuid(), tenant_id text not null references public.tenants(id) on delete cascade, blog_post_id uuid references public.blog_posts(id),
  prompt_version text not null, input_facts jsonb not null, generation_status text not null, error_details text, provider text, model_metadata jsonb not null default '{}', generated_draft jsonb,
  approval_status text not null default 'pending', reviewer uuid references auth.users(id), reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), created_by uuid references auth.users(id), updated_by uuid references auth.users(id)
);

create table public.seo_settings (
  tenant_id text primary key references public.tenants(id) on delete cascade, search_console_verification text, bing_verification text, default_og_image_path text,
  title_guidance text, description_guidance text, minimum_location_quality jsonb not null default '{}', created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), created_by uuid references auth.users(id), updated_by uuid references auth.users(id)
);
create table public.seo_audits (
  id uuid primary key default gen_random_uuid(), tenant_id text not null references public.tenants(id) on delete cascade, started_at timestamptz not null default timezone('utc', now()), completed_at timestamptz,
  summary jsonb not null default '{}', created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), created_by uuid references auth.users(id), updated_by uuid references auth.users(id)
);
create table public.seo_issues (
  id uuid primary key default gen_random_uuid(), tenant_id text not null references public.tenants(id) on delete cascade, audit_id uuid not null references public.seo_audits(id) on delete cascade, page_id uuid references public.pages(id) on delete cascade,
  severity public.issue_severity not null, code text not null, message text not null, resolved_at timestamptz, resolution_note text,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), created_by uuid references auth.users(id), updated_by uuid references auth.users(id)
);

create table public.contact_settings (
  tenant_id text primary key references public.tenants(id) on delete cascade, notification_recipients text[] not null, store_submissions boolean not null default true,
  map_embed_url text, provider_config_secret_name text, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), created_by uuid references auth.users(id), updated_by uuid references auth.users(id)
);
create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(), tenant_id text not null references public.tenants(id) on delete cascade, name text not null, email text not null, phone text,
  postal_code text, project_type text, message text not null, source_path text, status text not null default 'new', ip_hash text,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), created_by uuid references auth.users(id), updated_by uuid references auth.users(id)
);

create table public.redirects (
  id uuid primary key default gen_random_uuid(), tenant_id text not null references public.tenants(id) on delete cascade, from_path text not null, to_path text not null, status_code int not null default 308 check (status_code in (301,308,410)),
  is_active boolean not null default true, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), created_by uuid references auth.users(id), updated_by uuid references auth.users(id),
  unique (tenant_id, from_path), check (from_path like '/%'), check (to_path like '/%' or status_code = 410), check (from_path <> to_path)
);
create table public.analytics_settings (
  tenant_id text primary key references public.tenants(id) on delete cascade, google_analytics_id text, google_tag_manager_id text, call_tracking_script text, conversion_tracking_script text,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), created_by uuid references auth.users(id), updated_by uuid references auth.users(id)
);
create table public.audit_logs (
  id bigint generated always as identity primary key, tenant_id text references public.tenants(id) on delete set null, actor_id uuid references auth.users(id), action text not null,
  entity_type text not null, entity_id text, before_data jsonb, after_data jsonb, request_id text, created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_platform_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin', false)
$$;
create or replace function public.has_tenant_role(target_tenant text, allowed public.tenant_role[]) returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_platform_admin() or exists (
    select 1 from public.tenant_users tu where tu.tenant_id = target_tenant and tu.user_id = auth.uid() and tu.role = any(allowed)
  )
$$;

do $$ declare table_name text; begin
  foreach table_name in array array['tenants','domains','tenant_users','branding_settings','navigation_items','pages','services','locations','projects','project_services','project_images','testimonials','blog_posts','blog_generation_requests','seo_settings','seo_audits','seo_issues','contact_settings','contact_submissions','redirects','analytics_settings','audit_logs'] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

create policy tenants_public_read on public.tenants for select using (true);
create policy domains_public_read on public.domains for select using (true);
create policy branding_public_read on public.branding_settings for select using (true);
create policy navigation_public_read on public.navigation_items for select using (is_visible);
create policy pages_public_read on public.pages for select using (status = 'published');
create policy services_public_read on public.services for select using (exists (select 1 from public.pages p where p.id = page_id and p.status = 'published'));
create policy locations_public_read on public.locations for select using (exists (select 1 from public.pages p where p.id = page_id and p.status = 'published'));
create policy projects_public_read on public.projects for select using (status = 'published');
create policy project_services_public_read on public.project_services for select using (exists (select 1 from public.projects p where p.id = project_id and p.status = 'published'));
create policy project_images_public_read on public.project_images for select using (exists (select 1 from public.projects p where p.id = project_id and p.status = 'published'));
create policy testimonials_public_read on public.testimonials for select using (status = 'published' and permission_verified);
create policy blog_posts_public_read on public.blog_posts for select using (status = 'published');

do $$ declare table_name text; begin
  foreach table_name in array array['navigation_items','pages','services','locations','projects','project_services','project_images','testimonials','blog_posts','blog_generation_requests','seo_settings','seo_audits','seo_issues','contact_settings','contact_submissions','redirects','analytics_settings'] loop
    execute format('create policy %I_member_select on public.%I for select to authenticated using (public.has_tenant_role(tenant_id, array[''platform_admin'',''tenant_admin'',''tenant_editor'']::public.tenant_role[]))', table_name, table_name);
    execute format('create policy %I_editor_write on public.%I for all to authenticated using (public.has_tenant_role(tenant_id, array[''platform_admin'',''tenant_admin'',''tenant_editor'']::public.tenant_role[])) with check (public.has_tenant_role(tenant_id, array[''platform_admin'',''tenant_admin'',''tenant_editor'']::public.tenant_role[]))', table_name, table_name);
  end loop;
end $$;
create policy tenant_users_member_read on public.tenant_users for select to authenticated using (user_id = auth.uid() or public.has_tenant_role(tenant_id, array['platform_admin','tenant_admin']::public.tenant_role[]));
create policy tenant_users_admin_write on public.tenant_users for all to authenticated using (public.has_tenant_role(tenant_id, array['platform_admin','tenant_admin']::public.tenant_role[])) with check (public.has_tenant_role(tenant_id, array['platform_admin','tenant_admin']::public.tenant_role[]));
create policy domains_admin_write on public.domains for all to authenticated using (public.has_tenant_role(tenant_id, array['platform_admin','tenant_admin']::public.tenant_role[])) with check (public.has_tenant_role(tenant_id, array['platform_admin','tenant_admin']::public.tenant_role[]));
create policy tenant_platform_write on public.tenants for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy branding_admin_write on public.branding_settings for all to authenticated using (public.has_tenant_role(tenant_id, array['platform_admin','tenant_admin']::public.tenant_role[])) with check (public.has_tenant_role(tenant_id, array['platform_admin','tenant_admin']::public.tenant_role[]));
create policy audit_member_read on public.audit_logs for select to authenticated using (public.has_tenant_role(tenant_id, array['platform_admin','tenant_admin']::public.tenant_role[]));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tenant-media', 'tenant-media', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy tenant_media_public_read on storage.objects for select using (bucket_id = 'tenant-media');
create policy tenant_media_member_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'tenant-media' and (storage.foldername(name))[1] = 'tenants' and public.has_tenant_role((storage.foldername(name))[2], array['platform_admin','tenant_admin','tenant_editor']::public.tenant_role[])
);
create policy tenant_media_member_update on storage.objects for update to authenticated using (
  bucket_id = 'tenant-media' and public.has_tenant_role((storage.foldername(name))[2], array['platform_admin','tenant_admin','tenant_editor']::public.tenant_role[])
) with check (bucket_id = 'tenant-media' and public.has_tenant_role((storage.foldername(name))[2], array['platform_admin','tenant_admin','tenant_editor']::public.tenant_role[]));
create policy tenant_media_member_delete on storage.objects for delete to authenticated using (
  bucket_id = 'tenant-media' and public.has_tenant_role((storage.foldername(name))[2], array['platform_admin','tenant_admin','tenant_editor']::public.tenant_role[])
);

do $$ declare table_name text; begin
  foreach table_name in array array['tenants','domains','tenant_users','branding_settings','navigation_items','pages','services','locations','projects','project_images','testimonials','blog_posts','blog_generation_requests','seo_settings','seo_audits','seo_issues','contact_settings','contact_submissions','redirects','analytics_settings'] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;
