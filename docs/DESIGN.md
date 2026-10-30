# Design

The design system is recorded in [/DESIGN.md](../DESIGN.md), derived from the shipped code (machine-readable sidecar: `.impeccable/design.json`).

## Approved direction

**Blotter** (approved by Bhanu, 2026-10-30): every fragrance is a smelling strip on a neutral evaluation bench. Chosen over *Wheel* (dark, Edwards-wheel navigation) and *Chord* (overlapping translucent note bands). The homepage direction contract is in `.impeccable/surfaces/src-app-page-tsx.md`.

## Interaction principles

- **Lift and saturate.** Hover or focus slides a strip up its axis and deepens its stain; strips you have opened stay lifted in the homepage fan and lie on "your bench" as a trail.
- **Uncertainty is drawn.** Answers are stained strips; unconfirmed scan candidates are dashed, unstained ghost strips.
- **Evidence beside every claim.** Recommendations list the notes and fragrances behind them; numbers are labelled for what they measure (similarity, or "top N%" for you).
- **Paper physics.** One easing (`--ease-paper`), ~600 ms, instant under `prefers-reduced-motion`.
- **Keyboard first-class.** ⌘K / Ctrl+K palette, visible focus rings, skip link; axe WCAG 2.2 AA checks on ten pages in CI.

## Open

- Logo: the strip mark (nav and `src/app/icon.svg`) is a placeholder awaiting approval.
