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

## Open items
Latest UI update (2026-10-30): renamed the footer source link to “Repository” and linked every visible ScentLens mention, including scanner messages, using semibold ink on a subtle silver highlight with no underline. Checks skipped at the owner's request; committed and pushed through the existing workflow.

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
