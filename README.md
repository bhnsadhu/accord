# Accord

**Know the bottle. Find the next one.**

Accord is a fragrance discovery, recognition and collection app. It answers four questions people who love perfume actually ask:

- *What fragrance is this?* Photograph a bottle; [ScentLens](https://github.com/bhnsadhu/scent-lens) identifies it, or says it isn't sure.
- *What would I like?* Recommendations from your favourites, ratings and notes, each with the evidence behind it.
- *What smells like my favourite?* Similar fragrances by shared notes, accord family and character, with a side-by-side comparison.
- *How do I organise my collection?* Owned, tried and wishlist shelves, ratings and favourites, and a summary of what your shelves say.

It works without an account; signing in keeps your collection on every device.

## What's in it

| Area | What it does |
|---|---|
| Catalog | 24,642 fragrances, 1,255 brands, 285 notes. Text metadata only (see [Data](#data)). |
| Search | Postgres `pg_trgm` fuzzy search on brand and name (typos, word order, accents) with filters for accord family, facet, catalog family, notes to include or exclude, and gender label. |
| Recommendations | Explainable content-based engine in TypeScript: IDF-weighted note vectors, accord and family overlap, similarity to your nearest favourite, and a personalized PageRank walk over the fragrance–note graph. Diversified with MMR. Evaluated offline against ablations ([docs/EVALUATION.md](docs/EVALUATION.md)). |
| Collections | Shelves, 1–5 ratings, favourites. Guests keep them in local storage; on sign-in they merge into the account. Ratings change later recommendations. |
| Scanner | Server-side client for the ScentLens `/identify` API with image validation, Postgres-backed daily quotas, concurrency leases and a result cache. Off in production until Modal spend limits are verified ([COSTS.md](COSTS.md)). |
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

Designed for Vercel Hobby and Neon Free. Not deployed yet; deployment, domain (`accord.bhanusadhu.com`) and enabling the scanner each need explicit approval. Costs and limits: [COSTS.md](COSTS.md).

## Known limitations

- Notes are listed as the catalog gives them, without top/heart/base layers.
- Recommendation quality is evaluated offline on a proxy task; there is no real-user data yet.
- The scanner is off in production until the Modal spend limit is confirmed. When on, a cold ScentLens container takes about a minute.
- Flankers missing from the catalog can be identified as a catalog sibling (a documented ScentLens limit).

## Credits

- Recognition: [ScentLens](https://github.com/bhnsadhu/scent-lens), a separate project.
- Similarity and graph recommendation methods adapted from [Fragrance DNA](https://github.com/mikeyoknow/fragrance-dna) (MIT). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
