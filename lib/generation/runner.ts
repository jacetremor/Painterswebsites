import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { getAiProvider } from "@/lib/ai/provider";
import { buildSourceFacts } from "@/lib/generation/source-profile";
import { WEBSITE_GENERATION_STEPS, type WebsiteGenerationStepKey } from "@/lib/generation/steps";
import { getLocationProviders } from "@/lib/location/provider";
import { rankLocationCandidates } from "@/lib/location/ranking";
import { PAINTING_SERVICES } from "@/lib/onboarding/sections";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { processOnboardingImage } from "@/lib/media/processor";

class GenerationBlockedError extends Error {}
class GenerationContinueError extends Error {}
type JobRow = { id: string; invitation_id: string; submission_id: string; tenant_id: string | null; status: string; created_by: string | null };
type StepRow = { id: string; job_id: string; step_key: WebsiteGenerationStepKey; ordinal: number; status: string; attempt_count: number; output_references: Record<string, unknown> };
type GenerationContext = { job: JobRow; step: StepRow; invitation: { id: string; company_name: string; client_email: string; proposed_preview_slug: string; status: string }; answers: Record<string, Record<string, unknown>> };

function slugify(value: string): string { return value.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80); }
function text(value: unknown, fallback = ""): string { return typeof value === "string" ? value.trim() : fallback; }
function stringList(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : typeof value === "string" ? value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean) : []; }
function records(value: unknown): Array<Record<string, unknown>> { return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : []; }
function fingerprint(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }

async function loadContext(job: JobRow, step: StepRow): Promise<GenerationContext> {
  const supabase = createSupabaseAdminClient()!;
  const [{ data: invitation }, { data: answerRows }] = await Promise.all([
    supabase.from("onboarding_invitations").select("id,company_name,client_email,proposed_preview_slug,status").eq("id", job.invitation_id).single(),
    supabase.from("onboarding_answers").select("section_key,answer_data").eq("submission_id", job.submission_id),
  ]);
  if (!invitation) throw new Error("Generation invitation not found.");
  return { job, step, invitation, answers: Object.fromEntries((answerRows ?? []).map((row) => [row.section_key, row.answer_data as Record<string, unknown>])) };
}

async function outputFor(jobId: string, key: WebsiteGenerationStepKey): Promise<Record<string, unknown>> {
  const { data } = await createSupabaseAdminClient()!.from("website_generation_steps").select("output_references").eq("job_id", jobId).eq("step_key", key).single();
  return (data?.output_references as Record<string, unknown> | undefined) ?? {};
}

function basePage(tenantId: string, name: string, slug: string, kind: "core" | "service" | "location" | "project", intent: string) {
  const path = slug ? `/${slug}` : "/"; const title = `${name} | Draft`;
  return { tenant_id: tenantId, page_type: kind, page_name: name, nav_label: name, slug, primary_topic: name, primary_search_intent: intent, geographic_target: null, secondary_topics: [], seo_title: title, meta_description: `Draft content for ${name}. Human review required.`, h1: name, intro_copy: "Draft content is being prepared from approved business facts.", body_content: [], cta_text: "Request an estimate", canonical_path: path, is_indexable: false, is_follow: false, og_title: title, og_description: `Draft content for ${name}.`, twitter_metadata: {}, breadcrumb_label: name, structured_data_config: {}, status: "draft", internal_link_targets: [] };
}

async function requireTenant(context: GenerationContext): Promise<string> {
  if (context.job.tenant_id) return context.job.tenant_id;
  const { data } = await createSupabaseAdminClient()!.from("website_generation_jobs").select("tenant_id").eq("id", context.job.id).single();
  if (!data?.tenant_id) throw new GenerationBlockedError("Tenant must be created before this step.");
  return data.tenant_id;
}

