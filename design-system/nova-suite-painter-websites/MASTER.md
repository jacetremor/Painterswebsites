# Nova Suite Painter Websites Design System

This file defines the shared quality bar for the Summit and Heritage public websites. Page-specific files in `pages/` may override these rules for operational surfaces such as the owner portal.

## Experience Standard

- Present each company as an established local painting contractor, not a generic website template.
- Lead with finished spaces and real project work. Imagery must match the service, location, and page topic.
- Keep the path to an estimate obvious without repeating oversized calls to action in every section.
- Use whitespace and section contrast to create a deliberate reading rhythm.
- Favor specific, useful copy over decorative labels or inflated marketing language.

## Shared Foundation

- Content width: `1200px` maximum for public pages.
- Section rhythm: `96px` to `120px` desktop and `64px` to `80px` mobile.
- Corners: `8px` for interactive controls, project cards, service cards, and framed tools.
- Icons: Lucide only. Keep icon size and stroke weight consistent.
- Summit type: Plus Jakarta Sans for headings, body, and controls.
- Heritage type: Instrument Serif for headings and DM Sans for body and controls.
- Controls: at least `48px` high with visible keyboard focus.
- Cards: reserve for repeated projects, services, guides, and framed tools. Do not place cards inside cards.
- Motion: use restrained reveals, gentle image movement, and short page transitions. Respect `prefers-reduced-motion`.
- Shadows: subtle depth only where it clarifies layering; never use glow effects or decorative floating blobs.

## Summit Direction

- Character: precise, architectural, confident, modern.
- Primary: `#183D32`
- Surface: `#F7F8F5`
- Secondary: `#DCE8E2`
- Accent: `#D86745`
- Ink: `#14201C`
- Typography: Plus Jakarta Sans for headings and body.
- Composition: strong grids, generous whitespace, precise dividers, and direct calls to action.
- Imagery: finished contemporary interiors, clean exterior lines, and close detail work.

## Heritage Direction

- Character: warm, crafted, established, residential.
- Primary: `#285640`
- Surface: `#FFFFFF`
- Secondary: `#F7F3EA`
- Accent: `#C89B3C`
- Ink: `#252B26`
- Typography: Instrument Serif for headings and DM Sans for body and controls.
- Composition: editorial spacing, warmer surfaces, quiet borders, and `8px` corners.
- Imagery: inviting finished rooms, traditional homes, woodwork, and tactile finish details.

## Page Composition

1. Lead with a local hero that names the company, service, and service area.
2. Follow with concrete trust signals and a concise service summary.
3. Present primary services with topic-matched finished-space imagery.
4. Show finished projects before process and supporting SEO content.
5. Use full-width bands to change pacing instead of stacking floating containers.
6. Keep supporting SEO content readable with descriptive headings and concise paragraphs.
7. Place FAQs and nearby service-area links near the end of location pages.
8. Finish with one focused estimate path and a complete footer.

## Motion Language

- Page transitions: short opacity and vertical movement, roughly `240ms` to `420ms`.
- Scroll reveals: staggered, subtle, and automatic; no user instruction is required.
- Hero images: slow scale or parallax movement with stable text contrast.
- Hover states: color, border, and small vertical movement only.
- Never animate layout dimensions in a way that shifts surrounding content.

## Acceptance Checklist

- Text contrast meets WCAG AA.
- Focus states are visible on every interactive element.
- No text, image, or control overlaps at `375px`, `768px`, `1024px`, and `1440px`.
- Hero content leaves a hint of the following section visible.
- H1 text is specific to the service and location.
- Every prominent image supports the page topic.
- Mobile navigation, forms, accordions, and filters work without horizontal page scroll.
- Reduced-motion mode removes nonessential transforms and animation.
