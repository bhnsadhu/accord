import bottleManifest from "../../../data/media/bottles.json";
import noteManifest from "../../../data/media/notes.json";

export type ReferenceImage = {
  path: string; width: number; height: number; alt: string;
  author: string; source: string; license: string; licenseUrl: string;
  checkedAt: string; changes: string;
};
export type BottleImage = ReferenceImage & {
  productId: string; name: string; brand: string; concentration: string;
  thumbnail: string; position: string; caption: string; fit?: string;
};

// Exact catalog IDs only. Never reuse a sibling edition's bottle by name or brand.
const bottles: Readonly<Record<string, BottleImage>> = bottleManifest;
const notes: Readonly<Record<string, ReferenceImage>> = noteManifest;
export const bottleImage = (id: string): BottleImage | undefined => bottles[id];
export const noteImage = (key: string): ReferenceImage | undefined => notes[key];

/** Reference aliases do not change the listed note or the catalog's similarity data. */
const noteAliases: Record<string, string> = { cedar: "cedarwood", iris: "iris-orris", orris: "iris-orris", "jasmine-sambac": "jasmine", "may-rose": "rose", "bourbon-vanilla": "vanilla", "black-leather-accord": "leather", "sicilian-bergamot": "bergamot", "calabrian-bergamot": "bergamot" };
export const noteReferenceKey = (key: string) => noteAliases[key] ?? key;
