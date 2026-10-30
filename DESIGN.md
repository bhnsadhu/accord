---
name: Accord
description: A fragrance evaluation bench built from textured cotton paper, restrained family stains, and precise catalog evidence.
direction:
  home: Precision Bench
  discover: Scent Archive
  status: Implementation and production deployment approved by the owner on 2026-10-30.
  logo: Plain Accord wordmark A; no added symbol.
colors:
  ink: "#15181c"
  ink-2: "#525760"
  ink-3: "#636974"
  bench: "#f0f1f3"
  bench-deep: "#e2e4e7"
  paper: "#fcfbf8"
  paper-edge: "#e6e5e0"
  rule: "#d3d6db"
  focus: "#2f5bd3"
  alert: "#a3372b"
  stain-floral: "#d98ba0"
  stain-soft-floral: "#c9a3c8"
  stain-floral-amber: "#e0a16a"
  stain-soft-amber: "#d9b36c"
  stain-amber: "#c47a3a"
  stain-woody-amber: "#a8693f"
  stain-woods: "#8b6a4a"
  stain-mossy-woods: "#6f7a4a"
  stain-dry-woods: "#6b4e3d"
  stain-aromatic-fougere: "#7e9a6b"
  stain-citrus: "#e3c84b"
  stain-water: "#6fa8c7"
  stain-green: "#8db36a"
  stain-fruity: "#e07a5f"
  unstained: "#c4c6c0"
typography:
  sans: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
  mono: "Geist Mono, ui-monospace, monospace"
  home-display:
    fontSize: "clamp(46px, 5vw, 76px)"
    fontWeight: 450
    lineHeight: 1.06
    letterSpacing: "-0.055em"
  archive-heading:
    fontSize: "44px"
    fontWeight: 450
    letterSpacing: "-0.045em"
  archive-name:
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.04em"
  body:
    fontSize: "16px"
    lineHeight: 1.5
rounded:
  strip: "3px"
  tag: "2px"
  control: "4px to 6px"
layout:
  signature-max: "1600px"
  content-max: "1440px"
  archive-max: "1600px"
  desktop-from: "1100px"
  inline-preview-through: "700px"
motion:
  ease-paper: "cubic-bezier(0.16, 1, 0.3, 1)"
  strip: "350ms to 400ms"
  fan: "650ms"
  intro: "1050ms per strip, staggered over 250ms"
  reduced-motion: "0ms"
---

# Accord design system

## Approved direction

The approved references combine **Precision Bench for Home** with **Scent Archive for Discover**. Accord is a modern fragrance workbench: tactile white cotton paper, a cool silver-grey setting, small stains that encode accord family, and typography that makes the catalog easy to inspect. Material detail supplies the fragrance identity; useful selection, search, and evidence supply the technical quality.

The owner reviewed the local implementation and approved production deployment on 2026-10-30. For the logo, the owner selected **option A: the plain Accord typographic wordmark**, with no added symbol. Additional proposed marks were rejected. Do not introduce another emblem as if it were approved.

This direction supersedes the earlier pointed-strip and beaker-fan treatment. Keep the physical smelling-strip idea, now expressed through rectangular paper and a restrained stained end.

## Product truth

Accord helps people know a bottle, find their next fragrance, and understand their own taste. It is a discovery and collection product, not a fragrance shop.

- The current catalog contains **24,642 fragrances, 1,255 brands, and 285 notes**. Derive filter totals, result counts, and comparison values from the actual data.
- Catalog metadata is text only. Do not introduce catalog bottle photography, product descriptions, prices, public ratings, popularity claims, or reviews without a verified source and usage rights. The paper material texture is an interface asset, not catalog imagery.
- Display notes as listed in the catalog. Do not invent top, heart, or base layers, material concentrations, performance, or longevity.
- Personal ratings are 1 to 5 and belong to the user. Recommendations, pair similarity, and scan confidence are different concepts and must have distinct labels.
- A recommendation percentile is relative fit among eligible catalog fragrances, not a probability of liking it. Pair similarity is a separate 0 to 100 measure: notes 55%, accord 25%, catalog family 15%, character 5%.
- Put concrete reasons beside suggestions: shared notes, accord family, character, or a liked fragrance. Demonstrations and unconfirmed scanner candidates must be visibly labelled as such.