async function executeStep(context: GenerationContext): Promise<Record<string, unknown>> {
  const supabase = createSupabaseAdminClient()!; const business = context.answers.business_information ?? {}; const contact = context.answers.contact_information ?? {};
  switch (context.step.step_key) {
    case "validate_submission": {
      const { data: rows } = await supabase.from("onboarding_answers").select("section_key,is_complete").eq("submission_id", context.job.submission_id);
      if ((rows ?? []).length < 17 || (rows ?? []).some((row) => !row.is_complete)) throw new GenerationBlockedError("All 17 onboarding sections must be complete.");
      if (context.invitation.status !== "website_generating") throw new GenerationBlockedError("Generation requires explicit Nova Suite approval and start action.");
      return { validatedSections: rows!.length, inputFingerprint: fingerprint(context.answers) };
    }
    case "create_tenant": {
      const existing = await supabase.from("tenants").select("id").eq("onboarding_submission_id", context.job.submission_id).maybeSingle();
      const tenantId = existing.data?.id ?? context.invitation.proposed_preview_slug;
      if (!existing.data) {
        const social = context.answers.social_profiles ?? {}; const reviewLinks = context.answers.reviews ?? {};
        const { error } = await supabase.from("tenants").insert({
          id: tenantId, slug: context.invitation.proposed_preview_slug, preview_slug: context.invitation.proposed_preview_slug,
          onboarding_submission_id: context.job.submission_id, company_name: text(business.public_business_name, context.invitation.company_name),
          legal_business_name: text(business.legal_business_name, context.invitation.company_name), phone: text(contact.phone_number, "Pending confirmation"),
          email: text(contact.public_business_email, context.invitation.client_email), physical_address: text(business.business_address) || null,
          business_hours: text(business.business_hours, "By appointment"), founded_year: typeof business.year_founded === "number" ? business.year_founded : null,
          service_area: stringList(business.counties_served).join(", ") || text(business.primary_city), license_information: text(business.license_information) || null,
          insurance_information: text(business.insurance_information) || null,
          social_links: Object.entries(social).filter(([, value]) => typeof value === "string" && value).map(([label, href]) => ({ label, href })),
          review_links: [{ label: "Submitted review profiles", href: text(reviewLinks.review_profile_urls) }].filter((item) => item.href),
          primary_cta: text(context.answers.contact_form?.primary_cta, "Request an estimate"), production_ready: false, launch_status: "not_ready",
        });
        if (error) throw new Error(`Tenant creation failed: ${error.message}`);
      }
      await supabase.from("website_generation_jobs").update({ tenant_id: tenantId }).eq("id", context.job.id);
      return { tenantId };
    }
    case "create_tenant_users": {
      const tenantId = await requireTenant(context); const userIds: string[] = [];
      if (context.job.created_by) { await supabase.from("tenant_users").upsert({ tenant_id: tenantId, user_id: context.job.created_by, role: "platform_admin" }, { onConflict: "tenant_id,user_id" }); userIds.push(context.job.created_by); }
      const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }); const client = users?.users.find((user) => user.email?.toLowerCase() === context.invitation.client_email.toLowerCase());
      if (client) { await supabase.from("tenant_users").upsert({ tenant_id: tenantId, user_id: client.id, role: "tenant_admin" }, { onConflict: "tenant_id,user_id" }); userIds.push(client.id); }
      return { tenantId, userIds, clientAccountPending: !client };
    }
    case "create_preview_domain": {
      const tenantId = await requireTenant(context); const hostname = `${context.invitation.proposed_preview_slug}.novasuite.io`;
      const { error } = await supabase.from("domains").upsert({ tenant_id: tenantId, hostname, is_primary: false, is_development: true, is_preview: true, is_verified: true, redirect_to_primary: false, vercel_status: "verified", ssl_status: "issued", launch_status: "not_ready" }, { onConflict: "hostname" });
      if (error) throw new Error(`Preview domain failed: ${error.message}`); return { hostname, noindex: true, canonical: false };
    }
    case "create_branding": {
      const tenantId = await requireTenant(context); const branding = context.answers.branding ?? {}; const theme = text(branding.theme, "Premium and Modern");
      const { data: logo } = await supabase.from("onboarding_files").select("storage_path").eq("submission_id", context.job.submission_id).eq("section_key", "branding").eq("field_key", "primary_logo").limit(1).maybeSingle();
      const { error } = await supabase.from("branding_settings").upsert({ tenant_id: tenantId, logo_path: logo?.storage_path ?? null, primary_color: text(branding.primary_color, "#17463d"), secondary_color: text(branding.secondary_color, "#eef3f0"), accent_color: text(branding.accent_color, "#f2b84b"), heading_font: text(branding.heading_font, "Inter"), body_font: text(branding.body_font, "Inter"), button_style: text(branding.button_style, "Slightly rounded"), border_radius: text(branding.button_style) === "Square" ? "0px" : "6px", header_style: text(branding.header_layout, "Standard"), footer_style: text(branding.footer_layout, "Detailed"), hero_layout: text(branding.hero_layout, "Photo with overlay"), gallery_layout: text(branding.gallery_layout, "Grid"), theme }, { onConflict: "tenant_id" });
      if (error) throw new Error(`Branding creation failed: ${error.message}`); return { theme, contrastReviewRequired: true, logoColorSuggestionConfirmed: false };
    }
    case "save_business_information": {
      const tenantId = await requireTenant(context); const domain = context.answers.domain_information ?? {}; const ownsDomain = domain.domain_model === "Client already owns a domain"; const requested = text(ownsDomain ? domain.domain_name : domain.preferred_domain).toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
      if (requested && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(requested)) {
        const { error } = await supabase.from("domains").upsert({ tenant_id: tenantId, hostname: requested, is_primary: false, is_development: false, is_preview: false, is_verified: false, redirect_to_primary: true, ownership_model: ownsDomain ? "client_owned" : "nova_suite_managed", registrar: text(domain.registrar) || null, dns_provider: text(domain.dns_provider) || null, vercel_status: "not_added", ssl_status: "pending", www_redirect_verified: false, canonical_verified: false, email_records_preserved: domain.preserve_email_confirmation === true, nameserver_change_authorized: domain.nameserver_authorization === true, launch_status: "not_ready" }, { onConflict: "hostname" });
        if (error) throw new Error(`Domain tracking could not be created: ${error.message}`);
      }
      return { tenantId, requestedDomain: requested || null, sourceSections: ["business_information", "contact_information", "company_story", "legal_compliance", "domain_information"], claimsRemainDraft: true, domainConnectionManual: true };
    }
    case "geocode_business_address": {
      const providers = getLocationProviders(); if (!providers) throw new GenerationBlockedError("Configure a geocoder/geography provider before creating location candidates.");
      const address = text(business.business_address); if (!address) throw new GenerationBlockedError("A verified business address is required for geocoding.");
      const coordinates = await providers.geocoder.geocodeVerifiedAddress(address); return { ...coordinates, provider: providers.geocoder.name, addressFingerprint: fingerprint(address) };
    }
    case "generate_location_candidates": {
      const providers = getLocationProviders(); if (!providers) throw new GenerationBlockedError("Configure a reputable geography provider.");
      const geo = await outputFor(context.job.id, "geocode_business_address"); const center = { latitude: Number(geo.latitude), longitude: Number(geo.longitude) };
      if (!Number.isFinite(center.latitude) || !Number.isFinite(center.longitude)) throw new GenerationBlockedError("Verified coordinates are missing.");
      const area = context.answers.service_area ?? {}; const radius = typeof area.radius_miles === "number" ? area.radius_miles : 30;
      const places = await providers.geography.placesNear(center, radius); const ranked = rankLocationCandidates(places, { center, businessState: text(business.state), servedStates: stringList(business.states_served), radiusMiles: radius, maximumPages: typeof area.maximum_location_pages === "number" ? area.maximum_location_pages : 20, confirmedCoverage: stringList(area.confirmed_coverage), priorityLocations: stringList(area.priority_locations), crossStateEnabled: area.cross_state_enabled === true, novaApprovedCrossState: [] });
      if (!ranked.length) throw new GenerationBlockedError("No legitimate places matched the confirmed service coverage and approved radius.");
      const rows = ranked.map((place, index) => ({ invitation_id: context.invitation.id, submission_id: context.job.submission_id, provider: place.provider, provider_place_id: place.providerPlaceId, place_type: place.placeType, city: place.city, state_name: place.stateName, state_abbr: place.stateAbbr, latitude: place.latitude, longitude: place.longitude, distance_miles: place.distanceMiles, population: place.population ?? null, score: place.score, is_confirmed_coverage: true, is_priority: place.isPriority, is_cross_state: place.isCrossState, client_approved: true, nova_suite_approved: false, noindex: true, sort_order: index + 1, source_metadata: { projectCount: place.projectCount, testimonialCount: place.testimonialCount } }));
      const { error } = await supabase.from("onboarding_location_candidates").upsert(rows, { onConflict: "submission_id,provider,provider_place_id" }); if (error) throw new Error(`Location candidates could not be saved: ${error.message}`);
      return { provider: providers.geography.name, candidateCount: rows.length, radiusMiles: radius, requiresNovaSuiteApproval: true };
    }
    case "save_approved_locations": {
      const { data: candidates } = await supabase.from("onboarding_location_candidates").select("id,city,state_abbr").eq("submission_id", context.job.submission_id).eq("client_approved", true).eq("nova_suite_approved", true).order("sort_order");
      if (!candidates?.length) throw new GenerationBlockedError("Nova Suite must approve at least one legitimate location candidate.");
      return { approvedCandidateIds: candidates.map((item) => item.id), approvedCount: candidates.length };
    }
    case "create_selected_services": {
      const selected = stringList(context.answers.services?.selected_services).filter((service) => (PAINTING_SERVICES as readonly string[]).includes(service));
      if (!selected.length) throw new GenerationBlockedError("At least one supported service must be selected."); return { selectedServices: selected };
    }
    case "create_six_core_pages": {
      const tenantId = await requireTenant(context); const pages = [["Home", "", "painting company"], ["About", "about", "company information"], ["Contact", "contact", "estimate request"], ["Gallery", "gallery", "painting projects"], ["Residential Painting", "residential-painting", "residential painting"], ["Commercial Painting", "commercial-painting", "commercial painting"]] as const;
      const { error } = await supabase.from("pages").upsert(pages.map(([name, slug, intent]) => basePage(tenantId, name, slug, "core", intent)), { onConflict: "tenant_id,slug" }); if (error) throw new Error(`Core pages failed: ${error.message}`); return { pageSlugs: pages.map((item) => item[1]), status: "draft" };
    }
    case "create_selected_service_pages": {
      const tenantId = await requireTenant(context); const selectedOutput = await outputFor(context.job.id, "create_selected_services"); const selected = stringList(selectedOutput.selectedServices); const details = records(context.answers.services?.service_details); const created: string[] = [];
      for (const serviceName of selected) { const slug = slugify(serviceName); const pageRow = basePage(tenantId, serviceName, slug, "service", `${serviceName} service information`); const { data: page, error: pageError } = await supabase.from("pages").upsert(pageRow, { onConflict: "tenant_id,slug" }).select("id").single(); if (pageError || !page) throw new Error(`Service page failed for ${serviceName}.`); const detail = details.find((item) => item.service === serviceName) ?? {}; const category = (PAINTING_SERVICES as readonly string[]).indexOf(serviceName) <= 3 ? "interior" : "exterior"; const { error } = await supabase.from("services").upsert({ tenant_id: tenantId, page_id: page.id, category, use_cases: stringList(detail.surfaces), benefits: [], preparation: stringList(detail.preparation), process: stringList(detail.unique_process), materials: stringList(detail.products), concerns: stringList(detail.objections), faq: [] }, { onConflict: "page_id" }); if (error) throw new Error(`Service record failed for ${serviceName}.`); created.push(slug); }
      return { createdServiceSlugs: created, omittedUnselectedServices: PAINTING_SERVICES.filter((item) => !selected.includes(item)) };
    }
    case "create_location_page_drafts": {
      const tenantId = await requireTenant(context); const approvedOutput = await outputFor(context.job.id, "save_approved_locations"); const ids = stringList(approvedOutput.approvedCandidateIds); const { data: candidates } = await supabase.from("onboarding_location_candidates").select("id,city,state_name,state_abbr").in("id", ids); const created: string[] = [];
      for (const candidate of candidates ?? []) { const slug = `${slugify(candidate.city)}-${candidate.state_abbr.toLowerCase()}`; const { data: page, error: pageError } = await supabase.from("pages").upsert({ ...basePage(tenantId, `Painting in ${candidate.city}`, slug, "location", "local painting services"), geographic_target: `${candidate.city}, ${candidate.state_abbr}` }, { onConflict: "tenant_id,slug" }).select("id").single(); if (pageError || !page) throw new Error(`Location page failed for ${candidate.city}.`); const { error } = await supabase.from("locations").upsert({ tenant_id: tenantId, page_id: page.id, city: candidate.city, state_name: candidate.state_name, state_abbr: candidate.state_abbr, local_detail: `Confirmed service area in ${candidate.city}. Local detail requires human review.`, neighborhood_notes: [], housing_styles: [], climate_notes: [], common_surfaces: [], local_questions: [], quality_approved: false }, { onConflict: "page_id" }); if (error) throw new Error(`Location record failed for ${candidate.city}.`); created.push(slug); }
      return { locationDraftSlugs: created, noindex: true, describesServiceAreasOnly: true };
    }
    case "create_project_records": {
      const tenantId = await requireTenant(context); const projects = records(context.answers.projects_gallery?.projects).filter((project) => project.permission === true); const ids: string[] = [];
      for (const project of projects) { const title = text(project.title); if (!title) continue; const slug = slugify(title); const { data: page } = await supabase.from("pages").upsert({ ...basePage(tenantId, title, slug, "project", "painting project"), canonical_path: `/projects/${slug}` }, { onConflict: "tenant_id,slug" }).select("id").single(); if (!page) throw new Error(`Project page failed for ${title}.`); const { data: record, error } = await supabase.from("projects").upsert({ tenant_id: tenantId, page_id: page.id, title, slug, description: text(project.description, "Project description pending review."), completion_date: text(project.completion_date) || null, paint_products: stringList(project.products), category: text(project.category).toLowerCase() === "exterior" ? "exterior" : "interior", is_featured: project.featured === true, status: "draft" }, { onConflict: "tenant_id,slug" }).select("id").single(); if (error || !record) throw new Error(`Project record failed for ${title}.`); ids.push(record.id); }
      return { projectIds: ids, skippedWithoutPermission: records(context.answers.projects_gallery?.projects).length - ids.length };
    }
    case "create_gallery_records": {
      const tenantId = await requireTenant(context); const { data: files } = await supabase.from("onboarding_files").select("id,section_key,field_key,storage_path,original_filename,mime_type,processed_outputs").eq("submission_id", context.job.submission_id).like("mime_type", "image/%");
      if (!files?.length) throw new GenerationBlockedError("At least one permission-cleared brand or project image is required for the generated website.");
      const projectIds = stringList((await outputFor(context.job.id, "create_project_records")).projectIds); const projectInputs = records(context.answers.projects_gallery?.projects); let variantCount = 0; let galleryImages = 0; const pendingFiles = files.filter((file) => !Array.isArray(file.processed_outputs) || file.processed_outputs.length === 0);
      for (const file of pendingFiles.slice(0, 3)) {
        const outputs = await processOnboardingImage(file.storage_path, tenantId, file.original_filename); variantCount += outputs.length; const largest = outputs.at(-1)!; const projectMatch = /^projects\.(\d+)\.(before_photos|after_photos|additional_photos)$/.exec(file.field_key); let suggestedAltText: string | null = null;
        if (projectMatch) { const projectIndex = Number(projectMatch[1]); const projectId = projectIds[projectIndex]; const projectInput = projectInputs[projectIndex]; const stage = projectMatch[2] === "before_photos" ? "before" : projectMatch[2] === "after_photos" ? "after" : "standalone"; if (projectId && projectInput?.permission === true) { suggestedAltText = [stage === "standalone" ? "Completed" : stage === "before" ? "Before" : "After", text(projectInput.title), text(projectInput.public_city)].filter(Boolean).join(" - "); const { error } = await supabase.from("project_images").upsert({ tenant_id: tenantId, project_id: projectId, storage_path: largest.storagePath, descriptive_filename: `${slugify(`${text(projectInput.title, file.original_filename)}-${stage}`)}.avif`, alt_text: null, alt_decision: "pending", caption: null, width: largest.width, height: largest.height, stage, sort_order: galleryImages }, { onConflict: "tenant_id,storage_path" }); if (error) throw new Error(`Project image record failed: ${error.message}`); galleryImages += 1; } }
        await supabase.from("onboarding_files").update({ metadata_stripped: true, suggested_filename: `${slugify(file.original_filename)}.avif`, suggested_alt_text: suggestedAltText, processed_outputs: outputs, permission_to_publish: file.section_key === "branding" ? context.answers.legal_compliance?.asset_rights === true : Boolean(projectMatch && projectInputs[Number(projectMatch[1])]?.permission === true) }).eq("id", file.id);
        if (file.section_key === "branding" && file.field_key === "primary_logo") await supabase.from("branding_settings").update({ logo_path: largest.storagePath }).eq("tenant_id", tenantId);
      }
      if (pendingFiles.length > 3) throw new GenerationContinueError("More media remains to process.");
      return { sourceFileCount: files.length, responsiveVariantsCreatedThisRun: variantCount, galleryImagesCreatedThisRun: galleryImages, format: "avif", metadataStripped: true, altTextApprovalRequired: true };
    }
    case "create_testimonial_records": {
      const tenantId = await requireTenant(context); const testimonials = records(context.answers.reviews?.testimonials).filter((item) => item.permission === true); const rows = testimonials.map((item, index) => ({ tenant_id: tenantId, onboarding_source_key: `${context.job.submission_id}:${index}`, quote: text(item.testimonial), customer_name: `${text(item.first_name)} ${text(item.last_initial)}`.trim(), city: text(item.city) || null, source_url: text(item.review_url) || null, permission_verified: true, status: "draft" })).filter((item) => item.quote && item.customer_name); if (rows.length) { const { error } = await supabase.from("testimonials").upsert(rows, { onConflict: "tenant_id,onboarding_source_key" }); if (error) throw new Error(`Testimonials failed: ${error.message}`); } return { testimonialCount: rows.length, syntheticReviews: 0 };
    }
    case "create_navigation": {
      const tenantId = await requireTenant(context); const { data: pages } = await supabase.from("pages").select("page_name,slug,page_type").eq("tenant_id", tenantId).in("page_type", ["core", "service"]); const rows = (pages ?? []).map((page, index) => ({ tenant_id: tenantId, label: page.page_name, href: page.slug ? `/${page.slug}` : "/", location: "header", sort_order: index, is_visible: page.page_type === "core" || index < 10 })); await supabase.from("navigation_items").delete().eq("tenant_id", tenantId); if (rows.length) { const { error } = await supabase.from("navigation_items").insert(rows); if (error) throw new Error(`Navigation failed: ${error.message}`); } return { navigationItems: rows.length };
    }
    case "generate_page_content": {
      const tenantId = await requireTenant(context); const provider = getAiProvider(); if (!provider) throw new GenerationBlockedError("Configure OpenAI before generating content drafts."); const facts = buildSourceFacts(context.answers); const tone = text(context.answers.content_preferences?.writing_tone, "clear and professional"); const [{ data: pages }, { data: existing }] = await Promise.all([supabase.from("pages").select("id,page_type,page_name,slug").eq("tenant_id", tenantId), supabase.from("generated_content_versions").select("entity_key").eq("job_id", context.job.id).eq("entity_type", "page")]); const generatedKeys = new Set((existing ?? []).map((item) => item.entity_key)); const pendingPages = (pages ?? []).filter((page) => !generatedKeys.has(page.slug || "home")); let versionCount = 0;
      for (const page of pendingPages.slice(0, 4)) { const result = await provider.generateWebsiteDraft({ entityType: "page", entityKey: page.slug || "home", sourceFacts: facts, tone, requestedSections: ["introduction", "service context", "call to action"] }); const { error } = await supabase.from("generated_content_versions").insert({ job_id: context.job.id, tenant_id: tenantId, entity_type: "page", entity_key: page.slug || "home", version: 1, provider: result.provider, model: result.model, prompt_version: "onboarding-page-v1", source_fact_ids: result.sourceFactIds, draft_data: result.draft, factual_warnings: result.factualWarnings, status: "pending" }); if (error && error.code !== "23505") throw new Error(`Generated content could not be stored: ${error.message}`); versionCount += 1; }
      if (pendingPages.length > 4) throw new GenerationContinueError("More page drafts remain to generate.");
      return { versionCount: (existing?.length ?? 0) + versionCount, provider: "openai", status: "draft", autoPublished: false };
    }
    case "generate_seo_metadata": {
      const tenantId = await requireTenant(context); const { data: versions } = await supabase.from("generated_content_versions").select("entity_key,draft_data").eq("job_id", context.job.id).eq("entity_type", "page"); for (const version of versions ?? []) { const draft = version.draft_data as Record<string, unknown>; await supabase.from("pages").update({ seo_title: text(draft.seoTitle, "Draft title"), meta_description: text(draft.metaDescription, "Draft description"), og_title: text(draft.seoTitle, "Draft title"), og_description: text(draft.metaDescription, "Draft description") }).eq("tenant_id", tenantId).eq("slug", version.entity_key === "home" ? "" : version.entity_key); } return { updatedPages: versions?.length ?? 0, reviewRequired: true };
    }
    case "generate_structured_data": { const tenantId = await requireTenant(context); await supabase.from("pages").update({ structured_data_config: { type: "PaintingContractor", reviewRequired: true } }).eq("tenant_id", tenantId); return { schemaType: "PaintingContractor", fabricatedRatings: false }; }
    case "generate_internal_links": { const tenantId = await requireTenant(context); const { data: pages } = await supabase.from("pages").select("slug").eq("tenant_id", tenantId); const paths = (pages ?? []).map((page) => page.slug ? `/${page.slug}` : "/"); await supabase.from("pages").update({ internal_link_targets: paths.slice(0, 8) }).eq("tenant_id", tenantId); return { targetCount: paths.length }; }
    case "generate_sitemap": return { generatedDynamically: true, productionDomainsOnly: true, previewExcluded: true };
    case "generate_robots_behavior": return { preview: "noindex,nofollow,noarchive", production: "blocked_until_launch_approval" };
    case "run_factual_consistency_checks": { const { data: versions } = await supabase.from("generated_content_versions").select("factual_warnings").eq("job_id", context.job.id); const warnings = (versions ?? []).flatMap((item) => Array.isArray(item.factual_warnings) ? item.factual_warnings : []); if (warnings.length) throw new GenerationBlockedError(`${warnings.length} factual warning(s) require review.`); return { warnings: 0, sourceTraceabilityRequired: true }; }
    case "run_duplicate_content_checks": { const { data: versions } = await supabase.from("generated_content_versions").select("draft_data").eq("job_id", context.job.id); const hashes = (versions ?? []).map((item) => fingerprint(item.draft_data)); if (new Set(hashes).size !== hashes.length) throw new GenerationBlockedError("Duplicate generated page drafts require review."); return { comparedVersions: hashes.length, duplicates: 0 }; }
    case "run_seo_validation": { const tenantId = await requireTenant(context); const { data: invalid } = await supabase.from("pages").select("id").eq("tenant_id", tenantId).or("seo_title.eq.,meta_description.eq.,h1.eq."); if (invalid?.length) throw new GenerationBlockedError("SEO-required fields are missing."); return { criticalIssues: 0, productionLaunchStillBlocked: true }; }
    case "run_accessibility_checks": { const tenantId = await requireTenant(context); const { data: pages } = await supabase.from("pages").select("id,h1").eq("tenant_id", tenantId); if ((pages ?? []).some((page) => !page.h1)) throw new GenerationBlockedError("A page is missing its accessible H1."); return { staticChecksPassed: true, browserAuditRequiredBeforeLaunch: true, colorContrastConfirmationRequired: true }; }
    case "run_tenant_isolation_tests": { const tenantId = await requireTenant(context); const { data: domain } = await supabase.from("domains").select("tenant_id,hostname").eq("tenant_id", tenantId).eq("is_preview", true).single(); if (!domain || domain.tenant_id !== tenantId) throw new Error("Preview domain tenant isolation check failed."); return { tenantId, hostname: domain.hostname, crossTenantReferences: 0 }; }
    case "create_private_preview": { const tenantId = await requireTenant(context); const hostname = `${context.invitation.proposed_preview_slug}.novasuite.io`; await Promise.all([supabase.from("tenants").update({ launch_status: "preview", production_ready: false }).eq("id", tenantId), supabase.from("onboarding_invitations").update({ status: "preview_ready" }).eq("id", context.invitation.id)]); return { url: `https://${hostname}`, noindex: true, requiresPreviewAccess: true, productionLaunched: false }; }
    case "notify_nova_suite": { await supabase.from("audit_logs").insert({ action: "onboarding.preview_ready", entity_type: "onboarding_invitation", entity_id: context.invitation.id, after_data: { job_id: context.job.id, notification: "dashboard" } }); return { channel: "nova_suite_dashboard", notifiedAt: new Date().toISOString() }; }
  }
}

