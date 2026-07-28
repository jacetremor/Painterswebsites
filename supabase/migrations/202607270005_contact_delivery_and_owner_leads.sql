alter table public.contact_submissions
  add column if not exists notification_status text not null default 'pending'
    check (notification_status in ('pending', 'sent', 'failed')),
  add column if not exists notification_provider_id text,
  add column if not exists notification_error text,
  add column if not exists notified_at timestamptz;

create index if not exists contact_submissions_tenant_created_at
  on public.contact_submissions (tenant_id, created_at desc);

create index if not exists contact_submissions_ip_rate_limit
  on public.contact_submissions (tenant_id, ip_hash, created_at desc)
  where ip_hash is not null;
