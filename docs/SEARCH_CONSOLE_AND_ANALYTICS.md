# Search Console, Sitemaps, and Analytics

## Search Console and Bing

1. Create a separate domain property for each customer domain.
2. Add the DNS verification token supplied by the search platform; store only the nonsecret token per tenant.
3. Confirm the live URL inspector sees the production canonical, index directive, rendered H1/content, and correct tenant structured data.
4. Submit `https://PRIMARY_DOMAIN/sitemap.xml`.
5. Monitor indexing, crawl errors, duplicate canonical reports, mobile usability, Core Web Vitals, and structured-data warnings.
6. Investigate cross-domain canonicals or sitemap URLs immediately as tenant-isolation release blockers.

## Analytics and conversion tracking

Store Google Analytics, Tag Manager, and optional call/conversion configurations per tenant. Load only the current tenant's IDs and defer nonessential scripts. Do not install both direct GA and a duplicate GA tag through Tag Manager. Verify form and phone events in a preview-safe test property before production.

Synthetic Lighthouse scores are a controlled guardrail. Review real-user Core Web Vitals after launch and investigate template, device, geography, and image patterns rather than relying on a single aggregate number.
