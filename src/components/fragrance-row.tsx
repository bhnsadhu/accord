import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { FragranceSummary } from "@/lib/catalog/queries";
import { BottleThumbnail } from "./bottle-thumbnail";
import { hueFor } from "@/lib/hues";

/** Shared fragrance lists show the exact catalog bottle beside its identity. */
export function FragranceRow({
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
      <div className={`fragrance-surface min-h-24 ${ghost ? "is-unconfirmed" : ""}`}>
        <BottleThumbnail fragrance={fragrance} className="fragrance-row-photo" />
        <div className="fragrance-content flex items-start gap-6 py-4 pr-5">
          <div className="min-w-0 flex-1">
            {ghost && <p className="fragrance-status">Unconfirmed</p>}
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
      <div className="text-2xl font-medium tracking-[-0.02em] tabular">{value}</div>
      <div className="text-xs text-ink-3">{label}</div>
    </div>
  );
}
