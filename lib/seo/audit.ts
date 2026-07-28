import { allTenantPages } from "@/lib/content/pages";
import { canonicalUrl } from "@/lib/tenant/host";
import type { ContentPage, Location, SeoIssue, Tenant } from "@/lib/types";

const PLACEHOLDER_PATTERN = /lorem ipsum|todo|tbd|replace me/i;
const DEMONSTRATION_PATTERN = /demonstration|sample customer|\.example\b|\(demonstration\)/i;
const STOCK_IMAGE_PATTERN = /^https:\/\/images\.(pexels|unsplash)\.com\//i;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function duplicateIssues(pages: ContentPage[], field: "title" | "description" | "h1"): SeoIssue[] {
  const seen = new Map<string, string>();
  const issues: SeoIssue[] = [];
  for (const page of pages) {
    const value = normalize(page.seo[field]);
    const previous = seen.get(value);
    if (previous && value) {
      issues.push({ severity: "critical", code: `duplicate-${field}`, message: `${field} duplicates ${previous}.`, pageId: page.id });
    } else if (value) {
      seen.set(value, page.name);
    }
  }
  return issues;
}

export function validateForPublication(tenant: Tenant, page: ContentPage): SeoIssue[] {
  const issues: SeoIssue[] = [];
  if (page.tenantId !== tenant.id) issues.push({ severity: "critical", code: "tenant-mismatch", message: "Page tenant does not match the resolved tenant." });
  if (!page.seo.title.trim()) issues.push({ severity: "critical", code: "missing-title", message: "SEO title is required." });
  if (!page.seo.description.trim()) issues.push({ severity: "critical", code: "missing-description", message: "Meta description is required." });
  if (!page.seo.h1.trim()) issues.push({ severity: "critical", code: "missing-h1", message: "One primary H1 is required." });
  if (!page.intro.trim() || page.body.length === 0) issues.push({ severity: "critical", code: "missing-content", message: "Primary content is required." });
  if (PLACEHOLDER_PATTERN.test(`${page.intro} ${page.body.join(" ")}`)) issues.push({ severity: "critical", code: "placeholder-content", message: "Placeholder content cannot publish." });
  if (page.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug)) issues.push({ severity: "critical", code: "invalid-slug", message: "Slug must be lowercase words separated by hyphens." });
  if (!page.seo.canonicalPath.startsWith("/")) issues.push({ severity: "critical", code: "invalid-canonical", message: "Canonical path must be root-relative." });
  const resolvedCanonical = canonicalUrl(tenant, page.seo.canonicalPath);
  if (new URL(resolvedCanonical).hostname !== tenant.primaryDomain) issues.push({ severity: "critical", code: "cross-tenant-canonical", message: "Canonical must use the tenant primary domain." });
  if (page.kind === "location" && !(page as Location).localDetail.trim()) issues.push({ severity: "critical", code: "missing-local-evidence", message: "Location needs a meaningful local element." });
  if (!page.seo.ogImage) issues.push({ severity: "warning", code: "missing-og-image", message: "The tenant fallback social image will be used." });
  if (page.seo.description.length < 90) issues.push({ severity: "warning", code: "weak-description", message: "The description may not fully explain the page value." });
  return issues;
}

export function auditTenant(tenant: Tenant): SeoIssue[] {
  const pages = allTenantPages(tenant);
  const issues = pages.flatMap((page) => validateForPublication(tenant, page));
  issues.push(...duplicateIssues(pages, "title"), ...duplicateIssues(pages, "description"), ...duplicateIssues(pages, "h1"));

  const slugSet = new Set<string>();
  for (const page of pages) {
    const key = `${page.kind}:${page.slug}`;
    if (slugSet.has(key)) issues.push({ severity: "critical", code: "duplicate-slug", message: `Duplicate ${page.kind} slug: ${page.slug}`, pageId: page.id });
    slugSet.add(key);
  }
  return issues;
}

export function auditTenantLaunchReadiness(tenant: Tenant): SeoIssue[] {
  const issues = auditTenant(tenant);
  if (!tenant.productionReady) {
    issues.push({ severity: "critical", code: "launch-gate-closed", message: "Production indexing remains disabled until every launch requirement is approved." });
  }
  if (DEMONSTRATION_PATTERN.test([tenant.legalName, tenant.email, tenant.address].join(" ")) || /\b555\b/.test(tenant.phone)) {
    issues.push({ severity: "critical", code: "placeholder-business-data", message: "Replace demonstration contact and legal details before launch." });
  }
  if (!tenant.domainVerified) {
    issues.push({ severity: "critical", code: "primary-domain-unverified", message: "Verify the production domain, HTTPS, and primary-host redirects before launch." });
  }
  if (!tenant.insuranceInfo || /requires .*verification/i.test(tenant.insuranceInfo)) {
    issues.push({ severity: "critical", code: "business-claims-unverified", message: "Verify insurance, licensing, and other trust claims before launch." });
  }
  if (tenant.projects.some((project) => DEMONSTRATION_PATTERN.test(`${project.intro} ${project.body.join(" ")}`))) {
    issues.push({ severity: "critical", code: "project-evidence-unverified", message: "Replace demonstration project records with verified first-party work." });
  }
  const publicImages = [
    tenant.heroImage,
    ...tenant.services.flatMap((service) => service.heroImage ? [service.heroImage] : []),
    ...tenant.projects.flatMap((project) => project.images),
  ];
  if (publicImages.some((image) => STOCK_IMAGE_PATTERN.test(image.src))) {
    issues.push({ severity: "critical", code: "first-party-images-required", message: "Replace reference photography with permission-cleared first-party project images." });
  }
  if (!tenant.testimonials.some((testimonial) => testimonial.verified)) {
    issues.push({ severity: "warning", code: "no-verified-testimonials", message: "Add only source-verified customer reviews with publication permission." });
  }
  if (tenant.reviewLinks.length === 0) {
    issues.push({ severity: "warning", code: "missing-review-profile", message: "Add the verified Google Business Profile or approved review profile." });
  }
  return issues;
}
