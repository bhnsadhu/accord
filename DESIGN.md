---
name: Accord
description: Know the bottle, find the next one. A fragrance evaluation bench where every perfume is a smelling strip.
colors:
  ink: "#1c1e1d"
  ink-2: "#464a47"
  ink-3: "#585c58"
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
  focus: "#2f5bd3"
  alert: "#a3372b"
  bench: "#e4e5e1"
  bench-deep: "#d7d9d3"
  paper: "#fbfbf8"
  paper-edge: "#e8e8e2"
  rule: "#c9cbc5"
typography:
  display:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(48px, 6.4vw, 88px)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(32px, 3.6vw, 48px)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  title-strip:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.01em"
  body-lede:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"ss01\", \"cv11\""
  body-sm:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  figure:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\""
rounded:
  tag: "2px"
  control: "4px"
  track: "6px"
  swatch: "9999px"
spacing:
  gutter-sm: "16px"
  gutter-md: "32px"
  gutter-lg: "64px"
  strip-pad: "16px"
  section: "96px"
  section-lg: "128px"
  container: "1440px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.ink-2}"
    textColor: "{colors.paper}"
  button-scan:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "60px"
  button-outline:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "52px"
  button-outline-hover:
    backgroundColor: "{colors.paper}"
  button-danger:
    backgroundColor: "{colors.alert}"
    textColor: "{colors.paper}"
    padding: "0 20px"
    height: "44px"
  search-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.title-strip}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "60px"
  input-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "0 14px"
    height: "48px"
  tag-note:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.tag}"
    padding: "6px 14px"
  tag-toggle-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.tag}"
    padding: "6px 14px"
  tag-toggle-avoid:
    backgroundColor: "{colors.alert}"
    textColor: "{colors.paper}"
    rounded: "{rounded.tag}"
    padding: "6px 14px"
  tag-filter:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tag}"
    padding: "4px 8px 4px 12px"
  segmented-track:
    backgroundColor: "{colors.bench-deep}"
    rounded: "{rounded.track}"
    padding: "4px"
  segmented-option-on:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  strip-laid:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "16px 20px 16px 0"
  panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "24px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "12px 8px 12px 16px"
---

# Design System: Accord

## Overview

**Creative North Star: "The Evaluation Bench"**

Every fragrance in Accord is a smelling strip (a mouillette) and the product is the bench a perfumer evaluates them on. The ground is a neutral bench grey; content sits on blotter-paper white cut into strips with die-cut tapered tips; each strip carries an oil stain in the one hue fixed to its Edwards wheel family, darkening to a tide line where the oil stopped soaking. Everything else is graphite ink. The world is light only, chosen from the use scene: perfume is judged on white paper in neutral daylight.

The system is quiet and typographic. One grotesk sets every word; a mono face appears only where a number or identifier has to be read exactly. There are no catalog images: the stain is the only picture a fragrance gets, and colour on a strip always means its accord family, never decoration. Depth is paper physics: strips rest with a soft drop shadow, lift and saturate when touched, and confirmed versus unconfirmed is carried by stained versus dashed blank paper.

Density is moderate. Pages run in one 1440px container with generous section breaks; lists are stacks of laid strips rather than grids of cards.

**Key Characteristics:**
- Neutral bench grey ground, blotter-white paper strips with die-cut tapered tips.
- One fixed stain hue per Edwards wheel family, with a darker tide line; unparsed accords stay unstained.
- Graphite ink for text and primary actions; no brand accent colour.
- Schibsted Grotesk for all text; Geist Mono only for ids, counts and figures.
- Paper shadows and a lift-and-saturate response; no glass, no decorative gradients beyond the stain.
- Ghost strips (dashed, unstained) mean "unconfirmed".
- Light only.

## Colors

A near-achromatic bench-and-paper palette with graphite ink, where the only saturated colour is the oil stain encoding each fragrance's wheel family.

