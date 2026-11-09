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
- Catalog: 24,651 fragrances, including 9 editions added through the research workflow. Includes brands, notes, Edwards-wheel accord families and facets, family/subfamily, marketed-as label and year. Coverage counts come from the live catalog.
- Reference coverage: 25 researched fragrance profiles and 66 note definitions, including 24 additional definitions with individual ingredient references. Sources support original summaries, edition identity, available perfumers, documented note stages and attributed wear guidance. Missing facts remain "Not listed". See [CATALOG-RESEARCH.md](docs/CATALOG-RESEARCH.md) and [CATALOG-IMAGES.md](docs/CATALOG-IMAGES.md) for coverage and maintenance.
- Search supports exact editions, aliases and multiple included or excluded notes. Comparison and private taste overlap use the user's actual choices. Catalog release browsing uses listed years. Public contributions and manual catalog-request forms are retired.
- Bottle photographs cover 24,649 of 24,651 catalog entries: 24,647 exact brand and full-name source-dataset matches and 2 independently licensed fallbacks. Detail pages offer enlargement and source information; quick find, Discover previews and comparison show bottle thumbnails. The source dataset is labelled MIT but does not document individual photographers' permissions. The owner approved attributed publication of this batch with that limitation disclosed on 2026-11-01, superseding the earlier verified-license-only constraint for this batch. See [CATALOG-IMAGES.md](docs/CATALOG-IMAGES.md) for the identity audit, provenance and exceptions.
- The original 6 independently licensed bottle assets and 16 licensed note photographs retain their credits and licenses. All 304 catalog notes now have pictures, using credited material photos, molecular diagrams and labeled scent or context references. Fragrance pages use Top notes, Heart notes and Base notes when a source gives those stages. Sauvage Parfum and Tobacco Vanille Parfum remain unpictured. Textured paper strips remain part of the interface, including for entries with photos. Copied product descriptions still require verified usage rights; broad image coverage does not imply researched perfumers, note stages or wear guidance for every fragrance.
- No public ratings, reviews, comments, wear votes, member profiles or popularity charts are shown. Personal ratings and collections remain private. Published wear guidance appears only with an identified source; unsupported sections are omitted.
- Scanner: ScentLens on Modal free tier, ~6 s warm, ~1 min cold start; can abstain. Gated until cost protections are verified.
- $0 infrastructure: Vercel Hobby, Neon Free.
- Guest use with local storage; accounts (Better Auth) for persistence.

## Brand Commitments
- Name: Accord.
- Approved creative direction (by Bhanu): "What if Linear's product team built the best fragrance discovery platform?" Clarity, precision, speed, restraint, strong hierarchy, intentional high-quality motion, Apple-level attention to detail, with Accord's own original identity. Not a copy of Linear, Apple, or any fragrance site. Optional secondary reference for interaction personality: gaurimenon.com.
- Bhanu directs colors, fonts, logo, homepage composition, navigation, layouts, and motion. As of 2026-10-30, requested changes may be pushed and deployed after checks without a separate preview approval; he will review them on the live site.

## Evidence on Hand
- Real catalog metadata (local seed from ScentLens export), sourced research, independently licensed reference photographs and an attributed catalog-photo batch with its provenance limitation disclosed.
- Real offline recommender evaluation (docs/EVALUATION.md).
- ScentLens public repo and documented accuracy work (github.com/bhnsadhu/scent-lens).
- Absent, never to be fabricated: user counts, testimonials, reviews, ratings, prices, press.

## Product Principles
1. Honest by construction: show evidence, admit uncertainty, invent nothing.
2. Useful before sign-up; personal after.
3. Every recommendation explains itself in terms a fragrance person recognizes.
4. Fast and precise over feature count.
5. Recognition, discovery and collection feel like one product, not three tools.

## Accessibility & Inclusion
WCAG 2.2 AA: keyboard support, visible focus, reduced-motion support, sufficient contrast, touch-friendly targets on mobile.
