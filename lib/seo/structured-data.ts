import { canonicalUrl } from "@/lib/tenant/host";
import type { BlogPost, ContentPage, Location, Project, Service, Tenant } from "@/lib/types";

type JsonLd = Record<string, unknown>;

export function businessSchema(tenant: Tenant): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": `${canonicalUrl(tenant, "/")}#business`,
    name: tenant.name,
    legalName: tenant.legalName,
    url: canonicalUrl(tenant, "/"),
    telephone: tenant.phone,
    email: tenant.email,
    areaServed: tenant.serviceArea,
    openingHours: tenant.businessHours,
    image: tenant.heroImage.src,
  };
}

export function pageSchema(tenant: Tenant, page: ContentPage): JsonLd[] {
  const canonical = canonicalUrl(tenant, page.seo.canonicalPath);
  const graph: JsonLd[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: page.seo.title,
      description: page.seo.description,
      isPartOf: { "@id": `${canonicalUrl(tenant, "/")}#website` },
      about: { "@id": `${canonicalUrl(tenant, "/")}#business` },
      dateModified: page.updatedAt,
      primaryImageOfPage: { "@type": "ImageObject", contentUrl: page.heroImage?.src ?? tenant.heroImage.src },
    },
  ];

  if (page.slug === "") {
    graph.push(businessSchema(tenant));
    graph.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${canonicalUrl(tenant, "/")}#website`,
      url: canonicalUrl(tenant, "/"),
      name: tenant.name,
    });
  }

  if (page.kind === "service") {
    const service = page as Service;
    graph.push({
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.name,
      description: service.intro,
      url: canonical,
      provider: { "@id": `${canonicalUrl(tenant, "/")}#business` },
      areaServed: tenant.serviceArea,
    });
  }

  if (page.kind === "location") {
    const location = page as Location;
    graph.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: canonicalUrl(tenant, "/") },
        { "@type": "ListItem", position: 2, name: "Locations", item: canonicalUrl(tenant, "/#locations") },
        { "@type": "ListItem", position: 3, name: location.city, item: canonical },
      ],
    });
  }

  if (page.kind === "project") {
    const project = page as Project;
    graph.push({
      "@context": "https://schema.org",
      "@type": "ImageObject",
      contentUrl: project.images[0]?.src,
      caption: project.images[0]?.caption,
      name: project.images[0]?.alt,
    });
  }

  if (page.kind === "blog") {
    const post = page as BlogPost;
    graph.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.seo.h1,
      description: post.excerpt,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: { "@type": "Organization", name: post.author.name },
      image: post.featuredImage.src,
      mainEntityOfPage: canonical,
    });
  }

  if (page.slug !== "") {
    graph.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: canonicalUrl(tenant, "/") },
        { "@type": "ListItem", position: 2, name: page.breadcrumbLabel, item: canonical },
      ],
    });
  }

  return graph;
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function isValidStructuredData(value: unknown): boolean {
  const nodes = Array.isArray(value) ? value : [value];
  return nodes.length > 0 && nodes.every((node) => {
    if (!node || typeof node !== "object") return false;
    const record = node as Record<string, unknown>;
    return record["@context"] === "https://schema.org" && typeof record["@type"] === "string";
  });
}
