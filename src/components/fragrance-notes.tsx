import Link from "next/link";
import { ArrowIcon, PlusIcon } from "@/components/icons";
import { NOTE_GUIDE } from "@/lib/fragrance-guide";
import type { FragranceResearch } from "@/lib/catalog/research-schema";
import { SourceLinks } from "./fragrance-research";
import { slugify } from "@/lib/catalog/text";

/** Native disclosures keep the note reference usable before hydration and without JS. */
export function FragranceNotes({ notes, research, library = notes }: { notes: { key: string; label: string }[]; research?: FragranceResearch | null; library?: { key: string; label: string }[] }) {
  const stages = research?.noteStages;
  const keyFor = (label: string) => library.find(n => n.key === slugify(label))?.key;
  const list = notes.length ? <div className="reference-notes">
    {notes.map(note => <details key={note.key} name="fragrance-note" className="reference-note">
      <summary><span>{note.label}</span><PlusIcon /></summary>
      <div className="reference-note-body"><p>{NOTE_GUIDE[note.key] ?? "This note is listed in the catalog. Explore the fragrances that include it."}</p>
        {NOTE_GUIDE[note.key] && <p className="reference-caption">A general scent description, not its strength in this fragrance.</p>}
        <Link href={`/notes/${encodeURIComponent(note.key)}`}>Explore {note.label.toLowerCase()} <ArrowIcon /></Link>
      </div>
    </details>)}
  </div> : <p className="reference-empty">Notes are not listed for this fragrance. Its family and related fragrances can still give you a starting point.</p>;
  return (
    <section id="notes" className="reference-section" aria-labelledby="notes-h">
      <div className="reference-section-heading">
        <h2 id="notes-h">The notes</h2>
        <Link href="/notes">Browse the note library <ArrowIcon /></Link>
      </div>
      {stages ? <>
        <p className="reference-caption">The source’s note stages describe how the composition is presented. They are not a timed schedule.</p>
        <div className="research-note-stages">{([ ["opening", "Opening", "The first impression"], ["heart", "Heart", "The central character"], ["base", "Base", "The lasting foundation"] ] as const).map(([key, label, description]) => <div key={key}><h3>{label}</h3><p>{description}</p><ul>{stages[key].length ? stages[key].map(note => <li key={note}>{keyFor(note) ? <Link href={`/notes/${keyFor(note)}`}>{note}<ArrowIcon width={14} height={14} /></Link> : note}</li>) : <li>Not listed</li>}</ul></div>)}</div>
        <SourceLinks research={research!} field="noteStages" />
        <details className="reference-provenance"><summary>All catalog notes <PlusIcon /></summary><p className="reference-caption">Catalog listings and brand descriptions can differ. These are the original listed notes used in Accord’s similarity comparisons.</p>{list}</details>
      </> : <><p className="reference-caption">Open a note to get to know it. Listed in catalog order, without top, heart or base assignments.</p>{list}</>}
    </section>
  );
}
