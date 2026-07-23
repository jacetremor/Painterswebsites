create temporary table seed_owner_projects (
  tenant_id text not null,
  title text not null,
  slug text not null,
  description text not null,
  category text not null,
  is_featured boolean not null
) on commit drop;

insert into seed_owner_projects (tenant_id, title, slug, description, category, is_featured)
values
  ('summit', 'Foothill Stucco Color Study', 'foothill-stucco-color-study', 'Demonstration project record showing how Summit would document scope, preparation, coating decisions, and closeout for a stucco painting project.', 'exterior', true),
  ('summit', 'Open-Plan Interior Finish Study', 'open-plan-interior-finish-study', 'Demonstration project record showing how Summit would document scope, preparation, coating decisions, and closeout for an interior painting project.', 'interior', true),
  ('summit', 'Cabinet Enamel Sample Project', 'cabinet-enamel-sample-project', 'Demonstration project record showing how Summit would document scope, preparation, coating decisions, and closeout for a cabinet refinishing project.', 'interior', true),
  ('summit', 'Brick and Trim Exterior Study', 'brick-and-trim-exterior-study', 'Demonstration project record showing how Summit would document scope, preparation, coating decisions, and closeout for a brick and trim project.', 'exterior', false),
  ('summit', 'Commercial Entry Refresh Study', 'commercial-entry-refresh-study', 'Demonstration project record showing how Summit would document scope, preparation, coating decisions, and closeout for a commercial exterior project.', 'exterior', false),
  ('summit', 'Weathered Deck Finish Study', 'weathered-deck-finish-study', 'Demonstration project record showing how Summit would document scope, preparation, coating decisions, and closeout for a deck staining project.', 'exterior', false),
  ('heritage', 'Sunny Kitchen Cabinet Color Study', 'sunny-kitchen-cabinet-color-study', 'Demonstration project record showing how Heritage would document homeowner priorities, preparation, product choices, and finish review for a kitchen cabinet project.', 'interior', true),
  ('heritage', 'Brick Bungalow Room Refresh', 'brick-bungalow-room-refresh', 'Demonstration project record showing how Heritage would document homeowner priorities, preparation, product choices, and room reset for an interior project.', 'interior', true),
  ('heritage', 'Front Porch and Rail Study', 'front-porch-and-rail-study', 'Demonstration project record showing how Heritage would document homeowner priorities, preparation, product choices, and finish review for a porch project.', 'exterior', true),
  ('heritage', 'Family Room Washable Finish Study', 'family-room-washable-finish-study', 'Demonstration project record showing how Heritage would document homeowner priorities, preparation, product choices, and room reset for a family room project.', 'interior', false),
  ('heritage', 'Neighborhood Shop Interior Study', 'neighborhood-shop-interior-study', 'Demonstration project record showing how Heritage would document business priorities, preparation, product choices, and closeout for a commercial interior project.', 'interior', false),
  ('heritage', 'Backyard Fence Stain Study', 'backyard-fence-stain-study', 'Demonstration project record showing how Heritage would document homeowner priorities, preparation, product choices, and finish review for a fence staining project.', 'exterior', false);

insert into public.pages (
  tenant_id,
  page_type,
  page_name,
  nav_label,
  slug,
  primary_topic,
  primary_search_intent,
  geographic_target,
  secondary_topics,
  seo_title,
  meta_description,
  h1,
  intro_copy,
  body_content,
  cta_text,
  canonical_path,
  is_indexable,
  is_follow,
  og_title,
  og_description,
  twitter_metadata,
  breadcrumb_label,
  structured_data_config,
  status,
  published_at
)
select
  project.tenant_id,
  'project'::public.page_type,
  project.title,
  project.title,
  project.slug,
  project.title,
  'painting project evidence',
  tenant.service_area,
  array['painting project', project.category || ' painting'],
  project.title || ' | ' || tenant.company_name,
  project.description,
  project.title,
  project.description,
  jsonb_build_array(project.description),
  'Discuss a similar scope',
  '/projects/' || project.slug,
  false,
  true,
  project.title,
  project.description,
  '{}'::jsonb,
  project.title,
  '{}'::jsonb,
  'published'::public.publish_status,
  timezone('utc', now())
from seed_owner_projects project
join public.tenants tenant on tenant.id = project.tenant_id
on conflict (tenant_id, slug) do update set
  page_type = excluded.page_type,
  page_name = excluded.page_name,
  nav_label = excluded.nav_label,
  primary_topic = excluded.primary_topic,
  primary_search_intent = excluded.primary_search_intent,
  geographic_target = excluded.geographic_target,
  seo_title = excluded.seo_title,
  meta_description = excluded.meta_description,
  h1 = excluded.h1,
  intro_copy = excluded.intro_copy,
  body_content = excluded.body_content,
  cta_text = excluded.cta_text,
  canonical_path = excluded.canonical_path,
  is_indexable = excluded.is_indexable,
  og_title = excluded.og_title,
  og_description = excluded.og_description,
  breadcrumb_label = excluded.breadcrumb_label,
  status = excluded.status,
  published_at = excluded.published_at;

insert into public.projects (
  tenant_id,
  page_id,
  title,
  slug,
  description,
  completion_date,
  paint_products,
  category,
  is_featured,
  status
)
select
  project.tenant_id,
  page.id,
  project.title,
  project.slug,
  project.description,
  date '2026-06-01',
  '[]'::jsonb,
  project.category,
  project.is_featured,
  'published'::public.publish_status
from seed_owner_projects project
join public.pages page
  on page.tenant_id = project.tenant_id
  and page.slug = project.slug
on conflict (tenant_id, slug) do update set
  page_id = excluded.page_id,
  title = excluded.title,
  description = excluded.description,
  completion_date = excluded.completion_date,
  category = excluded.category,
  is_featured = excluded.is_featured,
  status = excluded.status;
