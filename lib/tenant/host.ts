import { TENANTS } from "@/lib/content/seeds";
import type { Tenant } from "@/lib/types";

const PREVIEW_HOST_SUFFIXES = [".vercel.app", ".novasuite.io", ".localhost", ".local"];

export function normalizeHostname(rawHost: string | null | undefined): string {
  if (!rawHost) return "summit.localhost";
  const forwardedHost = rawHost.split(",")[0]?.trim().toLowerCase() ?? "";
  const hostname = forwardedHost.startsWith("[")
    ? forwardedHost.slice(1, forwardedHost.indexOf("]"))
    : forwardedHost.split(":")[0] ?? "";
  return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
}

export function isPreviewHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  return PREVIEW_HOST_SUFFIXES.some((suffix) => normalized.endsWith(suffix)) || normalized === "localhost";
}

export function shouldNoIndexHostname(hostname: string): boolean {
  return isPreviewHostname(hostname) && process.env.LHCI_ALLOW_INDEXING !== "true";
}

export function previewSlugFromHostname(hostname: string): string | null {
  const normalized = normalizeHostname(hostname);
  if (!normalized.endsWith(".novasuite.io")) return null;
  const slug = normalized.slice(0, -".novasuite.io".length);
  if (!slug || ["app", "www"].includes(slug) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return slug;
}

export function resolveSeedTenant(rawHost: string | null | undefined): Tenant | null {
  const hostname = normalizeHostname(rawHost);
  if (hostname === "localhost" || hostname === "127.0.0.1") return TENANTS[0] ?? null;
  return (
    TENANTS.find((tenant) => {
      const hosts = [tenant.primaryDomain, tenant.developmentDomain, ...tenant.secondaryDomains];
      return hosts.some((candidate) => normalizeHostname(candidate) === hostname);
    }) ?? null
  );
}

export function isSecondaryDomain(tenant: Tenant, rawHost: string): boolean {
  const host = normalizeHostname(rawHost);
  return tenant.secondaryDomains.some((domain) => domain.toLowerCase() === rawHost.toLowerCase()) ||
    (rawHost.toLowerCase().startsWith("www.") && host === normalizeHostname(tenant.primaryDomain));
}

export function canonicalUrl(tenant: Tenant, path: string): string {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(safePath, `https://${normalizeHostname(tenant.primaryDomain)}`);
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, safePath === "/" ? "/" : "");
}

export function hostnameFromHeaders(headers: Headers): string {
  return normalizeHostname(headers.get("x-forwarded-host") ?? headers.get("host"));
}
