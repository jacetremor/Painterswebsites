import { z } from "zod";
import type { OnboardingAnswerMap } from "@/lib/onboarding/types";

export type OnboardingFieldType = "text" | "email" | "tel" | "url" | "textarea" | "select" | "multiselect" | "checkbox" | "number" | "color" | "file" | "repeater";

export type OnboardingField = {
  key: string;
  label: string;
  type: OnboardingFieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: readonly string[];
  accept?: string;
  multiple?: boolean;
  itemFields?: readonly OnboardingField[];
};

export type OnboardingSectionDefinition = {
  key: string;
  title: string;
  summary: string;
  fields: readonly OnboardingField[];
};

const states = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"] as const;

export const PAINTING_SERVICES = [
  "Cabinet Painting and Refinishing", "Epoxy Flooring", "Interior Painting", "Wallpaper Removal",
  "Brick Painting and Staining", "Concrete Staining", "Deck Painting and Staining", "Exterior Painting",
  "Fence Painting and Staining", "Home Siding Painting", "Stucco Painting",
] as const;

const linkFields: readonly OnboardingField[] = [
  { key: "google_business_profile", label: "Google Business Profile", type: "url" },
  { key: "facebook", label: "Facebook", type: "url" }, { key: "instagram", label: "Instagram", type: "url" },
  { key: "linkedin", label: "LinkedIn", type: "url" }, { key: "tiktok", label: "TikTok", type: "url" },
  { key: "pinterest", label: "Pinterest", type: "url" }, { key: "houzz", label: "Houzz", type: "url" },
  { key: "yelp", label: "Yelp", type: "url" }, { key: "angi", label: "Angi", type: "url" },
  { key: "bbb", label: "Better Business Bureau", type: "url" }, { key: "thumbtack", label: "Thumbtack", type: "url" },
  { key: "chamber", label: "Chamber of Commerce", type: "url" },
  { key: "license_lookup", label: "Contractor license lookup", type: "url" },
  { key: "financing_provider", label: "Financing provider", type: "url" },
];

