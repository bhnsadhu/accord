# Progress

## Current milestone
Phase 2–3: catalog + search done; recommendation engine next, then design checkpoint.

## Done
- Next.js 16.4 app, Tailwind 4, Vitest, ESLint, strict TS.
- Postgres schema (Drizzle): brands, fragrances (ScentLens product_id PK), notes, fragrance_notes, taste_profiles, collection_items, Better Auth tables.
- Local Postgres via PGlite socket server (`npm run db:server`).
- Catalog seed from ScentLens products.csv: 24,642 fragrances, 1,255 brands, 285 notes, 189,312 note links.
- Accord phrase parser (Edwards wheel family / character / facets) and note normalizer, unit tested.
- Fuzzy search (pg_trgm word similarity + all-words match) with family/wheel/facet/note/gender/brand filters.

## Blockers / waiting on Bhanu
- Modal spend limit: confirm in Modal dashboard (Usage & Billing) that spend limit is $0 so the public ScentLens endpoint cannot create charges. Scanner stays disabled until confirmed.
- Neon project + connection string needed before deployment (not before).
- Design direction choice (checkpoint coming).

## Next actions
1. Recommendation engine (src/lib/reco) + tests.
2. Catalog pages (browse, detail) with neutral scaffolding.
3. Design directions checkpoint.
