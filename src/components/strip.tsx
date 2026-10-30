import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { FragranceSummary } from "@/lib/catalog/queries";
import { hueFor } from "@/lib/hues";

type StripFragrance = Pick<FragranceSummary, "productId" | "slug" | "brand" | "name" | "wheel">;

/**
 * A smelling strip standing in the fan: tapered tip up, stained by the
 * fragrance's wheel family. The parent rotates it; hovering slides it up
 * its own axis, out of the fan.
 */
export function StripV({ fragrance, angle = 0, height = 640 }: { fragrance: StripFragrance; angle?: number; height?: number }) {
  return (
    <div className="absolute bottom-0 left-[-22px] w-11 origin-bottom" style={{ transform: `rotate(${angle}deg)`, height }}>
      <Link
        href={`/fragrance/${fragrance.slug}`}
        className="lift group block h-full w-full hover:-translate-y-6 focus-visible:-translate-y-6"
        aria-label={`${fragrance.brand} ${fragrance.name}`}
        style={{ "--hue": hueFor(fragrance.wheel) } as CSSProperties}
      >
        <span className="strip-v block h-full w-full" style={{ boxShadow: "inset 0 0 0 1px var(--color-paper-edge)" }}>
          <span className="stain-v" style={{ "--stain-depth": "190px" } as CSSProperties} />
          <span className="absolute left-1/2 top-[220px] rotate-180 whitespace-nowrap text-[13px] tracking-[0.01em] text-ink [writing-mode:vertical-rl] -translate-x-1/2">
            <b className="font-semibold">{fragrance.brand}</b> · {fragrance.name}
          </span>
        </span>
      </Link>
    </div>
  );
}

/** A fan of strips held in a beaker below the frame. */
export function StripFan({ fragrances, spread = 46, height = 640, className = "" }: { fragrances: StripFragrance[]; spread?: number; height?: number; className?: string }) {
  const n = fragrances.length;
  return (
    <div className={`pointer-events-none absolute h-0 w-0 [&_a]:pointer-events-auto ${className}`} aria-label="Fragrances">
      {fragrances.map((f, i) => (
        <StripV key={f.productId} fragrance={f} height={height} angle={n > 1 ? -spread / 2 - 7 + (i * spread) / (n - 1) : 0} />
      ))}
    </div>
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
      className="lift group relative min-w-0"
      style={{ "--hue": hueFor(fragrance.wheel) } as CSSProperties}
    >
      <div className={`strip-h min-h-24 ${ghost ? "strip-ghost" : ""}`}>
        {!ghost && <span className="stain-h" />}
        <div className="relative flex items-start gap-6 py-4 pl-[clamp(64px,10vw,124px)] pr-5">
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

export function MatchFigure({ value, label = "match" }: { value: number; label?: string }) {
  return (
    <div>
      <div className="font-mono text-2xl font-medium tracking-[-0.02em] tabular">{value}</div>
      <div className="text-xs text-ink-3">{label}</div>
    </div>
  );
}