export const ONBOARDING_SECTIONS: readonly OnboardingSectionDefinition[] = [
  {
    key: "business_information", title: "Business Information", summary: "The verified facts that identify and describe the company.",
    fields: [
      { key: "public_business_name", label: "Public business name", type: "text", required: true },
      { key: "legal_business_name", label: "Legal business name", type: "text", required: true },
      { key: "owner_name", label: "Owner name", type: "text", required: true },
      { key: "business_address", label: "Business address", type: "text", required: true },
      { key: "show_address_publicly", label: "Show this address publicly", type: "checkbox" },
      { key: "mailing_address", label: "Mailing address, if different", type: "text" },
      { key: "primary_city", label: "Primary city", type: "text", required: true },
      { key: "state", label: "State", type: "select", options: states, required: true },
      { key: "zip_code", label: "ZIP code", type: "text", required: true },
      { key: "counties_served", label: "Counties served", type: "textarea", help: "One per line or comma-separated." },
      { key: "states_served", label: "States served", type: "multiselect", options: states, required: true },
      { key: "year_founded", label: "Year founded", type: "number" }, { key: "years_in_business", label: "Years in business", type: "number" },
      { key: "employee_count", label: "Number of employees", type: "number" },
      { key: "market_type", label: "Painting market", type: "select", options: ["Residential", "Commercial", "Both"], required: true },
      { key: "short_description", label: "Short business description", type: "textarea", required: true },
      { key: "full_description", label: "Full business description", type: "textarea" },
      { key: "business_hours", label: "Business hours for each day", type: "textarea", required: true, placeholder: "Monday-Friday: 8:00 AM-5:00 PM" },
      { key: "holiday_hours", label: "Holiday hours", type: "textarea" },
      { key: "languages", label: "Languages spoken", type: "textarea" },
      { key: "free_estimates", label: "Free estimates available", type: "checkbox" },
      { key: "minimum_project_size", label: "Minimum project size", type: "text" },
      { key: "financing_available", label: "Financing available", type: "checkbox" },
      { key: "warranty_information", label: "Warranty information", type: "textarea" },
      { key: "license_information", label: "License information", type: "textarea", help: "Leave blank if none. This will never be invented." },
      { key: "insurance_information", label: "Insurance information", type: "textarea" },
      { key: "certifications", label: "Certifications", type: "textarea" }, { key: "awards", label: "Awards", type: "textarea" },
      { key: "professional_associations", label: "Professional associations", type: "textarea" },
    ],
  },
  {
    key: "contact_information", title: "Contact Information", summary: "Public and private points of contact for the project.",
    fields: [
      { key: "primary_contact_name", label: "Primary contact name", type: "text", required: true },
      { key: "primary_contact_email", label: "Primary contact email", type: "email", required: true },
      { key: "public_business_email", label: "Public business email", type: "email", required: true },
      { key: "phone_number", label: "Phone number", type: "tel", required: true },
      { key: "text_message_number", label: "Text-message number", type: "tel" },
      { key: "preferred_contact_method", label: "Preferred project contact method", type: "select", options: ["Email", "Phone", "Text"], required: true },
    ],
  },
  {
    key: "domain_information", title: "Domain Information", summary: "Existing web and email dependencies are preserved during the manual Phase One connection.",
    fields: [
      { key: "domain_model", label: "Domain situation", type: "select", options: ["Client already owns a domain", "Client needs a domain"], required: true },
      { key: "domain_name", label: "Existing domain name", type: "text" }, { key: "registrar", label: "Domain registrar", type: "text" },
      { key: "dns_provider", label: "DNS provider", type: "text" }, { key: "existing_website_url", label: "Existing website URL", type: "url" },
      { key: "existing_platform", label: "Existing website platform", type: "text" },
      { key: "domain_email_in_use", label: "Business email uses this domain", type: "checkbox" }, { key: "email_provider", label: "Existing email provider", type: "text" },
      { key: "existing_redirects", label: "Existing redirects", type: "textarea" }, { key: "existing_sitemap", label: "Existing sitemap URL", type: "url" },
      { key: "search_console_access", label: "Google Search Console access", type: "select", options: ["Available", "Needs access", "Not set up", "Unknown"] },
      { key: "analytics_access", label: "Google Analytics access", type: "select", options: ["Available", "Needs access", "Not set up", "Unknown"] },
      { key: "tag_manager_access", label: "Google Tag Manager access", type: "select", options: ["Available", "Needs access", "Not set up", "Unknown"] },
      { key: "indexed_pages_to_preserve", label: "Indexed pages to preserve", type: "textarea", help: "Paste one URL per line." },
      { key: "preferred_domain", label: "Preferred new domain", type: "text" }, { key: "alternative_domains", label: "Alternative domain names", type: "textarea" },
      { key: "preferred_extensions", label: "Preferred domain extensions", type: "textarea", placeholder: ".com, .co" },
      { key: "nova_should_purchase", label: "Nova Suite should purchase the domain manually", type: "checkbox" },
      { key: "registrant_information", label: "Preferred registrant information", type: "textarea" },
      { key: "nova_managed_domain", label: "Nova Suite will manage the domain", type: "checkbox" },
      { key: "preserve_email_confirmation", label: "I understand existing email records must be preserved", type: "checkbox", required: true },
      { key: "nameserver_authorization", label: "Explicitly authorize a nameserver change", type: "checkbox", help: "Leave off unless Nova Suite specifically requested this." },
    ],
  },
  {
    key: "branding", title: "Branding", summary: "Choose a controlled theme and supply recognizable brand assets.",
    fields: [
      { key: "theme", label: "Theme", type: "select", options: ["Premium and Modern", "Friendly and Residential"], required: true },
      { key: "primary_logo", label: "Primary logo", type: "file", accept: "image/png,image/jpeg,image/webp,image/avif,application/pdf", required: true },
      { key: "alternate_logos", label: "Alternate, dark-background, and light-background logos", type: "file", accept: "image/png,image/jpeg,image/webp,image/avif,application/pdf", multiple: true },
      { key: "favicon", label: "Favicon", type: "file", accept: "image/png,image/jpeg,image/webp,image/avif" },
      { key: "primary_color", label: "Primary brand color", type: "color", required: true },
      { key: "secondary_color", label: "Secondary brand color", type: "color", required: true },
      { key: "accent_color", label: "Accent color", type: "color", required: true },
      { key: "additional_colors", label: "Additional brand colors", type: "textarea" }, { key: "colors_to_avoid", label: "Colors to avoid", type: "textarea" },
      { key: "heading_font", label: "Heading font preference", type: "text" }, { key: "body_font", label: "Body font preference", type: "text" },
      { key: "brand_guidelines", label: "Brand guidelines", type: "file", accept: "application/pdf,image/png,image/jpeg" },
      { key: "brand_collateral", label: "Truck wraps, uniforms, cards, brochures, and signs", type: "file", accept: "image/png,image/jpeg,image/webp,application/pdf", multiple: true },
      { key: "websites_liked", label: "Websites you like and why", type: "textarea" }, { key: "websites_disliked", label: "Websites you dislike and why", type: "textarea" },
      { key: "visual_style", label: "Preferred visual style", type: "textarea" },
      { key: "button_style", label: "Preferred button style", type: "select", options: ["Square", "Slightly rounded", "Rounded"] },
      { key: "photo_style", label: "Preferred photo style", type: "textarea" },
      { key: "header_layout", label: "Header layout", type: "select", options: ["Compact", "Standard", "Centered"] },
      { key: "footer_layout", label: "Footer layout", type: "select", options: ["Compact", "Detailed"] },
      { key: "hero_layout", label: "Hero layout", type: "select", options: ["Photo with overlay", "Project showcase"] },
      { key: "gallery_layout", label: "Gallery layout", type: "select", options: ["Grid", "Before and after"] },
      { key: "contrast_confirmation", label: "I will approve suggested colors after contrast validation", type: "checkbox", required: true },
    ],
  },
  {
    key: "services", title: "Services", summary: "Only selected offerings can become service-page drafts.",
    fields: [
      { key: "selected_services", label: "Services offered", type: "multiselect", options: PAINTING_SERVICES, required: true },
      { key: "service_details", label: "Details for each selected service", type: "repeater", required: true, itemFields: [
        { key: "service", label: "Service", type: "select", options: PAINTING_SERVICES, required: true },
        { key: "market", label: "Residential, commercial, or both", type: "select", options: ["Residential", "Commercial", "Both"], required: true },
        { key: "description", label: "Service description", type: "textarea", required: true }, { key: "surfaces", label: "Surfaces worked on", type: "textarea" },
        { key: "preparation", label: "Preparation process", type: "textarea" }, { key: "products", label: "Products, paint brands, and coating types", type: "textarea" },
        { key: "timeline", label: "Typical project timeline", type: "text" }, { key: "warranty", label: "Warranty information", type: "textarea" },
        { key: "limitations", label: "Service limitations", type: "textarea" }, { key: "questions", label: "Common customer questions", type: "textarea" },
        { key: "objections", label: "Common objections", type: "textarea" }, { key: "unique_process", label: "Unique process", type: "textarea" },
        { key: "photos", label: "Related project photos", type: "file", accept: "image/png,image/jpeg,image/webp,image/avif", multiple: true },
        { key: "cta", label: "Preferred call to action", type: "text" },
      ] },
    ],
  },
  {
    key: "service_area", title: "Service Area", summary: "Candidates come from verified geographic data, never AI guesses.",
    fields: [
      { key: "radius_miles", label: "Service radius in miles", type: "number", required: true, help: "Default 30 miles. The system never increases this silently." },
      { key: "maximum_location_pages", label: "Maximum location pages", type: "number", required: true, help: "Maximum 20." },
      { key: "confirmed_coverage", label: "Confirmed cities and towns served", type: "textarea", required: true },
      { key: "priority_locations", label: "Priority locations", type: "textarea" }, { key: "future_locations", label: "Locations for future use", type: "textarea" },
      { key: "cross_state_enabled", label: "Request cross-state locations", type: "checkbox" },
      { key: "cross_state_explanation", label: "Cross-state coverage and licensing notes", type: "textarea" },
      { key: "location_noindex", label: "Location-page drafts should remain noindex until individually approved", type: "checkbox", required: true },
    ],
  },
  {
    key: "company_story", title: "Company Story", summary: "Use the company's own history and values as the source of truth.",
    fields: [
      { key: "company_story", label: "Company story", type: "textarea", required: true }, { key: "why_started", label: "Why the owner started the business", type: "textarea" },
      { key: "years_experience", label: "Years of experience", type: "number" }, { key: "company_values", label: "Company values", type: "textarea" },
      { key: "customer_service_philosophy", label: "Customer-service philosophy", type: "textarea" }, { key: "community_involvement", label: "Community involvement", type: "textarea" },
      { key: "charitable_involvement", label: "Charitable involvement", type: "textarea" }, { key: "ideal_customers", label: "Ideal customers", type: "textarea" },
      { key: "highest_priority_services", label: "Highest-priority services", type: "textarea" }, { key: "projects_not_accepted", label: "Projects the company does not accept", type: "textarea" },
    ],
  },
  {
    key: "team_owner", title: "Team and Owner Information", summary: "Verified people and operating practices only.",
    fields: [
      { key: "owner_biography", label: "Owner biography", type: "textarea", required: true }, { key: "team_information", label: "Team information", type: "textarea" },
      { key: "workforce_model", label: "Workforce model", type: "select", options: ["Employees", "Subcontractors", "Both"], required: true },
      { key: "team_photos", label: "Owner and team photos", type: "file", accept: "image/png,image/jpeg,image/webp,image/avif", multiple: true },
      { key: "safety_procedures", label: "Safety procedures", type: "textarea" }, { key: "property_protection", label: "Property-protection practices", type: "textarea" },
    ],
  },
  {
    key: "differentiators", title: "Business Differentiators", summary: "Specific, supportable reasons customers choose the company.",
    fields: [
      { key: "competitive_differentiators", label: "Competitive differentiators", type: "textarea", required: true },
      { key: "satisfaction_guarantees", label: "Satisfaction guarantees", type: "textarea" }, { key: "preparation_standards", label: "Preparation standards", type: "textarea" },
      { key: "paint_brands", label: "Paint brands used", type: "textarea" }, { key: "market_positioning", label: "Market positioning", type: "textarea" },
    ],
  },
  {
    key: "painting_process", title: "Painting Process", summary: "Set accurate expectations from estimate through final walkthrough.",
    fields: [
      { key: "painting_process", label: "Painting process", type: "textarea", required: true }, { key: "preparation_process", label: "Preparation process", type: "textarea", required: true },
      { key: "communication_process", label: "Communication process", type: "textarea" }, { key: "cleanup_process", label: "Cleanup process", type: "textarea", required: true },
      { key: "final_walkthrough", label: "Final walkthrough and touch-up process", type: "textarea" },
    ],
  },
  {
    key: "reviews", title: "Reviews and Testimonials", summary: "Submit only real reviews with publication permission.",
    fields: [
      { key: "testimonials", label: "Testimonials", type: "repeater", itemFields: [
        { key: "first_name", label: "Customer first name", type: "text", required: true }, { key: "last_initial", label: "Customer last initial", type: "text" },
        { key: "city", label: "Customer city", type: "text" }, { key: "service", label: "Service performed", type: "text" },
        { key: "testimonial", label: "Written testimonial", type: "textarea", required: true }, { key: "review_date", label: "Review date", type: "text" },
        { key: "source", label: "Review source", type: "text" }, { key: "review_url", label: "Review URL", type: "url" },
        { key: "permission", label: "Permission to publish", type: "checkbox", required: true },
      ] },
      { key: "review_profile_urls", label: "Google, Facebook, Yelp, BBB, and other review profile URLs", type: "textarea" },
      { key: "real_reviews_confirmation", label: "I confirm these are real reviews and no restricted platform was scraped", type: "checkbox", required: true },
    ],
  },
  {
    key: "projects_gallery", title: "Projects and Gallery", summary: "Create project records with approved, privacy-safe media.",
    fields: [
      { key: "projects", label: "Projects", type: "repeater", itemFields: [
        { key: "title", label: "Project title", type: "text", required: true }, { key: "public_city", label: "Public city", type: "text", required: true },
        { key: "private_address", label: "Private project address", type: "text" }, { key: "completion_date", label: "Completion date", type: "text" },
        { key: "category", label: "Interior or exterior", type: "select", options: ["Interior", "Exterior"], required: true },
        { key: "services", label: "Services performed", type: "textarea" }, { key: "description", label: "Project description", type: "textarea", required: true },
        { key: "customer_goal", label: "Customer goal", type: "textarea" }, { key: "problems", label: "Problems encountered", type: "textarea" },
        { key: "preparation", label: "Preparation performed", type: "textarea" }, { key: "products", label: "Products used", type: "textarea" },
        { key: "colors", label: "Paint colors", type: "textarea" }, { key: "techniques", label: "Techniques used", type: "textarea" },
        { key: "result", label: "Final result", type: "textarea" },
        { key: "before_photos", label: "Before photos", type: "file", accept: "image/png,image/jpeg,image/webp,image/avif", multiple: true },
        { key: "after_photos", label: "After photos", type: "file", accept: "image/png,image/jpeg,image/webp,image/avif", multiple: true },
        { key: "additional_photos", label: "Additional photos", type: "file", accept: "image/png,image/jpeg,image/webp,image/avif", multiple: true },
        { key: "captions", label: "Image captions and before/after pairing notes", type: "textarea" },
        { key: "permission", label: "Permission to publish", type: "checkbox", required: true }, { key: "featured", label: "Featured project", type: "checkbox" },
        { key: "related_testimonial", label: "Related testimonial", type: "text" },
      ] },
      { key: "alt_text_approval", label: "I understand suggested alt text requires human approval", type: "checkbox", required: true },
    ],
  },
  {
    key: "contact_form", title: "Contact Form Settings", summary: "Configure lead delivery without adding a CRM.",
    fields: [
      { key: "primary_cta", label: "Primary call to action", type: "text", required: true }, { key: "secondary_cta", label: "Secondary call to action", type: "text" },
      { key: "estimate_wording", label: "Estimate-request wording", type: "textarea" }, { key: "recipient", label: "Contact-form recipient", type: "email", required: true },
      { key: "cc_recipients", label: "CC recipients", type: "textarea" }, { key: "phone_preference", label: "Phone-call preference", type: "textarea" },
      { key: "text_preference", label: "Text-message preference", type: "textarea" }, { key: "booking_url", label: "Booking URL", type: "url" },
      { key: "financing_url", label: "Financing URL", type: "url" }, { key: "required_lead_fields", label: "Required lead fields", type: "textarea", required: true },
      { key: "sms_consent", label: "SMS consent wording", type: "textarea" }, { key: "email_consent", label: "Email consent wording", type: "textarea" },
      { key: "store_submissions", label: "Store contact submissions", type: "checkbox" }, { key: "webhook_url", label: "Optional webhook URL", type: "url" },
    ],
  },
  { key: "social_profiles", title: "Social Profiles", summary: "Only valid links will be displayed.", fields: linkFields },
  {
    key: "content_preferences", title: "Content Preferences", summary: "Set the writing boundaries and source materials for drafts.",
    fields: [
      { key: "writing_tone", label: "Preferred writing tone", type: "text", required: true }, { key: "formality", label: "Style", type: "select", options: ["Formal", "Conversational", "Balanced"], required: true },
      { key: "voice", label: "Voice", type: "select", options: ["First person", "Company voice"], required: true },
      { key: "terms_used", label: "Terms the business uses", type: "textarea" }, { key: "terms_avoided", label: "Terms the business avoids", type: "textarea" },
      { key: "preferred_ctas", label: "Preferred calls to action", type: "textarea" }, { key: "target_customers", label: "Target customers", type: "textarea" },
      { key: "priority_services", label: "Priority services", type: "textarea" }, { key: "priority_locations", label: "Priority locations", type: "textarea" },
      { key: "seasonal_priorities", label: "Seasonal priorities", type: "textarea" }, { key: "common_questions", label: "Common customer questions", type: "textarea" },
      { key: "common_objections", label: "Common objections", type: "textarea" }, { key: "competitors", label: "Competitors", type: "textarea" },
      { key: "market_positioning", label: "Market positioning", type: "textarea" }, { key: "topics_to_avoid", label: "Topics to avoid", type: "textarea" },
      { key: "existing_copy", label: "Existing website copy", type: "textarea" },
      { key: "content_documents", label: "Brochures, sales materials, blog posts, and other content", type: "file", accept: "application/pdf,image/png,image/jpeg", multiple: true },
    ],
  },
  {
    key: "legal_compliance", title: "Legal and Compliance", summary: "Confirm publication rights and identify claims that need review.",
    fields: [
      { key: "legal_business_disclosures", label: "Required legal business disclosures", type: "textarea" },
      { key: "license_review_notes", label: "License and jurisdiction notes", type: "textarea" }, { key: "warranty_review_notes", label: "Warranty and guarantee notes", type: "textarea" },
      { key: "privacy_contact", label: "Privacy contact email", type: "email", required: true },
      { key: "asset_rights", label: "I have rights to publish the supplied text, logos, reviews, and photos", type: "checkbox", required: true },
      { key: "facts_confirmed", label: "I confirm the submitted business claims are accurate", type: "checkbox", required: true },
    ],
  },
  {
    key: "final_review", title: "Final Review", summary: "Review every section before submitting it to Nova Suite.",
    fields: [
      { key: "confirmation_name", label: "Your full name", type: "text", required: true },
      { key: "truthfulness_confirmation", label: "I confirm these answers are accurate and complete to the best of my knowledge", type: "checkbox", required: true },
      { key: "draft_acknowledgement", label: "I understand generated content is a draft and will not launch automatically", type: "checkbox", required: true },
      { key: "final_notes", label: "Final notes for Nova Suite", type: "textarea" },
    ],
  },
] as const;

