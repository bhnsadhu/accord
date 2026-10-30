# Fragrance reference expansion

## Purpose

Make Accord useful when someone already has a fragrance in mind and wants to understand it. The owner's generated image supplied optional attribute ideas only. The approved paper strips, silver background, typography, Home fan and intro remain the visual authority.

## Research, reviewed 2026-10-30

| Source | Useful pattern | Decision for Accord |
| --- | --- | --- |
| [Parfumo: Santal 33](https://www.parfumo.com/Perfumes/Le_Labo/Santal_33_Eau_de_Parfum) | Identity, notes, perfumer, related fragrances; performance scores show vote counts | Make existing facts easier to read and connect. Do not import community scores or present them as Accord data. |
| [Fragrantica: Santal 33](https://www.fragrantica.com/perfume/Le-Labo/Santal-33-12201.html) | Notes and accords connect to further browsing; brand siblings provide context | Add meaningful note exploration and exact house browsing. No scraped descriptions, photographs, accord-strength bars or copied reviews. |
| [Wikiparfum](https://www.wikiparfum.com/en) | Fragrances, ingredients and brands form a reference network | Make every catalog note addressable and searchable, with a route back to real fragrances. |
| [The Perfume Society: ingredients](https://perfumesociety.org/discover-perfume/an-introduction/ingredients/) | Plain descriptions make note names understandable | 24 concise editorial definitions, totaling fewer than 200 words. These describe notes generally, never their quantity or performance in a specific fragrance. |
| [The Society of Scent: glossary](https://www.thesocietyofscent.com/education/glossary-index/) | Distinguishes notes, accords, drydown and fragrance formats | Short original explanations in the guide. No concentration percentages or fixed note-stage timings. |
| [Michael Edwards: fragrance wheel](https://www.fragrancesoftheworld.com/fragrance-wheel) and [The Perfume Society: families](https://perfumesociety.org/discover-perfume/an-introduction/fragrance-families/) | Families explain relationships between fragrances | Keep the existing fourteen catalog wheel families and colors. Short general descriptions provide orientation, not a new classification algorithm. |
| [The Perfume Society: choosing and wearing fragrance](https://perfumesociety.org/discover-perfume/an-introduction/faq/) | Sampling on paper and skin, checking versions, flexible occasions | Concise practical guidance. Do not assign a season or occasion to a perfume from its notes. |
| [The Perfume Society: language of scent](https://perfumesociety.org/wp-content/uploads/2018/06/SL31.OnlineIssue.pdf) | Sillage as a scent trail | Explain the term separately from longevity and projection. No product-specific values. |

The educational wording is original and concise, with source links on the relevant pages. No competitor assets or product descriptions are redistributed.

## Implemented paths

- `/fragrance/[slug]`: catalog-grounded introduction, separate release year and marketed-as label, existing shelf/rating/favourite controls, expandable note explanations, family context, source disclosure, existing similarity and comparisons, and other fragrances from the same house.
- `/notes`: searchable alphabetical index of every catalog note. Uses real counts and a native GET form. Definitions exist for selected notes only.
- `/notes/[key]`: note identity, available reference description, real catalog examples and full filtered results. Each example explicitly names the selected note. Unknown definitions get an honest fallback; an unknown catalog key is not a made-up entry.
- `/learn`: notes, accords, families, versions, sampling and performance terminology. Native disclosures expose the extra detail without a modal or an account.
- Discover links to notes and the guide; a selected note links back to its reference. Brand links now use the supported exact-brand query and retain that filter through further refinement.

## Data boundaries

The existing catalog remains authoritative for product facts. No database migration, third-party data feed, paid API or runtime generation was added. Introductions assemble only the actual family, character and listed notes. Formats display only when a full phrase such as “Eau de parfum” is explicit in the name; “Intense”, “Cologne” or “Le Parfum” alone are not enough.

Missing perfumer, note layers, measured wear time, projection, public reviews and season/occasion votes are not filled with guesses. Similarity still comes from the existing engine and is labelled separately from a rating. Generic reference descriptions do not imply that the named material is literally present in a formula.

## Interface contract

This is an extension of the existing design, not a new direction. Native links navigate, native disclosures explain, and keyboard focus stays visible. Notes retain catalog order. The only new motion is the small open/close indicator, with reduced-motion support inherited from the global rules. No underlines or em/en dashes are introduced.

The core question is “What is this fragrance, and how can I understand its notes?” The established standing paper specimen supplies the identity; factual typography supplies the reference. The note pages answer “What does this note suggest, and where is it listed?” The guide connects each concept to a real catalog action.
