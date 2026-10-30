"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { FragranceSummary } from "@/lib/catalog/queries";
import { hueFor } from "@/lib/hues";
import { ArrowIcon } from "./icons";
import { StripSpecimen } from "./strip";

const POSITIONS = [18, 32, 47, 61, 73, 83];
const COMPACT_POSITIONS = [15, 29, 45, 60, 73, 84];
const COMPACT_ANGLES = [-10, -7, 3, 8, 10, 11];
const ANGLES = [-24, -13, 5, 16, 24, 32];
const HEIGHTS = [350, 402, 470, 430, 395, 350];

/** Pick up a paper strip, then inspect its fragrance. */
export function HomeFan({ fragrances }: { fragrances: FragranceSummary[] }) {
  const [selectedId, setSelectedId] = useState(() => fragrances.find(f => f.productId === "p14487")?.productId ?? fragrances[0]?.productId);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const selected = fragrances.find(f => f.productId === (hoverId ?? selectedId)) ?? fragrances[0];
  if (!selected) return null;

  return (
    <div className="signature-bench">
      <div className="hero-fan" role="group" aria-label="Explore signature fragrances" onPointerLeave={() => setHoverId(null)}>
        <div className="bench-cast-light" aria-hidden />
        {fragrances.slice(0, 6).map((f, i) => (
          <button
            key={f.productId}
            type="button"
            className={`hero-strip${f.productId === selected.productId ? " is-selected" : ""}`}
            style={{ "--position": `${POSITIONS[i]}%`, "--angle": `${ANGLES[i]}deg`, "--compact-position": `${COMPACT_POSITIONS[i]}%`, "--compact-angle": `${COMPACT_ANGLES[i]}deg`, "--height": `${HEIGHTS[i]}px`, "--hue": hueFor(f.wheel) } as CSSProperties}
            onPointerEnter={event => { if (event.pointerType === "mouse") setHoverId(f.productId); }}
            onFocus={() => setHoverId(f.productId)}
            onBlur={() => setHoverId(null)}
            onClick={() => { setSelectedId(f.productId); setHoverId(null); }}
            aria-pressed={f.productId === selectedId}
          >
            <span className="sr-only">Preview </span>
            <StripSpecimen fragrance={f} decorative={false} />
            <span className="sr-only"> by {f.brand}</span>
          </button>
        ))}
        <div className="blotter-stand" aria-hidden="true">
          <div className="blotter-stand-top">
            {fragrances.slice(0, 6).map((f, i) => <span key={f.productId} className="blotter-slot" style={{ "--position": `${POSITIONS[i]}%`, "--compact-position": `${COMPACT_POSITIONS[i]}%`, "--angle": `${ANGLES[i] / 3}deg` } as CSSProperties} />)}
          </div>
          <div className="blotter-stand-front"><span>Fragrance blotters</span></div>
        </div>
      </div>
      <div className="signature-selection" aria-live="polite" aria-atomic="true" style={{ "--hue": hueFor(selected.wheel) } as CSSProperties}>
        <div className="signature-identity selection-change" key={`identity-${selected.productId}`}>
          <span className="signature-family" aria-hidden />
          <div><h2>{selected.name}</h2><p>{selected.brand}<span> · {selected.wheel}</span></p></div>
        </div>
        <div className="signature-notes selection-change" key={`notes-${selected.productId}`}><span>Notes</span><p>{selected.notes.slice(0, 4).join(" · ")}</p></div>
        <div className="signature-actions">
          <Link className="bench-button" href={`/fragrance/${selected.slug}`}>View fragrance <ArrowIcon /></Link>
          <Link className="bench-button secondary" href={`/discover?q=${encodeURIComponent(selected.brand)}`}>Explore the house</Link>
        </div>
      </div>
    </div>
  );
}
