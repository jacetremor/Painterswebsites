# Owner Dashboard Page Override

This page is a quiet operational workspace for painting company owners. These rules override the public-site design system where needed.

## Purpose

- Make the common jobs immediately obvious: add photos, review drafts, publish photos, inspect SEO, and open public pages.
- Optimize for repeat use and scanning rather than marketing.
- Use plain language and progressive disclosure so a nontechnical owner can work confidently.

## Visual System

- Font: Geist Sans throughout.
- Navigation: `#101210`.
- Canvas: `#171918`.
- Primary surface: `#202320`.
- Soft surface and controls: `#292D29`.
- Border: `#353A36`.
- Primary text: `#F4F6F4`.
- Muted text: `#A7AEA9`.
- Action green: `#48B889`.
- Warning: `#7A5500`; critical: `#9E2418`; success: `#23634F`.
- Corners: consistent `8px` for panels, controls, images, and navigation items. Status badges may use pill corners.
- Shadows: very subtle and limited to independent surfaces.

## Layout

- Desktop sidebar: `272px`, sticky below the platform header, with the tenant identity at the top and account actions at the bottom.
- Main workspace: up to `1500px`, with `24px` to `56px` horizontal padding.
- Use a compact page header, task actions, and a four-column status summary.
- Treat upload and library management as separate surfaces. Keep the selected-photo inspector beside the library on desktop.
- SEO and page inventory use responsive tables with a clear header row and horizontal overflow contained inside the table wrapper.
- Never nest a decorative card inside another decorative card.

## Navigation

- Use task names: Overview, Add photos, Photo library, SEO audit, and Pages.
- Pair every task with a Lucide icon and a short secondary label on desktop.
- On tablet, collapse the sidebar into a sticky horizontal task rail.
- On small mobile screens, show icon controls with accessible names and hide secondary account actions.
- External public-site links open in a new tab and use the external-link icon.

## Components

- Inputs and buttons are at least `44px` high.
- Upload controls clearly communicate accepted file formats and that uploads begin as private drafts.
- Photo filters use a segmented control with `aria-pressed`.
- The selected photo has a strong visible state that does not alter layout dimensions.
- Publishing controls explain whether the photo will be public.
- Destructive actions use a confirmation state before deletion.
- Empty, warning, success, and read-only states use text plus icons; color is not the only signal.

## Typography And Spacing

- Page heading: about `42px` desktop and `34px` mobile.
- Section heading: about `26px`.
- Compact panel heading: `16px` to `18px`.
- Supporting copy: `12px` to `14px` where space is constrained, with comfortable line height.
- Use `8px`, `12px`, `16px`, `24px`, `32px`, and `40px` spacing increments.
- Do not scale font size continuously with viewport width.

## Motion And Accessibility

- Use `150ms` to `220ms` hover and focus transitions.
- Do not animate data tables or form layout.
- Preserve scroll targets below sticky navigation with `scroll-margin-top`.
- Maintain WCAG AA contrast and visible focus rings.
- Verify at `375px`, `768px`, `1024px`, and `1440px`.
