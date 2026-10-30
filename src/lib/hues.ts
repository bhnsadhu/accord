/**
 * Keys run in Edwards wheel order (Floral round to Fruity), so iterating the
 * map walks the wheel. One stain hue per Edwards wheel family, fixed across every surface so a
 * colour always means the same accord. Unparsed accords stay unstained.
 */
export const WHEEL_HUES: Record<string, string> = {
  Floral: "#d98ba0",
  "Soft Floral": "#c9a3c8",
  "Floral Amber": "#e0a16a",
  "Soft Amber": "#d9b36c",
  Amber: "#c47a3a",
  "Woody Amber": "#a8693f",
  Woods: "#8b6a4a",
  "Mossy Woods": "#6f7a4a",
  "Dry Woods": "#6b4e3d",
  "Aromatic Fougère": "#7e9a6b",
  Citrus: "#e3c84b",
  Water: "#6fa8c7",
  Green: "#8db36a",
  Fruity: "#e07a5f",
};

export const WHEEL_ORDER = Object.keys(WHEEL_HUES);

export const UNSTAINED = "#c4c6c0";

export function hueFor(wheel: string | null | undefined): string {
  return (wheel && WHEEL_HUES[wheel]) || UNSTAINED;
}

export const GENDER_LABEL = { feminine: "Feminine", masculine: "Masculine", unisex: "Unisex" } as const;
