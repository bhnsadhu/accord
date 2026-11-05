# Progress

_Last updated 2026-10-30._

## Current milestone
All phases complete. Live at https://accord.bhanusadhu.com (Vercel Hobby + Neon Free), scanner on with budget-sized caps.

## Done (verified)
- **App**: Next.js 16.4, Tailwind 4, strict TS, Drizzle/node-postgres, Better Auth.
- **Data**: schema + 3 migrations; catalog seed from ScentLens products.csv (24,642 fragrances, 1,255 brands, 285 notes, 189,312 links; 36 MB).
- **Search**: pg_trgm fuzzy search + filters (wheel family, facet, family, include/exclude note, gender), pagination, sort.
- **Recommender**: IDF note vectors, accord/family similarity, nearest-liked, PPR, MMR, evidence-based reasons, percentile match, archetype cold start. Offline eval in docs/EVALUATION.md.
- **Collections/profiles**: guest localStorage + accounts, merge on sign-in, ratings feed recommendations, account deletion cascades.
- **Scanner**: ScentLens client (documented schema), validation, atomic quotas, slot leases, result cache, mock for dev only. Off in production.
- **Design**: Blotter direction approved and implemented across all pages; impeccable finish review verdict **ship** after 8 material fixes + 2 regressions resolved; DESIGN.md + docs/DESIGN.md written from the shipped build.
- **Tests**: 66 Vitest (unit + integration on PGlite); 19 Playwright tests (9 journeys desktop + mobile, mocked scanner; axe WCAG 2.2 AA on 10 pages); typecheck, lint, production build pass.
- **Docs**: README, CLAUDE.md, PRODUCT.md, docs/{ARCHITECTURE,PRODUCT,DECISIONS,EVALUATION,PROGRESS}.md, COSTS.md, THIRD_PARTY_NOTICES.md, .env.example.

## Community and reference expansion (2026-11-05)

Owner asked for Accord to become a complete everyday fragrance reference, adapted to Accord rather than copied. Built on branch `claude/beautiful-gates-p2u2ti` (not `main`, so nothing is deployed yet):

- **Fragrance page** reordered around what people look for first: member rating at a glance, your shelf and rating, an accord profile (stained bars estimated from listed notes, with the method disclosed), notes, member votes (longevity, sillage, season, time of day, reads as, value) with counts per answer, your own vote, reviews with helpful and report, "reminds members of", then published wear guidance, versions, similar, the house and sources.
- **New pages:** `/brands`, `/brands/[slug]`, `/perfumers`, `/perfumers/[slug]`, `/charts`, `/members/[id]`. Discover gains a release-year filter. Header gains Houses and Charts.
- **Safety:** verified members only (when email is on), per-member budgets, no links in reviews, three distinct reports hide a review, owner tool `npm run community:moderate`. Account deletion removes contributions and refreshes cached pages. Privacy and guide copy updated.
- **Checks:** typecheck, lint, 107 Vitest (11 new community integration + 3 accord profile unit), production build. New e2e `community.spec.ts` (guest view, full member flow, directory navigation) and axe on 5 new pages pass against a local fixture catalog; tests that assume the full production catalog were not runnable here (the ScentLens CSV is not in this environment).
- **Before deploying:** run `npm run db:migrate` against Neon (migration `0005_community`), then merge and redeploy.

## Open items
Latest UI update (2026-10-30): renamed the footer source link to “Repository” and linked every visible ScentLens mention, including scanner messages, using semibold ink on a subtle silver highlight with no underline. Checks skipped at the owner's request; committed and pushed through the existing workflow.

Catalog refresh (2026-11-04): the source catalog ends in early 2024 (435 entries for 2024, none after). Added Moroccanoil Lumière du Jour from the request inbox plus 9 notable 2025 and 2026 launches (Prada Paradigme, Paradoxe Sweet Chemistry, Infusion de Santal Chai; Chanel Chance Eau Splendide, Bleu de Chanel L'Exclusif; Estée Lauder Glimmer; Destin de Balmain; Tom Ford Tobacco Chocolat; Valentino Born in Roma Uomo Extradose). Owner rule: publish only additions with a sourced summary, concentration, family and year, like earlier additions. Notes come from official brand pages; years and perfumers from named press or reference sources. Held back until complete: YSL Libre Berry Crush and Armani Stronger With You Powerfully (year), Dior J'adore Intense and Miss Dior Essence (concentration), Rabanne Phantom Elixir and Lattafa Khamrah Dukhan (concentration, family), Carolina Herrera Bad Boy Elixir (family). Skipped: Versace Eros Energy (no brand-published notes), Ariana Grande Lovenotes (later batch); Althaïr and Burberry Goddess already exist. Next: more batches of about 20, then clear handled inbox requests.

1. **Logo**: placeholder strip mark; options being explored.
2. **More scans**: needs Modal budget (card + spend limit): Bhanu deciding later. Caps: 3/day global, 2 per account, 1 per guest.

## Deployment facts
- Vercel project `bhanu-sadhu-s-projects/accord`, Git-connected: every push to `main` deploys production.
- Neon `accord-db` (Free) via Vercel Marketplace; migrations and seed run from this machine with `DATABASE_URL_UNPOOLED` from `vercel env pull .env.production.local`.
- Env (production): DATABASE_URL (Neon), BETTER_AUTH_SECRET, BETTER_AUTH_URL, SCANNER_MODE=live, SCENTLENS_URL, SCAN_* caps.
- Modal workspace has no payment method; usage limit $1/month set by Modal, so no charges are possible.

## Production hardening, October 31, 2026

- Added verified email signup, expiring single-use recovery, session revocation and private data export. Resend sending key is stored in Vercel; simulator send accepted.
- Added privacy, safe error states, security headers, streaming body limits, distributed request budgets and a protected database health check. Production dependency audit reports zero known findings.
- Created encrypted daily backups in the private accord-ops repository. PostgreSQL 18 restore drill verified all 18 tables; retention cleanup completed.
- Deployed a separate proxy-authenticated scanner, shorter idle window and a calendar-month cap. Live cold request succeeded in 29.9 seconds; unauthorized requests return 401. Shared public-demo credit remains a capacity limit.
- Reviewed new account/privacy surfaces at 390 and 1440. Reviewer found two account layout defects, both resolved and scored ship. Documenter confirmed the extension preserves the existing system; preexisting design-sidecar drift was left untouched.
- See OPERATIONS.md and COSTS.md for recovery, limits and provider boundaries.
