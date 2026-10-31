import { PageShell, PageTitle } from "@/components/page-shell";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowIcon } from "@/components/icons";
import { StripRow } from "@/components/strip";
import { cachedNote, cachedSearch } from "@/lib/catalog/cached";
import { GUIDE_SOURCES, NOTE_GUIDE } from "@/lib/fragrance-guide";

export function generateStaticParams() { return ["sandalwood", "bergamot", "musk"].map(key => ({ key })); }

export async function generateMetadata({ params }: PageProps<"/notes/[key]">): Promise<Metadata> {
  const note = await cachedNote((await params).key);
  return note ? { title: `${note.label}: fragrance note guide`, description: NOTE_GUIDE[note.key] ?? `Explore fragrances that list ${note.label.toLowerCase()} in Accord’s catalog.`, alternates: { canonical: `/notes/${note.key}` } } : { title: "Note not found" };
}

export default function NotePage({ params }: PageProps<"/notes/[key]">) {
  return <PageShell width="reference" className="knowledge-page note-reference-page"><Suspense fallback={<p className="reference-empty" role="status">Loading the note.</p>}><NoteDetail params={params} /></Suspense></PageShell>;
}

async function NoteDetail({ params }: { params: Promise<{ key: string }> }) {
  const note = await cachedNote((await params).key);
  if (!note) notFound();
  const examples = await cachedSearch({ notes: [note.key], pageSize: 8 });
  const definition = NOTE_GUIDE[note.key];
  return <>
    <nav className="reference-wayfinding" aria-label="Note navigation"><Link href="/notes">Note library</Link><Link href="/learn">Fragrance guide</Link></nav>
    <PageTitle>{note.label}</PageTitle>
    <p className="page-intro knowledge-lead">{definition ?? "Explore the fragrances that list this note, and the other notes they bring together."}</p>
    <div className="note-reference-intro">
      <p>{definition ? "This describes the note in general. Its impression changes with the composition, and a listed note does not tell you how much is used." : "A scent description is not yet included for this note. The fragrances below come directly from its catalog listings."}</p>
      {definition && <a href={GUIDE_SOURCES.ingredients.href}>Reference: The Perfume Society <ArrowIcon /></a>}
    </div>
    <section className="reference-section" aria-labelledby="note-fragrances-h">
      <div className="reference-section-heading"><div><h2 id="note-fragrances-h">Find it in a fragrance</h2><p className="reference-caption mt-2">{examples.total.toLocaleString("en-US")} {examples.total === 1 ? "fragrance lists" : "fragrances list"} {note.label.toLowerCase()}. An alphabetical starting point.</p></div><Link href={`/discover?note=${encodeURIComponent(note.key)}`}>Explore all <ArrowIcon /></Link></div>
      <div className="note-fragrance-list">{examples.items.map(fragrance => <StripRow key={fragrance.productId} fragrance={fragrance}>
        <p className="mt-1 text-[15px]">Lists {note.label.toLowerCase()}</p>
        <p className="mt-1 truncate text-sm text-ink-2">{fragrance.notes.filter(label => label !== note.label).length > 0 ? `Also ${fragrance.notes.filter(label => label !== note.label).slice(0, 4).join(", ").toLowerCase()}` : "No other notes listed"}</p>
      </StripRow>)}</div>
      {examples.total === 0 && <p className="reference-empty">No fragrances currently list this note. <Link href="/notes">Explore another note.</Link></p>}
    </section>
    <aside className="knowledge-next"><div><h2>A note is one part of the story.</h2><p>Family, composition and the way a fragrance develops all shape the impression.</p></div><Link href="/learn">Learn to read a fragrance <ArrowIcon /></Link></aside>
  </>;
}
