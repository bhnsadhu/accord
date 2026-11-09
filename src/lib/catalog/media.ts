import noteManifest from "../../../data/media/notes.json";

export type ReferenceImage = {
  path: string; width: number; height: number; alt: string;
  author: string; source: string; license: string; licenseUrl: string;
  checkedAt: string; changes: string; provenanceNote?: string;
  kind?: "photo" | "illustration" | "structure";
  referenceNote?: string;
};
export type BottleImage = ReferenceImage & {
  productId: string; name: string; brand: string; concentration: string;
  thumbnail: string; position: string; caption: string; fit?: string; catalogPhoto?: boolean;
};

const notes = noteManifest as Readonly<Record<string, ReferenceImage>>;
export const noteImage = (key: string): ReferenceImage | undefined => notes[key] ?? notes[noteReferenceKey(key)];

/** Reference aliases do not change the listed note or the catalog's similarity data. */
const noteAliases: Record<string, string> = { cedar: "cedarwood", iris: "iris-orris", orris: "iris-orris", "jasmine-sambac": "jasmine", "may-rose": "rose", "bourbon-vanilla": "vanilla", "black-leather-accord": "leather", "sicilian-bergamot": "bergamot", "calabrian-bergamot": "bergamot" };
export const noteReferenceKey = (key: string) => noteAliases[key] ?? key;
