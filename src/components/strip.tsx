import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { FragranceSummary } from "@/lib/catalog/queries";
import { hueFor } from "@/lib/hues";

type StripFragrance = Pick<FragranceSummary, "productId" | "slug" | "brand" | "name" | "wheel">;

/**
 * A smelling strip standing in the fan: tapered tip up, stained by the
 * fragrance's wheel family. The parent rotates it. Only the stained tip is
 * the link, so neighbouring strips never share a touch target; hovering or
 * focusing it slides the whole strip up its own axis, out of the fan.
 */
export function StripV({
  fragrance,
  angle = 0,
  height = 640,
  locked = false,
}: {
  fragrance: StripFragrance;
  angle?: number;
  height?: number;
  locked?: boolean;
}) {
  return (
    <div className="absolute bottom-0 left-[-22px] w-11 origin-bottom" style={{ transform: `rotate(${angle}deg)`, height }}>
      <div className={`fan-strip lift h-full w-full ${locked ? "is-locked" : ""}`} style={{ "--hue": hueFor(fragrance.wheel) } as CSSProperties}>
        <span className="strip-v block h-full w-full" style={{ boxShadow: "inset 0 0 0 1px var(--color-paper-edge)" }}>
          <span className="stain-v" style={{ "--stain-depth": "190px" } as CSSProperties} />
          <span
            aria-hidden
            className="absolute left-1/2 top-[206px] max-h-[300px] -translate-x-1/2 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] tracking-[0.01em] text-ink [writing-mode:vertical-rl]"
          >
            <b className="font-semibold">{fragrance.brand}</b> · {fragrance.name}
          </span>
        </span>
        <Link
          href={`/fragrance/${fragrance.slug}`}
          className="absolute inset-x-0 top-0 h-[200px]"
          aria-label={`${fragrance.brand} ${fragrance.name}`}
        />
      </div>
    </div>
  );
}

/** A fan of strips held in a beaker below the frame. */
export function StripFan({
  fragrances,
  spread = 54,
  height = 640,
  className = "",
  locked,
}: {
  fragrances: StripFragrance[];
  spread?: number;
  height?: number;
  className?: string;
  locked?: Set<string>;
}) {
  const n = fragrances.length;
  return (
    <div className={`pointer-events-none absolute h-0 w-0 [&_a]:pointer-events-auto ${className}`}>
      {fragrances.map((f, i) => (
        <StripV
          key={f.productId}
          fragrance={f}
          height={height}
          locked={locked?.has(f.productId)}
          angle={n > 1 ? -spread / 2 - 5 + (i * spread) / (n - 1) : 0}
        />
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
      className={`group relative min-w-0 ${ghost ? "" : "lift"}`}
      style={{ "--hue": hueFor(fragrance.wheel) } as CSSProperties}
    >
      <div className={`strip-h min-h-24 ${ghost ? "strip-ghost" : ""}`}>
        {ghost ? (
          <>
            <span className="ghost-edge" aria-hidden />
            <svg className="ghost-tip" viewBox="0 0 28 100" preserveAspectRatio="none" aria-hidden>
              <polyline
                points="28,0.75 0.75,50 28,99.25"
                fill="none"
                stroke="var(--color-ink-3)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </>
        ) : (
          <span className="stain-h" />
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