## Color and type

The neutral tokens above match [globals.css](src/app/globals.css). Ink is the primary text and action color; ink-2 carries secondary copy; ink-3 carries readable labels and metadata. Paper is a slightly warm white against the cooler bench. Bench-deep and rule define recessed controls and dividers. Focus blue is reserved for keyboard outlines; alert red carries errors, destructive actions, and avoided-note state.

The fourteen family hues come from [hues.ts](src/lib/hues.ts). A hue always names the same Edwards accord family across strips, family labels, filters, and collection summaries. Unparsed families use the neutral unstained fallback. Do not recolor a family to indicate selection, success, rank, or fashion. Material gradients may mix the base hue with white to depict absorption, without changing its meaning.

Schibsted Grotesk carries names, headings, controls, and prose, with stylistic sets ss01 and cv11. The signature heading uses a light 450 weight, tight tracking, and generous scale; archive names use 500. Smaller labels stay in sentence case, close to the values they describe. Geist Mono is an instrument for exact counts, identifiers, and figures, with tabular numerals; it is not the voice for names or prose.

Use the actual responsive rules in globals rather than applying one headline scale everywhere. Home reaches 76px on wide screens; Discover starts at 44px, steps to 38px below 1100px, and 34px at phone widths. Body copy stays comfortably readable; metadata is subordinate without disappearing into low contrast.

## Paper, light, and shape

The signature object is a **rectangular cotton-paper smelling strip** with a 3px softened edge. It has fine irregular fiber texture, a small illuminated edge, a subtle thickness shadow, and a soft directional cast shadow. The texture source is [blotter-paper.png](public/materials/blotter-paper.png). Reuse the same material on vertical specimens and horizontal results so they belong to one physical system.

Horizontal strips have a **short stained tip at the right**. Keep most of the paper dry and white; reserve enough right padding that names, notes, figures, and controls never cross the stain. In the archive the tip is 52px on wide screens, 40px at intermediate widths, and 39px on phones. Shared strips use the responsive --strip-tip token, with smaller tips on compact rows.

Vertical specimens use a short stained end, about 14% of the paper by default. Home places it at the top; the Discover preview places its 11% tip at the bottom. Names are printed along the paper, with secondary brand text where space allows. A faint embossed Accord wordmark can appear on the specimen.

Gradients describe absorption, brushed metal, or directional light. The owner selected **option C: loose blotters with no visible holder**. Keep the original silver background, lighting, resting fan geometry, and selection movement. Do not restore the rail or oval stand. Do not use decorative rules merely to fill space. Avoid decorative color washes, prominent tide-line rings, pointed clip-path silhouettes, glass vessels, glowing interfaces, and oversized wet stains. Paper should read as a plausible premium blotter before it reads as an illustration.

Unconfirmed scanner candidates remain rectangular **ghost strips**: no family stain, no material shadow, and a dashed neutral edge. Their uncertainty must also be stated in text. A blank candidate is not an answer.

## Home: Precision Bench

The opening composition is wide and spatial. A clear headline and short product explanation sit above the bench; the search form occupies the adjacent desktop column. Search is a real GET form to Discover. Scan a bottle is a prominent, full-width entry below it with a camera icon and a short photo-identification explanation. Its height matches the search and Explore controls: 54px on larger screens and 48px on phones. The header, hero, and fan share a maximum width of 1600px.

