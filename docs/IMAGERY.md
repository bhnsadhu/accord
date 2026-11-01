# Reference imagery

Accord uses real photographs to help people recognize an exact bottle and connect a note name to its plant or material. Photographs extend the approved cotton-paper and silver interface. They do not replace its Home composition, archive strips or family colors.

## Coverage

The first image release includes six exact-edition bottle photographs: Santal 33, Bleu de Chanel Eau de Parfum, Sauvage Eau de Parfum, Green Irish Tweed, Ombré Leather Eau de Parfum and Chanel N°5 Eau de Parfum. Sixteen note photographs cover bergamot, cardamom, cedarwood, iris/orris, jasmine, lavender, lemon, orange blossom, patchouli, pink pepper, rose, saffron, sandalwood, vanilla, vetiver and violet.

These are selected reference images, not universal catalog coverage. Unpictured fragrances retain their paper specimen. Unpictured notes remain readable, expandable text. Abstract accords such as amber and musk are not illustrated with a misleading literal ingredient.

## Identity and rights

- [Bottle manifest](../data/media/bottles.json): exact catalog ID, brand, edition, concentration, caption, alternative text, photographer, original source page, license link, checked date and changes.
- [Note manifest](../data/media/notes.json): exact note reference, alternative text, photographer, original source page, license link, checked date and changes.
- Unsplash photographs use its free [Unsplash License](https://unsplash.com/license), not Unsplash Plus. Commons photographs retain the public-domain or Creative Commons terms recorded per file. Attribution and applicable license links appear with the reference image or its expanded note.
- The original photographers retain their rights. The application's code license does not relicense these images. Preserve the recorded image license, including ShareAlike where applicable, when distributing changed copies.
- No Fragrantica photographs, descriptions, user reviews or rating data are redistributed. No generated bottle or invented packaging substitutes for a real edition.

Visual inspection checks the bottle label and concentration before matching a photograph. Search titles are not reliable evidence: one result described a Creed bottle incorrectly, while the visible label identified Green Irish Tweed. It is mapped only to Green Irish Tweed. A black-label Ombré Leather EDP cannot illustrate the white-label Parfum. An ambiguous Chance photograph was rejected. Packaging can vary with size and year; the Green Irish Tweed caption explicitly identifies its older 120 ml presentation.

## Interface and delivery

Bottle photographs appear on the detail page and as small Quick Find thumbnails. A native dialog enlarges the photograph with its edition, caption, photographer and license. Escape closes it, focus returns to its trigger, and scrolling is restored. On phones the full photograph fits beside the fragrance name rather than cropping the bottle to a wide banner.

Visual note disclosures reveal a concise description, attribution and a link into the note library. Documented opening, heart and base stages appear only when supported by a source. Original catalog notes remain separately accessible and continue to drive similarity. Reference aliases help navigation without rewriting catalog data. A source note with no matching catalog article links to the library rather than a missing page.

All 28 files (six bottle photos, six search thumbnails and sixteen note photos) are optimized local WebP assets, totaling about 0.97 MB. No runtime third-party image fetch, image API subscription or generated-image service is required. Next Image serves the preoptimized files without paid image transformations. Each asset has an adjacent `.webp.json` provenance sidecar with its source and license details. This is fallback file metadata, not metadata embedded inside the WebP.

## Adding another image

1. Confirm the exact fragrance edition or note subject. Prefer a clearly identifiable bottle, with a readable label and useful framing.
2. Verify free redistribution rights on the original image page. Record the photographer and complete license URL; a publicly viewable brand photo alone is not permission.
3. Store an optimized local WebP with accurate dimensions and descriptive alternative text. Preserve the entire bottle in thumbnails. Record resizing, cropping or other changes in the manifest.
4. Map by exact product ID only. Never fall back by brand or similarly named edition. Use the research workflow for a genuinely missing edition.
5. Record source and license provenance in the adjacent `.webp.json` sidecar, run the media tests, and inspect detail, search, enlargement and phone layouts. Ensure credit and license links remain available.

The manifests are the attribution inventory. Update them with the asset so credits cannot drift from the shipped file.
