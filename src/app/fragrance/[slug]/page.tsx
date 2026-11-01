import { PageShell } from "@/components/page-shell";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import { CollectionControls } from "@/components/collection-controls";
import { BottlePhoto } from "@/components/bottle-photo";
import Image from "next/image";
import { bottleImage } from "@/lib/catalog/media";
import { FragranceSources, SourceLinks, WearGuidance } from "@/components/fragrance-research";
import { FragranceNotes } from "@/components/fragrance-notes";
import { FragranceTaste } from "@/components/fragrance-taste";
import { ArrowIcon } from "@/components/icons";
import { StripRow, StripSpecimen } from "@/components/strip";
import { VisitTracker } from "@/components/visit-tracker";
import { ReferenceAnchors } from "@/components/reference-anchors";
import { cachedEditions, cachedFragrance, cachedNotes, cachedSearch, cachedSimilar } from "@/lib/catalog/cached";
import { productIdFromSlug } from "@/lib/catalog/text";
import { FAMILY_GUIDE, fragranceIntroduction } from "@/lib/fragrance-guide";
import { GENDER_LABEL, hueFor } from "@/lib/hues";

// Prerender the homepage fan; every other fragrance renders on first visit and is then cached.
export function generateStaticParams() {
  return [{ slug: "chanel-chance-eau-de-parfum-p05819" }, { slug: "le-labo-santal-33-p14487" }];
}

export async function generateMetadata({ params }: PageProps<"/fragrance/[slug]">): Promise<Metadata> {
  const id = productIdFromSlug((await params).slug);
  const f = id ? await cachedFragrance(id) : null;
  if (!f) return { title: "Fragrance not found" };
  const photo = bottleImage(f.productId);
  return {
    title: `${f.name} by ${f.brand}`,
    description: `${f.name} by ${f.brand}. ${f.research?.summary ?? fragranceIntroduction(f)}`,
    alternates: { canonical: `/fragrance/${f.slug}` },
    ...(photo ? { openGraph: { images: [{ url: photo.path, width: photo.width, height: photo.height, alt: photo.alt }] } } : {}),
  };
}

export default function FragrancePage({ params }: PageProps<"/fragrance/[slug]">) {
  return (
    <PageShell className="fragrance-reference">
      <Suspense fallback={<DetailSkeleton />}>
        <Detail params={params} />
      </Suspense>
    </PageShell>
  );
}

