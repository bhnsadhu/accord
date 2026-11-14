# External fragrance data feasibility

Checked: 2026-11-13, America/Chicago. Status: initial feasibility investigation and ten-record ScentRev comparison inspected. Production integration remains unresolved; direct access was blocked and some validation checks remain unperformed.

## Objective

Revisit the ratings, wear reports, seasonal guidance, similarity reports, reviews and popularity features retired on 2026-11-08. The first deliverable is a source-backed restoration plan. This investigation does not reactivate public community features or import data into production.

## Evidence standard

Distinguish downloaded records, documented API capabilities and unverified provider claims. A public endpoint is not by itself a reuse license. External ratings and votes must retain their source, scale, sample size and observation date; they must not become Accord member activity. Editorial guidance, predicted attributes and community measurements are different kinds of evidence.

## Recommendation

No tested source currently supports restoring the full community feature set under Accord's existing free-operation and evidence requirements. This is a bounded finding, not a claim that no suitable source exists. Do not reactivate the legacy community UI with third-party values.

ScentRev is now the strongest tested candidate for attributed ratings and wear statistics: its signed-in Playground returned all ten requested comparison records with rating, longevity, sillage and seasonal metrics plus positive record counts. This establishes available response data, not independently verified community measurements. Direct MCP initialization remains blocked, concentration is not a dedicated response field, and source dates and the upstream community are absent. Resolve those limits before an Accord integration. Noteboxd remains a paid alternative with short retention windows.

The [machine-readable audit](research/source-audit-2026-11-13.json) records the downloaded snapshot, ten sample lookups, observed failures and the limits of the checks. Provider claims below are distinguished from tested responses.

## Verified sources

### Existing open dataset

