"use client";

import Link from "next/link";
import { useId, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import type { FragranceSummary } from "@/lib/catalog/queries";
import { hueFor } from "@/lib/hues";
import { ArrowIcon, CloseIcon } from "./icons";
import { StripSpecimen } from "./strip";

const FILTER_DESKTOP_QUERY = "(min-width: 1100px)";
const INLINE_PREVIEW_QUERY = "(max-width: 700px)";

function subscribeFilterViewport(notify: () => void) {
  const media = window.matchMedia(FILTER_DESKTOP_QUERY);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

function subscribeInlinePreviewViewport(notify: () => void) {
  const media = window.matchMedia(INLINE_PREVIEW_QUERY);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

/** Server-rendered filters remain ordinary forms and links inside this disclosure. */
export function ArchiveFilters({ children, activeCount = 0 }: { children: ReactNode; activeCount?: number }) {
  const desktop = useSyncExternalStore(
    subscribeFilterViewport,
    () => window.matchMedia(FILTER_DESKTOP_QUERY).matches,
    () => false,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <details
      className="archive-filter-disclosure"
      open={desktop || mobileOpen}
      onToggle={(event) => {
        if (!desktop) setMobileOpen(event.currentTarget.open);
      }}
    >
      <summary className="archive-filter-summary">
        <span>Filters</span>
        {activeCount > 0 && <span className="archive-filter-count">{activeCount} active</span>}
        <span className="archive-filter-toggle" aria-hidden="true">+</span>
      </summary>
      <div className="archive-filter-body">{children}</div>
    </details>
  );
}

/**
 * A page of server-filtered results with a local specimen selection. The parent
 * keys this component by the ordered result ids, so new results start with the
 * first fragrance and cannot retain a comparison from a different page.
 */
export function DiscoverResults({ fragrances }: { fragrances: FragranceSummary[] }) {
  const [selectedId, setSelectedId] = useState(fragrances[0]?.productId ?? "");
  const [comparisonId, setComparisonId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const inlinePreview = useSyncExternalStore(
    subscribeInlinePreviewViewport,
    () => window.matchMedia(INLINE_PREVIEW_QUERY).matches,
    () => false,
  );
  const previewId = useId();
  const titleId = useId();
  const selected = fragrances.find((f) => f.productId === selectedId) ?? fragrances[0];
  const comparison = fragrances.find((f) => f.productId === comparisonId);

  if (!selected) return null;

  const detailHref = `/fragrance/${selected.slug}`;
  const readyToCompare = comparison && comparison.productId !== selected.productId;
  const previewActions = (
    <>
      <Link className="archive-view-button" href={detailHref}>
        View fragrance <ArrowIcon width={17} height={17} />
      </Link>
      {fragrances.length === 1 ? (
        <Link className="archive-compare-button" href={`${detailHref}#similar-h`} aria-label={`Find a similar fragrance to compare with ${selected.name}`}>
          Compare
        </Link>
      ) : readyToCompare ? (
        <Link className="archive-compare-button" href={`/compare?a=${comparison.productId}&b=${selected.productId}`}>
          Compare the two
        </Link>
      ) : comparison ? (
        <button className="archive-compare-button" type="button" disabled>
          Choose another fragrance
        </button>
      ) : (
        <button className="archive-compare-button" type="button" onClick={() => setComparisonId(selected.productId)}>
          Compare
        </button>
      )}
    </>
  );

  return (
    <div className="archive-results">
      <p className="sr-only" role="status">
        Previewing {selected.name} by {selected.brand}.
      </p>

      <div className="archive-list-column">
        {comparison && (
          <div className="archive-compare-prompt" role="status">
            <p>
              {readyToCompare ? "Ready to compare with " : "Choose another fragrance to compare with "}
              <strong>{comparison.name}</strong>.
            </p>
            <button type="button" onClick={() => setComparisonId(null)} aria-label="Cancel comparison">
              <CloseIcon width={16} height={16} />
              <span>Cancel</span>
            </button>
          </div>
        )}

        <ul className="archive-list" aria-label="Fragrance results">
          {fragrances.map((fragrance) => {
            const isSelected = fragrance.productId === selected.productId;
            const isComparison = fragrance.productId === comparison?.productId;
            const isExpanded = isSelected && expandedId === fragrance.productId;
            const inlineId = `${previewId}-${fragrance.productId}`;
            const choiceId = `${inlineId}-choice`;

            return (
              <li
                key={fragrance.productId}
                className={`archive-item${isSelected ? " is-selected" : ""}${isComparison ? " is-comparison" : ""}`}
                style={{ "--hue": hueFor(fragrance.wheel) } as CSSProperties}
              >
                <button
                  id={choiceId}
                  type="button"
                  className={`archive-choice${isSelected ? " is-selected" : ""}`}
                  aria-pressed={isSelected}
                  aria-controls={inlinePreview ? (isExpanded ? inlineId : undefined) : previewId}
                  aria-expanded={inlinePreview ? isExpanded : undefined}
                  onClick={() => {
                    setSelectedId(fragrance.productId);
                    setExpandedId(fragrance.productId);
                  }}
                >
                  <span className="sr-only">Preview </span>
                  <span className="archive-choice-copy">
                    <span className="archive-choice-name">{fragrance.name}</span>
                    <span className="archive-choice-brand">{[fragrance.brand, fragrance.concentration, fragrance.year].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="archive-choice-meta">
                    {isComparison ? "To compare" : fragrance.wheel ?? "Unclassified"}
                  </span>
                  <span className="archive-choice-selection" aria-hidden="true">
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="m3 7 2.5 2.5L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="archive-choice-tip" aria-hidden="true" />
                </button>

                <Link className="archive-open" href={`/fragrance/${fragrance.slug}`} aria-label={`View fragrance: ${fragrance.name} by ${fragrance.brand}`}>
                  <span>View fragrance</span>
                  <ArrowIcon width={16} height={16} />
                </Link>

                {isExpanded && (
                  <section id={inlineId} className="archive-mobile-preview" aria-label={`Details for ${selected.name}`}>
                    <div className="archive-mobile-preview-heading">
                      <p>{[selected.wheel, selected.character].filter(Boolean).join(" · ") || "Fragrance details"}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedId(null);
                          document.getElementById(choiceId)?.focus({ preventScroll: true });
                        }}
                        aria-label={`Close preview for ${selected.name}`}
                      >
                        <CloseIcon width={16} height={16} />
                        <span>Close</span>
                      </button>
                    </div>
                    <h3>Notes</h3>
                    {selected.notes.length ? (
                      <ul className="archive-mobile-preview-notes">
                        {selected.notes.map((note) => <li key={note}>{note}</li>)}
                      </ul>
                    ) : (
                      <p>No notes listed in the catalog.</p>
                    )}
                    {comparison && (
                      <div className="archive-mobile-comparison">
                        <p>{readyToCompare ? "Compare with " : "Choose another result to compare with "}<strong>{comparison.name}</strong>.</p>
                        <button type="button" onClick={() => setComparisonId(null)}>Cancel comparison</button>
                      </div>
                    )}
                    <div className="archive-preview-actions archive-mobile-preview-actions">{previewActions}</div>
                  </section>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <aside id={previewId} className="archive-preview" aria-labelledby={titleId}>
        <div className="archive-preview-strip specimen-change" key={selected.productId} aria-hidden="true">
          <StripSpecimen fragrance={selected} className="archive-preview-paper" />
        </div>

        <div className="archive-preview-content">
          <header className="archive-preview-heading selection-change" key={`heading-${selected.productId}`}>
            <h2 id={titleId}>{selected.name}</h2>
            <p>{selected.brand}</p>
          </header>

          <dl className="archive-preview-facts">
            {selected.concentration && <div><dt>Concentration</dt><dd>{selected.concentration}</dd></div>}
            {selected.year && <div><dt>Released</dt><dd>{selected.year}</dd></div>}
            <div>
              <dt>Accord family</dt>
              <dd>
                <i style={{ backgroundColor: hueFor(selected.wheel) }} aria-hidden="true" />
                {selected.wheel ?? "Unclassified"}
              </dd>
            </div>
            {selected.character && (
              <div>
                <dt>Character</dt>
                <dd>{selected.character}</dd>
              </div>
            )}
          </dl>

          <section className="archive-preview-note-section" aria-labelledby={`${titleId}-notes`}>
            <h3 id={`${titleId}-notes`}>Notes</h3>
            {selected.notes.length ? (
              <ul className="archive-preview-notes">
                {selected.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : (
              <p className="archive-preview-no-notes">No notes listed in the catalog.</p>
            )}
          </section>

          <div className="archive-preview-actions">{previewActions}</div>
        </div>
      </aside>
    </div>
  );
}