function hasRequiredValue(value: unknown, field: OnboardingField): boolean {
  if (field.type === "checkbox") return value === true;
  if (field.type === "repeater" || field.type === "multiselect" || field.type === "file") return Array.isArray(value) && value.length > 0;
  return typeof value === "string" ? value.trim().length > 0 : typeof value === "number" && Number.isFinite(value);
}

export function validateOnboardingSection(sectionKey: string, answers: OnboardingAnswerMap) {
  const section = ONBOARDING_SECTIONS.find((item) => item.key === sectionKey);
  if (!section) return { success: false as const, errors: { section: "Unknown section." } };
  const errors: Record<string, string> = {};
  for (const field of section.fields) {
    const value = answers[field.key];
    if (field.required && !hasRequiredValue(value, field)) errors[field.key] = "This field is required.";
    if (field.type === "repeater" && Array.isArray(value) && field.itemFields) {
      const nestedMissing = value.some((item) => typeof item !== "object" || !item || field.itemFields!.some((nested) => nested.required && !hasRequiredValue((item as Record<string, unknown>)[nested.key], nested)));
      if (nestedMissing) errors[field.key] = "Complete the required fields for every item.";
    }
    if (typeof value === "string" && value.trim()) {
      if (field.type === "email" && !z.string().email().safeParse(value).success) errors[field.key] = "Enter a valid email address.";
      if (field.type === "url" && !z.string().url().safeParse(value).success) errors[field.key] = "Enter a complete URL including https://.";
    }
    if (field.key === "radius_miles" && typeof value === "number" && (value < 1 || value > 100)) errors[field.key] = "Choose a radius from 1 to 100 miles.";
    if (field.key === "maximum_location_pages" && typeof value === "number" && (value < 0 || value > 20)) errors[field.key] = "Choose no more than 20 location pages.";
  }
  if (sectionKey === "services") {
    const selected = Array.isArray(answers.selected_services) ? answers.selected_services : [];
    const details = Array.isArray(answers.service_details) ? answers.service_details : [];
    if (selected.some((service) => !details.some((detail) => typeof detail === "object" && detail && (detail as Record<string, unknown>).service === service))) errors.service_details = "Add details for every selected service.";
  }
  if (sectionKey === "domain_information") {
    if (answers.domain_model === "Client already owns a domain" && !(typeof answers.domain_name === "string" && answers.domain_name.trim())) errors.domain_name = "Enter the existing domain.";
    if (answers.domain_model === "Client needs a domain" && !(typeof answers.preferred_domain === "string" && answers.preferred_domain.trim())) errors.preferred_domain = "Enter a preferred domain.";
  }
  return Object.keys(errors).length ? { success: false as const, errors } : { success: true as const, errors: {} };
}

export function calculateCompletion(answers: Record<string, { isComplete: boolean }>): number {
  const applicable = ONBOARDING_SECTIONS.filter((section) => section.key !== "final_review");
  const complete = applicable.filter((section) => answers[section.key]?.isComplete).length;
  return Math.round((complete / applicable.length) * 100);
}

export function getOnboardingSection(sectionKey: string): OnboardingSectionDefinition | undefined {
  return ONBOARDING_SECTIONS.find((section) => section.key === sectionKey);
}
