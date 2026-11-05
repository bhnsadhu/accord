import { PageShell, PageTitle } from "@/components/page-shell";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Review } from "@/components/community-review";
import { ArrowIcon } from "@/components/icons";
import { MatchFigure, StripRow } from "@/components/strip";
import { cachedSearch, cachedYears } from "@/lib/catalog/cached";
import { cachedCharts } from "@/lib/community/cached";
import { CHART_MIN_RATINGS } from "@/lib/community/rules";
import type { FragranceSummary } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Charts", description: "Top-rated, most owned and most wanted fragrances among Accord members, the newest reviews, and the latest releases in the catalog." };

export default function ChartsPage() {
  return (
    <PageShell width="reference" className="knowledge-page">
      <PageTitle>Charts</PageTitle>
      <p className="page-intro knowledge-lead">What Accord members rate, own and want, the newest reviews, and the latest releases in the catalog. Every number here is counted from member activity or the catalog itself.</p>
      <nav className="reference-wayfinding page-wayfinding" aria-label="Directory navigation"><Link href="/discover">Discover</Link><Link href="/brands">Houses</Link><Link href="/perfumers">Perfumers</Link><Link href="/notes">Notes</Link></nav>
      <Suspense fallback={<p className="reference-empty" role="status">Loading charts.</p>}><Charts /></Suspense>
    </PageShell>
  );
}

type Entry = { productId: string; value: number; count: number; fragrance: FragranceSummary };

function Chart({ id, title, entries, empty, figure }: { id: string; title: string; entries: Entry[]; empty: string; figure: (e: Entry) => { value: string; label: string } }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="community-heading">{title}</h2>
      {entries.length ? (
        <ol className="chart-list">
          {entries.map((e, i) => {
            const f = figure(e);
            return <li key={e.productId}><StripRow fragrance={e.fragrance} meta={<> · <span className="chart-rank">#{i + 1}</span></>} aside={<MatchFigure value={f.value} label={f.label} />} /></li>;
          })}
        </ol>
      ) : <p className="reference-empty">{empty}</p>}
    </section>
  );
}

async function Charts() {
  const [c, newest, years] = await Promise.all([cachedCharts(), cachedSearch({ sort: "newest", pageSize: 8 }), cachedYears()]);
  const t = c.totals;
  const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
  return (
    <>
      <p className="reference-caption mt-6">{plural(t.members, "member has", "members have")} contributed {plural(t.ratings, "rating", "ratings")}, {plural(t.reviews, "review", "reviews")} and {plural(t.votes, "wear vote", "wear votes")}.</p>
      <div className="chart-grid mt-10">
        <Chart id="rated-h" title="Top rated by members" entries={c.rated.slice(0, 10)} figure={e => ({ value: e.value.toFixed(2), label: `${e.count} ratings` })} empty={`No fragrance has ${CHART_MIN_RATINGS} member ratings yet. Rate fragrances in your collection to start this chart.`} />
        <Chart id="reviewed-h" title="Most reviewed" entries={c.reviewed} figure={e => ({ value: String(e.count), label: e.count === 1 ? "review" : "reviews" })} empty="No reviews yet. Open any fragrance to write the first." />
        <Chart id="owned-h" title="Most owned" entries={c.owned} figure={e => ({ value: String(e.count), label: e.count === 1 ? "member" : "members" })} empty="No member has shelved a fragrance as owned yet." />
        <Chart id="wanted-h" title="Most wanted" entries={c.wanted} figure={e => ({ value: String(e.count), label: e.count === 1 ? "member" : "members" })} empty="No member has added a fragrance to a wishlist yet." />
      </div>
      {c.rated.length > 0 && <p className="reference-caption mt-4">Top rated uses a weighted average: fragrances with few ratings are pulled toward the average of all member ratings, and need at least {CHART_MIN_RATINGS} ratings to appear.</p>}

      <section className="reference-section section-divider" aria-labelledby="recent-h">
        <div className="reference-section-heading"><h2 id="recent-h">Latest reviews</h2></div>
        {c.recent.length ? <ol className="community-reviews">{c.recent.map(r => <li key={r.id}><Review review={r} fragrance={r.fragrance} /></li>)}</ol> : <p className="reference-empty">No reviews yet.</p>}
      </section>

      <section className="reference-section section-divider" aria-labelledby="newest-h">
        <div className="reference-section-heading"><h2 id="newest-h">Newest in the catalog</h2><Link href="/discover?sort=newest">All by release year <ArrowIcon /></Link></div>
        <div className="grid gap-3">{newest.items.map(f => <StripRow key={f.productId} fragrance={f} meta={<>{f.year ? <> · {f.year}</> : null}{f.wheel ? <> · {f.wheel}</> : null}</>} />)}</div>
      </section>

      <section className="reference-section" aria-labelledby="years-h">
        <div className="reference-section-heading"><h2 id="years-h">Browse by release year</h2></div>
        <div className="chip-links">{years.slice(0, 40).map(y => <Link key={y.year} href={`/discover?year=${y.year}`}>{y.year}<span>{y.n}</span></Link>)}</div>
      </section>
    </>
  );
}
