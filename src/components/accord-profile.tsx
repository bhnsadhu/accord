import Link from "next/link";
import type { CSSProperties } from "react";
import type { AccordStrength } from "@/lib/catalog/accord-profile";
import { hueFor } from "@/lib/hues";
import { ArrowIcon, PlusIcon } from "./icons";

/**
 * Main accords as stained bars, one hue per family. Strengths are relative
 * and estimated from listed notes; the caption and disclosure say how.
 */
export function AccordProfile({ accords, catalogFamily, labels, description, facets }: { accords: AccordStrength[]; catalogFamily: string | null; labels: Record<string, string>; description: string | null; facets: string[] }) {
  return (
    <section id="accords" className="reference-section" aria-labelledby="accords-h">
      <div className="reference-section-heading"><h2 id="accords-h">Accord profile</h2><Link href="/learn#families">Read the families <ArrowIcon /></Link></div>
      {(description || facets.length > 0) && (
        <div className="accord-reading">
          {description && <p><strong>{catalogFamily}.</strong> {description}</p>}
          {facets.length > 0 && <p className="reference-facet-links"><span className="text-ink-3">Also named in its catalog profile:</span>{facets.map(facet => <Link key={facet} href={`/discover?facet=${encodeURIComponent(facet)}`}>{facet}<ArrowIcon /></Link>)}</p>}
        </div>
      )}
      {accords.length ? (
        <>
          <ul className="accord-bars">
            {accords.map(a => (
              <li key={a.family} style={{ "--hue": hueFor(a.family), "--strength": a.strength } as CSSProperties}>
                <Link href={`/discover?wheel=${encodeURIComponent(a.family)}`} className="accord-bar">
                  <span className="accord-bar-fill" aria-hidden />
                  <span className="accord-bar-label">{a.family}{a.family === catalogFamily && <small>Catalog family</small>}<span className="sr-only">, {Math.round(a.strength * 100)} percent of the strongest accord</span></span>
                </Link>
                {a.notes.length > 0 && <p className="accord-bar-notes">{a.notes.slice(0, 4).map(k => labels[k] ?? k).join(", ")}</p>}
              </li>
            ))}
          </ul>
          <details className="reference-provenance">
            <summary>How this profile is calculated <PlusIcon /></summary>
            <div>
              <p>Accord estimates the profile from this fragrance’s listed notes. For each note, it checks which accord families the catalog’s fragrances with that note belong to, and counts a family when the note appears there more often than usual. The catalog’s own family classification always leads.</p>
              <p>Bar lengths are relative to the strongest accord. They are a catalog statistic, not a measurement of the fragrance or the amount of any ingredient. Notes under each bar are the ones pointing most clearly to that family.</p>
            </div>
          </details>
        </>
      ) : (
        <p className="research-unlisted">Not enough listed notes to estimate an accord profile. {catalogFamily ? `The catalog places it in the ${catalogFamily} family.` : "Its family is not listed."}</p>
      )}
    </section>
  );
}
