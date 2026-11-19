import Link from "next/link";
import { bottleImage } from "@/lib/catalog/bottle-media";
import { BottleThumbnail } from "@/components/bottle-thumbnail";
import { Bench } from "@/components/bench";
import { HomeBottles } from "@/components/home-bottles";
import { NoteExplorer } from "@/components/note-explorer";
import { FamilyExplorer } from "@/components/family-explorer";
import { ArrowIcon, CameraIcon, SearchIcon } from "@/components/icons";
import { cachedArchetypes, cachedFragrance, cachedFragrancesByIds, cachedSearch, cachedSimilar } from "@/lib/catalog/cached";
import { WHEEL_ORDER } from "@/lib/hues";
import { HOME_BOTTLE_IDS } from "@/lib/home-bottles";

const DISSECT = "p14487"; // Le Labo Santal 33
export default async function Home() {
  const [featured, dissect, similar, tour] = await Promise.all([
    cachedFragrancesByIds(HOME_BOTTLE_IDS),
    cachedFragrance(DISSECT),
    cachedSimilar(DISSECT, 24),
    cachedArchetypes(),
  ]);
  const wheelTour = [...tour].sort((a, b) => WHEEL_ORDER.indexOf(a.wheel ?? "") - WHEEL_ORDER.indexOf(b.wheel ?? ""));
  const noteConnections = dissect ? await Promise.all(dissect.notes.map(async (label, i) => {
    const key = dissect.noteKeys[i];
    const result = await cachedSearch({ notes: [key], pageSize: 4 });
    const related = similar.filter(s => s.sharedNotes.includes(label)).map(s => s.fragrance);
    const candidates = [...related, ...result.items].filter(f => f.productId !== dissect.productId);
    const unique = [...new Map(candidates.map(f => [f.productId, f])).values()];
    return { key, label, total: result.total, fragrances: unique.slice(0, 3) };
  })) : [];

  return (
    <>
      <section className="signature-hero" aria-labelledby="signature-heading">
        <div className="signature-heading">
          <div>
            <h1 id="signature-heading">Know the bottle. Find the next one.</h1>
          </div>
          <div className="signature-search">
            <form action="/discover" role="search">
              <label><SearchIcon /><input type="search" name="q" placeholder="Search fragrances or brands" aria-label="Search fragrances" /></label>
              <button type="submit" className="bench-button">Explore <ArrowIcon /></button>
            </form>
            <Link href="/scan" className="signature-scan">
              <CameraIcon className="signature-scan-camera" />
              <span><strong>Scan a bottle</strong></span>
              <ArrowIcon className="signature-scan-arrow" />
            </Link>
          </div>
        </div>
        <HomeBottles fragrances={featured.map(f => ({ ...f, bottleImage: bottleImage(f.productId)?.path }))} />
      </section>

      <div className="site-frame"><Bench /></div>

      {/* One fragrance, read closely. */}
      {dissect && (
        <section className="site-frame mt-16 lg:mt-24">
          <div className="section-divider">
            <h2 className="text-[clamp(32px,3.6vw,48px)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
              Explore by note
            </h2>
          </div>

          <article className="mt-12">
            <div className="fragrance-feature">
              <BottleThumbnail fragrance={dissect} src={bottleImage(dissect.productId)?.path} />
              <div className="min-w-0">
                <p className="text-sm text-ink-3">{dissect.brand}</p>
                <h3 className="text-[clamp(28px,3vw,40px)] font-semibold leading-tight tracking-[-0.025em]">
                  <Link href={`/fragrance/${dissect.slug}`} className="hover:underline">
                    {dissect.name}
                  </Link>
                </h3>
              </div>
            </div>
          </article>

          <NoteExplorer connections={noteConnections} />

          <div className="mt-12 lg:pl-6">
            <p className="text-[13px] text-ink-3">Smells closest to</p>
            <ul className="mt-3 grid min-w-0 gap-3">
              {similar.slice(0, 3).map((s) => (
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
      <section className="site-frame mt-16 lg:mt-24">
        <div className="section-divider flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-[18em] text-[clamp(32px,3.6vw,48px)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
            Explore by family
          </h2>
        </div>
        <FamilyExplorer fragrances={wheelTour} />
      </section>

      <section className="site-frame mt-24 lg:mt-32">
        <div className="flex flex-col items-start gap-6 pt-10 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-[16em] text-[clamp(28px,3vw,40px)] font-semibold leading-[1.08] tracking-[-0.025em] text-balance">
            Recommendations for you
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
