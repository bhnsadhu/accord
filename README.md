# Accord

**Know the bottle. Find the next one.** · Live at **[accord.bhanusadhu.com](https://accord.bhanusadhu.com)**

Accord is a fragrance discovery, reference, recognition and collection app. It answers five questions people who love perfume actually ask:

- *What fragrance is this?* Photograph a bottle; [ScentLens](https://github.com/bhnsadhu/scent-lens) identifies it, or says it isn't sure.
- *What can I learn about it?* Read its catalog profile, open note explanations, follow a note into other fragrances, and use the fragrance guide to understand the terminology.
- *What would I like?* Recommendations from your favourites, ratings and notes, each with the evidence behind it.
- *What smells like my favourite?* Similar fragrances by shared notes, accord family and character, with a side-by-side comparison.
- *How do I organise my collection?* Owned, tried and wishlist shelves, ratings and favourites, and a summary of what your shelves say.

It works without an account; signing in keeps your collection on every device.

## What's in it

| Area | What it does |
|---|---|
| Catalog | 24,642 fragrances, 1,255 brands, 285 notes. Text metadata only (see [Data](#data)). |
| Reference | Fragrance profiles, a searchable note library, 24 concise note definitions, family context and a guide to fragrance terminology. Sources and scope: [docs/FRAGRANCE-REFERENCE.md](docs/FRAGRANCE-REFERENCE.md). |
| Search | Postgres `pg_trgm` fuzzy search on brand and name (typos, word order, accents) with filters for accord family, facet, catalog family, notes to include or exclude, and gender label. |
| Recommendations | Explainable content-based engine in TypeScript: IDF-weighted note vectors, accord and family overlap, similarity to your nearest favourite, and a personalized PageRank walk over the fragrance-note graph. Diversified with MMR. Evaluated offline against ablations ([docs/EVALUATION.md](docs/EVALUATION.md)). |
| Collections | Shelves, 1 to 5 ratings, favourites. Guests keep them in local storage; on sign-in they merge into the account. Ratings change later recommendations. |
| Scanner | Server-side client for the ScentLens `/identify` API with image validation, Postgres-backed daily quotas, concurrency leases and a result cache. Live, with daily caps sized to a $1/month compute budget ([COSTS.md](COSTS.md)). |
| Accounts | Better Auth (email and password, optional GitHub), rate limited, with full account deletion. |

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM · Postgres (Neon in production, PGlite locally) · Better Auth · Vitest · Playwright · Vercel Hobby.

## Architecture

```
Browser ──► Next.js on Vercel
             ├─ Server components: catalog pages, cached with "use cache"
             ├─ /api/recommendations ─► in-memory catalog index ─► recommender (src/lib/reco)
             ├─ /api/scan ─► validate ─► cache ─► slot lease ─► quota ─► ScentLens on Modal
             ├─ Server actions: collection and profile writes (session user only)
             └─ Better Auth
                     │
                     ▼
                Postgres (Neon): catalog, users, collections, profiles, scan counters
```

More in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Running it locally

Requirements: Node 22+. No Docker or cloud accounts.

```bash
npm install
cp .env.example .env            # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
npm run db:server               # local Postgres (PGlite) on :5433; keep it running
npm run db:migrate
npm run db:seed                 # reads the ScentLens export; see SCENTLENS_PRODUCTS_CSV
npm run dev
```

The seed reads `products.csv` from a local ScentLens checkout (`artifacts/export/products.csv`); the file is not redistributed here.

## Tests

```bash
npm run typecheck && npm run lint
npm test             # unit + integration (in-memory Postgres per run)
npm run test:e2e     # Playwright, desktop and mobile; scanner mocked, never calls ScentLens
npm run build
npx tsx scripts/evaluate-reco.ts   # offline recommender evaluation
```

## Data

The catalog is the Hugging Face dataset `doevent/perfume`, cleaned by ScentLens. Its image and description rights are not verified, so Accord uses only text metadata and shows no catalog photos or descriptions; bottles are drawn as smelling strips coloured by accord family. There are no prices, reviews, popularity or ratings beyond your own, and none are implied.

## Deployment

Vercel Hobby (Git-connected: every push to `main` deploys production) with Neon Free provisioned through the Vercel Marketplace, served at `accord.bhanusadhu.com`. Migrations and the catalog seed run from a local machine against the unpooled Neon URL (`vercel env pull`). Costs and limits: [COSTS.md](COSTS.md).

## Known limitations

- Notes are listed as the catalog gives them, without top/heart/base layers.
- Recommendation quality is evaluated offline on a proxy task; there is no real-user data yet.
- Scanning is capped at a few scans a day to stay within a $1/month free compute budget; a cold ScentLens container takes up to a minute.
- Flankers missing from the catalog can be identified as a catalog sibling (a documented ScentLens limit).

## Credits

- Recognition: [ScentLens](https://github.com/bhnsadhu/scent-lens), a separate project.
- Similarity and graph recommendation methods adapted from [Fragrance DNA](https://github.com/mikeyoknow/fragrance-dna) (MIT). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
