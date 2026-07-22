export const WEBSITE_GENERATION_STEPS = [
  "validate_submission", "create_tenant", "create_tenant_users", "create_preview_domain", "create_branding",
  "save_business_information", "geocode_business_address", "generate_location_candidates", "save_approved_locations",
  "create_selected_services", "create_six_core_pages", "create_selected_service_pages", "create_location_page_drafts",
  "create_project_records", "create_gallery_records", "create_testimonial_records", "create_navigation",
  "generate_page_content", "generate_seo_metadata", "generate_structured_data", "generate_internal_links",
  "generate_sitemap", "generate_robots_behavior", "run_factual_consistency_checks", "run_duplicate_content_checks",
  "run_seo_validation", "run_accessibility_checks", "run_tenant_isolation_tests", "create_private_preview",
  "notify_nova_suite",
] as const;

export type WebsiteGenerationStepKey = (typeof WEBSITE_GENERATION_STEPS)[number];

export function generationStepRows(jobId: string) {
  return WEBSITE_GENERATION_STEPS.map((stepKey, index) => ({
    job_id: jobId, step_key: stepKey, ordinal: index + 1, status: "pending",
    idempotency_key: `${jobId}:${stepKey}`,
  }));
}

