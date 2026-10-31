import { PageShell, PageTitle } from "@/components/page-shell";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowIcon, SearchIcon } from "@/components/icons";
import { cachedNotes } from "@/lib/catalog/cached";
import { foldText } from "@/lib/catalog/text";
import { NOTE_GUIDE } from "@/lib/fragrance-guide";

export const metadata: Metadata = { title: "Fragrance notes", description: "Get to know fragrance notes and find the perfumes that list them in Accord’s catalog." };

export default function NotesPage({ searchParams }: PageProps<"/notes">) {
  return <PageShell width="reference" className="knowledge-page">
    <PageTitle>The note library</PageTitle>
    <p className="page-intro knowledge-lead">Put a name to what you smell. Get to know a note, then follow it into a fragrance.</p>
    <nav className="reference-wayfinding page-wayfinding" aria-label="Note navigation"><Link href="/discover">Discover</Link><Link href="/learn">Fragrance guide</Link></nav>
    <Suspense fallback={<p className="reference-empty" role="status">Loading the note library.</p>}><NoteIndex searchParams={searchParams} /></Suspense>
  </PageShell>;
}

async function NoteIndex({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const [raw, notes] = await Promise.all([searchParams, cachedNotes()]);
  const q = (Array.isArray(raw.q) ? raw.q[0] : raw.q ?? "").trim().slice(0, 80);
  const matches = notes.filter(note => foldText(note.label).includes(foldText(q))).sort((a, b) => a.label.localeCompare(b.label, "en"));
  return <>
    <form action="/notes" role="search" className="knowledge-search">
      <label><SearchIcon /><span className="sr-only">Search notes</span><input name="q" type="search" defaultValue={q} placeholder="Search a note, like sandalwood" maxLength={80} /></label>
      <button type="submit">Search</button>
    </form>
    <div className="knowledge-index-heading"><p>{matches.length.toLocaleString("en-US")} {matches.length === 1 ? "note" : "notes"}{q ? ` matching “${q}”` : " in the catalog"}</p>{q && <Link href="/notes">Clear search</Link>}</div>
    {!matches.length ? <div className="reference-empty"><p>No notes match “{q}”. Try a shorter name.</p><Link href="/notes">Browse all notes <ArrowIcon /></Link></div> :
      <ul className="knowledge-index">{matches.map(note => <li key={note.key}>
        <Link href={`/notes/${note.key}`}><span><strong>{note.label}</strong><span>{NOTE_GUIDE[note.key] ?? `${note.fragranceCount.toLocaleString("en-US")} fragrances list this note`}</span></span><ArrowIcon /></Link>
      </li>)}</ul>}
    <p className="reference-caption mt-8">Notes describe scent impressions, not a full ingredient list. Short reference descriptions are available for selected notes.</p>
  </>;
}
