import { foldText } from "./text";
import type { CONCENTRATIONS } from "./research-schema";

const formats: [RegExp, typeof CONCENTRATIONS[number]][] = [
  [/\b(?:extrait de parfum|extrait)\b/g, "Extrait de parfum"],
  [/\b(?:eau de parfum|edp)\b/g, "Eau de parfum"],
  [/\b(?:eau de toilette|edt)\b/g, "Eau de toilette"],
  [/\b(?:eau de cologne|edc)\b/g, "Eau de cologne"],
];

/** Explicit format queries are strict so EDT never silently substitutes for EDP. */
export function parseFragranceQuery(input: string) {
  let text = foldText(input).slice(0, 80)
    .replace(/\bysl\b/g, "yves saint laurent")
    .replace(/\bmfk\b/g, "maison francis kurkdjian")
    .replace(/\bbdc\b/g, "bleu de chanel")
    .replace(/\bbr\s?540\b/g, "baccarat rouge 540");
  let concentration: typeof CONCENTRATIONS[number] | undefined;
  for (const [pattern, format] of formats) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) { concentration = format; text = text.replace(pattern, " "); break; }
  }
  // "Le Parfum" can be the product name, so retain that phrase as identity text.
  if (!concentration && /\bparfum\b/.test(text) && !/\ble parfum\b/.test(text)) {
    concentration = "Parfum";
    text = text.replace(/\bparfum\b/g, " ");
  }
  return { text: text.replace(/\s+/g, " ").trim(), concentration };
}
