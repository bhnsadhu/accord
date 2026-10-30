import { foldText, slugify } from "./text";

/**
 * The ScentLens catalog (products.csv) stores accords as one short phrase built
 * from the Michael Edwards fragrance wheel: a wheel family, a character
 * modifier, then zero or more facets, e.g. "Woody Amber Fresher Citrus".
 * These tables turn that phrase into structured, comparable attributes.
 */

export const WHEEL_FAMILIES = [
  "Woody Amber",
  "Floral Amber",
  "Soft Amber",
  "Soft Floral",
  "Mossy Woods",
  "Dry Woods",
  "Aromatic Fougère",
  "Floral",
  "Amber",
  "Woods",
  "Citrus",
  "Fruity",
  "Green",
  "Water",
] as const;

export const CHARACTERS = ["Fresher", "Classical", "Crisp", "Richer"] as const;
export type Character = (typeof CHARACTERS)[number];

export const FACETS = [
  "Lily of the Valley",
  "White Flower",
  "Orange Blossom",
  "Lime Blossom",
  "Ylang Ylang",
  "Sweet Pea",
  "Fruity",
  "Citrus",
  "Green",
  "Water",
  "Gourmand",
  "Spicy",
  "Aromatic",
  "Rose",
  "Bouquet",
  "Musk",
  "Iris",
  "Jasmine",
  "Tuberose",
  "Violet",
  "Magnolia",
  "Mimosa",
  "Carnation",
  "Lilac",
  "Honeysuckle",
  "Freesia",
  "Lavender",
  "Frangipani",
] as const;

const CHARACTER_ALIASES: Record<string, Character> = {
  fresher: "Fresher",
  fresh: "Fresher",
  classical: "Classical",
  crisp: "Crisp",
  richer: "Richer",
  rich: "Richer",
};

type Phrase = { words: string[]; label: string };

function phrases(labels: readonly string[]): Phrase[] {
  return labels
    .map((label) => ({ words: foldText(label).split(" "), label }))
    .sort((a, b) => b.words.length - a.words.length);
}

const FAMILY_PHRASES = phrases(WHEEL_FAMILIES);
const FACET_PHRASES = phrases(FACETS);

function matchAt(tokens: string[], start: number, table: Phrase[]): Phrase | null {
  for (const phrase of table) {
    if (phrase.words.every((w, i) => tokens[start + i] === w)) return phrase;
  }
  return null;
}

export type ParsedAccords = {
  /** Wheel family, e.g. "Woody Amber"; null when the phrase is unparseable. */
  wheel: string | null;
  character: Character | null;
  facets: string[];
};

export function parseAccords(raw: string): ParsedAccords {
  // The catalog predates the 2020 rename of "Oriental" to "Amber" in places.
  const tokens = foldText(raw.replace(/\boriental\b/gi, "Amber")).split(" ").filter(Boolean);
  const result: ParsedAccords = { wheel: null, character: null, facets: [] };
  let i = 0;

  const family = matchAt(tokens, 0, FAMILY_PHRASES);
  if (family) {
    result.wheel = family.label;
    i = family.words.length;
  }

  while (i < tokens.length) {
    const character = CHARACTER_ALIASES[tokens[i]];
    if (character) {
      result.character ??= character;
      i += 1;
      continue;
    }
    const facet = matchAt(tokens, i, FACET_PHRASES);
    if (facet) {
      if (!result.facets.includes(facet.label)) result.facets.push(facet.label);
      i += facet.words.length;
      continue;
    }
    i += 1; // stray tokens (perfumer names, "$$$ info") are dropped
  }

  // "Floral Amber Floral" style repeats add nothing beyond the family.
  result.facets = result.facets.filter((f) => f !== result.wheel);
  return result;
}

export type ParsedNote = { label: string; key: string };

/**
 * Notes arrive as "Jasmine (Grandiflorum), Vetiver (Haiti), Iris / Orris".
 * The parenthetical origin is dropped so the same material compares equal;
 * the display label keeps alternative names like "Iris / Orris".
 */
export function parseNotes(raw: string): ParsedNote[] {
  const seen = new Set<string>();
  const notes: ParsedNote[] = [];
  for (const part of raw.split(",")) {
    const label = part.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
    if (!label) continue;
    const key = slugify(label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    notes.push({ label: titleCase(label), key });
  }
  return notes;
}

function titleCase(label: string): string {
  return label.replace(/(^|[\s/-])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

const FAMILY_LABELS: Record<string, string> = {
  FLORAL: "Floral",
  WOODY: "Woody",
  "AMBERY (ORIENTAL)": "Amber",
  "AROMATIC FOUGERE": "Aromatic Fougère",
  CITRUS: "Citrus",
  CHYPRE: "Chypre",
  LEATHER: "Leather",
  FRUITY: "Fruity",
  GREEN: "Green",
  "MUSK SKIN": "Musk",
  WATERY: "Aquatic",
  GOURMAND: "Gourmand",
  SPICY: "Spicy",
  ALDEHYDIC: "Aldehydic",
  TOBACCO: "Tobacco",
};

/** Human label for the catalog's upper-case family and subfamily values. */
export function familyLabel(raw: string): string {
  const key = raw.trim().toUpperCase();
  return FAMILY_LABELS[key] ?? titleCase(raw.trim().toLowerCase());
}

export type Gender = "feminine" | "masculine" | "unisex";

export function parseGender(raw: string): Gender | null {
  switch (raw.trim().toLowerCase()) {
    case "female":
      return "feminine";
    case "male":
      return "masculine";
    case "unisex":
      return "unisex";
    default:
      return null;
  }
}

export function parseYear(raw: string): number | null {
  const year = Number.parseInt(raw, 10);
  return Number.isInteger(year) && year >= 1700 && year <= 2100 ? year : null;
}
