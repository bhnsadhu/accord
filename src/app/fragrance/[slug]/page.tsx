import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import { CollectionControls } from "@/components/collection-controls";
import { FragranceNotes } from "@/components/fragrance-notes";
import { ArrowIcon, PlusIcon } from "@/components/icons";
import { StripRow, StripSpecimen } from "@/components/strip";
import { VisitTracker } from "@/components/visit-tracker";
import { cachedFragrance, cachedSearch, cachedSimilar } from "@/lib/catalog/cached";
import { productIdFromSlug } from "@/lib/catalog/text";
import { FAMILY_GUIDE, fragranceIntroduction, namedConcentration } from "@/lib/fragrance-guide";
import { GENDER_LABEL, hueFor } from "@/lib/hues";

// Prerender the homepage fan; every other fragrance renders on first visit and is then cached.
export function generateStaticParams() {
  return [{ slug: "chanel-chance-eau-de-parfum-p05819" }, { slug: "le-labo-santal-33-p14487" }];
}

export async function generateMetadata({ params }: PageProps<"/fragrance/[slug]">): Promise<Metadata> {
  const id = productIdFromSlug((await params).slug);
  const f = id ? await cachedFragrance(id) : null;
  if (!f) return { title: "Fragrance not found" };
  return {
    title: `${f.name} by ${f.brand}`,
    description: `${f.name} by ${f.brand}. ${fragranceIntroduction(f)}`,
    alternates: { canonical: `/fragrance/${f.slug}` },
  };
}

export default function FragrancePage({ params }: PageProps<"/fragrance/[slug]">) {
  return (
    <div className="fragrance-reference mx-auto w-full max-w-[1440px] px-4 pt-8 sm:px-8 lg:px-16 lg:pt-12">
      <Suspense fallback={<DetailSkeleton />}>
        <Detail params={params} />
      </Suspense>
    </div>
  );
}

