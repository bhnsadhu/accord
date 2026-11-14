# Local ScentRev preview

Run Accord's normal local database with `npm run db:server`, then run `npm run dev:preview` in another terminal and open <http://127.0.0.1:3210/preview/scentrev> on this computer. The shared navigation uses the normal session endpoint; the preview itself reads only its fixture. The page starts with Santal 33. Choose any of the ten trial fragrances to compare the presentation of ratings, longevity, sillage and seasonal suitability. Desktop uses a fragrance list; phones use a labeled select.

The page is development-only. Production builds return not found before loading the snapshot. It is absent from product navigation and marked noindex. No ScentRev key, live request, catalog join, database migration or collection write is involved. Source concentration is shown only when explicit in the returned name; other records say "Not listed".

The fixture at `data/research/scentrev-preview.json` contains selected numeric fields from the official Playground comparison captured on 2026-11-13. Its ratings and wear counts match the [trial record](research/scentrev-trial-2026-11-13.json). The forty seasonal scores retain their returned zero-to-one scale; they are not vote percentages. Projection is not duplicated because the provider derives it from sillage. See [source feasibility](SOURCE-FEASIBILITY.md) for the unresolved access, methodology and reuse questions. This preview does not approve production integration.

## Verification

```sh
npm run typecheck
npx vitest run src/app/preview/scentrev/model.test.ts
npm run test:preview
```

The browser checks cover desktop and mobile selection, keyboard activation, source explanations, accessibility, overflow, browser errors and absence of ScentRev requests. They stub the shared session request as an anonymous visitor, so the UI checks do not require a database. They use Playwright's installed Chromium by default. To use an installed Chrome in a separate temporary test profile, run `PLAYWRIGHT_CHANNEL=chrome npm run test:preview`.

The dev server uses port 3210 and `.next-scentrev-preview`, leaving an existing normal dev server separate. The unit checks assert that production cannot render the preview, that missing metrics stay missing and that a supported zero score remains zero.
