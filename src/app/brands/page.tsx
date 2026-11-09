import { PageShell, PageTitle } from "@/components/page-shell";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowIcon, SearchIcon } from "@/components/icons";
import { cachedBrands } from "@/lib/catalog/cached";
import { foldText } from "@/lib/catalog/text";

export const metadata: Metadata = { title: "Fragrance houses", description: "Every fragrance house in Accord’s catalog, from A to Z, with the number of fragrances listed for each." };

export default function BrandsPage({ searchParams }: PageProps<"/brands">) {
  return (
    <PageShell width="reference" className="knowledge-page">
      <PageTitle>Fragrance houses</PageTitle>
      <p className="page-intro knowledge-lead">Every house in the catalog, from heritage names to independent perfumers. Open one to see its whole line, its families and its notes.</p>
      <nav className="reference-wayfinding page-wayfinding" aria-label="Directory navigation"><Link href="/discover">Discover</Link><Link href="/perfumers">Perfumers</Link><Link href="/notes">Notes</Link><Link href="/releases">Releases</Link></nav>
      <Suspense fallback={<p className="reference-empty" role="status">Loading houses.</p>}><BrandIndex searchParams={searchParams} /></Suspense>
    </PageShell>
  );
}

const letterOf = (name: string) => {
  const first = foldText(name).charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
};

async function BrandIndex({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const [raw, brands] = await Promise.all([searchParams, cachedBrands()]);
  const q = (Array.isArray(raw.q) ? raw.q[0] : raw.q ?? "").trim().slice(0, 80);
  const matches = brands.filter(b => foldText(b.name).includes(foldText(q))).sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  const groups = new Map<string, typeof matches>();
  for (const b of matches) {
    const letter = letterOf(b.name);
    groups.set(letter, [...(groups.get(letter) ?? []), b]);
  }
  const letters = [...groups.keys()].sort((a, b) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)));
  return (
    <>
      {!q && (
        <section aria-labelledby="largest-h" className="mt-10">
          <h2 id="largest-h" className="directory-heading">Largest houses in the catalog</h2>
          <div className="directory-featured">
            {brands.slice(0, 12).map(b => <Link key={b.id} href={`/brands/${b.slug}`}><strong>{b.name}</strong><span className="font-mono tabular">{b.fragranceCount.toLocaleString("en-US")} fragrances</span></Link>)}
          </div>
        </section>
      )}
      <form action="/brands" role="search" className="knowledge-search">
        <label><SearchIcon /><span className="sr-only">Search houses</span><input name="q" type="search" defaultValue={q} placeholder="Search a house, like Guerlain" maxLength={80} /></label>
        <button type="submit">Search</button>
      </form>
      <div className="knowledge-index-heading"><p>{matches.length.toLocaleString("en-US")} {matches.length === 1 ? "house" : "houses"}{q ? ` matching “${q}”` : " in the catalog"}</p>{q && <Link href="/brands">Clear search</Link>}</div>
      {!matches.length ? (
        <div className="reference-empty"><p>No houses match “{q}”. Try a shorter name, or search fragrances directly.</p><Link href={`/discover?q=${encodeURIComponent(q)}`}>Search fragrances <ArrowIcon /></Link></div>
      ) : (
        <>
          <nav className="directory-letters" aria-label="Jump to letter">{letters.map(l => <a key={l} href={`#letter-${l === "#" ? "other" : l}`}>{l}</a>)}</nav>
          {letters.map(l => (
            <section key={l} id={`letter-${l === "#" ? "other" : l}`} className="directory-group" aria-label={l === "#" ? "Other" : l}>
              <h2>{l}</h2>
              <div className="directory-list">{groups.get(l)!.map(b => <Link key={b.id} href={`/brands/${b.slug}`}><span>{b.name}</span><span>{b.fragranceCount}</span></Link>)}</div>
            </section>
          ))}
        </>
      )}
    </>
  );
}
