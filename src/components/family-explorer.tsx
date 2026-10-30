import Link from "next/link";
import type { CSSProperties } from "react";
import type { FragranceSummary } from "@/lib/catalog/queries";
import { hueFor } from "@/lib/hues";
import { ArrowIcon, PlusIcon } from "./icons";

/** Native disclosures keep the wheel usable with a keyboard and without script. */
export function FamilyExplorer({ fragrances }: { fragrances: FragranceSummary[] }) {
  const middle = Math.ceil(fragrances.length / 2);
  return <div className="family-explorer">
    {[fragrances.slice(0, middle), fragrances.slice(middle)].map((column, i) => (
      <ol key={i} start={i === 0 ? 1 : middle + 1}>
        {column.map(fragrance => <li key={fragrance.productId}>
          <details className="family-disclosure" name="accord-families" style={{ "--hue": hueFor(fragrance.wheel) } as CSSProperties}>
            <summary className="strip-h">
              <span className="sr-only">Inspect </span>
              <span className="stain-h" aria-hidden />
              <span className="family-disclosure-copy">
                <span>{fragrance.brand} · {fragrance.wheel ?? "Unclassified"}</span>
                <strong>{fragrance.name}</strong>
              </span>
              <PlusIcon className="family-disclosure-icon" />
            </summary>
            <div className="family-disclosure-body">
              <p className="family-note-label">Notes in this fragrance</p>
              <p>{fragrance.notes.join(" · ") || "No notes listed in the catalog."}</p>
              {fragrance.character && <p className="family-character">{fragrance.character}</p>}
              <div className="family-disclosure-actions">
                <Link href={`/fragrance/${fragrance.slug}`}>View fragrance <ArrowIcon /></Link>
                {fragrance.wheel && <Link href={`/discover?wheel=${encodeURIComponent(fragrance.wheel)}`}>Explore {fragrance.wheel.toLowerCase()} <ArrowIcon /></Link>}
              </div>
            </div>
          </details>
        </li>)}
      </ol>
    ))}
  </div>;
}