async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const id = productIdFromSlug((await params).slug);
  const f = id ? await cachedFragrance(id) : null;
  if (!f) notFound();
  const [similar, house] = await Promise.all([cachedSimilar(f.productId, 10), cachedSearch({ brand: f.brandSlug, pageSize: 5 })]);
  const hue = hueFor(f.wheel);
  const concentration = namedConcentration(f.name);
  const siblings = house.items.filter(item => item.productId !== f.productId).slice(0, 4);

  return (
    <>
      <VisitTracker productId={f.productId} />
      <nav className="reference-wayfinding" aria-label="Fragrance navigation">
        <Link href="/discover">Discover</Link>
        <Link href="/notes">Note library</Link>
        <Link href="/learn">Fragrance guide</Link>
      </nav>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,180px)_minmax(0,1fr)] lg:gap-20">
        {/* The strip itself, standing. */}
        <div className="hidden lg:block" style={{ "--hue": hue } as CSSProperties}>
          <div className="lift sticky top-8">
            <StripSpecimen fragrance={f} className="detail-paper" />
        </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-3 lg:hidden" style={{ "--hue": hue } as CSSProperties}>
            <div className="strip-h h-6 w-24 [--stain-depth:70px]">
              <span className="stain-h" />
            </div>
          </div>
          <Link href={`/discover?brand=${encodeURIComponent(f.brandSlug)}`} className="mt-4 inline-block text-lg text-ink-2 lg:mt-0">
            {f.brand}
          </Link>
          <h1 className="mt-1 text-[clamp(40px,5vw,72px)] font-semibold leading-[1] tracking-[-0.035em] text-balance">{f.name}</h1>
          <p className="reference-introduction">{fragranceIntroduction(f)}</p>

          <dl className="reference-facts">
            <Fact term="Accord family">
              <span className="flex items-center gap-2">
                <i className="inline-block size-2.5 rounded-full" style={{ background: hue }} />
                {f.wheel ? <Link href={`/discover?wheel=${encodeURIComponent(f.wheel)}`}>{f.wheel}</Link> : "Not listed"}
              </span>
            </Fact>
            <Fact term="Character">{f.character ?? "Not listed"}</Fact>
            <Fact term="Released">{f.year ?? "Not listed"}</Fact>
            <Fact term="Marketed as">{f.gender ? GENDER_LABEL[f.gender] : "Not listed"}</Fact>
          </dl>
          <p className="reference-caption mt-3">Catalog labels describe the fragrance. Anyone can wear it.{concentration && <> Format named in the catalog: <Link href="/learn#concentration">{concentration}</Link>.</>}</p>

          <section className="reference-collection" aria-label="Your collection">
            <CollectionControls productId={f.productId} />
          </section>

          <FragranceNotes notes={f.notes.map((label, i) => ({ label, key: f.noteKeys[i] }))} />

          <section className="reference-section" aria-labelledby="profile-h">
            <div className="reference-section-heading"><h2 id="profile-h">Read its profile</h2><Link href="/learn">Learn the language <ArrowIcon /></Link></div>
            <div className="reference-profile">
              <div>
                <h3>{f.wheel ?? f.family ?? "Fragrance family"}</h3>
                <p>{(f.wheel && FAMILY_GUIDE[f.wheel]) || "A fragrance family groups scents by their overall impression. This catalog entry has no further family description."}</p>
                {f.wheel && <Link href={`/discover?wheel=${encodeURIComponent(f.wheel)}`}>Explore the {f.wheel.toLowerCase()} family <ArrowIcon /></Link>}
              </div>
              <div>
                <h3>{f.facets.length ? "Other facets" : "From paper to skin"}</h3>
                {f.facets.length ? <><p>Other qualities named in this fragrance’s catalog profile.</p><div className="reference-facet-links">{f.facets.map(facet => <Link key={facet} href={`/discover?facet=${encodeURIComponent(facet)}`}>{facet}<ArrowIcon /></Link>)}</div></> : <p>Try it on a blotter first, then revisit it on your skin. Notice which notes you recognise and what changes as it settles.</p>}
              </div>
            </div>
            <details className="reference-provenance">
              <summary>About this fragrance’s data <PlusIcon /></summary>
              <div>
                <p>Source accord phrase: “{f.accordsRaw || "Not listed"}”. Catalog family: {[...new Set([f.family, f.subfamily].filter(Boolean))].join(" · ") || "Not listed"}.</p>
                <p>Product facts come from the doevent/perfume catalog, cleaned by ScentLens. Note descriptions are general reference material, separate from the product’s listed notes.</p>
                <p>Note layers, perfumer, measured longevity and projection are not supplied for this entry. The profile does not assign wear times, seasons or occasions.</p>
                <Link href="/how-it-works">How Accord uses its sources <ArrowIcon /></Link>
              </div>
            </details>
          </section>

          <section className="reference-section section-divider" aria-labelledby="similar-h">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="similar-h" className="text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.03em]">
                Smells similar
              </h2>
              <p className="max-w-[28em] text-sm text-ink-3">
                Compared by listed notes, family and character. A catalog similarity score, not a rating or a promise of an identical smell.
              </p>
            </div>
            <div className="mt-6 grid gap-3">
              {similar.map((s) => (
                <StripRow
                  key={s.fragrance.productId}
                  fragrance={s.fragrance}
                  aside={
                    <div className="flex flex-col items-end gap-2">
                      <div>
                        <div className="font-mono text-2xl font-medium tracking-[-0.02em] tabular">{Math.round(s.similarity.score * 100)}</div>
                        <div className="text-xs text-ink-3">similarity / 100</div>
                      </div>
                      <Link
                        href={`/compare?a=${f.productId}&b=${s.fragrance.productId}`}
                        className="relative z-10 text-sm text-ink-2 hover:text-ink"
                      >
                        Compare
                      </Link>
                    </div>
                  }
                >
                  <p className="mt-1 text-[15px] text-ink-2">
                    {s.sharedNotes.length > 0 ? (
                      <>
                        Shares <span className="text-ink">{s.sharedNotes.slice(0, 4).join(", ").toLowerCase()}</span>
                      </>
                    ) : (
                      s.fragrance.wheel === f.wheel && f.wheel ? "Same accord family, different listed notes" : "Related catalog profile, different listed notes"
                    )}
                  </p>
                </StripRow>
              ))}
            </div>
            <Link href={`/for-you`} className="mt-8 inline-flex items-center gap-2 font-medium">
              Personal recommendations <ArrowIcon />
            </Link>
          </section>
          {siblings.length > 0 && <section className="reference-section section-divider" aria-labelledby="house-h">
            <div className="reference-section-heading"><h2 id="house-h">More from {f.brand}</h2><Link href={`/discover?brand=${encodeURIComponent(f.brandSlug)}`}>Explore the house <ArrowIcon /></Link></div>
            <div className="mt-6 grid gap-3">{siblings.map(sibling => <StripRow key={sibling.productId} fragrance={sibling} />)}</div>
          </section>}
        </div>
      </div>
    </>
  );
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[13px] text-ink-3">{term}</dt>
      <dd className="mt-1.5 text-[17px] font-medium">{children}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-20" aria-busy="true" aria-label="Loading fragrance">
      <div className="strip-v mx-auto hidden h-[560px] w-[104px] animate-pulse opacity-60 lg:block" />
      <div>
        <div className="h-6 w-40 bg-paper/70" />
        <div className="mt-3 h-16 w-3/4 bg-paper/70" />
        <div className="mt-8 h-20 bg-paper/50" />
      </div>
    </div>
  );
}
