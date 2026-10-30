import Link from "next/link";
import { ArrowIcon, PlusIcon } from "@/components/icons";
import { NOTE_GUIDE } from "@/lib/fragrance-guide";

/** Native disclosures keep the note reference usable before hydration and without JS. */
export function FragranceNotes({ notes }: { notes: { key: string; label: string }[] }) {
  return (
    <section id="notes" className="reference-section" aria-labelledby="notes-h">
      <div className="reference-section-heading">
        <h2 id="notes-h">The notes</h2>
        <Link href="/notes">Browse the note library <ArrowIcon /></Link>
      </div>
      <p className="reference-caption">Open a note to get to know it. Listed in catalog order, without top, heart or base assignments.</p>
      {notes.length ? <div className="reference-notes">
        {notes.map(note => <details key={note.key} name="fragrance-note" className="reference-note">
          <summary><span>{note.label}</span><PlusIcon /></summary>
          <div className="reference-note-body">
            <p>{NOTE_GUIDE[note.key] ?? "This note is listed in the catalog. Explore the fragrances that include it."}</p>
            {NOTE_GUIDE[note.key] && <p className="reference-caption">A general scent description, not its strength in this fragrance.</p>}
            <Link href={`/notes/${encodeURIComponent(note.key)}`}>Explore {note.label.toLowerCase()} <ArrowIcon /></Link>
          </div>
        </details>)}
      </div> : <p className="reference-empty">Notes are not listed for this fragrance. Its family and related fragrances can still give you a starting point.</p>}
    </section>
  );
}