### Primary
- **Graphite Ink** (ink): all primary text, primary action fills (Scan, Build your profile, submit), selected toggles, the bench rule above closing sections. It is the action colour; there is no separate brand accent.
- **Pencil Grey** (ink-2): secondary text, ledes, note lists on strips, inactive nav links, and the hover state of ink-filled buttons.
- **Faint Pencil** (ink-3): field labels, brand lines on strips, captions, placeholders, ghost-strip dashes, annotation rules. Kept dark enough to read on bench grey as running text.

### Secondary
- **Wheel Stains** (stain-floral through stain-fruity, fourteen hues in Edwards wheel order from Floral round to Fruity): the stain on a strip, the legend swatches, the family dot beside an accord name, and the collection's family bar. One hue per family, fixed on every surface so a colour always means the same accord.
- **Unstained** (unstained): the fallback when a fragrance's accord could not be parsed. It reads as dry paper, never as a family.

### Tertiary
- **Focus Blue** (focus): keyboard focus outlines only (2px solid, 3px offset). Never used as decoration or as an action fill.
- **Alert Red** (alert): errors, destructive confirmation, the "avoid" state of a note toggle, and the development-mode notice in the scanner.

### Neutral
- **Bench Grey** (bench): the page ground and theme colour; also the row fill inside hairline-ruled lists.
- **Deep Bench** (bench-deep): recessed tracks (the shelf segmented control) and the scrollbar track.
- **Blotter White** (paper): every strip, field, tag, panel, dialog and the mobile tab bar.
- **Paper Edge** (paper-edge): the inset edge on standing strips, the border of note tags and key caps, the divider inside the command palette.
- **Bench Rule** (rule): hairline dividers, the footer and mobile tab bar top border, unselected toggle borders.

### Named Rules
**The One Hue Per Family Rule.** A stain hue belongs to exactly one Edwards wheel family and is never reassigned, tinted for decoration or used for UI state. If a colour is on a strip, it names the accord.

**The Graphite Action Rule.** Actions are graphite ink on paper or bench. Do not introduce a brand accent for buttons or links; the stains are data, not chrome.

## Typography

**Display Font:** Schibsted Grotesk (with ui-sans-serif, system-ui fallback)
**Body Font:** Schibsted Grotesk, stylistic sets ss01 and cv11 on
**Label/Mono Font:** Geist Mono (with ui-monospace), tabular figures

**Character:** A single editorial grotesk carries headings, body and labels; tight negative tracking on large sizes gives the headings a set, newsprint weight, while body stays at default tracking. Geist Mono is a measuring instrument, not a voice.

### Hierarchy
- **Display** (600, clamp 48 to 88px, 0.98, -0.035em, balanced wrap): the homepage headline and other first-viewport statements only.
- **Headline** (600, clamp 32 to 48px, 1.05, -0.03em): section headings; page titles on inner pages sit in the same band.
- **Title** (600, 22px, -0.015em): the name on a featured laid strip; the strip-row name steps down to **Title Strip** (600, 18px, -0.01em).
- **Body Lede** (400, 19px, 1.625): the opening paragraph under a display or headline, held to about 32 to 36em.
- **Body** (400, 16px, 1.5) and **Body Small** (400, 15px): running text, notes lists, controls, nav links.
- **Label** (400, 13px, sentence case, no tracking, ink-3): field labels, brand lines on strips, legend items, annotation terms. Always sentence case and attached to the value it labels.
- **Figure** (Geist Mono 500, 24px, -0.02em, tabular): match and similarity numbers; larger on Compare. Counts and pagination use Geist Mono at 12 to 14px.

### Named Rules
**The Instrument Mono Rule.** Geist Mono sets only ids (product ids), counts, percentages and match figures, always with tabular numerals. Words, names and headings are never mono.

**The Sentence-Case Label Rule.** Small labels are sentence case at 13px in faint pencil, sitting directly above or beside the value they describe. No uppercase tracked labels.

## Layout

One centred container (container, 1440px) with responsive gutters of 16px, 32px from 640px and 64px from 1024px. Sections are separated by large breaks (section on small screens, section-lg from 1024px) rather than by rules or backgrounds; a single ink rule may open a closing call-to-action band.

