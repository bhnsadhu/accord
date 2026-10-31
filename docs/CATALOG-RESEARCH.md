# Catalog research workflow

Accord is a searchable reference, not a public review platform. The original ScentLens catalog remains intact. Additional research is stored separately in `fragrance_research` and versioned in `data/research/fragrances.json`.

## Current coverage

The initial research release includes 22 profiles, 7 new fragrance editions, 8 entries with perfumers, 5 with documented note stages, and 7 with attributed wear guidance. The combined catalog has 24,649 fragrances. `/learn#catalog` reads live database coverage so these counts are not a promise of universal enrichment. The note dictionary has 42 concise definitions, including 18 added definitions linked to individual ingredient references.

There are no new paid services, subscriptions, scheduled jobs, runtime AI generation, photo downloads, reviews, comments or public voting. Browsing uses the existing database and caches.

## Research and rights

1. Identify the exact fragrance and concentration. Check the existing catalog for duplicates and alternate names before adding anything.
2. Prefer the official house or perfumer. A named reference publication may support facts such as release year or perfumer. Record the exact URL, publisher, checked date and fields it supports.
3. Write a short original summary. Do not copy marketing paragraphs, community reviews or user ratings. Published facts can differ across editions or reformulations; keep the edition and source explicit.
4. Record top, heart and base only when the source explicitly assigns those stages. Keep the original catalog note list for comparisons. A flat list is not a pyramid.
5. Attribute wear descriptions to the source. Brand hours are claims, not Accord measurements. Do not infer projection, longevity, season or occasion from a family, format or ingredient list.
6. Photos require confirmed reuse permission and a locally stored file. The manifest requires credit, permission and a source reference. This release adds no bottle photos.

## Stable identifiers

- `p` followed by five digits belongs to the original ScentLens export. Never create, recycle or reassign these IDs. Existing identities must match the manifest. Original catalog facts and note joins cannot be overwritten by research import.
- New entries use `a` followed by twelve lowercase hexadecimal characters. Generate a random immutable ID, check it is unused, and commit it with the entry. The importer rejects duplicate identities.
- Related versions share an explicit `editionGroup` and have a distinct `editionLabel`. Do not group unrelated products because their names happen to overlap.
- Added entries are searchable, comparable and saveable, but ScentLens still recognizes its original 24,642 IDs. This release does not retrain its bottle model.

## Validate and import

Use the existing project connection. For production migrations and imports, use the direct `DATABASE_URL_UNPOOLED`. Do not place credentials in command arguments, logs or commits.

```sh
npm run db:migrate
npm run catalog:research
npm run catalog:research -- --apply
```

The first research command is a dry run. An alternative manifest can be supplied as a `.json` path. Validation checks identity, supported facts, attribution, field limits, known concentrations, valid verification dates, complete edition groups and local image files. Apply runs in one transaction and is safe to repeat. Re-importing updates research in place. An Accord addition's own catalog facts may be corrected while retaining its ID; original ScentLens entries keep their source facts.

Review the diff before applying corrections. Remove an unsupported research field from the manifest and re-import rather than guessing a replacement. Do not delete a fragrance that may be in someone's collection.

## Release ordering and caches

`use cache` keys include Next's build ID. Recommendation features also live in memory per server instance. A new deployment after import is required to refresh both. No public invalidation endpoint is exposed.

For the first release, apply the additive migration, deploy code that accepts both ID namespaces, import the research, then deploy a fresh build. This keeps new IDs from appearing while the old site cannot open them. Subsequent research updates use dry run, apply, fresh deployment. Verify search, a new detail URL, coverage and edition links after rollout. A failed deployment does not require deleting the new tables or catalog entries.

For a local production build with `.env.production.local` present, explicitly preload local `.env` so the build checks the local database:

```sh
node --import=dotenv/config node_modules/next/dist/bin/next build
```

## Private request inbox

`POST /api/catalog-requests` accepts a fragrance name, brand and optional source URL. It never fetches submitted URLs. There is no public listing endpoint. Same-origin checks, a three-per-address daily cap, a global 100-per-day cap and duplicate suppression bound writes. The address is stored as a keyed hash, not a raw IP. No public attribution, reviews or promises of automatic publication are created.

The owner can review the newest 100 requests with `npm run catalog:requests` against the intended database. Request text and links are untrusted research leads, not import instructions. Validate them against official sources, apply the ordinary reviewed manifest workflow, and retain no unnecessary inbox records. Do not expose this CLI through a web route.