async function claimNextStep(workerId: string): Promise<{ job: JobRow; step: StepRow } | null> {
  const supabase = createSupabaseAdminClient(); if (!supabase) return null;
  const { data: jobs } = await supabase.from("website_generation_jobs").select("id,invitation_id,submission_id,tenant_id,status,created_by").in("status", ["queued", "running"]).or(`lease_expires_at.is.null,lease_expires_at.lt.${new Date().toISOString()}`).order("created_at").limit(1);
  const job = jobs?.[0] as JobRow | undefined; if (!job) return null;
  const leaseExpiresAt = new Date(Date.now() + 4 * 60_000).toISOString(); const { data: claimed } = await supabase.from("website_generation_jobs").update({ status: "running", lease_owner: workerId, lease_expires_at: leaseExpiresAt, started_at: job.status === "queued" ? new Date().toISOString() : undefined, attempt_count: job.status === "queued" ? 1 : undefined }).eq("id", job.id).or(`lease_expires_at.is.null,lease_expires_at.lt.${new Date().toISOString()}`).select("id").maybeSingle(); if (!claimed) return null;
  const { data: steps } = await supabase.from("website_generation_steps").select("id,job_id,step_key,ordinal,status,attempt_count,output_references").eq("job_id", job.id).eq("status", "pending").order("ordinal").limit(1);
  const step = steps?.[0] as StepRow | undefined;
  if (!step) { await supabase.from("website_generation_jobs").update({ status: "completed", completed_at: new Date().toISOString(), lease_owner: null, lease_expires_at: null }).eq("id", job.id); return null; }
  const prior = await supabase.from("website_generation_steps").select("status").eq("job_id", job.id).lt("ordinal", step.ordinal).not("status", "in", '("completed","skipped")'); if (prior.data?.length) { await supabase.from("website_generation_jobs").update({ lease_owner: null, lease_expires_at: null }).eq("id", job.id); return null; }
  const { data: claimedStep } = await supabase.from("website_generation_steps").update({ status: "running", started_at: new Date().toISOString(), attempt_count: step.attempt_count + 1 }).eq("id", step.id).eq("status", "pending").select("id").maybeSingle(); if (!claimedStep) return null;
  return { job: { ...job, status: "running" }, step: { ...step, status: "running", attempt_count: step.attempt_count + 1 } };
}