Lists are vertical stacks of laid strips with 8 to 12px gaps; on wider screens a list may flow into two columns (the wheel tour). Secondary lists use hairline-ruled rows: a rule-coloured grid with a 1px gap and bench-filled rows. Two-column text layouts pair a headline column with a lede column (roughly 5:7). Detail pages pair a standing strip column (about 180px) with the content column.

The first viewport on large screens fills the remaining viewport height (between 720 and 860px) with text on the left and a fan of standing strips rising from below the frame on the right. On small screens the fan sits below the text in a fixed 440px window and the nav gives way to a fixed bottom tab bar of four sections.

Text on a laid strip always begins past the stain: left padding is the stain depth (72px, 112px from 640px, adjustable per strip) plus strip-pad.

## Elevation & Depth

Depth is paper on a bench. Surfaces are flat colour; paper objects (strips, fields, tags, panels) rest with a soft, low-spread paper shadow, and objects that float above the bench (command palette, toast) use a deeper lifted shadow. Strips use drop-shadow filters instead of box shadows so the shadow follows the die-cut tip. Interaction raises paper: hover or focus deepens the drop shadow and saturates the stain; a strip in the fan slides 24px up its own axis and stays lifted once opened, so laid strips form a retraceable trail.

Motion is paper physics: 600ms on an exponential ease-out (cubic-bezier(0.16, 1, 0.3, 1)); segmented and toggle state changes run 300ms. Under reduced motion every transition and animation is instant.

### Shadow Vocabulary
- **Paper** (`0 1px 0 rgb(28 30 29 / 0.04), 0 10px 28px -16px rgb(28 30 29 / 0.38)`): fields, filter tags, panels, the selected shelf option.
- **Lifted** (`0 2px 0 rgb(28 30 29 / 0.04), 0 22px 36px -18px rgb(28 30 29 / 0.45)`): command palette and toast.
- **Strip rest** (`filter: drop-shadow(0 6px 10px rgb(28 30 29 / 0.12))`): every stained strip at rest.
- **Strip raised** (`filter: drop-shadow(0 18px 22px rgb(28 30 29 / 0.24))`): hover, focus and locked strips.

### Named Rules
**The Paper Physics Rule.** Only paper casts shadows, and only soft ones. No hard offset shadows, no glass or blur, no glow.

**The Lift and Saturate Rule.** Attention lifts paper and saturates the stain together (stain opacity 0.88 to 1, saturate 1.35); never one without the other on a stained strip.

## Shapes

