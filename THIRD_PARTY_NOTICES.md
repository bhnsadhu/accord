# Third-party notices

## Adapted ideas and algorithms

### Fragrance DNA
- Source: https://github.com/mikeyoknow/fragrance-dna
- License: MIT, Copyright (c) 2026 Erfan Razmand
- Used: the accord-aware perfume similarity (note overlap blended with accord overlap, 0.7 / 0.3) and the Personalized PageRank recommender. No code was copied; Accord reimplements both in TypeScript with changes: IDF-weighted note cosine instead of Jaccard, family and wheel-character terms, and a walk on the fragrance-note-accord graph instead of a precomputed perfume similarity graph. See `src/lib/reco/similarity.ts` and `src/lib/reco/graph.ts`.

```
MIT License

Copyright (c) 2026 Erfan Razmand

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Data

### Fragrance catalog
- Source: Hugging Face dataset `doevent/perfume` at revision 9d2db452d8f0d649c4bfb0189a2fcc5282028a3c, cleaned by ScentLens (`scripts/clean_catalog.py`, MIT, Copyright (c) 2026 bhnsadhu).
- The dataset card carries an MIT tag; the provenance of its images and descriptions is not documented. Accord therefore uses only text metadata (brand, name, family, subfamily, accord phrase, notes, gender, year) and never displays catalog images or descriptions. The data file is not redistributed in this repository.

## Packages

Runtime dependencies are listed in `package.json`; all are under permissive licenses (MIT, Apache-2.0 or ISC): Next.js, React, Drizzle ORM, node-postgres, Better Auth, Zod, @gradio/client, csv-parse, @vercel/functions, PGlite (Apache-2.0 / PostgreSQL License).