The [Scento dataset](https://github.com/Scento-com/perfume-dataset) is published under [CC BY 4.0](https://github.com/Scento-com/perfume-dataset/blob/main/LICENSE). A fresh download on the check date resolved to the same revision already used by Accord: `086769ecf1add770ea6646bd4d88d39f0e7cddeb`. The JSONL SHA-256 is `695d9e7b5a61bb482ab84e04ae82806ca684bd26fab95b2c8e2931b6d561dfe2`.

Inspection found 1,479 rows. Every row contains season and time-of-day suggestions; 613 contain a popularity rank. There are no rating, review, longevity or sillage fields. The popularity rank is not accompanied by votes, a time series or a documented measurement method.

Matching source URLs already recorded in Accord's research manifest finds 597 existing links, including 595 entries without wear guidance. These are candidates for editorial seasonal guidance, subject to edition and quality review. This count is not a new exact-edition validation or a claim of community consensus. No new catalog identities were matched or created.

Quality check: all rows use only four combinations of seasons and times. Of these, 1,377 rows, or 93.1%, say day/evening. This establishes low variation, not how the publisher generated the values. Broad import would add little fragrance-specific evidence. Keep this as attributed editorial guidance for a reviewed subset, not votes or an occasion-confidence score.

### Perfume Picks: live checks

The publisher's [documented MCP interface](https://github.com/bguillow-rgb/perfume-picks-mcp) answered without a key. Initialization reported server version 1.0.6. Its response attribution permits quotation with credit; that does not establish permission for a wholesale catalog mirror. No private endpoint was reverse engineered.

Ten illustrative name lookups returned ten records; nine supplied longevity and sillage values. None supplied vote counts, rating averages or written reviews. Three concrete identity problems need attention:

| Query | Observed result | Assessment |
| --- | --- | --- |
| Bleu de Chanel Eau de Parfum | Chanel No 5 L'Eau | Wrong fragrance from the name resolver. Follow-up brand-filtered search found Bleu entries, so this is not evidence of complete catalog absence. |
| Dior Sauvage Eau de Parfum | Generic Sauvage, concentration `cologne` | Cannot accept as an exact EDP match. Follow-up search retained this labeling. |
| Layton | Concentration `cologne` | Conflicts with the [house's Eau de Parfum listing](https://us.parfums-de-marly.com/products/layton). |

The live trends call used wardrobe additions over 30 days, but its top three counts were only 2, 1 and 1. Similarity returned a bundle listing. Dupes included editorial, community, clone-house and seed labels without supporting vote counts. These are observed responses, not a catalog-wide accuracy estimate. Recommendation: do not import these scores or publish them as community consensus.

### Documented API candidates

| Provider | Relevant documented capabilities | Access and unresolved points |
| --- | --- | --- |
| [Noteboxd](https://developers.noteboxd.com/) | Community scores, moderated reviews, trending and similar fragrances | Public v2 OpenAPI fetched successfully; no authenticated fragrance responses tested. [API terms](https://www.noteboxd.com/legal/api-terms) specify 50 calls/day for free evaluation, zero distinct review allowance, 24-hour catalog caching and one-hour wear-stat caching. Permanent embedding requires an enterprise agreement. A paid trial starts with a $25 balance top-up; Starter is $49/month. Poor fit for a permanent free import. |
| [ScentRev](https://mcp.scentrev.com/docs) | Normalized wear metrics, seasons, community scores, similarities and per-metric `n_records` | [Published access](https://mcp.scentrev.com/perfume-mcp) is temporarily free, 300 calls/day and 1,500/week, with a key or OAuth. Direct initialization returned Cloudflare 403/1010. The signed-in Playground returned ten inspected comparison records with ratings and wear counts. Projection is explicitly derived from sillage. Source dates and upstream provenance remain absent. [API-specific terms](https://mcp.scentrev.com/terms) offer MCP/REST access and prohibit bulk extraction and a directly competing dataset. Cache duration and upstream community are not specified. |
| [Fragella](https://api.fragella.com/docs.html) | Weighted ratings, performance descriptors, season and occasion rankings, similarity | Key required; [pricing](https://api.fragella.com/#pricing) lists 20 requests/month free and Basic at $12/month. The provider says its model fills missing performance values; no per-field observed/predicted distinction was established in this review. [Terms](https://api.fragella.com/terms-of-use.html) restrict large-scale caching. Not a verified community-vote source. |
| [FragDB](https://fragdb.net/api) | Rating and vote fields, performance votes, related fragrances; separate review datasets | Minimum API top-up $100, with $100 minimum spend per 180 days. Full records cost $0.01 each at listed unit prices. Its [sample license](https://github.com/FragDB/fragrance-database/blob/main/LICENSE.md) is CC BY-NC 4.0 despite an MIT statement in the README license section; code examples are MIT. [Terms](https://fragdb.net/legal) allow local storage but prohibit a competing data service. Paid and not selected; upstream reuse rights remain unverified. |
| [ScentVerdict](https://scentverdict.com/connect) | Editorial verdicts, modeled drydown, similarity and contextual recommendations | Public keyless MCP is documented, but initialization returned HTTP 403 in this environment. No product response was verified and no bypass was attempted. Editorial output is not community votes. |

These sources publish documented interfaces, so discovering private browser endpoints is unnecessary for them. The user supplied a ScentRev key and an existing signed-in account. This investigation created no account or key and started no paid service.

Some indexed Noteboxd pages still describe v1. The fetched v2 contract and current API terms take precedence for this recommendation. Likewise, provider catalog-size claims were not treated as measured Accord coverage.

### ScentRev trial, 2026-11-13

The [trial record](research/scentrev-trial-2026-11-13.json) separates direct transport checks from the official Playground. Two initialization attempts returned HTTP 403. The second inspected the response and identified Cloudflare error 1010, `browser_signature_banned`, marked non-retryable. Direct requests stopped at that point. No fingerprint, proxy or endpoint bypass was attempted, and no fragrance tool was called through the direct API. This response does not establish whether the key is valid.

The official [Playground](https://mcp.scentrev.com/playground) returned ten records in a single comparison, plus separately inspected Aventus and Santal 33 profile results and a Santal 33 performance response. The comparison supplied positive `n_records` with ratings, longevity, sillage and all four seasons for every record. These were deliberately selected popular fragrances, not a representative coverage or accuracy benchmark.

| Returned fragrance | Rating converted to /5 | Reported rating records | Reported longevity records |
| --- | --- | --- | --- |
| Another 13 | 4.03 | 8,085 | 4,235 |
| Aventus | 4.32 | 26,137 | 16,309 |
| Baccarat Rouge 540 | 3.77 | 27,797 | 15,308 |
| Black Opium | 3.94 | 33,278 | 15,922 |
| Bleu de Chanel Eau de Parfum | 4.43 | 20,712 | 14,058 |
| Layton | 4.45 | 17,154 | 11,532 |
| Light Blue | 3.86 | 35,067 | 13,025 |
| Santal 33 | 3.75 | 12,333 | 6,238 |
| Sauvage Eau de Parfum | 4.21 | 13,645 | 9,837 |
| Tobacco Vanille | 4.19 | 29,694 | 15,270 |

The displayed stars are `score * 5`; they should not be presented as raw vote averages. The two inspected profile rating scales disclose Bayesian smoothing with `m=50, C=0.80`; their values agree with the comparison. The comparison itself does not repeat the smoothing explanation. All ten projection objects exactly repeat sillage and say `derived_from: sillage`. Treat projection as derived, not another independent measurement. Wear scores are normalized axes, not hours or distances.

Identity checks are promising but incomplete. Sauvage EDP and Bleu de Chanel EDP appear explicitly in returned names, with 2018 and 2014 release years respectively. Light Blue returns the original 2001 female fragrance, rather than the previously observed generic 2007 result from another provider. Nine normalized name/brand pairs match existing Accord research entries. No response has a separate concentration field, and no mapping has been approved for import. Search also distinguishes Santal 33 perfume oil and multiple Aventus editions; never join only on a loose base name.

The sample raises specific provenance questions. All 40 seasonal counts and all ten written-review counts are multiples of 100. This does not establish whether they are rounded, estimated or generated, but exact voter counts should not be claimed without clarification. None of the ten records identifies the source community or a source observation date. A fetch timestamp would only record retrieval, not the age of the votes.

The default Santal 33 full-profile request returned only `identity`; the dedicated performance tool and comparison did expose wear data. Do not infer that wear data is absent from the catalog or that every full-profile request omits it. No low-vote or nonexistent-fragrance response was inspected. An Aventus similarity recipe was initiated but its result was not inspected, so no similarity-quality claim follows. Written review text was not fetched. Successful Playground requests do not validate the bearer key or establish that an Accord backend can call the API.

The API-specific terms were located during this trial. They describe programmatic MCP and REST access, forbid bulk scraping and directly competing datasets, and specify no cache duration. They also retain a template notice. These are the relevant service-specific terms for this evaluation; the separate retail website terms do not establish API permissions. Neither identifies an upstream community or source-data provenance. A future integration should be a limited, attributed lookup rather than a catalog import, subject to resolving the intended use with the provider.

### Previously excluded sources

[Fragrantica's terms](https://www.fragrantica.com/terms-of-service.phtml), section 5.3, explicitly cover internal JSON, GraphQL and search endpoints and require written authorization for automated extraction. Reverse API discovery does not resolve that condition. The earlier Parfumo and Basenotes access findings do not establish a reusable feed; a new source must be assessed on its own evidence.

## Feature decisions

| Requested feature | Current outcome | Concrete next step |
| --- | --- | --- |
| Ratings with sample counts | Present in ten ScentRev records; integration unresolved | Resolve backend access, edition mappings and count provenance. Preserve source, normalized scale and smoothing; never treat imported records as Accord votes. |
| Longevity and projection | Longevity and sillage present; projection derived | All ten projection objects copy sillage explicitly. Use the source scale and reported count; do not add independent projection statistics or convert scores to hours. |
| Seasonal and occasion guidance | ScentRev season scores present; count interpretation unresolved | Clarify the rounded-looking counts and source method. Scento remains an editorial option, not community voting. Occasion coverage was not established. |
| Community-supported similar fragrances | Not ready | Require a source with an explicit basis for each relationship. Keep Accord's existing note-based similarity clearly described as such. |
| Popularity and trending | Not ready | Require a defined population, observation window and meaningful activity counts. A static popularity rank is not a live trend. |
| Written reviews | Not ready | Noteboxd documents a paid review API, but its free review allowance is zero and review caching is limited to six hours. Verify redistribution and attribution requirements before any trial. |

## Proposed next checkpoint

The ten-record comparison is inspected. The next useful work is to resolve backend access and the evidence questions below, rather than enlarge the sample of popular fragrances. No vendor has been contacted.

1. Does an attributed, on-demand lookup inside Accord fit the API terms, and what cache duration and attribution should it use? How should a normal backend client resolve the observed Cloudflare 1010 block?
2. Which community supplies each metric? Does `n_records` count unique votes, source rows or aggregated records? Why are all 40 inspected seasonal counts and all ten written-review counts multiples of 100?
3. Can any field be predicted, seeded or rounded? How is that marked? Is the rating smoothing disclosed by full profiles also applied throughout comparison results?
4. Are source observation dates and concentration-specific metadata available? What happens after the temporary free period?

If these points are resolved, the first implementation should be a small server-side preview on reviewed existing Accord identities: an attributed rating, longevity, sillage and seasonal guidance, with clear missing-data and provider-failure behavior. Fetch on demand within the free allowance; do not mirror the catalog or expose the key in the browser. Test a low-vote record, a nonexistent slug and any intended similarity response before publishing. Reviews and live popularity remain separate unvalidated features.

## Verification and scope

The Scento snapshot was downloaded and parsed, its hash compared with `data/research/note-stage-import.json`, and its source URLs joined to `data/research/fragrances.json`. Perfume Picks received 15 read-only tool calls after discovery, including ten detail lookups; selected observed fields and failures are recorded in the audit JSON. Provider documentation was checked separately. The ScentRev direct transport and Playground checks are recorded separately. Eight tool requests were initiated through the Playground; seven showed HTTP 200, six had at least some result content inspected, and the last similarity request was not inspected. The comparison payload was exported through the official Copy Markdown control to a private local scratch file. The committed trial includes selected numeric evidence and identity metadata, with descriptions and raw review text excluded. No credentials, raw third-party reviews or network captures are committed. The supplied key is stored only in an ignored local environment file with owner-only permissions. No reverse API capture or model generation ran. Application code, schemas and production data are unchanged.
