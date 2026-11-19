import Link from "next/link";
import { ArrowIcon, PlusIcon } from "@/components/icons";
import { NOTE_GUIDE } from "@/lib/fragrance-guide";
import type { FragranceResearch } from "@/lib/catalog/research-schema";
import { noteImage, noteReferenceKey } from "@/lib/catalog/media";
import { SourceLinks } from "./fragrance-research";
import { ImageCredit, NotePhoto } from "./reference-image";
import { slugify } from "@/lib/catalog/text";

type Note = { key: string; label: string; available?: boolean };

/** Native disclosures make the visual reference work without waiting for hydration. */
function NoteTiles({ notes, name }: { notes: Note[]; name: string }) {
  return <div className="reference-notes visual-notes">{notes.map(note => {
    const key = noteReferenceKey(note.key);
    const photo = noteImage(key);
    const description = NOTE_GUIDE[key];
    return <details key={note.key} name={name} className={`reference-note ${photo ? "reference-note-photographed" : ""}`}>
      <summary>{photo && <NotePhoto noteKey={key} />}<span>{note.label}</span><PlusIcon /></summary>
      <div className="reference-note-body"><p>{description ?? "This note is listed for the fragrance. Explore other compositions that include it."}</p>
        {note.available === false ? <Link href="/notes">Explore the note library <ArrowIcon /></Link> : <Link href={`/notes/${encodeURIComponent(key)}`}>Explore {note.label.toLowerCase()} <ArrowIcon /></Link>}
        {photo?.referenceNote && <p className="reference-caption">{photo.referenceNote}</p>}
        {photo && <ImageCredit image={photo} />}
      </div>
    </details>;
  })}</div>;
}

export function FragranceNotes({ notes, research, library = notes }: { notes: Note[]; research?: FragranceResearch | null; library?: Note[] }) {
  const stages = research?.noteStages;
  const resolve = (label: string): Note => {
    const key = noteReferenceKey(slugify(label));
    const match = library.find(n => n.key === key);
    return { key: match?.key ?? slugify(label), label, available: Boolean(match) };
  };
  const featured = research?.featuredNotes.map(resolve) ?? [];
  const catalogList = notes.length ? <NoteTiles notes={notes} name="catalog-note" /> : <p className="reference-empty">Notes: Not listed.</p>;
  return <section id="notes" className="reference-section" aria-labelledby="notes-h">
    <div className="reference-section-heading"><h2 id="notes-h">The notes</h2><Link href="/notes">Browse the note library <ArrowIcon /></Link></div>
    <p className="reference-caption">Notes describe scent impressions, not an ingredient list.</p>
    {stages ? <>
      <div className="visual-note-stages">{([ ["opening", "Top notes"], ["heart", "Heart notes"], ["base", "Base notes"] ] as const).map(([key, label]) => <div key={key}><div className="visual-stage-heading"><h3>{label}</h3></div>{stages[key].length ? <NoteTiles notes={stages[key].map(resolve)} name={`stage-${key}`} /> : <p className="reference-caption">Not listed</p>}</div>)}</div>
      <SourceLinks research={research!} field="noteStages" />
    </> : <><p className="reference-caption mt-3">Top, heart and base stages: Not listed.</p>{featured.length ? <><NoteTiles notes={featured} name="featured-note" /><SourceLinks research={research!} field="featuredNotes" /></> : catalogList}</>}
    {(stages || featured.length > 0) && <details className="reference-provenance"><summary>All catalog notes <PlusIcon /></summary><p className="reference-caption">Original catalog notes used for similarity.</p>{catalogList}</details>}
  </section>;
}