Six real fragrances form a spreading fan of **loose paper blotters**, without a rail or holder. The strips vary in angle and height, each with a readable identity and family stain. Selection moves the strip forward and down along its own axis. On smaller screens the fan compresses its angles, heights, and spacing while preserving distinct targets and staying clear of the scanner action.

The first Home visit in a document opens with the strips gathered at the center, then spreading into their final positions. The center strips lead and the outer strips follow, finishing in about 1.3 seconds. At the owner's explicit request, a transparent native dialog blocks site interaction and scrolling during this sequence. Skip intro and Escape settle it immediately; a 1.8-second fail-safe also releases it. Reduced motion and disabled JavaScript show the finished composition directly. Client-side returns to Home do not replay it; a fresh page load does. A resize or hidden tab settles the sequence and releases the gate.

The fan is an interactive preview:

- Mouse hover or keyboard focus previews a fragrance. Leaving returns to the committed selection.
- Clicking or tapping selects the fragrance; aria-pressed reflects that selection.
- The adjoining preview updates the name, brand, accord family, and a short note list from real metadata. View fragrance opens the detail page; Explore the house opens a brand search.
- The initial selection prefers Santal 33 when present. Do not imply that an unselected fragrance was opened or saved.

The first supporting section explains a real connection, including shared-note evidence and a labelled similarity figure. The personal bench trail is separate from fan selection and reflects actual opened fragrances. Further sections retain the product story: reading a fragrance through its notes, exploring the accord wheel, and distinguishing a scanner answer from unconfirmed candidates.

Follow a note opens an inline catalog connection panel. Counts come from actual note-filtered catalog queries; examples prefer similar fragrances that list the selected note, with catalog results as the fallback. Explore the note opens the corresponding Discover filter. Accord-family strips are native disclosures, one open at a time, showing full listed notes, character, and links to the fragrance or family. They work without JavaScript. Keep these interactions inline so exploration never requires a modal.

## Discover: Scent Archive

At **1100px and above**, Discover is a three-column working archive: filters at left, horizontal paper result strips in the center, and a sticky selected-fragrance preview at right. The preview includes a tall paper specimen, name, brand, accord family, character when available, the full listed notes, View fragrance, and Compare. Keep its information visible beside the results rather than hiding it behind another route.

The primary structure is .archive-page → .archive-layout with .archive-filters and .archive-main. The main area contains the existing search/status UI, .archive-results (list and preview), and pagination. The desktop baseline is a 174px filter column, fluid results, and a 340px preview; responsive CSS adjusts these widths.

Each result has two explicit interactions: the paper button selects a preview, and its View fragrance link navigates. The selected strip is marked with a graphite check and accessible pressed state. Selection stays local to the page; actual search, filters, sort, counts, and pagination remain server-driven and URL-addressable. A changed ordered result set resets preview and comparison to the new results.

Compare anchors the selected fragrance, asks the user to select another result, then exposes Compare the two with the two real product IDs. Cancel clears that pairing. When only one result is present, Compare leads to its similar-fragrances section so the user can find a second scent. Never choose an unexplained comparison partner for them.

Responsive behavior is part of the contract:

- **701 to 1099px:** filters move above results in a native disclosure, closed initially; the result list and selected preview remain beside each other.
- **700px and below:** filters stay above the list. Explicit selection reveals a compact preview immediately below that strip, containing full notes, View fragrance, and Compare. Close returns focus to the source button. The desktop preview is hidden so selection never appears to do nothing far below the results.
- The filter disclosure opens on desktop and remains keyboard-operable. Accord family precedes the included/excluded-note form. Existing facets, catalog families, gender, sorting, clear-filter actions, empty results, and pagination remain available.

## Shared product surfaces

Use horizontal paper strips for fragrance lists in recommendations, collections, and similar results, and standing specimens for fragrance detail. Shared row links still navigate directly; Discover's explicit preview interaction is specific to its archive layout.

**Fragrance detail** presents real identity, accord and catalog family, character, year/gender when available, and the listed notes. Keep Owned, Tried, Wishlist, personal rating, and favourite actions distinct. Similar suggestions show shared-note evidence and link to comparison.