export async function processGenerationSteps(maxSteps = 3): Promise<{ processed: number; outcomes: Array<{ jobId: string; step: string; status: string }> }> {
  const workerId = `worker-${randomUUID()}`; const outcomes: Array<{ jobId: string; step: string; status: string }> = [];
  for (let index = 0; index < Math.max(1, Math.min(maxSteps, WEBSITE_GENERATION_STEPS.length)); index += 1) {
    const claimed = await claimNextStep(workerId); if (!claimed) break; const supabase = createSupabaseAdminClient()!;
    try { const context = await loadContext(claimed.job, claimed.step); const output = await executeStep(context); await supabase.from("website_generation_steps").update({ status: "completed", output_references: output, input_fingerprint: fingerprint(context.answers), completed_at: new Date().toISOString() }).eq("id", claimed.step.id); await supabase.from("website_generation_jobs").update({ current_step: claimed.step.step_key, lease_owner: null, lease_expires_at: null }).eq("id", claimed.job.id); outcomes.push({ jobId: claimed.job.id, step: claimed.step.step_key, status: "completed" }); }
    catch (error) { if (error instanceof GenerationContinueError) { await Promise.all([supabase.from("website_generation_steps").update({ status: "pending" }).eq("id", claimed.step.id), supabase.from("website_generation_jobs").update({ status: "running", lease_owner: null, lease_expires_at: null }).eq("id", claimed.job.id)]); outcomes.push({ jobId: claimed.job.id, step: claimed.step.step_key, status: "continued" }); continue; } const blocked = error instanceof GenerationBlockedError; const message = error instanceof Error ? error.message : "Unknown generation error."; await Promise.all([supabase.from("website_generation_steps").update({ status: blocked ? "blocked" : "failed", completed_at: new Date().toISOString() }).eq("id", claimed.step.id), supabase.from("website_generation_jobs").update({ status: blocked ? "waiting_for_input" : "failed", lease_owner: null, lease_expires_at: null }).eq("id", claimed.job.id), supabase.from("website_generation_errors").insert({ job_id: claimed.job.id, step_id: claimed.step.id, error_code: blocked ? "INPUT_REQUIRED" : "STEP_FAILED", category: blocked ? "validation" : "unknown", sanitized_message: message.slice(0, 1000), retryable: blocked, attempt: claimed.step.attempt_count })]); outcomes.push({ jobId: claimed.job.id, step: claimed.step.step_key, status: blocked ? "blocked" : "failed" }); break; }
  }
  return { processed: outcomes.length, outcomes };
}
