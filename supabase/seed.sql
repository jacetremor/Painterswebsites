insert into public.tenants (id, slug, company_name, legal_business_name, phone, email, physical_address, business_hours, service_area, insurance_information, primary_cta)
values
  ('summit', 'summit', 'Summit Painting Co.', 'Summit Painting Co. (demonstration)', '(801) 555-0142', 'estimates@summitpainting.example', 'Demonstration address, Provo, UT', 'Monday-Friday, 8:00 AM-5:00 PM', 'Utah County, Utah', 'Requires verification', 'Plan your project'),
  ('heritage', 'heritage', 'Heritage Paint & Finish', 'Heritage Paint & Finish (demonstration)', '(303) 555-0186', 'hello@heritagepaint.example', 'Demonstration address, Lakewood, CO', 'Monday-Saturday, 8:30 AM-5:30 PM', 'Denver west and south metro, Colorado', 'Requires verification', 'Get a friendly estimate')
on conflict (id) do update set company_name = excluded.company_name;

insert into public.domains (tenant_id, hostname, is_primary, is_development, is_verified, redirect_to_primary)
values
  ('summit', 'summitpainting.com', true, false, false, false),
  ('summit', 'www.summitpainting.com', false, false, false, true),
  ('summit', 'summit.localhost', false, true, true, false),
  ('heritage', 'heritagepaint.com', true, false, false, false),
  ('heritage', 'www.heritagepaint.com', false, false, false, true),
  ('heritage', 'heritage.localhost', false, true, true, false)
on conflict (hostname) do update set tenant_id = excluded.tenant_id;

insert into public.branding_settings (tenant_id, primary_color, secondary_color, accent_color, heading_font, body_font, button_style, border_radius, header_style, footer_style, hero_layout, gallery_layout, theme)
values
  ('summit', '#173c35', '#f1eee7', '#e15d3f', 'Arial Narrow', 'Inter', 'solid', '2px', 'editorial', 'dark', 'architectural', 'masonry', 'summit'),
  ('heritage', '#1f5a43', '#fff8eb', '#e7a92f', 'Georgia', 'Aptos', 'outlined', '8px', 'utility', 'light', 'welcoming', 'grid', 'heritage')
on conflict (tenant_id) do update set primary_color = excluded.primary_color;

insert into public.contact_settings (tenant_id, notification_recipients)
values ('summit', array['estimates@summitpainting.example']), ('heritage', array['hello@heritagepaint.example'])
on conflict (tenant_id) do update set notification_recipients = excluded.notification_recipients;

insert into public.seo_settings (tenant_id, minimum_location_quality)
values
  ('summit', '{"requiresLocalDetail":true,"requiresInternalLinks":true,"requiresUniqueMetadata":true}'),
  ('heritage', '{"requiresLocalDetail":true,"requiresInternalLinks":true,"requiresUniqueMetadata":true}')
on conflict (tenant_id) do update set minimum_location_quality = excluded.minimum_location_quality;

-- Full demonstration page, service, location, project, testimonial, and blog content is
-- maintained in lib/content/seeds.ts for local preview. Use the documented import task
-- after applying this migration so every seeded record passes the same publishing gate.