**For you** explains the current recommendation context and each suggestion. An empty profile offers a useful start rather than a fabricated personal match. Feedback, avoided notes, and collection signals must retain their real behavior. Static concepts that show a fixed ranking must label the profile as a sample snapshot rather than imply it recomputes from edits.

**Collection and profile** retain Owned, Tried, Wishlist, and Favourites; personal ratings and profile inputs remain editable. Guest data stays in local storage and merges into the account on sign-in. Optional taste inputs should feel optional. Avoided notes are exclusions, not a weak preference. Show currently selected or avoided values so the summary never refers to hidden state.

**Scan** is a deliberate upload/identify flow. Preserve preparing, identifying, confirmed, uncertain, invalid, busy, quota, timeout, offline, and disabled states where applicable. Explain what happened and give a usable next action. Only a confirmed answer gets the stained-answer treatment; candidates remain explicitly unconfirmed. Never turn an illustrative example into an asserted scan result.

## Controls, navigation, and accessibility

Use no em or en dashes in project text. Write numeric ranges with “to” and missing metadata as “Not listed”. Repository and ScentLens links use stronger text, with no arrows or background highlights.

Links and text actions use no underlines in any state. Current navigation and sort choices use stronger text; the selected collection shelf uses a subtle neutral fill and stronger text. Keep the visible keyboard-focus outline.

Primary actions use graphite fills and paper text. Secondary actions use a restrained neutral border. Controls have 4 to 6px corners; tags are almost square at 2px. Avoid pill-shaped note chips and card grids that replace the strip vocabulary. Fields have visible labels, appropriate input types, clear errors, and real submit behavior.

The main sections remain **Discover / For you / Collection / Scan**. At desktop widths they appear in the top navigation; below 1100px they move into the four-section bottom bar. Keep content clear of that fixed bar. Quick find, Cmd/Ctrl K, account/profile access, and the skip link remain available.

Native links navigate and native buttons change state. Accessible names include the visible label; prefer native content with a short screen-reader-only prefix where a preview needs context. Preview controls expose selection and expanded state, identify the region they control when applicable, and announce the selected fragrance. All mouse interactions must work from the keyboard; visible focus uses a 2px blue outline with a 3px offset. Full names and note lists must remain accessible when the visual layout truncates compact labels.

Motion uses cubic-bezier(0.16, 1, 0.3, 1): short paper movements around 350 to 400ms, fan selection around 650ms, controls around 250ms. Horizontal strips rise only a few pixels; the selected fan strip moves along its own axis and deepens its shadow/stain. Reduced-motion preferences remove transitions and animations. Do not make essential information depend on motion, hover, color, or decorative texture.

Supporting motion explains state: note and family disclosures open in place, archive specimens settle into the preview, quick find opens and closes with a short focus transition, and favourite/rating controls acknowledge a press. The scanner photo area uses camera framing corners that tighten on hover and while reading. Supporting motion is interruptible and adds no dependency, network wait, or looping decoration. The short Home introduction is the sole exception that temporarily locks site interaction.

## Maintenance and verification

Use this document for the current direction, [globals.css](src/app/globals.css) for implemented style values, [hues.ts](src/lib/hues.ts) for the family mapping, and source components for interaction behavior. Earlier .impeccable design snapshots describe the previous treatment and are not the authority for the new reference direction.

Review Home and Discover in a real browser at desktop and phone sizes. Verify real search/filter URLs, result counts, no-results recovery, preview selection, comparison, direct detail links, mobile disclosure/inline preview, keyboard focus, and reduced motion. Check other routes for regressions when changing shared paper styles. The owner authorized requested changes to be pushed and deployed after checks on 2026-10-30, without a separate preview approval. Preserve the current strip-and-silver direction; a later request to hold deployment overrides this standing preference.
