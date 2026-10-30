# Decisions

## Approved by Bhanu

| Date | Decision | Notes |
|---|---|---|
| 2026-10-30 | Creative direction: "What if Linear built Accord", Apple-level craft, original identity | From the master brief |
| 2026-10-30 | Homepage first viewport wins over **fragrance enthusiasts first**; recruiters judge it as a real product | Engineering story lives in README/docs |
| 2026-10-30 | PRODUCT.md product truth approved as written | |
| 2026-10-30 | Deploy to Vercel + Neon at accord.bhanusadhu.com and turn the scanner on with budget-sized caps | Approved in chat ("do this all yourself", "turn on") |
| 2026-10-30 | Logo: four options drafted (`.impeccable/mocks/logo/options.html`); decision deferred | Placeholder strip mark stays until then |
| 2026-10-30 | Visual world: **Blotter** — fragrances as smelling strips on a neutral evaluation bench, stained by accord family | Chosen over Wheel (dark, Edwards wheel) and Chord (overlapping bands). Preview palette and type (Schibsted Grotesk, Geist Mono) adopted with it. Logo mark is a placeholder pending approval. |
| 2026-10-30 | Push and deploy requested changes after checks; no separate preview approval required | Owner will review on the live site. Applies to the current no-underline change and future requested work. Preserve the live paper-and-silver direction; the dark redesign remains shelved. |

## Engineering decisions (mine, within approved scope)

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
