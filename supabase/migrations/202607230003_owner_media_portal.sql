alter table public.project_images
  add column if not exists storage_bucket text not null default 'tenant-media',
  add column if not exists is_published boolean not null default false,
  add column if not exists published_at timestamptz;

create index if not exists project_images_public_gallery
  on public.project_images (tenant_id, project_id, is_published, sort_order)
  where is_published = true;

drop policy if exists project_images_public_read on public.project_images;
create policy project_images_public_read on public.project_images for select using (
  is_published = true
  and alt_decision in ('descriptive', 'decorative')
  and exists (
    select 1
    from public.projects p
    where p.id = project_id and p.status = 'published'
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('owner-media', 'owner-media', false, 10485760, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy owner_media_member_read on storage.objects for select to authenticated using (
  bucket_id = 'owner-media'
  and (storage.foldername(name))[1] = 'tenants'
  and public.has_tenant_role(
    (storage.foldername(name))[2],
    array['platform_admin','tenant_admin','tenant_editor']::public.tenant_role[]
  )
);

create policy owner_media_member_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'owner-media'
  and (storage.foldername(name))[1] = 'tenants'
  and public.has_tenant_role(
    (storage.foldername(name))[2],
    array['platform_admin','tenant_admin','tenant_editor']::public.tenant_role[]
  )
);

create policy owner_media_member_update on storage.objects for update to authenticated using (
  bucket_id = 'owner-media'
  and (storage.foldername(name))[1] = 'tenants'
  and public.has_tenant_role(
    (storage.foldername(name))[2],
    array['platform_admin','tenant_admin','tenant_editor']::public.tenant_role[]
  )
) with check (
  bucket_id = 'owner-media'
  and (storage.foldername(name))[1] = 'tenants'
  and public.has_tenant_role(
    (storage.foldername(name))[2],
    array['platform_admin','tenant_admin','tenant_editor']::public.tenant_role[]
  )
);

create policy owner_media_member_delete on storage.objects for delete to authenticated using (
  bucket_id = 'owner-media'
  and (storage.foldername(name))[1] = 'tenants'
  and public.has_tenant_role(
    (storage.foldername(name))[2],
    array['platform_admin','tenant_admin','tenant_editor']::public.tenant_role[]
  )
);
