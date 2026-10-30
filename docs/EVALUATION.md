# Evaluation

All numbers here come from scripts in this repo, run on the local catalog. Nothing is estimated.

## Recommendation engine — offline line hold-out

**Script:** `npx tsx scripts/evaluate-reco.ts` (deterministic seed 42, 300 trials).

**Why a proxy:** Accord has no real interaction data yet, so there is no ground truth for "would this person enjoy this". Collaborative filtering is deliberately not used for the same reason.

**Task:** a *line* is a brand plus the first meaningful word of the name (Chanel *Chance*, Dior *Sauvage*); 631 lines have ≥ 5 members. A simulated person likes four fragrances from one line (weight 1 each). We hide a fifth and record its rank among all ~24.6k fragrances they have not collected. Brand and name are never inputs to the recommender, so the task does not reward reading the label. Flankers usually share notes and accords, which a good taste model should pick up.

**Limits:** flankers are only a proxy for taste. Some lines are loosely related (a "Rose" in many brands' names, reformulations), so absolute hit rates are low and should be read comparatively. Results do not measure enjoyment.

Run of 2026-10-30, catalog of 24,642 fragrances:

| Variant | Hit@24 | Hit@100 | MRR | Median rank |
|---|---|---|---|---|
| Random order | 0.3% | 0.3% | 0.000 | 12713 |
| Same family only | 0.0% | 1.7% | 0.001 | 5293 |
| Notes only (IDF cosine) | 9.7% | 14.3% | 0.054 | 3776 |
| Graph walk only (PPR) | 4.0% | 8.3% | 0.010 | 3298 |
| Nearest liked only | 8.7% | 14.0% | 0.067 | 3461 |
| First blend (no neighbor term) | 9.0% | 14.0% | 0.043 | 3549 |
| Shipped blend without graph | 12.0% | 16.3% | 0.070 | 2820 |
| **Shipped blend** | **12.0%** | **16.3%** | **0.069** | **2717** |

Shipped weights: notes 0.40, nearest liked 0.40, graph 0.10, accords 0.05, family 0.05.

**Findings**
- Every content signal beats random by a wide margin; family alone is too coarse (7 families over 24k items).
- The first blend I wrote (no nearest-neighbour term) was *worse* than notes alone at the top of the list. Adding similarity to the single closest liked fragrance gave the biggest gain (Hit@24 9.0% → 12.0%), so it shipped.
- The graph walk adds little at the top (Hit@24 unchanged) and modestly improves the median rank (2820 → 2717). It is kept at a small weight because it also lets explicitly liked notes spread to co-occurring notes for people with no rated fragrances, which this task does not test.
- Latency: ~40 ms per full ranking of 24.6k fragrances on a laptop (Node, single thread).

## Unit tests

`src/lib/reco/reco.test.ts` covers similarity properties, IDF weighting, cold start, preference sensitivity (different notes → disjoint top lists), disliked-note exclusion, collection exclusion, rating-driven re-ranking, evidence-based explanations, brand diversity, gender filtering and graph diffusion on a synthetic catalog.

## ScentLens integration

**Live check, 2026-10-30** (authorized single call, production `https://accord.bhanusadhu.com/api/scan`):

| Item | Value |
|---|---|
| Photo | ScentLens real-photo set `b058__clean__2`, resized on this machine to ≤ 1024 px JPEG (112 KB), as the browser does |
| Result | `answered: true`, reason `confident`, confidence 0.999, `product_id` p14603 — Les Eaux Primordiales *Vanille Supermassive* |
| Ground truth | ScentLens `data/real/labels.csv`: b058 → p14603. Match. |
| Latency | 21.6 s end to end (container waking); ScentLens reported 5.6 s inside the model |
| Quota | Guest daily allowance went 1 → 0 as designed |

This verifies the contract (request format, response schema, id mapping to Accord's catalog, quota accounting). It is **not** an accuracy measurement: one photo, taken from ScentLens's own development photos. Accuracy figures belong to ScentLens and are documented in its repository.
