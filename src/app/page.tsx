import Link from "next/link";
import type { CSSProperties } from "react";
import { Bench } from "@/components/bench";
import { HomeFan } from "@/components/home-fan";
import { ScentLensLink } from "@/components/scentlens-link";
import { ArrowIcon, CameraIcon, SearchIcon } from "@/components/icons";
import { MatchFigure, StripRow } from "@/components/strip";
import { cachedArchetypes, cachedExample, cachedFragrance, cachedFragrancesByIds, cachedSimilar } from "@/lib/catalog/cached";
import { hueFor, WHEEL_ORDER } from "@/lib/hues";

// Well-known fragrances for the opening fan, by ScentLens product id.
const FAN = ["p14462", "p14486", "p14487", "p14490", "p14466", "p22724"];
const DISSECT = "p14487"; // Le Labo Santal 33
// Chance and two close flankers, for the illustration of answered vs unconfirmed.
const SURE = "p05819";
const UNSURE = ["p05820", "p05821"];

export default async function Home() {
  const [fan, example, dissect, similar, tour, illustration] = await Promise.all([
    cachedFragrancesByIds(FAN),
    cachedExample(FAN),
    cachedFragrance(DISSECT),
    cachedSimilar(DISSECT, 3),
    cachedArchetypes(),
    cachedFragrancesByIds([SURE, ...UNSURE]),
  ]);
  const wheelTour = [...tour].sort((a, b) => WHEEL_ORDER.indexOf(a.wheel ?? "") - WHEEL_ORDER.indexOf(b.wheel ?? ""));
  const sure = illustration.find((f) => f.productId === SURE);
  const unsure = illustration.filter((f) => UNSURE.includes(f.productId));

  return (
    <>
      <section className="signature-hero" aria-labelledby="signature-heading">
        <div className="signature-heading">
          <div>
            <h1 id="signature-heading">Find your next signature.</h1>
            <p>Fragrance, understood through notes.</p>
          </div>
          <div className="signature-search">
            <form action="/discover" role="search">
              <label><SearchIcon /><input type="search" name="q" placeholder="Search fragrances or brands" aria-label="Search fragrances" /></label>
              <button type="submit" className="bench-button">Explore <ArrowIcon /></button>
            </form>
            <Link href="/scan"><CameraIcon /> Scan a bottle</Link>
          </div>
        </div>
        <HomeFan fragrances={fan} />
      </section>

      <section className="home-evidence" aria-label="How Accord connects fragrances">
        <div><h2>Every suggestion has a reason.</h2><p>Explore 24,642 fragrances through their notes, accord family, and character.</p></div>
        {example && <Link href={`/fragrance/${example.fragrance.slug}`} className="home-evidence-example">
          <div><span>If you love {example.source.name}</span><h3>{example.fragrance.name}</h3><p>{example.fragrance.brand} · Shares {example.sharedNotes.slice(0, 3).join(", ").toLowerCase()}</p></div>
          {example.similarity !== null && <MatchFigure value={example.similarity} label="similarity" />}
          <ArrowIcon />
        </Link>}
        <div className="home-bench-history"><Bench /></div>
      </section>

      {/* One strip, read closely. */}
      {dissect && (
        <section className="mx-auto mt-24 w-full max-w-[1440px] px-4 sm:px-8 lg:mt-32 lg:px-16">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <h2 className="text-[clamp(32px,3.6vw,48px)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
              Read a fragrance, note by note.
            </h2>
            <p className="max-w-[36em] text-lg leading-relaxed text-ink-2 lg:pt-2">
              Accord turns each catalog entry into notes, an accord family and its character, then compares fragrances on all
              three. Rare materials count for more than the musk that half the catalog lists.
            </p>
          </div>

          <article className="lift mt-12" style={{ "--hue": hueFor(dissect.wheel) } as CSSProperties}>
            <div className="strip-h [--stain-depth:96px] sm:[--stain-depth:220px]">
              <span className="stain-h" style={{ "--stain-opacity": "1" } as CSSProperties} />
              <div className="strip-text relative py-6 pr-6 sm:py-8">
                <p className="text-sm text-ink-3">{dissect.brand}</p>
                <h3 className="text-[clamp(28px,3vw,40px)] font-semibold leading-tight tracking-[-0.025em]">
                  <Link href={`/fragrance/${dissect.slug}`} className="hover:underline">
                    {dissect.name}
                  </Link>
                </h3>
                <p className="mt-3 text-[clamp(17px,1.6vw,22px)] leading-snug text-ink">{dissect.notes.join(" · ")}</p>
              </div>
            </div>
          </article>

          {/* Margin annotations, pencilled beside the strip. */}
          <dl className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-3 lg:pl-6">
            <Annotation term="Accord family">
              <span className="flex items-center gap-2">
                <i className="inline-block size-2.5 rounded-full" style={{ background: hueFor(dissect.wheel) }} />
                {dissect.wheel ?? "Unclassified"}
              </span>
            </Annotation>
            <Annotation term="Character">{dissect.character ?? "—"}</Annotation>
            <Annotation term="Catalog family">
              {[...new Set([dissect.family, dissect.subfamily].filter(Boolean))].join(" · ") || "—"}
            </Annotation>
          </dl>

          <div className="mt-12 lg:pl-6">
            <p className="text-[13px] text-ink-3">Smells closest to</p>
            <ul className="mt-3 grid min-w-0 gap-px bg-rule">
              {similar.map((s) => (
                <li
                  key={s.fragrance.productId}
                  className="flex min-w-0 flex-col gap-1 bg-bench py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                >
                  <Link href={`/fragrance/${s.fragrance.slug}`} className="min-w-0 truncate hover:underline">
                    <span className="font-medium">{s.fragrance.name}</span>
                    <span className="text-ink-3"> · {s.fragrance.brand}</span>
                  </Link>
                  <span className="text-sm text-ink-2 sm:shrink-0">shares {s.sharedNotes.slice(0, 3).join(", ").toLowerCase()}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Start anywhere on the wheel, walking it in order. */}
      <section className="mx-auto mt-24 w-full max-w-[1440px] px-4 sm:px-8 lg:mt-32 lg:px-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-[18em] text-[clamp(32px,3.6vw,48px)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
            Start anywhere on the wheel.
          </h2>
          <p className="max-w-[30em] text-ink-2">
            The most characteristic fragrance of each accord family, in wheel order from Floral round to Fruity, chosen by how
            closely its notes match the family as a whole.
          </p>
        </div>
        <ol className="mt-10 grid gap-3 md:grid-flow-col md:grid-cols-2 md:grid-rows-7">
          {wheelTour.map((f) => (
            <li key={f.productId} className="min-w-0">
              <StripRow fragrance={f} />
            </li>
          ))}
        </ol>
      </section>

      {/* The scanner, stated plainly and shown in the strip's own terms. */}
      <section className="mx-auto mt-24 grid w-full max-w-[1440px] gap-10 px-4 sm:px-8 lg:mt-32 lg:grid-cols-2 lg:gap-16 lg:px-16">
        <div>
          <h2 className="text-[clamp(32px,3.6vw,48px)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
            A careful eye for your next scent.
          </h2>
          <p className="mt-6 max-w-[34em] text-lg leading-relaxed text-ink-2">
            <ScentLensLink /> finds the bottle, compares it with 24,642 catalog fragrances and reads its label. When the evidence is thin it
            says so and shows its best candidates as unconfirmed, instead of guessing.
          </p>
          <Link href="/scan" className="mt-6 inline-flex items-center gap-2 font-medium hover:underline">
            How scanning works <ArrowIcon />
          </Link>
        </div>
        <figure className="min-w-0">
          {sure && (
            <>
              <p className="text-[13px] text-ink-3">An answer is stained</p>
              <div className="mt-2">
                <StripRow fragrance={sure} />
              </div>
            </>
          )}
          {unsure.length > 0 && (
            <>
              <p className="mt-6 text-[13px] text-ink-3">Candidates it can&rsquo;t confirm stay blank</p>
              <div className="mt-2 grid gap-2">
                {unsure.map((f) => (
                  <StripRow key={f.productId} fragrance={f} ghost />
                ))}
              </div>
            </>
          )}
          <figcaption className="mt-4 text-sm text-ink-3">An illustration of the two states, not a scan result.</figcaption>
        </figure>
      </section>

      <section className="mx-auto mt-24 w-full max-w-[1440px] px-4 sm:px-8 lg:mt-32 lg:px-16">
        <div className="flex flex-col items-start gap-6 border-t border-ink pt-10 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-[16em] text-[clamp(28px,3vw,40px)] font-semibold leading-[1.08] tracking-[-0.025em] text-balance">
            Tell Accord three things you wear. It does the rest.
          </h2>
          <Link
            href="/profile"
            className="inline-flex h-[52px] items-center gap-2 bg-ink px-6 font-medium text-paper transition-[background-color] hover:bg-ink-2"
            style={{ borderRadius: 4 }}
          >
            Build your profile <ArrowIcon />
          </Link>
        </div>
      </section>
    </>
  );
}

function Annotation({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="border-l border-ink-3 pl-4">
      <dt className="text-[13px] text-ink-3">{term}</dt>
      <dd className="mt-1 text-lg font-medium">{children}</dd>
    </div>
  );
}
