@AGENTS.md

# Accord — engineering notes for Claude

Accord is a premium fragrance discovery, recognition and collection platform: Bhanu's PM + SWE portfolio project (not commercial). The recognition engine is ScentLens, a separate repo (github.com/bhnsadhu/scent-lens) deployed on Modal. Never merge, rebuild, retrain or redeploy ScentLens without explicit permission.

Read `docs/PROGRESS.md` first for current state and next actions.

## Product priorities
1. Working core functionality (browse, search, detail, profile, recommendations, collections)
2. Strong, explainable recommendations (src/lib/reco)
3. Secure, cost-safe ScentLens integration (scanner gated until spend limits verified)
4. Premium consumer UX; 5. visual execution; 6. clean engineering; 7. tests; 8. deploy readiness

## Hard rules
- $0 required spend. No paid APIs, no billing changes, no public deployment, no DNS changes without approval.
- Never fake recognition results, notes, prices, ratings, reviews, images, metrics or testimonials.
- Catalog: text metadata only from ScentLens products.csv (HF doevent/perfume, MIT tag, image rights unverified). No catalog images, no descriptions. The CSV is never committed.
- Never present an abstained ScentLens result as confirmed. Confidence 1.0 from "clear label" is not a guarantee.
- No secrets in git. `.env` is local only; `.env.example` lists names.
- Design: final colors/fonts/logo/layouts/motion need Bhanu's approval (see docs/DESIGN.md, docs/DECISIONS.md). Scaffolding UI is temporary.

## Approved visual world: Blotter
Fragrances are smelling strips on a neutral evaluation bench; one fixed stain hue per Edwards wheel family (`src/lib/hues.ts`); Schibsted Grotesk + Geist Mono (numbers/ids only); light only. Every list uses the strip module (`src/components/strip.tsx`). Homepage contract: `.impeccable/surfaces/src-app-page-tsx.md`. Unconfirmed scan candidates are ghost (unstained, dashed) strips.

## Creative direction (approved, high level)
"What if Linear's product team built the best fragrance discovery platform?" Clarity, precision, speed, restraint, strong hierarchy, high-quality motion, Apple-level craft. Original identity; no copying Linear/Apple; no generic AI-dashboard styling, random glass, gratuitous gradients.

## Stack
Next.js 16 App Router (cacheComponents + partialPrefetching ON — read node_modules/next/dist/docs before using caching/params APIs), React 19, TS strict, Tailwind 4, Drizzle + node-postgres, Neon in prod, PGlite locally, Better Auth, Vitest, Playwright.

## Local dev
```
npm run db:server      # PGlite on 127.0.0.1:5433, data in .data/pglite (keep running)
npm run db:migrate && npm run db:seed
npm run dev
```
Checks before every commit: `npm run typecheck && npm run lint && npm test` (+ `npm run build` and `npm run test:e2e` for app changes; e2e starts its own server on :3200 with the scanner mocked).

Next.js 16 gotchas seen here: setState inside effects fails lint (react-compiler rules) — derive state instead; pages reading params/searchParams must await them inside <Suspense>; Turbopack dev can go stale after appending exports to a "use cache" module — restart dev.

## Git workflow
- Commit + push completed, tested chunks to `main` (authorized). Conventional commits. Never force-push.
- Author: `bhnsadhu <bhnsadhu@gmail.com>` (verified linked to GitHub login bhnsadhu).
- No Vercel project is linked to the repo yet, so pushes do not deploy. Re-check before linking one.
- After a push, report briefly: what changed, tests, commit hash, push status, next item.

## Collaboration
Don't ask about routine engineering. Ask one focused question only for design direction, credentials, billing/infra, legal. Keep docs/PROGRESS.md and docs/DECISIONS.md current.
