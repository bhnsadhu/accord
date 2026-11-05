import { PageShell } from "@/components/page-shell";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StripRow } from "@/components/strip";
import { cachedPerfumers, cachedSearch } from "@/lib/catalog/cached";
import { slugify } from "@/lib/catalog/text";

async function find(slug: string) {
  return (await cachedPerfumers()).find(p => slugify(p.name) === slug) ?? null;
}

export function generateStaticParams() {
  return [{ slug: "frank-voelkl" }];
}

export async function generateMetadata({ params }: PageProps<"/perfumers/[slug]">): Promise<Metadata> {
  const p = await find((await params).slug);
  return p ? { title: `${p.name}, perfumer`, description: `Fragrances by ${p.name} in Accord’s catalog.`, alternates: { canonical: `/perfumers/${slugify(p.name)}` } } : { title: "Perfumer not found" };
}

export default function PerfumerPage({ params }: PageProps<"/perfumers/[slug]">) {
  return (
    <PageShell width="reference" className="knowledge-page">
      <Suspense fallback={<div className="reference-empty" aria-busy="true">Loading the perfumer</div>}><Perfumer params={params} /></Suspense>
    </PageShell>
  );
}

async function Perfumer({ params }: { params: Promise<{ slug: string }> }) {
  const p = await find((await params).slug);
  if (!p) notFound();
  const list = await cachedSearch({ perfumer: p.name, sort: "newest", pageSize: 60 });
  return (
    <>
      <nav className="reference-wayfinding" aria-label="Perfumer navigation"><Link href="/perfumers">All perfumers</Link><Link href="/brands">Houses</Link></nav>
      <p className="text-lg text-ink-2">Perfumer</p>
      <h1 className="mt-1 text-[clamp(40px,5vw,72px)] font-semibold leading-[1] tracking-[-0.035em] text-balance">{p.name}</h1>
      <dl className="house-stats">
        <div><dt>Credited fragrances</dt><dd className="font-mono tabular">{p.n}</dd></div>
        <div><dt>Houses</dt><dd>{p.houses.join(", ")}</dd></div>
      </dl>
      <section className="reference-section section-divider" aria-labelledby="works-h">
        <div className="reference-section-heading"><h2 id="works-h">Fragrances</h2></div>
        <div className="grid gap-3">{list.items.map(f => <StripRow key={f.productId} fragrance={f} meta={<>{f.year ? <> · {f.year}</> : null}{f.wheel ? <> · {f.wheel}</> : null}</>} />)}</div>
        <p className="reference-caption mt-4">Listed where a source credits {p.name}. Co-authors appear on each fragrance page.</p>
      </section>
    </>
  );
}
