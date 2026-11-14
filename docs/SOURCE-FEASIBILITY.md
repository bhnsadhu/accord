# External fragrance data feasibility

Checked: 2026-11-13. Status: investigation in progress.

## Objective

Revisit the ratings, wear reports, seasonal guidance, similarity reports, reviews and popularity features retired on 2026-11-08. The first deliverable is a source-backed restoration plan. This investigation does not reactivate public community features or import data into production.

## Evidence standard

Distinguish downloaded records, documented API capabilities and unverified provider claims. A public endpoint is not by itself a reuse license. External ratings and votes must retain their source, scale, sample size and observation date; they must not become Accord member activity. Editorial guidance, predicted attributes and community measurements are different kinds of evidence.

## First verified checkpoint

### Existing open dataset

The [Scento dataset](https://github.com/Scento-com/perfume-dataset) is published under [CC BY 4.0](https://github.com/Scento-com/perfume-dataset/blob/main/LICENSE). A fresh download on the check date resolved to the same revision already used by Accord: `086769ecf1add770ea6646bd4d88d39f0e7cddeb`. The JSONL SHA-256 is `695d9e7b5a61bb482ab84e04ae82806ca684bd26fab95b2c8e2931b6d561dfe2`.

Inspection found 1,479 rows. Every row contains season and time-of-day suggestions; 613 contain a popularity rank. There are no rating, review, longevity or sillage fields. The popularity rank is not accompanied by votes, a time series or a documented measurement method.

Matching source URLs already recorded in Accord's research manifest finds 597 existing links, including 595 entries without wear guidance. These are candidates for editorial seasonal guidance, subject to edition and quality review. This count is not a new exact-edition validation or a claim of community consensus. No new catalog identities were matched or created.

### Documented API candidates

| Provider | Relevant documented capabilities | Access and unresolved points |
| --- | --- | --- |
| [Noteboxd](https://developers.noteboxd.com/) | Community scores, moderated reviews, trending and similar fragrances | Bearer key and verified email. Free plan advertises 50 calls/day for prototyping and evaluation. Record coverage, developer terms and production suitability remain to be checked. |
| [ScentRev](https://mcp.scentrev.com/) | Normalized wear metrics, seasons, community scores and similarities | Key or OAuth. Advertises a temporary free period. Source provenance, licensing and actual responses remain unverified. Homepage samples are not live test results. |
| [Fragella](https://api.fragella.com/docs.html) | Weighted ratings, performance descriptors, season and occasion rankings, similarity | Key required; [free tier](https://api.fragella.com/#pricing) has 20 requests/month. [Terms](https://api.fragella.com/terms-of-use.html) restrict large-scale caching. Need to distinguish observed and predicted values and establish usable vote counts. |
| [FragDB](https://fragdb.net/api) | Rating and vote fields, performance votes, related fragrances; separate review datasets | Paid production access. Its [sample license](https://github.com/FragDB/fragrance-database/blob/main/LICENSE.md) is CC BY-NC 4.0, despite an MIT claim in the README's license section. Code examples are MIT. Data provenance and the application terms need separate review. |

These sources publish documented interfaces, so discovering private browser endpoints is unnecessary for them. No account, API key, subscription or purchase has been created.

### Previously excluded sources

[Fragrantica's terms](https://www.fragrantica.com/terms-of-service.phtml), section 5.3, explicitly cover internal JSON, GraphQL and search endpoints and require written authorization for automated extraction. Reverse API discovery does not resolve that condition. The earlier Parfumo and Basenotes access findings do not establish a reusable feed; a new source must be assessed on its own evidence.

## Remaining investigation

1. Inspect public API contracts and terms for the strongest community-data candidates.
2. Check representative fragrance identities and distinguish real response evidence from documentation examples.
3. Review the quality of the existing seasonal suggestions before proposing a batch import.
4. Produce a final feature matrix with a source, cost, coverage and next action for each proposed restoration.

## Verification and scope

The Scento snapshot was downloaded and parsed, its hash compared with `data/research/note-stage-import.json`, and its source URLs joined to `data/research/fragrances.json`. Provider documentation was read separately. Raw third-party reviews, credentials and network captures are not stored in this repository. Application code, schemas and production data are unchanged.
