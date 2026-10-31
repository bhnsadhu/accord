"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { FragranceSummary } from "@/lib/catalog/queries";
import { hueFor } from "@/lib/hues";
import { ArrowIcon } from "./icons";
import { StripSpecimen } from "./strip";

const POSITIONS = [18, 32, 47, 61, 73, 83];
const COMPACT_POSITIONS = [15, 29, 45, 60, 73, 84];
const COMPACT_ANGLES = [-10, -7, 3, 8, 10, 11];
const ANGLES = [-24, -13, 5, 16, 24, 32];
const HEIGHTS = [350, 402, 470, 430, 395, 350];
const INTRO_DELAYS = [150, 100, 0, 50, 200, 250];
let introSeen = false;

/** Pick up a paper strip, then inspect its fragrance. */
export function HomeFan({ fragrances }: { fragrances: FragranceSummary[] }) {
  const benchRef = useRef<HTMLDivElement>(null);
  const gateRef = useRef<HTMLDialogElement>(null);
  const [selectedId, setSelectedId] = useState(() => fragrances.find(f => f.productId === "p14487")?.productId ?? fragrances[0]?.productId);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const selected = fragrances.find(f => f.productId === (hoverId ?? selectedId)) ?? fragrances[0];

  useLayoutEffect(() => {
    const bench = benchRef.current;
    const gate = gateRef.current;
    if (!bench || !gate) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const arrivals = bench.getAnimations({ subtree: true }).filter(animation =>
      "animationName" in animation && animation.animationName === "fan-arrive",
    );
    let disposed = false;
    let finished = false;
    const finish = () => {
      if (disposed || finished) return;
      finished = true;
      clearTimeout(timeout);
      // Settle before removing the animation so skipping cannot leave a strip midair.
      arrivals.forEach(animation => animation.finish());
      bench.dataset.intro = "done";
      gate.close();
      document.documentElement.classList.remove("accord-intro-active");
      introSeen = true;
    };
    // A stalled animation must never leave the site locked.
    const timeout = setTimeout(finish, 1800);
    const onMotionChange = () => { if (motion.matches) finish(); };
    // A cleanup close can be queued until after Strict Mode reopens the dialog.
    const onGateClose = () => { if (!gate.open) finish(); };
    const onVisibilityChange = () => { if (document.hidden) finish(); };
    const containShortcut = (event: KeyboardEvent) => {
      event.stopPropagation();
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") event.preventDefault();
    };

    if (introSeen || motion.matches || document.hidden || !arrivals.some(animation => animation.playState !== "finished")) {
      finish();
      return;
    }

    // SSR supplies a temporary click shield; native modality also blocks keyboard
    // access as soon as hydration runs. The animation itself starts with CSS.
    gate.open = false;
    gate.showModal();
    gate.focus({ preventScroll: true });
    bench.dataset.intro = "playing";
    document.documentElement.classList.add("accord-intro-active");
    gate.addEventListener("close", onGateClose);
    gate.addEventListener("keydown", containShortcut);
    motion.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("resize", finish);
    window.addEventListener("pagehide", finish);
    void Promise.all(arrivals.map(animation => animation.finished)).then(finish, finish);

    return () => {
      disposed = true;
      clearTimeout(timeout);
      gate.removeEventListener("close", onGateClose);
      gate.removeEventListener("keydown", containShortcut);
      motion.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", finish);
      window.removeEventListener("pagehide", finish);
      gate.close();
      document.documentElement.classList.remove("accord-intro-active");
    };
  }, []);

  if (!selected) return null;

  return (
    <div className="signature-bench" ref={benchRef} data-intro="pending">
      <dialog ref={gateRef} open className="fan-intro-gate" aria-label="Welcome to Accord">
        <p className="sr-only">Arranging your fragrance strips. The site opens when the introduction finishes.</p>
        <form method="dialog"><button className="fan-intro-skip" type="submit">Skip intro</button></form>
      </dialog>
      <noscript><style>{`.fan-intro-gate { display: none !important; } .signature-bench .hero-strip { animation: none !important; }`}</style></noscript>
      <div className="hero-fan" role="group" aria-label="Explore signature fragrances" onPointerLeave={() => setHoverId(null)}>
        <div className="bench-cast-light" aria-hidden />
        {fragrances.slice(0, 6).map((f, i) => (
          <button
            key={f.productId}
            type="button"
            className={`hero-strip${f.productId === selected.productId ? " is-selected" : ""}`}
            style={{ "--position": `${POSITIONS[i]}%`, "--angle": `${ANGLES[i]}deg`, "--compact-position": `${COMPACT_POSITIONS[i]}%`, "--compact-angle": `${COMPACT_ANGLES[i]}deg`, "--height": `${HEIGHTS[i]}px`, "--hue": hueFor(f.wheel), "--intro-shift": `${50 - POSITIONS[i]}cqw`, "--compact-intro-shift": `${50 - COMPACT_POSITIONS[i]}cqw`, "--intro-angle": `${(i - 2) * 2}deg`, "--intro-delay": `${INTRO_DELAYS[i]}ms` } as CSSProperties}
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
      </div>
      <div className="signature-selection" aria-live="polite" aria-atomic="true" style={{ "--hue": hueFor(selected.wheel) } as CSSProperties}>
        <div className="signature-identity">
          <span className="signature-family" aria-hidden />
          <div><h2>{selected.name}</h2><p>{selected.brand}<span> · {selected.wheel}</span></p></div>
        </div>
        <div className="signature-notes"><span>Notes</span><p>{selected.notes.slice(0, 4).join(" · ")}</p></div>
        <div className="signature-actions">
          <Link className="bench-button" href={`/fragrance/${selected.slug}`}>View fragrance <ArrowIcon /></Link>
          <Link className="bench-button secondary" href={`/discover?q=${encodeURIComponent(selected.brand)}`}>Explore the house</Link>
        </div>
      </div>
    </div>
  );
}