The signature silhouette is the die-cut strip: a rectangle with a tapered point, cut with a clip-path. Standing strips point up (30px tip, 60px on the detail page's large strip); laid strips point left (28px tip). The point is part of the shape, not an ornament, and it is never rounded.

Everything else is nearly square paper. Tags are square paper (tag, 2px); buttons, fields, panels, dialogs and toasts use a barely softened corner (control, 4px); the recessed segmented track is 6px. Full circles appear only as small colour swatches (8 to 10px) in legends and family labels. Borders are 1px hairlines; the one dashed border is the ghost strip's 1.5px dash, drawn to follow the tip.

**The Square Paper Rule.** Tags and chips are square paper at 2px. No pills.

## Components

### Buttons
Tactile, plain, graphite.
- **Shape:** barely softened corner (control).
- **Primary:** graphite ink fill, blotter-white text, medium weight, 52px tall with 24px side padding; the Scan button beside search is 60px to match the field. An arrow icon may trail the label.
- **Hover / Focus:** fill shifts to pencil grey; focus shows the 2px focus-blue outline.
- **Outline:** 1px ink border, transparent fill, 52px; hover fills with paper.
- **Danger:** alert fill, paper text, 44px; used only for destructive confirmation.
- **Text links:** ink or pencil, medium weight where they are calls to action, underline on hover, 0.2em underline offset and 1px thickness.

### Chips (Tags)
- **Note tag:** paper fill, 1px paper-edge border, 15px text, square paper corner; hover darkens the border to faint pencil. Links to that note in Discover.
- **Filter tag:** paper fill with paper shadow, 14px drawn close icon in faint pencil; the whole tag removes the filter.
- **Toggle (profile builder):** unselected is paper with a rule border; selected is ink fill with paper text; "avoid" selection is alert fill. 300ms colour transition.

### Cards / Containers
- **Corner Style:** control (4px).
- **Background:** paper on bench.
- **Shadow Strategy:** Paper shadow (see Elevation & Depth).
- **Border:** none.
- **Internal Padding:** 20px, 24px from 640px.
Panels are used sparingly (scanner states, detail-page side panels); lists are strips, not cards.

### Inputs / Fields
- **Search field:** 60px paper field with paper shadow, control corner, leading search icon in pencil, 18px input text, faint-pencil placeholder, a 3px-cornered key cap hint on wider screens. Focus outlines the whole field in focus blue (2px, 2px offset). It is a real GET form to Discover, with Scan beside it.
- **Form field:** 48px paper field with paper shadow, 17px text, label above in 15px medium, hint below in faint pencil; focus is the focus-blue outline.
- **Error:** message in alert red beneath the form, announced as an alert.

### Segmented Shelf Control
A deep-bench track (6px corner, 4px padding) holding 40px options. The selected option becomes raised paper (paper fill, paper shadow, medium weight, ink); others are pencil text.

### Navigation
72px top bar in the container: placeholder strip mark and 21px bold wordmark (-0.03em), section links in 15px pencil, current section in ink with underline. A search button opens the command palette (Cmd/Ctrl K). Below 768px the links move to a fixed bottom tab bar: paper at 95% with a rule top border, four equal 13px tabs, current tab semibold ink. The command palette is a 640px paper dialog with the lifted shadow over a 25% ink backdrop.

### Smelling Strips (signature)
- **Laid strip (the list module):** a left-pointing strip at least 96px tall. Every list in the product uses it: search results, recommendations, collections, similar fragrances. Brand and family on a 13px label line, name in Title Strip, notes in 15px pencil truncated to one line, an optional right-aligned aside for a figure. The whole strip is the link.
- **Standing strip:** up-pointing, 44px wide in the fan with the name set vertically in 13px; only the stained tip is the link so neighbouring strips never share a touch target. The detail page stands a large 104 by 560px strip with the product id in Geist Mono at its foot.
- **Stain:** a gradient from near-full hue to half-white, closed by a darker tide line (the hue mixed toward umber), at 0.88 opacity at rest.
- **Ghost strip:** unstained paper at 40% with a 1.5px dashed faint-pencil edge following the tip. It means the candidate is unconfirmed; it does not lift.
- **Match figure:** a Geist Mono figure above a 12px faint-pencil label (match, similarity), right-aligned on the strip.

## Do's and Don'ts

### Do:
- **Do** put every fragrance on a strip: laid strips for lists, standing strips for fans and detail pages.
- **Do** stain a strip with its wheel family's fixed hue and leave unparsed accords unstained.
- **Do** draw unconfirmed candidates as ghost strips (dashed, unstained) and keep confirmed answers stained.
- **Do** set ids, counts and match figures in Geist Mono with tabular numerals, and everything else in Schibsted Grotesk.
- **Do** keep tags as square paper (2px) and controls at 4px.
- **Do** lift and saturate together on hover and focus, over 600ms on the paper ease-out, instant under reduced motion.
- **Do** draw icons from the one 20px grid, 1.5px stroke, round-join set.
- **Do** start strip text past the stain depth.

### Don't:
- **Don't** show catalog photos or bottle imagery; the stain is the fragrance's only picture.
- **Don't** add a dark theme; the world is light only.
- **Don't** use pill-shaped tags or chips.
- **Don't** use a stain hue for anything other than its accord family.
- **Don't** use glass, blur, glow or decorative gradients; the stain is the only gradient.
- **Don't** use hard offset shadows; paper shadows are soft.
- **Don't** set names, headings or prose in Geist Mono.
- **Don't** treat the strip mark in the nav and favicon as a final logo; it is a placeholder pending the owner's approval.
