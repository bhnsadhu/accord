/**
 * Offline evaluation of the recommender on the real catalog.
 *
 * There is no interaction data, so this uses a proxy task that does not reuse
 * the features being scored: a "line" is a brand plus the first word of the
 * product name (Chanel Chance, Dior Sauvage, ...). A simulated person likes
 * four fragrances from a line; we hide a fifth and measure where it ranks
 * among all ~24k candidates. Flankers usually share DNA, so a good taste model
 * should rank the hidden one high: but brand and name are never inputs.
 *
 *   npx tsx scripts/evaluate-reco.ts
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { foldText } from "../src/lib/catalog/text";
import { buildCatalogIndex, type CatalogIndex } from "../src/lib/reco/catalog-index";
import { loadFeatures } from "../src/lib/reco/load";
import { rankAll, SCORE_WEIGHTS } from "../src/lib/reco/recommend";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const features = await loadFeatures(drizzle(pool, { schema }));
await pool.end();
const index = buildCatalogIndex(features);

const STOP = new Set(["eau", "de", "le", "la", "l", "the", "parfum", "extrait", "edp", "edt", "pour", "homme", "femme", "no"]);
const lines = new Map<string, string[]>();
for (const f of features) {
  const word = foldText(f.name).split(" ").find((w) => w.length >= 3 && !STOP.has(w));
  if (!word) continue;
  const key = `${foldText(f.brand)}|${word}`;
  lines.set(key, [...(lines.get(key) ?? []), f.productId]);
}

// Deterministic PRNG so runs are comparable.
let seed = 42;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const eligibleLines = [...lines.values()].filter((l) => l.length >= 5);
const trials = Array.from({ length: 300 }, () => {
  const line = eligibleLines[Math.floor(rand() * eligibleLines.length)];
  const shuffled = [...line].sort(() => rand() - 0.5);
  return { liked: shuffled.slice(0, 4), held: shuffled[4] };
});

type Variant = { name: string; rank: (idx: CatalogIndex, liked: string[]) => string[] };

const original = { ...SCORE_WEIGHTS };
const ZERO = { notes: 0, accords: 0, family: 0, graph: 0, neighbor: 0 };
function withWeights(w: Partial<typeof SCORE_WEIGHTS>, liked: string[]) {
  Object.assign(SCORE_WEIGHTS, original, w);
  try {
    return rankAll(index, { items: liked.map((productId) => ({ productId, weight: 1 })) });
  } finally {
    Object.assign(SCORE_WEIGHTS, original);
  }
}

const variants: Variant[] = [
  {
    name: "Random order",
    rank: (idx, liked) => {
      const skip = new Set(liked);
      return idx.items.map((i) => i.productId).filter((p) => !skip.has(p)).sort(() => rand() - 0.5);
    },
  },
  {
    name: "Same family only",
    rank: (_, liked) => withWeights({ ...ZERO, family: 1 }, liked),
  },
  { name: "Notes only (IDF cosine)", rank: (_, liked) => withWeights({ ...ZERO, notes: 1 }, liked) },
  { name: "Shipped blend without graph", rank: (_, liked) => withWeights({ graph: 0 }, liked) },
  { name: "Graph walk only", rank: (_, liked) => withWeights({ ...ZERO, graph: 1 }, liked) },
  { name: "Nearest liked only", rank: (_, liked) => withWeights({ ...ZERO, neighbor: 1 }, liked) },
  { name: "First blend (no neighbor)", rank: (_, liked) => withWeights({ notes: 0.45, accords: 0.2, family: 0.15, graph: 0.2, neighbor: 0 }, liked) },
  { name: "Shipped blend", rank: (_, liked) => withWeights({}, liked) },
];

console.log(`Catalog ${features.length} fragrances, ${eligibleLines.length} lines with >= 5 members, ${trials.length} trials\n`);
console.log("| Variant | Hit@24 | Hit@100 | MRR | Median rank |");
console.log("|---|---|---|---|---|");
for (const v of variants) {
  const ranks: number[] = [];
  const started = Date.now();
  for (const t of trials) {
    const r = v.rank(index, t.liked).indexOf(t.held);
    ranks.push(r < 0 ? index.items.length : r + 1);
  }
  ranks.sort((a, b) => a - b);
  const hit = (k: number) => ((100 * ranks.filter((r) => r <= k).length) / ranks.length).toFixed(1) + "%";
  const mrr = (ranks.reduce((s, r) => s + 1 / r, 0) / ranks.length).toFixed(3);
  const ms = ((Date.now() - started) / trials.length).toFixed(0);
  console.log(`| ${v.name} | ${hit(24)} | ${hit(100)} | ${mrr} | ${ranks[Math.floor(ranks.length / 2)]} | <!-- ${ms} ms/query -->`);
}
