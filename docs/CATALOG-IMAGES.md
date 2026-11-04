# Catalog photographs

Accord's bottle reference covers 24,649 of 24,652 catalog entries as of 2026-11-04. The source dataset supplies 24,647 exact brand and full-name image matches. Two existing, individually licensed photos fill gaps for Sauvage Eau de Parfum and N°5 Eau de Parfum. Sauvage Parfum, Tobacco Vanille Parfum and Moroccanoil Lumière du Jour retain paper specimens until correctly licensed photographs are sourced.

This is an identity and file-integrity audit across the whole catalog, with visual spot checks. It is not independent visual verification of every bottle label. Packaging can differ by market and production year. Counts and exceptions are recorded in `data/media/catalog-audit.json`.

## Provenance and publication choice

Source: [doevent/perfume](https://huggingface.co/datasets/doevent/perfume/tree/9d2db452d8f0d649c4bfb0189a2fcc5282028a3c), revision `9d2db452d8f0d649c4bfb0189a2fcc5282028a3c`, using ScentLens's curated gallery and original image archive. The dataset is labelled MIT. It does not document original photographers' permissions. Accord does not assert individually verified rights for those photographs. The project owner explicitly approved attributed publication with this limitation disclosed on 2026-11-01. This supersedes the earlier verified-license-only constraint for this specific catalog image batch.

Each enlarged image links to its source and the explanation in `/learn#catalog-images`. Independently licensed reference photographs retain their own author and license. The release archive includes source filenames, rows, original checksums, identities and transformation records. Photographs are resized and encoded as WebP without regenerating bottles, labels or backgrounds. CSS blending integrates the original white backgrounds with the bench; the enlarged viewer shows the photograph on white.

## Matching rules

Match normalized brand and complete fragrance name, keeping concentration, flanker and year. Preserve non-Latin letters, rather than reducing them to an empty ASCII key. Never borrow a photograph through a recognition group: 832 original ScentLens groups contain multiple source names, including EDP/EDT/Parfum variants. Existing catalog IDs, user collections and scanner associations remain unchanged.

Every selected original was decoded and checksum recorded. All 24,722 exact-match candidate files decoded successfully. A deterministic choice prefers the largest exact-match candidate, then the source row. A source-name match is not evidence of a concentration that is absent from catalog text.

## Build and delivery

`data/media/catalog-index.json` is a compact server-only lookup. Its tuples contain width, height, full name, brand and source filename. Search receives only the requested result thumbnails; the full index is never imported by a client component.

The optimized batch is a pinned [GitHub release asset](https://github.com/bhnsadhu/accord/releases/tag/catalog-photos-2026-11-01), outside Git source history. `npm run build` downloads it, verifies size and SHA-256, rejects unexpected paths/counts, and restores the WebP assets. A failed verification fails the build. Sources and licenses are not fetched at page-view time.

Assets are served from the same origin under a checksum-versioned path, with immutable caching. Full images are bounded at 640 × 800; search images at 96 × 120. No paid image API, image optimization quota or new subscription is involved. The public build contains the photographs and thumbnails; provenance sidecars remain in the release archive. Vercel's existing Hobby bandwidth and build allowances still apply.

The bulk directory is excluded from Git and CLI uploads. Vercel allows files generated during its build beyond the CLI source-file limit. Avoid committing tens of thousands of binary files or passing them through a runtime image proxy.

## Reproduce and maintain

With the sibling ScentLens repository and its local source assets present:

```sh
python3 scripts/audit-catalog-media.py
python3 scripts/prepare-catalog-images.py
```

These commands only create local review artifacts under `output/catalog-expansion`. They do not publish. Inspect exact-match exceptions, source-name conflicts, visual samples and the coverage report before creating a new versioned release. Copy the generated index and release lock into `data/media`, publish the archive, and set the public URL/status in the lock. Preserve the existing version while deployed pages reference it.

For local development, restore the currently published assets once with `npm run catalog:images`. Production builds do this automatically. The preparation script retains provenance for full images and thumbnails. The two unpictured editions must never inherit a sibling's photograph to make a coverage number reach 100%.

## Learning coverage

This release also adds 24 concise note definitions, bringing the library to 66 defined notes. References are individual ingredient articles from The Perfume Society and The Society of Scent, linked on the note pages. Definitions describe general scent character, not a formula or the strength of a note in a specific perfume. The existing 25 researched fragrance profiles, 16 note photographs and factual-source requirements remain in place. The other catalog entries retain their existing notes, families, years where listed, and comparisons. Broad image coverage does not imply complete perfumer, note-stage or wear data.

## Validation evidence

Validation completed on 2026-11-01:

- All 93 unit and integration tests passed, along with type checking, lint and the production build.
- Nineteen distinct browser journeys passed, covering the image and reference interactions alongside the existing catalog flows.
- The provenance scan checked 49,322 raster assets and found zero missing provenance sidecars. Local metadata sidecars were restored after the remote-asset restore check. The public build serves the photographs and thumbnails; the release archive retains their sidecars.
- The published release archive was downloaded and restored successfully with its locked size of 606,853,120 bytes and SHA-256 `93860b1ddd5cfacd5b636cf4f311170afdb3dcfbe619f91ff5e10e5f9e4706dd` verified.
- The final independent visual review returned a ship disposition. Reviewed captures are in `.impeccable/review/catalog-expansion/`: `detail-desktop.png` and `discover-desktop.png` at 1440px, `compare-tablet.png` at 768px, `detail-phone.png` at 390px, `note-small.png` at 320px, `search-desktop.png`, `bottle-open.png`, and `user-1470.png` at 1470px. Render checks found no horizontal overflow or broken images on the five responsive page captures; the follow-up desktop checks confirmed the bench background and no overflow.

The local audit artifacts under `output/catalog-expansion/` include `render-checks.json`, `fix-render-checks.json`, `provenance-scan-final.txt` and `build.log`. The committed coverage summary is `data/media/catalog-audit.json`, and `data/media/catalog-release.json` pins the published archive.

## Design audit

This is an ordinary extension of the approved Precision Bench and Scent Archive system. Bottle photographs sit within the existing cool silver bench, while textured paper strips, family stains, graphite text, Schibsted Grotesk and Geist Mono keep their established roles. The shared route frame, type hierarchy and responsive navigation remain intact. Detail, search, Discover and comparison use contained photographs; source-image white backgrounds blend with the surrounding surface. The enlarged viewer intentionally shows the full photograph on white, with attribution and the provenance limitation below it.

`DESIGN.md` and `.impeccable/design.json` were inspected and preserved. Pre-existing drift remains documented here without being adopted as new guidance: `DESIGN.md` still records the original 24,642-entry catalog and the earlier text-only imagery constraint; the sidecar still contains older neutral-color fallbacks, pointed strip examples, active-link underlines and a prohibition on bottle photographs. Those records predate the current rectangular strips, current palette and this approved image batch. The documenter's scope did not include regenerating the visual system. This batch does not turn those stale examples or restrictions into rules for future screens.
