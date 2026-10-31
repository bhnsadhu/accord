import { PageShell, PageTitle } from "@/components/page-shell";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type CSSProperties } from "react";
import { cachedCompare } from "@/lib/catalog/cached";
import { isProductId } from "@/lib/catalog/text";
import { hueFor } from "@/lib/hues";
import { SIMILARITY_WEIGHTS } from "@/lib/reco/similarity";
import type { FragranceDetail } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Compare" };

export default function ComparePage({ searchParams }: PageProps<"/compare">) {
  return (
    <PageShell>
      <PageTitle>Compare</PageTitle>
      <Suspense fallback={<div className="mt-8 h-96" aria-busy="true" />}>
        <Comparison searchParams={searchParams} />
      </Suspense>
    </PageShell>
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
        <p className="page-intro">
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
      <p className="sr-only">
        {data.a.name} compared with {data.b.name}
      </p>
      <div className="comparison-layout mt-8 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
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

      <ReferenceComparison a={data.a} b={data.b} />
      {!breakdown && <p className="reference-caption mt-6">A full similarity score is not shown because family or character details are incomplete. The shared catalog notes above are still useful for comparison.</p>}
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

function ReferenceComparison({ a, b }: { a: FragranceDetail; b: FragranceDetail }) {
  const rows: { label: string; value: (f: FragranceDetail) => React.ReactNode }[] = [
    { label: "Concentration", value: f => f.concentration ?? "Not listed" },
    { label: "Released", value: f => f.year ?? "Not listed" },
    { label: "Perfumer", value: f => f.perfumers?.join(", ") || "Not listed" },
    { label: "Scent profile", value: f => f.research?.summary ?? "Researched description not listed" },
    ...(["opening", "heart", "base"] as const).map(stage => ({ label: `${stage[0].toUpperCase()}${stage.slice(1)} notes`, value: (f: FragranceDetail) => f.research?.noteStages?.[stage].join(", ") || "Documented stage not listed" })),
    { label: "Wearing it", value: f => f.research?.wear.length ? f.research.wear.map((wear, i) => <p key={i}><strong>{wear.aspect}:</strong> {wear.text} <a href={f.research!.sources.find(s => s.id === wear.sourceId)!.url} className="research-attribution">Source</a></p>) : "Verified wear guidance not listed" },
  ];
  return <section className="reference-section research-comparison" aria-labelledby="reference-compare-h">
    <h2 id="reference-compare-h">The details, side by side</h2>
    <div className="research-comparison-heading"><span aria-hidden /><h3>{a.name}</h3><h3>{b.name}</h3></div>
    <dl>{rows.map(row => <div className="research-comparison-row" key={row.label}><dt>{row.label}</dt>{[a, b].map(f => <dd key={f.productId}><span className="sr-only">{f.name}: </span>{row.value(f)}</dd>)}</div>)}</dl>
    <div className="research-comparison-row"><span>Sources</span>{[a, b].map(f => <Link key={f.productId} href={`/fragrance/${f.slug}#sources`}>View sources for {f.name}</Link>)}</div>
    <p className="reference-caption mt-4">Notes and wear descriptions come from the sources on each fragrance page. Unlisted details stay unlisted. The similarity score uses catalog notes, family and character.</p>
  </section>;
}

function Side({ f, only }: { f: NonNullable<Awaited<ReturnType<typeof cachedCompare>>>["a"]; only: string[] }) {
  return (
    <article className="comparison-fragrance lift" style={{ "--hue": hueFor(f.wheel) } as CSSProperties}>
      <div className="strip-h h-full">
        <span className="stain-h" />
        <div className="strip-text relative py-6">
          <p className="text-[13px] text-ink-3">
            {f.brand} · {f.wheel ?? f.family ?? "Family not listed"}
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
