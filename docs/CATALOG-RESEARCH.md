# Catalog research workflow

Accord is a searchable reference, not a public review platform. The original ScentLens catalog remains intact. Additional research is stored separately in `fragrance_research` and versioned in `data/research/fragrances.json`.

## Current coverage

The current research release includes 35 profiles, 19 new fragrance editions, 12 entries with perfumers, 11 with documented note stages, and 9 with attributed wear guidance. The combined catalog has 24,661 fragrances. The 2026-11-04 release added Moroccanoil Lumière du Jour from the private request inbox and 9 notable 2025 and 2026 launches missing from the source data, which ends in early 2024. New additions must carry at least a sourced summary, concentration, family and release year, like earlier additions. `/learn#catalog` reads live database coverage so these counts are not a promise of universal enrichment. The note dictionary has 42 concise definitions, including 18 added definitions linked to individual ingredient references.

There are no new paid services, subscriptions, scheduled jobs, runtime AI generation, third-party image fetches, reviews, comments or public voting. Browsing uses the existing database and caches.

## Research and rights

1. Identify the exact fragrance and concentration. Check the existing catalog for duplicates and alternate names before adding anything.
2. Prefer the official house or perfumer. A named reference publication may support facts such as release year or perfumer. Record the exact URL, publisher, checked date and fields it supports.
3. Write a short original summary. Do not copy marketing paragraphs, community reviews or user ratings. Published facts can differ across editions or reformulations; keep the edition and source explicit.
4. Record top, heart and base only when the source explicitly assigns those stages. Keep the original catalog note list for comparisons. A flat list is not a pyramid.
5. Attribute wear descriptions to the source. Brand hours are claims, not Accord measurements. Do not infer projection, longevity, season or occasion from a family, format or ingredient list.
6. Photos require confirmed reuse permission and a locally stored file. The manifest requires credit, permission and a source reference. The separate media manifests cover all catalog notes and additional researched note names with photos, molecular diagrams or labeled visual references. See [IMAGERY.md](IMAGERY.md) for exact-edition matching, licenses, credits and the local asset workflow.

### Santal 33 note stages, 2026-11-08

Le Labo's product description supplies a flat set of featured notes. [Liberty's Santal 33 Eau de Parfum listing](https://www.libertylondon.com/us/santal-33-eau-de-parfum-100ml-1001225081.html) explicitly assigns top, heart and base stages, which are now displayed with Liberty identified as the retailer source. The original Le Labo description and catalog note associations are retained. Violet Accord links to the violet reference, and Papyrus has its own licensed photograph with a library link because it has no catalog article yet.

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

## Source-access review, 2026-11-08

The owner requested existing sources before removing community-dependent features. The bounded review found:

- [Fragrantica’s published terms](https://www.fragrantica.com/terms-of-service.phtml) require written authorization for automated access and reuse. No authorized API or agreement is configured here. No Fragrantica data was imported.
- A direct Parfumo Santal 33 request returned HTML, but the next request returned HTTP 403. No reliable unattended feed or reuse agreement was established. No Parfumo content was imported, and no access controls were bypassed.
- Public dataset and API candidates surfaced in search, but none established a reliable, reusable feed for member reviews, ratings, shelf counts or votes within this project’s existing access and budget. This review does not claim such a source can never be obtained.
- [Scento’s public API](https://www.scento.com/developers/perfume-api) answered without a key. Its [API terms](https://www.scento.com/terms-of-service#perfume-api) allow reference lookups and tools, prohibit wholesale competing-catalog copies, and request reasonable use. Six exact-name lookups were evaluated. Two exact name, house and concentration matches, Santal 33 and Another 13, add a short attributed seasonal/time-of-day summary to the existing research manifest. The other responses were not imported. These are editorial suggestions, not measured performance, ratings or votes.

No external API runs during a page view. The two reviewed additions use the existing manifest validation and import process. Future updates should repeat the exact-edition/source check and update the checked date. Unsupported wear sections are omitted, while existing brand wear guidance remains attributed.

## Retired request inbox

The request form was removed on 2026-11-08 because it leaves visitors waiting for manual review. `POST /api/catalog-requests` now returns HTTP 410 and never writes a submission. The owner’s `npm run catalog:requests` command remains available for retained historical requests, which expire through the existing maintenance job. Existing request text and links remain untrusted research leads, not import instructions. Do not expose that CLI through a web route.
