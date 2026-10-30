# Design

The current design system is recorded in [DESIGN.md](../DESIGN.md). Its neutral tokens match [globals.css](../src/app/globals.css); accord colors come from the fixed [family hue mapping](../src/lib/hues.ts).

## Approved direction

The chosen references are **Precision Bench for Home** and **Scent Archive for Discover**. Both use rectangular cotton-paper smelling strips, short stained ends, fine fiber texture, soft directional shadows, and a cool silver-grey bench. Horizontal strips carry their family-colored tip at the right. This replaces the earlier pointed strips, broad tide-line stains, and beaker fan.

Home spreads real fragrance strips behind a thin silver bench rail. Hover, focus, or selection updates a nearby fragrance preview; explicit links open the detail page or explore its house. The supporting evidence section connects actual fragrances through shared notes and labelled similarity.

Discover places filters, result strips, and a sticky selected-fragrance preview in three desktop columns. Filters collapse above results below 1100px. At phone widths (700px and below), selecting a strip opens its notes and actions directly below that result. Search, filters, counts, sort, pagination, and comparison continue to use the real catalog and existing URLs.

## Standing contracts

- **Color is data.** One fixed hue per accord family; graphite for actions and selected state.
- **Evidence accompanies claims.** Use real notes and fragrance relationships. Distinguish pair similarity from a recommendation percentile; neither is a probability of liking a fragrance.
- **Paper remains plausible.** Rectangular textured white strips, restrained absorption at the end, and soft shadows. Gradients describe material and light.
- **Uncertainty is explicit.** Unconfirmed scan candidates are labelled, dashed, and unstained. Examples are labelled illustrations.
- **Interactions remain usable.** Native buttons and links, accessible names that include visible labels, keyboard focus, preview state announcements, responsive filters, and reduced-motion support.
- **Catalog truth is preserved.** No invented note layers, commercial data, public reviews, or unsupported imagery. Collection ratings belong to the user.

## Approval and source status

The owner reviewed the local implementation and approved production deployment on **2026-10-30**. The owner selected **logo option A: the plain Accord typographic wordmark**, with no added symbol. The additional proposed marks were rejected.

Earlier .impeccable/design.json and surface snapshots describe the previous design and have not been updated as part of this documentation change. Consult the root design system and current source for this direction. Standalone studies under output/design-explorations/ are review artifacts, not production catalog or account state.
