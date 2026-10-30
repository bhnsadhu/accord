import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { FragranceSummary } from "@/lib/catalog/queries";
import { hueFor } from "@/lib/hues";

export type StripFragrance = Pick<FragranceSummary, "productId" | "slug" | "brand" | "name" | "wheel">;

/** The printed paper object; selection and navigation belong to its parent. */
export function StripSpecimen({ fragrance, className = "", decorative = true }: { fragrance: StripFragrance; className?: string; decorative?: boolean }) {
  return (
    <span className={`strip-v strip-specimen ${className}`} style={{ "--hue": hueFor(fragrance.wheel) } as CSSProperties} aria-hidden={decorative || undefined}>
      <span className="stain-v" />
      <span className="specimen-print"><strong>{fragrance.name}</strong><span>{fragrance.brand}</span></span>
      <span className="specimen-emboss">Accord</span>
    </span>
  );
}

/**
 * The list module: a strip laid flat on the bench. Every list in Accord
 * (search results, recommendations, collections, similar) uses it.
 */
export function StripRow({
  fragrance,
  href,
  meta,
  aside,
  children,
  ghost = false,
}: {
  fragrance: FragranceSummary;
  href?: string;
  meta?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  ghost?: boolean;
}) {
  const link = href ?? `/fragrance/${fragrance.slug}`;
  return (
    <article
      className={`fragrance-row group relative min-w-0 ${ghost ? "" : "lift"}`}
      style={{ "--hue": hueFor(fragrance.wheel) } as CSSProperties}
    >
      <div className={`strip-h min-h-24 ${ghost ? "strip-ghost" : ""}`}>
        {ghost ? (
          <>
            <span className="ghost-edge" aria-hidden />
          </>
        ) : (
          <span className="stain-h" aria-hidden />
        )}
        <div className="strip-text relative flex items-start gap-6 py-4 pr-5">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-ink-3">
              {fragrance.brand}
              {meta ?? (fragrance.wheel ? <> · {fragrance.wheel}</> : null)}
            </p>
            <h3 className="mt-0.5 text-lg font-semibold leading-snug tracking-[-0.01em]">
              <Link href={link} className="after:absolute after:inset-0 focus-visible:outline-none">
                {fragrance.name}
              </Link>
            </h3>
            {children ?? (
              fragrance.notes.length > 0 && (
                <p className="mt-1 truncate text-[15px] text-ink-2">{fragrance.notes.slice(0, 6).join(", ")}</p>
              )
            )}
          </div>
          {aside && <div className="relative z-10 shrink-0 text-right">{aside}</div>}
        </div>
      </div>
    </article>
  );
}

export function MatchFigure({ value, label = "match" }: { value: ReactNode; label?: string }) {
  return (
    <div>
      <div className="font-mono text-2xl font-medium tracking-[-0.02em] tabular">{value}</div>
      <div className="text-xs text-ink-3">{label}</div>
    </div>
  );
}
