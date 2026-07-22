create type public.onboarding_status as enum (
  'draft', 'sent', 'opened', 'in_progress', 'submitted', 'changes_requested',
  'approved', 'website_generating', 'preview_ready', 'ready_for_launch',
  'launched', 'expired', 'revoked'
);
create type public.generation_job_status as enum ('queued', 'running', 'waiting_for_input', 'failed', 'completed');
create type public.generation_step_status as enum ('pending', 'running', 'completed', 'failed', 'blocked', 'skipped');
create type public.approval_status as enum ('pending', 'approved', 'changes_requested', 'rejected', 'superseded');

create table public.onboarding_invitations (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  client_name text not null,
  company_name text not null,
  client_email text not null,
  proposed_preview_slug text not null check (proposed_preview_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  notes text,
  status public.onboarding_status not null default 'draft',
  expires_at timestamptz not null,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  sent_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  check (expires_at > created_at)
);
create index onboarding_invitations_status_idx on public.onboarding_invitations(status, expires_at desc);
create unique index onboarding_active_preview_slug_idx on public.onboarding_invitations(proposed_preview_slug)
  where status not in ('expired', 'revoked', 'launched');

create table public.onboarding_submissions (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null unique references public.onboarding_invitations(id) on delete cascade,
  schema_version int not null default 1 check (schema_version > 0),
  completion_percent int not null default 0 check (completion_percent between 0 and 100),
  current_section text not null default 'business_information',
  client_confirmed boolean not null default false,
  confirmation_name text,
  confirmed_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create table public.onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.onboarding_submissions(id) on delete cascade,
  invitation_id uuid not null references public.onboarding_invitations(id) on delete cascade,
  section_key text not null,
  answer_data jsonb not null default '{}',
  is_complete boolean not null default false,
  schema_version int not null default 1,
  last_saved_by text not null default 'client' check (last_saved_by in ('client', 'platform_admin')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  unique (submission_id, section_key)
);
create index onboarding_answers_invitation_idx on public.onboarding_answers(invitation_id, section_key);

create table public.onboarding_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.onboarding_submissions(id) on delete cascade,
  invitation_id uuid not null references public.onboarding_invitations(id) on delete cascade,
  section_key text not null,
  field_key text not null,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 20971520),
  width int,
  height int,
  metadata_stripped boolean not null default false,
  suggested_filename text,
  suggested_alt_text text,
  approved_alt_text text,
  alt_decision text not null default 'pending' check (alt_decision in ('pending', 'descriptive', 'decorative')),
  processed_outputs jsonb not null default '[]',
  permission_to_publish boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create table public.onboarding_location_candidates (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.onboarding_invitations(id) on delete cascade,
  submission_id uuid not null references public.onboarding_submissions(id) on delete cascade,
  provider text not null,
  provider_place_id text not null,
  place_type text not null check (place_type in ('city', 'town', 'village', 'census_designated_place')),
  city text not null,
  state_name text not null,
  state_abbr text not null check (state_abbr ~ '^[A-Z]{2}$'),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  distance_miles numeric(7,2) not null check (distance_miles >= 0),
  population bigint check (population is null or population >= 0),
  score numeric(10,4) not null default 0,
  is_confirmed_coverage boolean not null default false,
  is_priority boolean not null default false,
  is_cross_state boolean not null default false,
  client_approved boolean not null default false,
  nova_suite_approved boolean not null default false,
  future_use boolean not null default false,
  noindex boolean not null default true,
  sort_order int,
  source_metadata jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (submission_id, provider, provider_place_id)
);

create table public.website_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.onboarding_invitations(id) on delete restrict,
  submission_id uuid not null references public.onboarding_submissions(id) on delete restrict,
  tenant_id text references public.tenants(id) on delete restrict,
  status public.generation_job_status not null default 'queued',
  idempotency_key text not null unique,
  current_step text,
  attempt_count int not null default 0,
  lease_owner text,
  lease_expires_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create table public.website_generation_steps (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.website_generation_jobs(id) on delete cascade,
  step_key text not null,
  ordinal int not null check (ordinal between 1 and 30),
  status public.generation_step_status not null default 'pending',
  idempotency_key text not null unique,
  attempt_count int not null default 0,
  input_fingerprint text,
  output_references jsonb not null default '{}',
  started_at timestamptz,
  completed_at timestamptz,
  next_retry_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (job_id, step_key),
  unique (job_id, ordinal)
);

create table public.website_generation_errors (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.website_generation_jobs(id) on delete cascade,
  step_id uuid references public.website_generation_steps(id) on delete cascade,
  error_code text not null,
  category text not null check (category in ('validation', 'transient', 'provider', 'security', 'unknown')),
  sanitized_message text not null,
  provider_request_id text,
  retryable boolean not null default false,
  attempt int not null default 1,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.generated_content_versions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.website_generation_jobs(id) on delete cascade,
  tenant_id text references public.tenants(id) on delete cascade,
  entity_type text not null,
  entity_key text not null,
  version int not null check (version > 0),
  provider text not null,
  model text not null,
  prompt_version text not null,
  source_fact_ids text[] not null default '{}',
  draft_data jsonb not null,
  factual_warnings jsonb not null default '[]',
  status public.approval_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id),
  unique (job_id, entity_type, entity_key, version)
);

