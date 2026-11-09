# Product

Product truth lives in [/PRODUCT.md](../PRODUCT.md). This page covers journeys, priorities and product decisions.

## Journeys

1. **Visit.** The first viewport states the promise, offers a working search and Scan, and shows one real recommendation with its evidence. No sign-up wall.
2. **Profile (optional).** `/profile`: favourites by search, notes to like and avoid, accord families, catalog families, worn-as. Everything optional.
3. **Browse and search.** `/discover`: fuzzy name/brand search, filters, strip list; ⌘K palette anywhere; a trail of recently opened strips.
4. **Inspect.** `/fragrance/[slug]`: facts, private shelf and rating controls, an accord profile estimated from the notes, sourced notes and wear guidance where available, editions, similar fragrances, more from the house, sources.
4b. **Browse the reference.** `/brands` and `/brands/[slug]` (family mix, signature notes, perfumers, the full line by year), `/perfumers`, `/releases` (newest catalog releases and release-year browsing). The old `/charts` URL redirects to `/releases`.
5. **Recommendations.** `/for-you`: ranked with reasons; "Want to try" and "Tried it, not for me" feed back immediately and re-rank.
6. **Collect.** `/collection`: owned, tried, wishlist, favourites; ratings; a summary of accord families and recurring notes.
7. **Scan.** `/scan`: photo → identified fragrance with honest confidence, or "Not sure" with candidates, tips and a search fallback.
8. **Return.** Sign in to keep everything; guest data merges in.

## Priorities

1. Core discovery works for guests on the first visit.
2. Recommendations that explain themselves and respond to feedback.
3. Honest recognition; never a guess presented as an answer.
4. Polished, fast, accessible UI in one consistent visual language.

Out of scope by decision: retail links, prices, forums and messaging. Member ratings, reviews, votes, charts and public profiles were retired on 2026-11-08. Features must work from catalog facts, attributed published sources, or the visitor’s own choices. Manual catalog-request forms are also retired. See DECISIONS.md.

## Product decisions

- **Evidence over scores.** Every recommendation shows why; the number is a percentile, labelled as relative fit.
- **Feedback without friction.** "Tried it, not for me" records a 1-star tried entry (explicit, reversible in Collection); "Want to try" adds to wishlist.
- **Avoided notes are hard filters**, because a person who hates oud doesn't want a "slightly lower" oud.
- **No popularity proxy.** The catalog has none; cold start shows each accord family's most characteristic fragrance instead.
- **Scanner gated.** Better to ship discovery now and open scanning when cost safety is verified.

## Metrics worth measuring once live (not measured yet)

Search-to-detail rate, profile completion, recommendation saves (wishlist/owned) per session, "not for me" rate, scan answer vs abstain rate, return visits by signed-in users. None of these exist yet; no numbers are claimed.
