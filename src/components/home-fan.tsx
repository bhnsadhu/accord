"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { FragranceSummary } from "@/lib/catalog/queries";
import { hueFor } from "@/lib/hues";
import { ArrowIcon } from "./icons";
import { BottleThumbnail } from "./bottle-thumbnail";

const INTRO_DELAYS = [100, 50, 0, 50, 100, 150];
let introSeen = false;

/** Explore a shelf of catalog bottles, then inspect the selected fragrance. */
export function HomeFan({ fragrances }: { fragrances: (FragranceSummary & { bottleImage?: string })[] }) {
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
      "animationName" in animation && animation.animationName === "bottle-arrive",
    );
    let disposed = false;
    let finished = false;
    const finish = () => {
      if (disposed || finished) return;
      finished = true;
      clearTimeout(timeout);
      // Settle before removing the animation so skipping cannot leave a bottle midair.
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
        <p className="sr-only">Arranging your fragrance bottles. The site opens when the introduction finishes.</p>
        <form method="dialog"><button className="fan-intro-skip" type="submit">Skip intro</button></form>
      </dialog>
      <noscript><style>{`.fan-intro-gate { display: none !important; } .signature-bench .hero-bottle { animation: none !important; }`}</style></noscript>
      <div className="hero-bottles" role="group" aria-label="Explore signature fragrances" onPointerLeave={() => setHoverId(null)}>
        {fragrances.slice(0, 6).map((f, i) => (
          <button
            key={f.productId}
            type="button"
            className={`hero-bottle${f.productId === selected.productId ? " is-selected" : ""}`}
            style={{ "--intro-delay": `${INTRO_DELAYS[i]}ms` } as CSSProperties}
            onPointerEnter={event => { if (event.pointerType === "mouse") setHoverId(f.productId); }}
            onFocus={() => setHoverId(f.productId)}
            onBlur={() => setHoverId(null)}
            onClick={() => { setSelectedId(f.productId); setHoverId(null); }}
            aria-pressed={f.productId === selectedId}
          >
            <span className="sr-only">Preview {f.name} by {f.brand}</span>
            <BottleThumbnail fragrance={f} src={f.bottleImage} eager />
            <span className="hero-bottle-name" aria-hidden="true">{f.name}</span>
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
