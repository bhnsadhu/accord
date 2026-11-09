import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageShell, PageTitle } from "@/components/page-shell";
import { ArrowIcon } from "@/components/icons";
import { StripRow } from "@/components/strip";
import { cachedSearch, cachedYears } from "@/lib/catalog/cached";

export const metadata: Metadata = {
  title: "Fragrance releases",
  description: "Explore the newest release years in Accord’s catalog and browse fragrances by year.",
  alternates: { canonical: "/releases" },
};

export default function ReleasesPage() {
  return (
    <PageShell width="reference" className="knowledge-page">
      <PageTitle>Fragrance releases</PageTitle>
      <p className="page-intro knowledge-lead">Explore recent releases in the catalog, or revisit a year in fragrance.</p>
      <nav className="reference-wayfinding page-wayfinding" aria-label="Directory navigation"><Link href="/discover">Discover</Link><Link href="/brands">Houses</Link><Link href="/perfumers">Perfumers</Link><Link href="/notes">Notes</Link></nav>
      <Suspense fallback={<p className="reference-empty" role="status">Loading releases.</p>}><Releases /></Suspense>
    </PageShell>
  );
}

async function Releases() {
  const [newest, years] = await Promise.all([cachedSearch({ sort: "newest", pageSize: 8 }), cachedYears()]);
  return (
    <>
      <section className="reference-section" aria-labelledby="newest-h">
        <div className="reference-section-heading"><h2 id="newest-h">Newest in the catalog</h2><Link href="/discover?sort=newest">All by release year <ArrowIcon /></Link></div>
        <div className="grid gap-3">{newest.items.map(f => <StripRow key={f.productId} fragrance={f} meta={<>{f.year ? <> · {f.year}</> : null}{f.wheel ? <> · {f.wheel}</> : null}</>} />)}</div>
        <p className="reference-caption mt-4">Ordered by listed release year. Catalog coverage varies by house and year.</p>
      </section>
      <section className="reference-section" aria-labelledby="years-h">
        <div className="reference-section-heading"><h2 id="years-h">Browse by release year</h2></div>
        <div className="chip-links">{years.slice(0, 40).map(y => <Link key={y.year} href={`/discover?year=${y.year}`}>{y.year}<span>{y.n}</span></Link>)}</div>
      </section>
    </>
  );
}
