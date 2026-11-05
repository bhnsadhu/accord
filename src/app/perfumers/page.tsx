import { PageShell, PageTitle } from "@/components/page-shell";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cachedCoverage, cachedPerfumers } from "@/lib/catalog/cached";
import { slugify } from "@/lib/catalog/text";

export const metadata: Metadata = { title: "Perfumers", description: "The perfumers credited in Accord’s reviewed fragrance research, and the fragrances they composed." };

export default function PerfumersPage() {
  return (
    <PageShell width="reference" className="knowledge-page">
      <PageTitle>Perfumers</PageTitle>
      <p className="page-intro knowledge-lead">The noses behind the fragrances. Accord credits a perfumer only when a brand, the perfumer or a named reference source confirms it.</p>
      <nav className="reference-wayfinding page-wayfinding" aria-label="Directory navigation"><Link href="/brands">Houses</Link><Link href="/discover">Discover</Link><Link href="/notes">Notes</Link></nav>
      <Suspense fallback={<p className="reference-empty" role="status">Loading perfumers.</p>}><PerfumerIndex /></Suspense>
    </PageShell>
  );
}

async function PerfumerIndex() {
  const [perfumers, coverage] = await Promise.all([cachedPerfumers(), cachedCoverage()]);
  return (
    <>
      {perfumers.length ? (
        <div className="directory-featured mt-10">
          {perfumers.map(p => <Link key={p.name} href={`/perfumers/${slugify(p.name)}`}><strong>{p.name}</strong><span>{p.n} {p.n === 1 ? "fragrance" : "fragrances"} · {p.houses.join(", ")}</span></Link>)}
        </div>
      ) : (
        <p className="reference-empty mt-10">No perfumer credits have been verified yet.</p>
      )}
      <p className="reference-caption mt-8">Perfumer credits cover {coverage.withPerfumers.toLocaleString("en-US")} of {coverage.total.toLocaleString("en-US")} catalog entries so far. More are added as each one is checked against a source. <Link href="/learn#catalog">How the catalog grows</Link></p>
    </>
  );
}
