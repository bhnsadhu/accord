import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import { CollectionControls } from "@/components/collection-controls";
import { ArrowIcon } from "@/components/icons";
import { StripRow, StripSpecimen } from "@/components/strip";
import { VisitTracker } from "@/components/visit-tracker";
import { cachedFragrance, cachedNotes, cachedSimilar } from "@/lib/catalog/cached";
import { productIdFromSlug } from "@/lib/catalog/text";
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
    description: `${f.name} by ${f.brand}: ${f.wheel ?? "fragrance"} with ${f.notes.slice(0, 5).join(", ").toLowerCase()}.`,
  };
}

export default function FragrancePage({ params }: PageProps<"/fragrance/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-8 sm:px-8 lg:px-16 lg:pt-12">
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
  const [similar, notes] = await Promise.all([cachedSimilar(f.productId, 10), cachedNotes()]);
  const keyByLabel = new Map(notes.map((n) => [n.label, n.key]));
  const hue = hueFor(f.wheel);

  return (
    <>
      <VisitTracker productId={f.productId} />
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
          <Link href={`/discover?q=${encodeURIComponent(f.brand)}`} className="mt-4 inline-block text-lg text-ink-2 hover:underline lg:mt-0">
            {f.brand}
          </Link>
          <h1 className="mt-1 text-[clamp(40px,5vw,72px)] font-semibold leading-[1] tracking-[-0.035em] text-balance">{f.name}</h1>

          <dl className="mt-8 grid grid-cols-2 gap-px bg-rule sm:grid-cols-4">
            <Fact term="Accord family">
              <span className="flex items-center gap-2">
                <i className="inline-block size-2.5 rounded-full" style={{ background: hue }} />
                {f.wheel ? <Link href={`/discover?wheel=${encodeURIComponent(f.wheel)}`} className="hover:underline">{f.wheel}</Link> : "Unclassified"}
              </span>
            </Fact>
            <Fact term="Character">{f.character ?? "—"}</Fact>
            <Fact term="Family">{[...new Set([f.family, f.subfamily].filter(Boolean))].join(" · ") || "—"}</Fact>
            <Fact term="Worn as">
              {f.gender ? GENDER_LABEL[f.gender] : "—"}
              {f.year ? <span className="text-ink-3"> · {f.year}</span> : null}
            </Fact>
          </dl>

          {f.facets.length > 0 && (
            <p className="mt-4 text-[15px] text-ink-2">
              Facets:{" "}
              {f.facets.map((x, i) => (
                <span key={x}>
                  <Link href={`/discover?facet=${encodeURIComponent(x)}`} className="text-ink hover:underline">
                    {x}
                  </Link>
                  {i < f.facets.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}

          <section className="mt-10" aria-labelledby="notes-h">
            <h2 id="notes-h" className="text-[13px] text-ink-3">
              Notes, in catalog order
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {f.notes.map((n) => (
                <li key={n}>
                  <Link
                    href={`/discover?note=${keyByLabel.get(n) ?? ""}`}
                    className="block border border-paper-edge bg-paper px-3.5 py-1.5 text-[15px] transition-colors hover:border-ink-3"
                    style={{ borderRadius: 2 }}
                  >
                    {n}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-ink-3">
              The catalog lists notes without top, heart and base layers, so Accord shows them as listed. Source accord phrase:
              “{f.accordsRaw}”.
            </p>
          </section>

          <section className="mt-10 bg-paper p-5 shadow-[var(--shadow-paper)] sm:p-6" style={{ borderRadius: 4 }}>
            <CollectionControls productId={f.productId} />
          </section>

          <section className="mt-16" aria-labelledby="similar-h">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="similar-h" className="text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.03em]">
                Smells similar
              </h2>
              <p className="max-w-[28em] text-sm text-ink-3">
                Similarity weighs shared notes (rarer notes count more), accord family, catalog family and character. 100 would be
                identical on all four.
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
                        <div className="text-xs text-ink-3">similarity</div>
                      </div>
                      <Link
                        href={`/compare?a=${f.productId}&b=${s.fragrance.productId}`}
                        className="relative z-10 text-sm text-ink-2 underline hover:text-ink"
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
                      "Same accord family, different notes"
                    )}
                  </p>
                </StripRow>
              ))}
            </div>
            <Link href={`/for-you`} className="mt-8 inline-flex items-center gap-2 font-medium hover:underline">
              Personal recommendations <ArrowIcon />
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="bg-paper p-4">
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
