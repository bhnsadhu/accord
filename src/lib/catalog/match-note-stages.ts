import { foldText } from "./text";

type Identity = { brand: string; name: string; year?: number | null; concentration?: string | null };
type CatalogIdentity = Identity & { productId: string; hasStages?: boolean };
export type StagedReference = Identity & {
  id: string;
  url: string;
  noteStages: { opening: string[]; heart: string[]; base: string[] };
};

// Only punctuation, accents and spelled-out concentration suffixes are normalized.
// Flanker names, numbers, gender and release years remain part of the identity.
const compact = (value: string) => foldText(value).replace(/ /g, "");
function identity(item: Identity) {
  const full = foldText(item.name);
  const suffix = /(?:^| )(extrait de parfum|eau de parfum|eau de toilette|eau de cologne|parfum)$/.exec(full);
  const concentration = item.concentration ? compact(item.concentration) : suffix ? compact(suffix[1]) : null;
  const conflict = Boolean(item.concentration && suffix && compact(item.concentration) !== compact(suffix[1]));
  return { full: compact(item.name), name: compact(suffix ? full.slice(0, suffix.index) : full), brand: compact(item.brand), concentration, conflict };
}

/** Fail closed on edition ambiguity, conflicting dates and incomplete pyramids. */
export function matchNoteStages(catalog: CatalogIdentity[], references: StagedReference[]) {
  const groups = new Map<string, StagedReference[]>();
  for (const reference of references) {
    const id = identity(reference);
    const key = `${id.brand}|${id.name}`;
    groups.set(key, [...(groups.get(key) ?? []), reference]);
  }
  const matches: { productId: string; reference: StagedReference }[] = [];
  const skipped: { productId: string; reason: string }[] = [];
  for (const item of catalog) {
    if (item.hasStages) { skipped.push({ productId: item.productId, reason: "Existing sourced stages retained" }); continue; }
    const id = identity(item);
    if (id.conflict) { skipped.push({ productId: item.productId, reason: "Conflicting catalog concentration" }); continue; }
    const group = groups.get(`${id.brand}|${id.name}`) ?? [];
    // An unqualified name must have only one source edition, even if one sibling lacks notes.
    const candidates = group.filter(reference => {
      const source = identity(reference);
      if (source.conflict || (item.year && reference.year && item.year !== reference.year)) return false;
      if (id.concentration) return id.concentration === source.concentration;
      return group.length === 1 && id.full === source.full;
    });
    if (candidates.length !== 1) { skipped.push({ productId: item.productId, reason: candidates.length ? "Ambiguous source edition" : "No exact edition match" }); continue; }
    const reference = candidates[0];
    if (!Object.values(reference.noteStages).every(notes => notes.length > 0)) { skipped.push({ productId: item.productId, reason: "No complete published stages" }); continue; }
    matches.push({ productId: item.productId, reference });
  }
  const unique = matches.filter(match => {
    if (matches.filter(other => other.reference.id === match.reference.id).length === 1) return true;
    skipped.push({ productId: match.productId, reason: "Source matches multiple catalog identities" });
    return false;
  });
  return { matches: unique, skipped };
}
