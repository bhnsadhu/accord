import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type CSSProperties } from "react";
import { cachedCompare } from "@/lib/catalog/cached";
import { isProductId } from "@/lib/catalog/text";
import { hueFor } from "@/lib/hues";
import { SIMILARITY_WEIGHTS } from "@/lib/reco/similarity";

export const metadata: Metadata = { title: "Compare" };

export default function ComparePage({ searchParams }: PageProps<"/compare">) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-8 sm:px-8 lg:px-16 lg:pt-12">
      <Suspense fallback={<div className="h-96" aria-busy="true" />}>
        <Comparison searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Comparison({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const a = typeof sp.a === "string" && isProductId(sp.a) ? sp.a : null;
  const b = typeof sp.b === "string" && isProductId(sp.b) ? sp.b : null;
  const data = a && b ? await cachedCompare(a, b) : null;
  if (!data) {
    return (
      <div className="max-w-xl">
        <h1 className="text-[clamp(36px,4vw,56px)] font-semibold tracking-[-0.035em]">Compare</h1>
        <p className="mt-4 text-lg text-ink-2">
          Open any fragrance and choose Compare beside a similar one to lay the two strips side by side.
        </p>
        <Link href="/discover" className="mt-6 inline-block font-medium underline">
          Go to Discover
        </Link>
      </div>
    );
  }
  const { breakdown } = data;
  const parts = breakdown
    ? [
        { label: "Shared notes", value: breakdown.notes, weight: SIMILARITY_WEIGHTS.notes },
        { label: "Accord overlap", value: breakdown.accords, weight: SIMILARITY_WEIGHTS.accords },
        { label: "Family", value: breakdown.family, weight: SIMILARITY_WEIGHTS.family },
        { label: "Character", value: breakdown.character, weight: SIMILARITY_WEIGHTS.character },
      ]
    : [];

  return (
    <>
      <h1 className="sr-only">
        {data.a.name} compared with {data.b.name}
      </h1>
      <div className="comparison-layout grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <Side f={data.a} only={data.onlyA} />
        <div className="comparison-evidence flex flex-col items-center justify-center px-4 py-6 text-center md:w-72">
          {breakdown && (
            <>
              <div className="font-mono text-5xl font-medium tracking-[-0.03em] tabular">{Math.round(breakdown.score * 100)}</div>
              <div className="text-sm text-ink-3">similarity</div>
            </>
          )}
          <p className="mt-6 text-[13px] text-ink-3">Shared notes</p>
          <ul className="mt-2 flex flex-wrap justify-center gap-1.5">
            {data.shared.length ? (
              data.shared.map((n) => (
                <li key={n} className="border border-ink px-3 py-1 text-[15px]" style={{ borderRadius: 2 }}>
                  {n}
                </li>
              ))
            ) : (
              <li className="text-ink-2">None</li>
            )}
          </ul>
        </div>
        <Side f={data.b} only={data.onlyB} />
      </div>

      {breakdown && (
        <section className="mt-14 max-w-3xl" aria-labelledby="why-h">
          <h2 id="why-h" className="text-2xl font-semibold tracking-[-0.02em]">
            How the score is built
          </h2>
          <dl className="mt-6 grid gap-4">
            {parts.map((p) => (
              <div key={p.label} className="grid grid-cols-[120px_1fr_auto] items-center gap-4">
                <dt className="text-[15px]">{p.label}</dt>
                <dd className="h-2 bg-bench-deep" aria-hidden>
                  <div className="h-full bg-ink" style={{ width: `${Math.round(p.value * 100)}%` }} />
                </dd>
                <dd className="whitespace-nowrap text-right font-mono text-sm text-ink-2 tabular">
                  {Math.round(p.value * 100)} × {p.weight}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-sm text-ink-3">
            Notes use cosine similarity with rarer notes weighted higher; accords use overlap of wheel family and facets.
          </p>
        </section>
      )}
    </>
  );
}

function Side({ f, only }: { f: NonNullable<Awaited<ReturnType<typeof cachedCompare>>>["a"]; only: string[] }) {
  return (
    <article className="comparison-fragrance lift" style={{ "--hue": hueFor(f.wheel) } as CSSProperties}>
      <div className="strip-h h-full">
        <span className="stain-h" />
        <div className="strip-text relative py-6">
          <p className="text-[13px] text-ink-3">
            {f.brand} · {f.wheel ?? "Unclassified"}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">
            <Link href={`/fragrance/${f.slug}`} className="hover:underline">
              {f.name}
            </Link>
          </h2>
          <p className="mt-4 text-[13px] text-ink-3">Only in this one</p>
          <p className="mt-1 text-[15px] text-ink-2">{only.length ? only.join(", ") : "Nothing: every note is shared"}</p>
        </div>
      </div>
    </article>
  );
}
