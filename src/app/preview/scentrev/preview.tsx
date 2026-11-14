"use client";

import { useState } from "react";
import { PageShell, PageTitle } from "@/components/page-shell";
import { countLabel, metricLabel, SEASONS, supportedMetric, type ScentRevSnapshot, type SourceMetric } from "./model";
import "./preview.css";

export function ScentRevPreview({ snapshot }: { snapshot: ScentRevSnapshot }) {
  const [slug, setSlug] = useState("le-labo-santal-33");
  const selected = snapshot.records.find(record => record.slug === slug) ?? snapshot.records[0];
  if (!selected) return <PageShell><PageTitle>ScentRev preview</PageTitle><p className="page-intro">No sample fragrances are available.</p></PageShell>;
  const rating = supportedMetric(selected.rating);
  const captured = new Date(`${snapshot.capturedAt}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

  return <PageShell width="reference">
    <PageTitle>Another perspective on your fragrance.</PageTitle>
    <p className="page-intro">Explore how a sourced rating and wear report could sit alongside Accord’s fragrance research.</p>
    <aside className="scentrev-preview-notice" aria-label="Preview status">
      <strong>Local preview</strong><span>Saved ScentRev sample from {captured}. These figures are not live.</span>
    </aside>

    <div className="scentrev-preview-layout">
      <aside className="scentrev-preview-choices" aria-label="Sample fragrances">
        <h2>{snapshot.records.length} trial fragrances</h2>
        <p>Choose one to explore.</p>
        <div className="scentrev-preview-desktop-choices">
          {snapshot.records.map(record => <button key={record.slug} type="button" aria-pressed={selected.slug === record.slug}
            aria-label={`${record.name} by ${record.brand}`} aria-controls="scentrev-detail" onClick={() => setSlug(record.slug)} className="scentrev-preview-choice">
            <span><strong>{record.name}</strong><small>{record.brand}</small></span>
            {selected.slug === record.slug && <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="none"><path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </button>)}
        </div>
        <div className="scentrev-preview-mobile-choices">
          <label htmlFor="sample-fragrance">Choose a fragrance</label>
          <select id="sample-fragrance" value={selected.slug} onChange={event => setSlug(event.target.value)}>
            {snapshot.records.map(record => <option key={record.slug} value={record.slug}>{record.name} · {record.brand}</option>)}
          </select>
        </div>
      </aside>

      <p className="sr-only" role="status">Showing {selected.name} by {selected.brand}.</p>
      <article id="scentrev-detail" aria-labelledby="sample-name" className="scentrev-preview-detail">
        <header className="scentrev-preview-identity">
          <h2 id="sample-name">{selected.name}</h2>
          <p>{selected.brand}</p>
          <dl className="scentrev-preview-facts">
            <div><dt>Released</dt><dd>{selected.year ?? "Not listed"}</dd></div>
            <div><dt>Concentration in this source</dt><dd>{selected.concentration ?? "Not listed"}</dd></div>
          </dl>
        </header>

        <section className="scentrev-preview-section" aria-labelledby="rating-title">
          <div className="scentrev-preview-section-title"><h3 id="rating-title">ScentRev rating</h3><a href={snapshot.sourceUrl}>View source</a></div>
          {rating ? <div className="scentrev-preview-rating">
            <p><strong>{(rating.score * 5).toFixed(2)}</strong><span> / 5</span></p>
            <p><b>{countLabel(rating.count)}</b> reported rating records</p>
          </div> : <p className="scentrev-preview-missing">Not listed</p>}
          <p className="scentrev-preview-caption">A source-reported score. Your personal rating in Accord stays separate.</p>
        </section>

        <section className="scentrev-preview-section" aria-labelledby="wear-title">
          <h3 id="wear-title">How it wears</h3>
          <div className="scentrev-preview-wear">
            <WearMetric label="Longevity" metric={selected.longevity} axis="Very weak to eternal" />
            <WearMetric label="Sillage" metric={selected.sillage} axis="Intimate to enormous" />
          </div>
          <p className="scentrev-preview-caption">Relative scores from 0 to 1, not hours or distances. ScentRev derives projection from sillage, so it is shown only once.</p>
        </section>

        <section className="scentrev-preview-section" aria-labelledby="season-title">
          <h3 id="season-title">Through the seasons</h3>
          <p className="scentrev-preview-caption">Suitability from 0 to 1. Seasons are scored separately, not as shares of a whole.</p>
          <div className="scentrev-preview-seasons">
            {SEASONS.map(season => {
              const metric = supportedMetric(selected.seasons[season]);
              const name = season === "fall" ? "Fall" : metricLabel(season);
              return <div key={season} className="scentrev-preview-season">
                <div><span>{name}</span><b>{metric ? metric.score.toFixed(2) : "Not listed"}</b></div>
                {metric && <><meter min={0} max={1} value={metric.score} aria-label={`${name} suitability`} /><small>{countLabel(metric.count)} reported records</small></>}
              </div>;
            })}
          </div>
        </section>

        <details className="scentrev-preview-source">
          <summary>About these figures</summary>
          <div>
            <p>Captured from <a href={snapshot.sourceUrl}>ScentRev</a> on {captured}. The original community and the dates of its observations were not listed. Reported records have not been verified as unique voters.</p>
            <p>The inspected Aventus and Santal 33 profiles disclose Bayesian smoothing. The comparison used here does not explain that calculation for each fragrance.</p>
            <p>All seasonal counts in this sample are multiples of 100. Their rounding method is not documented. These are suitability scores, not percentages of people recommending a season.</p>
            <p>Only two source names specify a concentration. This preview does not join these records to Accord’s catalog or add them to your collection.</p>
            <a href="https://github.com/bhnsadhu/accord/blob/main/docs/SOURCE-FEASIBILITY.md#scentrev-trial-2026-11-13">Read the ten-fragrance trial</a>
          </div>
        </details>
      </article>
    </div>
  </PageShell>;
}

function WearMetric({ label, metric: source, axis }: { label: string; metric: SourceMetric | null; axis: string }) {
  const metric = supportedMetric(source);
  return <div className="scentrev-preview-wear-metric">
    <div className="scentrev-preview-metric-heading"><h4>{label}</h4><span>{metric ? metricLabel(metric.category) : "Not listed"}</span></div>
    {metric && <>
      <div className="scentrev-preview-meter-row"><meter min={0} max={1} value={metric.score} aria-label={`${label} score`} /><b>{metric.score.toFixed(2)}</b></div>
      <p>{axis}<span>{countLabel(metric.count)} reported records</span></p>
    </>}
  </div>;
}