async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const id = productIdFromSlug((await params).slug);
  const f = id ? await cachedFragrance(id) : null;
  if (!f) notFound();
  const [similar, house, editions, library] = await Promise.all([cachedSimilar(f.productId, 8), cachedSearch({ brand: f.brandSlug, pageSize: 5 }), f.editionGroup ? cachedEditions(f.editionGroup) : [], cachedNotes()]);
  const hue = hueFor(f.wheel);
  const research = f.research;
  const photo = bottleImage(f.productId);
  const otherEditions = editions.filter(item => item.productId !== f.productId);
  const siblings = house.items.filter(item => item.productId !== f.productId).slice(0, 4);

  return (
    <>
      <VisitTracker productId={f.productId} />
      <ReferenceAnchors identity={f.productId} />
      <nav className="reference-wayfinding" aria-label="Fragrance navigation">
        <Link href="/discover">Discover</Link>
        <Link href="/notes">Note library</Link>
        <Link href="/learn">Fragrance guide</Link>
      </nav>
      <div className={`reference-layout ${photo ? "reference-layout-photographed" : ""}`}>
        <div className="reference-specimen" style={{ "--hue": hue } as CSSProperties}>
          <div className="sticky top-8">
            {photo ? <><BottlePhoto image={photo} /><div className="bottle-paper-label strip-h"><span className="stain-h" /><span>{f.name}</span><small>{f.brand}</small></div></> : <div className="lift"><StripSpecimen fragrance={f} className="detail-paper" /></div>}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-3 lg:hidden" style={{ "--hue": hue } as CSSProperties}>
            <div className="strip-h h-6 w-24 [--stain-depth:70px]">
              <span className="stain-h" />
            </div>
          </div>
          <div className={`reference-identity ${photo ? "reference-identity-photographed" : ""}`}><div className="min-w-0">
          <Link href={`/discover?brand=${encodeURIComponent(f.brandSlug)}`} className="mt-4 inline-block text-lg text-ink-2 lg:mt-0">
            {f.brand}
          </Link>
          <h1 className="mt-1 text-[clamp(40px,5vw,72px)] font-semibold leading-[1] tracking-[-0.035em] text-balance">{f.name}</h1>
          </div>
          {photo && <div className="reference-mobile-photo"><BottlePhoto image={photo} /></div>}
          </div>
          <p className="reference-introduction">{research?.summary ?? fragranceIntroduction(f)}</p>
          {research?.summary && <SourceLinks research={research} field="summary" />}
          {otherEditions.length > 0 && <nav className="research-edition-nav" aria-label="Fragrance editions">{editions.map(edition => <Link key={edition.productId} href={`/fragrance/${edition.slug}`} aria-current={edition.productId === f.productId ? "page" : undefined}>{edition.editionLabel ?? edition.concentration ?? edition.name}</Link>)}</nav>}

          <dl className="reference-facts research-facts">
            <Fact term="Concentration">{f.concentration ? <Link href="/learn#concentration">{f.concentration}</Link> : "Not listed"}</Fact>
            <Fact term={f.wheel ? "Accord family" : "Fragrance family"}>
              <span className="flex items-center gap-2">
                <i className="inline-block size-2.5 rounded-full" style={{ background: hue }} />
                {f.wheel ? <Link href={`/discover?wheel=${encodeURIComponent(f.wheel)}`}>{f.wheel}</Link> : f.family ? <Link href={`/discover?family=${encodeURIComponent(f.family)}`}>{f.family}</Link> : "Not listed"}
              </span>
            </Fact>
            <Fact term="Released">{f.year ?? "Not listed"}</Fact>
            <Fact term="Perfumer">{f.perfumers?.length ? f.perfumers.map((name, i) => <span key={name}>{i > 0 && ", "}<Link href={`/discover?perfumer=${encodeURIComponent(name)}`}>{name}</Link></span>) : "Not listed"}</Fact>
            <Fact term="Character">{f.character ?? "Not listed"}</Fact>
            <Fact term="Marketed as">{f.gender ? GENDER_LABEL[f.gender] : "Not listed"}</Fact>
          </dl>
          <p className="reference-caption mt-3">Anyone can wear it. <a href="#sources">See the sources behind these details.</a></p>

          <nav className="research-section-nav" aria-label="On this fragrance page"><a href="#notes">Notes</a><a href="#wear">Wearing it</a>{otherEditions.length > 0 && <a href="#editions">Versions</a>}<a href="#similar-h">Similar fragrances</a><a href="#collection">Your collection</a><a href="#sources">Sources</a></nav>
          {!photo && research?.image && <figure className="research-bottle"><Image src={research.image.path} alt={research.image.alt} width={600} height={600} /><figcaption>{research.image.credit}</figcaption></figure>}
          <FragranceNotes notes={f.notes.map((label, i) => ({ label, key: f.noteKeys[i] }))} research={research} library={library} />

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
          </section>

          <section id="collection" className="reference-collection" aria-label="Your collection">
            <CollectionControls productId={f.productId} />
            <FragranceTaste notes={f.notes.map((label, i) => ({ label, key: f.noteKeys[i] }))} family={f.wheel} />
          </section>
          <WearGuidance research={research} />
          <FragranceSources fragrance={f} />
          {otherEditions.length > 0 && <section id="editions" className="reference-section section-divider" aria-labelledby="editions-h">
            <div className="reference-section-heading"><h2 id="editions-h">Other versions</h2><Link href="/learn#concentration">Understanding concentration <ArrowIcon /></Link></div>
            <p className="reference-caption">Related editions can change the composition as well as its concentration. Compare the exact versions.</p>
            <div className="mt-6 grid gap-3">{otherEditions.map(edition => <StripRow key={edition.productId} fragrance={edition} aside={<Link className="relative z-10 text-sm" href={`/compare?a=${f.productId}&b=${edition.productId}`}>Compare</Link>}><p className="mt-1 text-sm text-ink-2">{[edition.concentration, edition.year].filter(Boolean).join(" · ") || "Format and year not listed"}</p></StripRow>)}</div>
          </section>}

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
