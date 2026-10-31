import type { FragranceSummary } from "@/lib/catalog/queries";

/** Short editorial definitions, separate from the catalog's product facts.
 * Sources and scope are recorded in docs/FRAGRANCE-REFERENCE.md.
 * A note describes an impression, not a formula, quantity or wear-time claim.
 */
export const GUIDE_SOURCES = {
  ingredients: { label: "The Perfume Society: ingredients", href: "https://perfumesociety.org/discover-perfume/an-introduction/ingredients/" },
  families: { label: "The Perfume Society: fragrance families", href: "https://perfumesociety.org/discover-perfume/an-introduction/fragrance-families/" },
  wheel: { label: "Michael Edwards: the fragrance wheel", href: "https://www.fragrancesoftheworld.com/fragrance-wheel" },
  wearing: { label: "The Perfume Society: choosing and wearing fragrance", href: "https://perfumesociety.org/discover-perfume/an-introduction/faq/" },
  language: { label: "The Perfume Society: the language of scent", href: "https://perfumesociety.org/wp-content/uploads/2018/06/SL31.OnlineIssue.pdf" },
  glossary: { label: "The Society of Scent: perfumer’s glossary", href: "https://www.thesocietyofscent.com/education/glossary-index/" },
} as const;

// Unknown notes retain their catalog identity without a guessed description.
export const NOTE_GUIDE: Readonly<Record<string, string>> = {
  musk: "Soft, skinlike warmth; sometimes clean or powdery.",
  bergamot: "Bitter citrus peel with a delicate floral edge.",
  jasmine: "Rich white flowers, sometimes with an animalic undertone.",
  vanilla: "Sweet, rounded warmth with a familiar pod-like softness.",
  sandalwood: "Smooth, creamy wood, sometimes with a milky quality.",
  patchouli: "Earthy, dark wood with a damp, leafy quality.",
  amber: "A warm, resinous accord, often sweet rather than mineral.",
  rose: "Floral, sometimes fresh, honeyed or gently spicy.",
  cedarwood: "Dry wood with a pencil-shaving character.",
  vetiver: "Rooty, earthy wood, sometimes smoky or grassy.",
  mandarin: "Juicy citrus with a sweeter, softer peel.",
  lemon: "Bright, tart citrus with a sharp peel impression.",
  "tonka-bean": "Warm, haylike sweetness with almond and vanilla associations.",
  "orange-blossom": "White flowers with honeyed, citrus accents.",
  "iris-orris": "Powdery, softly earthy, sometimes violet-like.",
  lavender: "Aromatic flowers with a clean, herbal character.",
  cardamom: "Cool spice with green and aromatic facets.",
  "pink-pepper": "Bright, gently fruity spice.",
  grapefruit: "Tart citrus with a distinctly bitter peel.",
  leather: "An accord suggesting suede, smoke or tanned leather.",
  "incense-olibanum": "Resinous incense with woody, smoky and citrus nuances.",
  violet: "Soft, powdery flowers with a green edge.",
  "oud-agarwood": "Deep resinous wood, sometimes smoky or animalic.",
  neroli: "Fresh, green citrus flowers.",
  saffron: "Soft, bittersweet spice with leathery and haylike facets.",
  benzoin: "Rounded resin sweetness, recalling vanilla and gentle cinnamon.",
  osmanthus: "Creamy flowers with apricot, plum and soft suede associations.",
  galbanum: "Bitter green resin with earthy, woody depth.",
  tuberose: "Dense white flowers, with creamy and sometimes camphorlike facets.",
  "ylang-ylang": "Rich, buttery flowers with fruity and softly spicy nuances.",
  geranium: "Green rosiness, sometimes with lemon and mint accents.",
  oakmoss: "Earthy woods and the damp impression of a forest floor.",
  heliotrope: "Powdery floral sweetness, recalling almond and vanilla.",
  ginger: "Lively, sharp spice with a tingling freshness.",
  "ciste-labdanum": "Warm resin with leathery, honeyed and sometimes plumlike facets.",
  myrrh: "Earthy resin with a bitter edge.",
  petitgrain: "Fresh green wood with bitter citrus and orange-flower accents.",
  fig: "Juicy fruit and milky sweetness, sometimes with bitter green leaves.",
  blackcurrant: "Tart, sweet fruit; bud notes can be greener and more animalic.",
  "blackcurrant-bud": "Green, fruity wood with a slightly animalic edge.",
  cashmeran: "Soft woody musk with powdery and gently spicy facets.",
  aldehyde: "A varied group of impressions, from sparkling citrus to waxy cleanliness.",
};

// Individual references for the expanded entries; original definitions use the ingredient index.
export const NOTE_REFERENCES: Readonly<Record<string, string>> = Object.fromEntries(
  ["saffron", "benzoin", "osmanthus", "galbanum", "tuberose", "ylang-ylang", "geranium", "oakmoss", "heliotrope", "ginger", "ciste-labdanum", "myrrh", "petitgrain", "fig", "blackcurrant", "blackcurrant-bud", "cashmeran", "aldehyde"].map(key => [key, `https://perfumesociety.org/ingredients-post/${({ "ciste-labdanum": "labdanum", "blackcurrant-bud": "blackcurrant", aldehyde: "aldehydes" } as Record<string, string>)[key] ?? key}/`]),
);

export const FAMILY_GUIDE: Readonly<Record<string, string>> = {
  Floral: "Flowers lead, from a single bloom to a layered bouquet.",
  "Soft Floral": "A softer floral impression, often powdery or gently aldehydic.",
  "Floral Amber": "Floral notes meet the sweetness and warmth of amber.",
  "Soft Amber": "Gentle amber warmth with a softer, less dense impression.",
  Amber: "Warm resins, balsamic sweetness and often spice.",
  "Woody Amber": "Amber warmth with a pronounced woody character.",
  Woods: "A woody center, from creamy sandalwood to dry cedar.",
  "Mossy Woods": "Woody depth with a mossy, earthy character.",
  "Dry Woods": "Dry woods with leathery or smoky associations.",
  "Aromatic Fougère": "An aromatic style associated with lavender, herbs and mossy warmth.",
  Citrus: "The brightness of citrus peel, from bitter to juicy.",
  Water: "An airy, aquatic impression suggesting water or sea air.",
  Green: "The freshness of leaves, stems and cut grass.",
  Fruity: "Fruit impressions beyond citrus, from crisp to ripe and sweet.",
};

export function fragranceIntroduction(f: FragranceSummary): string {
  const identity = f.wheel ? `In the ${f.wheel} family${f.character ? `, with a ${f.character.toLowerCase()} character` : ""}.` :
    f.family ? `Listed in the ${f.family.toLowerCase()} family.` : "Explore its listed notes and catalog profile.";
  const listed = f.notes.slice(0, 3);
  if (!listed.length) return identity;
  const joined = listed.length < 2 ? listed[0] : `${listed.slice(0, -1).join(", ")} and ${listed.at(-1)}`;
  return `${identity} The catalog lists ${joined.toLowerCase()}${f.notes.length > 3 ? " among its notes" : ""}.`;
}

/** Only a full, explicit format in the name is displayed. No guessed percentages. */
export function namedConcentration(name: string): string | null {
  if (/\bextrait de parfum\b/i.test(name)) return "Extrait de parfum";
  if (/\beau de parfum\b/i.test(name)) return "Eau de parfum";
  if (/\beau de toilette\b/i.test(name)) return "Eau de toilette";
  if (/\beau de cologne\b/i.test(name)) return "Eau de cologne";
  return null;
}
