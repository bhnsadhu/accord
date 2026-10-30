# Progress

_Last updated 2026-10-30._

## Current milestone
Phases 1–7 complete. Phase 8 (deployment) blocked on Bhanu's approvals below.

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

## Blockers / waiting on Bhanu
1. **Modal spend limit**: confirm Usage & Billing spend limit = $0 (and whether a card is on file). Required before `SCANNER_MODE=live` in production.
2. **One live ScentLens call** for integration verification (costs a few cents of free credit; wakes the container). Not run yet — needs approval.
3. **Neon project + pooled connection string**, and approval to create the Vercel project / deploy / point `accord.bhanusadhu.com`.
4. **Logo**: current mark is a placeholder strip icon.

## Next actions
1. After approvals: create Neon project, run `npm run db:migrate` and `npm run db:seed` against it from this machine, create the Vercel project with env vars (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL), deploy, attach accord.bhanusadhu.com.
2. After the Modal spend limit is confirmed: one live `/identify` call to verify, record latency in docs/EVALUATION.md, then set SCANNER_MODE=live.
3. Logo exploration when Bhanu wants it.