create table public.approval_records (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references public.onboarding_invitations(id) on delete cascade,
  submission_id uuid references public.onboarding_submissions(id) on delete cascade,
  job_id uuid references public.website_generation_jobs(id) on delete cascade,
  tenant_id text references public.tenants(id) on delete cascade,
  scope text not null check (scope in ('submission', 'generation', 'client_review', 'page', 'location', 'business_fact', 'domain_ready', 'launch')),
  subject_key text,
  status public.approval_status not null,
  actor_type text not null check (actor_type in ('client', 'platform_admin')),
  actor_id uuid references auth.users(id),
  actor_name text,
  notes text,
  snapshot jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);
create index approval_records_invitation_idx on public.approval_records(invitation_id, created_at desc);

alter table public.tenants
  add column preview_slug text unique check (preview_slug is null or preview_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  add column onboarding_submission_id uuid unique references public.onboarding_submissions(id) on delete set null,
  add column launch_status text not null default 'not_ready' check (launch_status in ('not_ready', 'preview', 'ready_for_launch', 'launched'));

alter table public.testimonials add column onboarding_source_key text;
create unique index testimonials_onboarding_source_key_idx on public.testimonials(tenant_id, onboarding_source_key) where onboarding_source_key is not null;

alter table public.domains
  add column is_preview boolean not null default false,
  add column ownership_model text check (ownership_model in ('client_owned', 'nova_suite_managed')),
  add column registrar text,
  add column dns_provider text,
  add column vercel_status text not null default 'not_added' check (vercel_status in ('not_added', 'added', 'verified')),
  add column ssl_status text not null default 'pending' check (ssl_status in ('pending', 'issued', 'failed')),
  add column www_redirect_verified boolean not null default false,
  add column canonical_verified boolean not null default false,
  add column email_records_preserved boolean not null default false,
  add column nameserver_change_authorized boolean not null default false,
  add column launch_status text not null default 'not_ready' check (launch_status in ('not_ready', 'ready', 'launched'));
create unique index one_preview_domain_per_tenant on public.domains(tenant_id) where is_preview;
alter table public.domains add constraint preview_domain_not_primary check (not (is_preview and is_primary));

do $$ declare table_name text; begin
  foreach table_name in array array[
    'onboarding_invitations', 'onboarding_submissions', 'onboarding_answers', 'onboarding_files', 'onboarding_location_candidates',
    'website_generation_jobs', 'website_generation_steps', 'website_generation_errors',
    'generated_content_versions', 'approval_records'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I_platform_admin_all on public.%I for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin())',
      table_name, table_name
    );
  end loop;
end $$;

do $$ declare table_name text; begin
  foreach table_name in array array[
    'onboarding_invitations', 'onboarding_submissions', 'onboarding_answers', 'onboarding_files', 'onboarding_location_candidates',
    'website_generation_jobs', 'website_generation_steps'
  ] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('onboarding-files', 'onboarding-files', false, 20971520, array['image/jpeg','image/png','image/webp','image/avif','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy onboarding_files_platform_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'onboarding-files' and public.is_platform_admin());
create policy onboarding_files_platform_admin_write on storage.objects for all to authenticated
  using (bucket_id = 'onboarding-files' and public.is_platform_admin())
  with check (bucket_id = 'onboarding-files' and public.is_platform_admin());
