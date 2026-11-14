# External fragrance data feasibility

Checked: 2026-11-13, America/Chicago. Status: initial feasibility investigation complete. The ScentRev trial has started but remains incomplete; direct access was blocked and one official Playground recipe returned HTTP 200.

## Objective

Revisit the ratings, wear reports, seasonal guidance, similarity reports, reviews and popularity features retired on 2026-11-08. The first deliverable is a source-backed restoration plan. This investigation does not reactivate public community features or import data into production.

## Evidence standard

Distinguish downloaded records, documented API capabilities and unverified provider claims. A public endpoint is not by itself a reuse license. External ratings and votes must retain their source, scale, sample size and observation date; they must not become Accord member activity. Editorial guidance, predicted attributes and community measurements are different kinds of evidence.

## Recommendation

No tested source currently supports restoring the full community feature set under Accord's existing free-operation and evidence requirements. This is a bounded finding, not a claim that no suitable source exists. Do not reactivate the legacy community UI with third-party values.

The ScentRev trial is now in progress using a user-supplied key and the user's signed-in official Playground. Direct MCP initialization hit a traffic-filter block before key validity could be established. The Playground returned an Aventus profile, but its metric payload has not yet been inspected. This is evidence of access through the web interface, not a successful ten-fragrance evaluation. Noteboxd remains a paid alternative with short retention windows.

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
| [ScentRev](https://mcp.scentrev.com/docs) | Normalized wear metrics, seasons, community scores, similarities and per-metric `n_records` | [Published access](https://mcp.scentrev.com/perfume-mcp) is temporarily free, 300 calls/day and 1,500/week, with a key or OAuth. Direct initialization returned Cloudflare 403/1010. One signed-in Playground profile returned HTTP 200; metric inspection is pending. [API-specific terms](https://mcp.scentrev.com/terms) offer MCP/REST access and prohibit bulk extraction and a directly competing dataset. Cache duration and upstream community are not specified. |
| [Fragella](https://api.fragella.com/docs.html) | Weighted ratings, performance descriptors, season and occasion rankings, similarity | Key required; [pricing](https://api.fragella.com/#pricing) lists 20 requests/month free and Basic at $12/month. The provider says its model fills missing performance values; no per-field observed/predicted distinction was established in this review. [Terms](https://api.fragella.com/terms-of-use.html) restrict large-scale caching. Not a verified community-vote source. |
| [FragDB](https://fragdb.net/api) | Rating and vote fields, performance votes, related fragrances; separate review datasets | Minimum API top-up $100, with $100 minimum spend per 180 days. Full records cost $0.01 each at listed unit prices. Its [sample license](https://github.com/FragDB/fragrance-database/blob/main/LICENSE.md) is CC BY-NC 4.0 despite an MIT statement in the README license section; code examples are MIT. [Terms](https://fragdb.net/legal) allow local storage but prohibit a competing data service. Paid and not selected; upstream reuse rights remain unverified. |
| [ScentVerdict](https://scentverdict.com/connect) | Editorial verdicts, modeled drydown, similarity and contextual recommendations | Public keyless MCP is documented, but initialization returned HTTP 403 in this environment. No product response was verified and no bypass was attempted. Editorial output is not community votes. |

These sources publish documented interfaces, so discovering private browser endpoints is unnecessary for them. The user supplied a ScentRev key and an existing signed-in account. This investigation created no account or key and started no paid service.

Some indexed Noteboxd pages still describe v1. The fetched v2 contract and current API terms take precedence for this recommendation. Likewise, provider catalog-size claims were not treated as measured Accord coverage.

### ScentRev trial, 2026-11-13

The [trial record](research/scentrev-trial-2026-11-13.json) separates direct transport checks from the official Playground. Two initialization attempts returned HTTP 403. The second inspected the response and identified Cloudflare error 1010, `browser_signature_banned`, marked non-retryable. Direct requests stopped at that point. No fingerprint, proxy or endpoint bypass was attempted, and no fragrance tool was called through the direct API. This response does not establish whether the key is valid.

The user's existing signed-in [Playground](https://mcp.scentrev.com/playground) successfully ran its built-in Aventus full-profile recipe and showed HTTP 200 with `creed-aventus`. Detailed JSON payload inspection is still pending. Zero exact editions and zero metric objects have been validated so far. Complete the bounded sample through the supported interface before drawing a data-quality conclusion. A working Playground does not establish that an Accord backend can call the API.

The API-specific terms were located during this trial. They describe programmatic MCP and REST access, forbid bulk scraping and directly competing datasets, and specify no cache duration. They also retain a template notice. These are the relevant service-specific terms for this evaluation; the separate retail website terms do not establish API permissions. Neither identifies an upstream community or source-data provenance. A future integration should be a limited, attributed lookup rather than a catalog import, subject to resolving the intended use with the provider.

### Previously excluded sources

[Fragrantica's terms](https://www.fragrantica.com/terms-of-service.phtml), section 5.3, explicitly cover internal JSON, GraphQL and search endpoints and require written authorization for automated extraction. Reverse API discovery does not resolve that condition. The earlier Parfumo and Basenotes access findings do not establish a reusable feed; a new source must be assessed on its own evidence.

## Feature decisions

| Requested feature | Current outcome | Concrete next step |
| --- | --- | --- |
| Ratings with sample counts | Not ready | Test ScentRev score and `n_records` against exact editions; Noteboxd is a paid alternative. Preserve each provider's scale and source. |
| Longevity and projection | Not ready | Verify measured versus predicted values, scale and sample size in the same trial. A normalized score cannot be converted into hours without evidence. |
| Seasonal and occasion guidance | Limited editorial option | Manually review a small Scento subset. Label the publisher's suggestions; do not fabricate distributions or voter totals. |
| Community-supported similar fragrances | Not ready | Require a source with an explicit basis for each relationship. Keep Accord's existing note-based similarity clearly described as such. |
| Popularity and trending | Not ready | Require a defined population, observation window and meaningful activity counts. A static popularity rank is not a live trend. |
| Written reviews | Not ready | Noteboxd documents a paid review API, but its free review allowance is zero and review caching is limited to six hours. Verify redistribution and attribution requirements before any trial. |

## Proposed next checkpoint

Evaluate ScentRev on the same ten names, with explicit concentration and edition checks. Required evidence: valid sample counts, defined metric scales, observation dates, real missing-value behavior, source provenance, and permission to display and cache the results in Accord. If those conditions fail, do not restore those features from that provider.

The account dependency is resolved. Transport access, the incomplete sample and the following provider questions remain open. No vendor has been contacted. Questions to resolve before production use:

1. Does an attributed, on-demand lookup inside Accord fit the API terms, and what cache duration and attribution should it use? How should a normal backend client resolve the observed Cloudflare 1010 block?
2. Which community supplies each metric, and does `n_records` count unique votes, records or an aggregate across sources?
3. Can any wear or rating field be predicted or seeded? If so, how does the response distinguish that from observed user input?
4. Are source dates and exact concentration-specific identifiers available, and what happens after the temporary free period?

## Verification and scope

The Scento snapshot was downloaded and parsed, its hash compared with `data/research/note-stage-import.json`, and its source URLs joined to `data/research/fragrances.json`. Perfume Picks received 15 read-only tool calls after discovery, including ten detail lookups; selected observed fields and failures are recorded in the audit JSON. Provider documentation was checked separately. The ScentRev direct transport and Playground checks are recorded separately. No credentials, raw third-party reviews or network captures are committed. The supplied key is stored only in an ignored local environment file with owner-only permissions. No reverse API capture or model generation ran. Application code, schemas and production data are unchanged.
