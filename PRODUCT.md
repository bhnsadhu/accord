# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Fragrance enthusiasts: people who already own several bottles, know (or want to learn) notes and accords, and spend time researching what to try next. They arrive with one of five questions: "What fragrance is this?", "What would I like?", "What smells like my favorite?", "What do this fragrance's notes and family mean?", "How do I organize and understand my collection?". They use Accord on a laptop while researching and on a phone in a store, at a friend's place, or in front of their own shelf.

Secondary audience: recruiters and hiring managers evaluating Bhanu Sadhu's product and engineering judgment. They should experience a real consumer product, not a demo, and find the engineering story in the README and docs.

## Product Purpose
Accord identifies, recommends, compares and collects fragrances. It is useful on the first visit without an account (browse, search, explain, recommend from a few taste choices) and becomes more personal as people rate and collect. Success: a visitor finds a fragrance they want to try and understands why it was suggested.

It also serves as a fragrance reference: find an exact edition or familiar alias, understand its sourced facts and scent vocabulary, compare editions, then follow a note, family or house into the catalog. General educational explanations, published wear guidance and private preference overlap stay distinct from verified facts about an individual fragrance.

## Positioning
Accord pairs a real bottle-recognition engine (ScentLens: detection, fine-tuned visual embeddings, label reading, calibrated abstention over 24,642 catalog fragrances) with an explainable recommender that shows its evidence (shared notes, named fragrances, accords). It never pretends to know: uncertain scans say so, match scores are relative percentiles, and nothing about a fragrance is invented.

## Operating Context
- Browsing and research sessions at a desk; quick lookups on a phone, including photographing a bottle.
- Returning visits to rate what was tried, move bottles between Owned / Tried / Wishlist, and refine taste.
- Not a store: no prices, checkout, or retailer links.

## Capabilities and Constraints
- Catalog: 24,649 fragrances, including 7 editions added through the research workflow. Includes brands, notes, Edwards-wheel accord families and facets, family/subfamily, marketed-as label and year. Coverage counts come from the live catalog.
- Reference coverage: 22 researched fragrance profiles and 42 note definitions. Sources support original summaries, edition identity, available perfumers, documented note stages and attributed wear guidance. Missing facts remain "Not listed". See [CATALOG-RESEARCH.md](docs/CATALOG-RESEARCH.md) for coverage and maintenance.
- Search supports exact editions, aliases and multiple included or excluded notes. Comparison and private taste overlap use the user's actual choices. A private catalog request can flag a missing fragrance for review.
- No catalog bottle images or copied product descriptions may be shown without verified rights. This release uses the established paper-strip presentation and adds no bottle photos.
- No prices, community ratings, reviews, comments, public votes or popularity data exist; none may be implied.
- Scanner: ScentLens on Modal free tier, ~6 s warm, ~1 min cold start; can abstain. Gated until cost protections are verified.
- $0 infrastructure: Vercel Hobby, Neon Free.
- Guest use with local storage; accounts (Better Auth) for persistence.

## Brand Commitments
- Name: Accord.
- Approved creative direction (by Bhanu): "What if Linear's product team built the best fragrance discovery platform?" Clarity, precision, speed, restraint, strong hierarchy, intentional high-quality motion, Apple-level attention to detail, with Accord's own original identity. Not a copy of Linear, Apple, or any fragrance site. Optional secondary reference for interaction personality: gaurimenon.com.
- Bhanu directs colors, fonts, logo, homepage composition, navigation, layouts, and motion. As of 2026-10-30, requested changes may be pushed and deployed after checks without a separate preview approval; he will review them on the live site.

## Evidence on Hand
- Real catalog metadata (local seed from ScentLens export).
- Real offline recommender evaluation (docs/EVALUATION.md).
- ScentLens public repo and documented accuracy work (github.com/bhnsadhu/scent-lens).
- Absent, never to be fabricated: user counts, testimonials, reviews, ratings, prices, bottle photos, press.

## Product Principles
1. Honest by construction: show evidence, admit uncertainty, invent nothing.
2. Useful before sign-up; personal after.
3. Every recommendation explains itself in terms a fragrance person recognizes.
4. Fast and precise over feature count.
5. Recognition, discovery and collection feel like one product, not three tools.

## Accessibility & Inclusion
WCAG 2.2 AA: keyboard support, visible focus, reduced-motion support, sufficient contrast, touch-friendly targets on mobile.
