import { PageShell } from "@/components/page-shell";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import { ArrowIcon } from "@/components/icons";
import { StripRow } from "@/components/strip";
import { cachedBrandOverview, cachedSearch } from "@/lib/catalog/cached";
import { slugify } from "@/lib/catalog/text";
import { GENDER_LABEL, hueFor } from "@/lib/hues";

// Prerender a fallback shell; every other house renders on first visit and is then cached.
export function generateStaticParams() {
  return [{ slug: "le-labo" }, { slug: "chanel" }];
}

export async function generateMetadata({ params }: PageProps<"/brands/[slug]">): Promise<Metadata> {
  const overview = await cachedBrandOverview((await params).slug);
  if (!overview) return { title: "House not found" };
  const { brand } = overview;
  return { title: `${brand.name} fragrances`, description: `All ${brand.fragranceCount} ${brand.name} fragrances in Accord’s catalog, with their families, notes and perfumers.`, alternates: { canonical: `/brands/${brand.slug}` } };
}

type Raw = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const SORTS = { newest: "Newest", oldest: "Oldest", name: "A to Z" } as const;

export default function BrandPage({ params, searchParams }: PageProps<"/brands/[slug]">) {
  return (
    <PageShell width="reference" className="knowledge-page">
      <Suspense fallback={<div className="reference-empty" aria-busy="true">Loading the house</div>}>
        <House params={params} searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}

async function House({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Raw> }) {
  const [{ slug }, raw] = await Promise.all([params, searchParams]);
  const overview = await cachedBrandOverview(slug);
  if (!overview) notFound();
  const { brand, span, families, perfumers, topNotes, genders } = overview;
  const sortRaw = one(raw.sort);
  const sort = sortRaw === "oldest" || sortRaw === "name" ? sortRaw : "newest";
  const page = Math.min(Math.max(Number.parseInt(one(raw.page) ?? "1", 10) || 1, 1), 500);
  const list = await cachedSearch({ brand: slug, sort, page, pageSize: 30 });
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  const classified = families.reduce((a, f) => a + f.n, 0);
  const query = (patch: Record<string, string | number>) => {
    const p = new URLSearchParams({ ...(sort !== "newest" ? { sort } : {}), ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, String(v)])) });
    if (p.get("page") === "1") p.delete("page");
    if (p.get("sort") === "newest") p.delete("sort");
    const s = p.toString();
    return `/brands/${slug}${s ? `?${s}` : ""}#line`;
  };

  return (
    <>
      <nav className="reference-wayfinding" aria-label="House navigation"><Link href="/brands">All houses</Link><Link href="/discover">Discover</Link><Link href="/perfumers">Perfumers</Link></nav>
      <p className="text-lg text-ink-2">Fragrance house</p>
      <h1 className="mt-1 text-[clamp(40px,5vw,72px)] font-semibold leading-[1] tracking-[-0.035em] text-balance">{brand.name}</h1>
      <dl className="house-stats">
        <div><dt>In the catalog</dt><dd className="font-mono tabular">{brand.fragranceCount.toLocaleString("en-US")}</dd></div>
        <div><dt>Release years</dt><dd className="font-mono tabular">{span.first ? (span.first === span.last ? span.first : `${span.first} to ${span.last}`) : "Not listed"}</dd></div>
        <div><dt>Leading family</dt><dd>{families[0] ? <Link href={`/discover?brand=${slug}&wheel=${encodeURIComponent(families[0].wheel)}`}>{families[0].wheel}</Link> : "Not listed"}</dd></div>
        <div><dt>Marketed mostly as</dt><dd>{genders[0] ? GENDER_LABEL[genders[0].gender as keyof typeof GENDER_LABEL] : "Not listed"}</dd></div>
      </dl>

      {classified > 0 && (
        <section className="reference-section" aria-labelledby="mix-h">
          <div className="reference-section-heading"><h2 id="mix-h">Family mix</h2><Link href="/learn#families">Read the families <ArrowIcon /></Link></div>
          <div className="house-mix" role="img" aria-label={families.map(f => `${f.wheel} ${Math.round((f.n / classified) * 100)} percent`).join(", ")}>
            {families.map(f => <i key={f.wheel} style={{ width: `${(f.n / classified) * 100}%`, "--hue": hueFor(f.wheel) } as CSSProperties} />)}
          </div>
          <div className="house-mix-legend">
            {families.map(f => <Link key={f.wheel} href={`/discover?brand=${slug}&wheel=${encodeURIComponent(f.wheel)}`} style={{ "--hue": hueFor(f.wheel) } as CSSProperties}><i />{f.wheel}<span className="font-mono text-ink-3 tabular">{f.n}</span></Link>)}
          </div>
          <p className="reference-caption mt-2">Share of this house’s classified fragrances in each accord family.</p>
        </section>
      )}

      {topNotes.length > 0 && (
        <section className="reference-section" aria-labelledby="house-notes-h">
          <div className="reference-section-heading"><h2 id="house-notes-h">Notes the house returns to</h2></div>
          <div className="chip-links">{topNotes.map(n => <Link key={n.key} href={`/discover?brand=${slug}&note=${n.key}`}>{n.label}<span>{n.n}</span></Link>)}</div>
          <p className="reference-caption mt-3">How many of its listed fragrances name each note.</p>
        </section>
      )}

      {perfumers.length > 0 && (
        <section className="reference-section" aria-labelledby="house-perfumers-h">
          <div className="reference-section-heading"><h2 id="house-perfumers-h">Perfumers</h2><Link href="/perfumers">All perfumers <ArrowIcon /></Link></div>
          <div className="chip-links">{perfumers.map(p => <Link key={p.name} href={`/perfumers/${slugify(p.name)}`}>{p.name}<span>{p.n}</span></Link>)}</div>
          <p className="reference-caption mt-3">From reviewed sources. Most catalog entries do not yet credit a perfumer.</p>
        </section>
      )}

      <section id="line" className="reference-section section-divider" aria-labelledby="line-h">
        <div className="reference-section-heading flex-wrap">
          <h2 id="line-h">The full line <span className="font-mono text-ink-3 tabular">{list.total}</span></h2>
          <nav className="archive-sort flex gap-4 text-sm" aria-label="Sort the line">{Object.entries(SORTS).map(([key, label]) => <Link key={key} href={query({ sort: key, page: 1 })} aria-current={sort === key ? "true" : undefined} className="inline-flex min-h-11 items-center text-ink-2 aria-[current=true]:font-semibold aria-[current=true]:text-ink">{label}</Link>)}</nav>
        </div>
        <div className="grid gap-3">
          {list.items.map(f => <StripRow key={f.productId} fragrance={f} meta={<>{f.year ? <> · {f.year}</> : null}{f.wheel ? <> · {f.wheel}</> : null}{f.concentration ? <> · {f.concentration}</> : null}</>} />)}
        </div>
        {pages > 1 && (
          <nav className="pagination" aria-label="Pages">
            {page > 1 ? <Link href={query({ page: page - 1 })}>Previous</Link> : <span />}
            <span className="font-mono text-ink-3 tabular">Page {page} of {pages}</span>
            {page < pages ? <Link href={query({ page: page + 1 })}>Next</Link> : <span />}
          </nav>
        )}
        <Link href={`/discover?brand=${slug}`} className="mt-6 inline-flex items-center gap-2 font-medium">Filter this house by notes and family <ArrowIcon /></Link>
      </section>
    </>
  );
}
