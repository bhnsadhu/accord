# Decisions

## Approved by Bhanu

| Date | Decision | Notes |
|---|---|---|
| 2026-10-30 | Creative direction: "What if Linear built Accord", Apple-level craft, original identity | From the master brief |
| 2026-10-30 | Homepage first viewport wins over **fragrance enthusiasts first**; recruiters judge it as a real product | Engineering story lives in README/docs |
| 2026-10-30 | PRODUCT.md product truth approved as written | |
| 2026-10-30 | Deploy to Vercel + Neon at accord.bhanusadhu.com and turn the scanner on with budget-sized caps | Approved in chat ("do this all yourself", "turn on") |
| 2026-10-30 | Logo: four options drafted (`.impeccable/mocks/logo/options.html`); decision deferred | Placeholder strip mark stays until then |
| 2026-10-30 | Visual world: **Blotter**: fragrances as smelling strips on a neutral evaluation bench, stained by accord family | Chosen over Wheel (dark, Edwards wheel) and Chord (overlapping bands). Preview palette and type (Schibsted Grotesk, Geist Mono) adopted with it. Logo mark is a placeholder pending approval. |
| 2026-11-05 | Make Accord a full fragrance reference people can use day to day, on par with the large community reference sites, "but make it make sense for Accord" | Owner request. Adds member ratings, wear votes, reviews, "reminds me of", house, perfumer and chart pages in the Blotter world. No copied look; nothing seeded or invented: every member number starts at zero. Pushed to a review branch, not `main`; the production migration still needs to run. |
| 2026-10-30 | Push and deploy requested changes after checks; no separate preview approval required | Owner will review on the live site. Applies to the current no-underline change and future requested work. Preserve the live paper-and-silver direction; the dark redesign remains shelved. |

## Engineering decisions (mine, within approved scope)

2026-10-30: Bhanu requested a “Repository” link label and consistently highlighted, clickable ScentLens mentions. Keep all links free of underlines; ScentLens uses the existing ink and silver bench colors. For this small edit, skip checks and commit/push as requested.

| Decision | Why |
|---|---|
| node-postgres driver for local and Neon (pooled URL) | One code path, transactions available, works with Vercel Fluid `attachDatabasePool` |
| PGlite (Postgres in WASM) for local dev and tests | No Docker or credentials needed; real Postgres semantics incl. `pg_trgm` |
| Better Auth (email + password, optional GitHub) | Free, maintained, Drizzle adapter, data stays in our Neon DB; no homemade auth |
| Text metadata only from the catalog; CSV not committed | Image and description rights unverified (see THIRD_PARTY_NOTICES.md) |
| Search in Postgres with `pg_trgm` | Typo tolerance without an external search service |
| Recommender: content-based + nearest-liked + small PPR term; no collaborative filtering | No real interaction data exists; ablation in docs/EVALUATION.md |
| Match score = percentile of eligible catalog | Honest relative measure; never shown as a probability of enjoyment |
| Guest state in localStorage, merged into the account on sign-in (account data wins on conflicts) | Useful before sign-up; nothing lost on sign-in |
| Server session checks bypass Better Auth's cookie cache | Sign-out and account deletion revoke access immediately, even for a replayed cookie |
| Member rating = the existing collection rating, counted anonymously | One rating per member and fragrance, no second star widget to keep in sync; guests' device-only ratings never count |
| Wear votes are shown as counts per answer, plus the most chosen answer only when it leads alone | A single averaged "longevity score" would hide splits and imply a measurement |
| Accord profile bars are estimated from listed notes (log lift of each note's family share across the catalog), catalog family first, labelled as an estimate | The catalog has no accord strengths; this is reproducible, explainable and never claims to measure the juice |
| Reviews: signed-in and (when email is on) verified members, 30 to 3,000 characters, no links, one per fragrance, per-member daily budgets | Keeps spam and drive-by abuse out without paid moderation services |
| Three reports from different members hide a review until the owner restores it (`npm run community:moderate`) | Free, local moderation; no public admin route to attack |
| Member pages list published reviews only; collections stay private | Reviews are already public; shelves and taste were promised private |
| Production builds apply pending migrations before `next build` (`scripts/deploy-migrate.mjs`, production only) | The agent environment cannot read production secrets; the build already has them and already needs the schema to prerender. A failed migration fails the build, so the live site never runs ahead of its schema. |
| Community caches tagged per fragrance, lifetime in days, refreshed by `updateTag` on every write and by `revalidateTag` on account deletion | Fragrance pages stay static and cheap on Vercel Hobby and Neon Free, yet show a member's own change immediately |
