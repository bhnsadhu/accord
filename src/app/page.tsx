import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowIcon } from "@/components/icons";
import { SearchBar } from "@/components/search-bar";
import { MatchFigure, StripFan, StripRow } from "@/components/strip";
import { cachedArchetypes, cachedExample, cachedFragrance, cachedFragrancesByIds, cachedSimilar } from "@/lib/catalog/cached";
import { hueFor, WHEEL_HUES } from "@/lib/hues";

// Well-known fragrances for the opening fan, by ScentLens product id.
const FAN = ["p05819", "p07571", "p15249", "p14487", "p06737", "p10989", "p22724", "p05119", "p07629", "p14069", "p09910"];
const EXAMPLE_SOURCE = "p05819"; // Chanel Chance Eau De Parfum
const DISSECT = "p14487"; // Le Labo Santal 33

export default async function Home() {
  const [fan, example, dissect, similar, tour] = await Promise.all([
    cachedFragrancesByIds(FAN),
    cachedExample(EXAMPLE_SOURCE),
    cachedFragrance(DISSECT),
    cachedSimilar(DISSECT, 3),
    cachedArchetypes(),
  ]);

  return (
    <>
      {/* First viewport: the bench. */}
      <section className="relative mx-auto w-full max-w-[1440px] overflow-hidden px-4 sm:px-8 lg:h-[calc(100dvh-72px)] lg:max-h-[860px] lg:min-h-[720px] lg:px-16">
        <div className="relative z-10 pt-10 lg:w-[min(580px,44vw)] lg:pt-[clamp(48px,10vh,104px)]">
          <h1 className="text-[clamp(48px,6.4vw,88px)] font-semibold leading-[0.98] tracking-[-0.035em] text-balance">
            Know the bottle. Find the next one.
          </h1>
          <p className="mt-7 max-w-[32em] text-[19px] leading-relaxed text-ink-2">
            24,642 fragrances, read by note and accord. Search, photograph a bottle, or tell Accord what you wear. Every
            suggestion shows its evidence.
          </p>
          <div className="mt-10">
            <SearchBar />
          </div>
          <p className="mt-4 text-sm text-ink-3">
            Try{" "}
            <Link className="font-medium text-ink-2 hover:underline" href="/discover?q=santal+33">
              Santal 33
            </Link>
            ,{" "}
            <Link className="font-medium text-ink-2 hover:underline" href="/discover?q=kurkdjian">
              Kurkdjian
            </Link>{" "}
            or{" "}
            <Link className="font-medium text-ink-2 hover:underline" href="/discover?note=tonka-bean">
              tonka bean
            </Link>
          </p>
        </div>

        <div className="relative mt-10 h-[420px] overflow-hidden lg:absolute lg:inset-0 lg:mt-0 lg:h-auto">
          <StripFan
            fragrances={fan}
            height={720}
            className="bottom-[-330px] left-1/2 lg:bottom-[-150px] lg:left-[75%]"
          />
        </div>

        {example && (
          <article
            className="lift relative z-10 mt-[-120px] lg:absolute lg:bottom-[8%] lg:right-[3%] lg:mt-0 lg:w-[min(760px,54vw)] lg:-rotate-3"
            style={{ "--hue": hueFor(example.fragrance.wheel) } as CSSProperties}
          >
            <div className="strip-h">
              <span className="stain-h" style={{ "--stain-depth": "180px" } as CSSProperties} />
              <div className="relative grid grid-cols-[1fr_auto] gap-x-6 py-4 pl-[clamp(80px,9vw,112px)] pr-6">
                <p className="text-[13px] text-ink-3">
                  If you love {example.source.name} · {example.source.brand}
                </p>
                <div className="row-span-3 self-start">
                  <MatchFigure value={example.match} />
                </div>
                <h2 className="text-[22px] font-semibold tracking-[-0.015em]">
                  <Link href={`/fragrance/${example.fragrance.slug}`} className="after:absolute after:inset-0">
                    {example.fragrance.name}
                  </Link>{" "}
                  <span className="text-base font-normal text-ink-3">{example.fragrance.brand}</span>
                </h2>
                {example.sharedNotes.length > 0 && (
                  <p className="mt-1 text-[15px] text-ink-2">
                    Shares{" "}
                    {example.sharedNotes.map((n, i) => (
                      <span key={n}>
                        <b className="font-medium text-ink">{n.toLowerCase()}</b>
                        {i < example.sharedNotes.length - 2 ? ", " : i === example.sharedNotes.length - 2 ? " and " : ""}
                      </span>
                    ))}{" "}
                    with {example.source.name}.
                  </p>
                )}
              </div>
            </div>
          </article>
        )}

        <ul className="relative z-10 mt-8 flex flex-wrap gap-x-6 gap-y-2 pb-6 text-[13px] text-ink-3 lg:absolute lg:bottom-8 lg:left-16 lg:mt-0 lg:pb-0">
          {["Woody Amber", "Woods", "Aromatic Fougère", "Amber", "Soft Floral"].map((w) => (
            <li key={w} className="flex items-center gap-2">
              <i className="inline-block size-2 rounded-full" style={{ background: WHEEL_HUES[w] }} />
              {w}
            </li>
          ))}
        </ul>
      </section>

      {/* How Accord reads one fragrance. */}
      {dissect && (
        <section className="mx-auto mt-24 grid w-full max-w-[1440px] gap-12 px-4 sm:px-8 lg:mt-32 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:px-16">
          <div>
            <h2 className="text-[clamp(32px,3.6vw,48px)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
              One strip, read the way a perfumer would.
            </h2>
            <p className="mt-5 max-w-[34em] text-lg leading-relaxed text-ink-2">
              Accord turns each catalog entry into notes, an accord family and its character, then compares fragrances on
              all three. Rare materials count for more than the musk that half the catalog lists.
            </p>
            <Link href={`/fragrance/${dissect.slug}`} className="mt-7 inline-flex items-center gap-2 font-medium hover:underline">
              Open {dissect.name} <ArrowIcon />
            </Link>
          </div>
          <div className="grid gap-px bg-rule sm:grid-cols-3">
            <Fact label="Accord family" value={dissect.wheel ?? "Unclassified"} hue={hueFor(dissect.wheel)} />
            <Fact label="Character" value={dissect.character ?? "—"} />
            <Fact label="Family" value={[...new Set([dissect.family, dissect.subfamily].filter(Boolean))].join(" · ") || "—"} />
            <div className="bg-paper p-5 sm:col-span-3">
              <p className="text-[13px] text-ink-3">Notes, in catalog order</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {dissect.notes.map((n) => (
                  <li key={n} className="border border-paper-edge px-3 py-1.5 text-[15px]" style={{ borderRadius: 999 }}>
                    {n}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-paper p-5 sm:col-span-3">
              <p className="text-[13px] text-ink-3">Smells closest to</p>
              <ul className="mt-3 grid gap-3">
                {similar.map((s) => (
                  <li key={s.fragrance.productId} className="flex items-baseline justify-between gap-4">
                    <Link href={`/fragrance/${s.fragrance.slug}`} className="min-w-0 truncate hover:underline">
                      <span className="font-medium">{s.fragrance.name}</span>
                      <span className="text-ink-3"> · {s.fragrance.brand}</span>
                    </Link>
                    <span className="shrink-0 text-sm text-ink-2">
                      shares {s.sharedNotes.slice(0, 3).join(", ").toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Start anywhere on the wheel. */}
      <section className="mx-auto mt-24 w-full max-w-[1440px] px-4 sm:px-8 lg:mt-32 lg:px-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-[18em] text-[clamp(32px,3.6vw,48px)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
            Start anywhere on the wheel.
          </h2>
          <p className="max-w-[30em] text-ink-2">
            The most characteristic fragrance of each accord family, chosen by how closely its notes match the family as a
            whole.
          </p>
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {tour.map((f) => (
            <StripRow key={f.productId} fragrance={f} />
          ))}
        </div>
      </section>

      {/* The scanner, stated plainly. */}
      <section className="mx-auto mt-24 grid w-full max-w-[1440px] gap-10 px-4 sm:px-8 lg:mt-32 lg:grid-cols-2 lg:px-16">
        <h2 className="text-[clamp(32px,3.6vw,48px)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
          Point a camera at a bottle. Accord says when it isn&rsquo;t sure.
        </h2>
        <div className="max-w-[34em] text-lg leading-relaxed text-ink-2">
          <p>
            ScentLens finds the bottle, compares it with 24,642 catalog fragrances and reads its label. When the evidence is
            thin it says so and shows its best candidates as unconfirmed, instead of guessing.
          </p>
          <Link href="/scan" className="mt-6 inline-flex items-center gap-2 font-medium text-ink hover:underline">
            How scanning works <ArrowIcon />
          </Link>
        </div>
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

function Fact({ label, value, hue }: { label: string; value: string; hue?: string }) {
  return (
    <div className="bg-paper p-5">
      <p className="text-[13px] text-ink-3">{label}</p>
      <p className="mt-2 flex items-center gap-2 text-lg font-medium">
        {hue && <i className="inline-block size-2.5 rounded-full" style={{ background: hue }} />}
        {value}
      </p>
    </div>
  );
}
