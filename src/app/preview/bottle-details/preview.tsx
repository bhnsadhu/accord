"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowIcon, CameraIcon, SearchIcon } from "@/components/icons";
import { BottleThumbnail } from "@/components/bottle-thumbnail";
import { homeBottleName } from "@/lib/home-bottles";
import { DetailsRow, RelatedBottles, ScentCard } from "./panels";
import type { PreviewBottle } from "./types";
import "./preview.css";

const variants = ["Details row", "Scent card", "Related bottles"];
const descriptions = [
  "A quiet, compact row. Just the identity, key notes, and a link.",
  "A soft inset card with a short description of the scent.",
  "A little more discovery: the selected scent and two related bottles.",
];
const Panels = [DetailsRow, ScentCard, RelatedBottles];

export function BottleDetailsPreview({ bottles, initialVariant }: { bottles: PreviewBottle[]; initialVariant: number }) {
  const [variant, setVariant] = useState(initialVariant);
  const [selected, setSelected] = useState<string | null>("p14487");
  const selectedButton = useRef<HTMLButtonElement | null>(null);
  const preview = useRef<HTMLDivElement | null>(null);
  const current = bottles.find(bottle => bottle.productId === selected);
  const Panel = Panels[variant];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName))) return;
      if (/^[123]$/.test(event.key)) {
        const next = Number(event.key) - 1;
        setVariant(next);
        const url = new URL(window.location.href);
        url.searchParams.set("v", String(next + 1));
        window.history.replaceState(null, "", url);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function chooseVariant(next: number) {
    setVariant(next);
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(next + 1));
    window.history.replaceState(null, "", url);
  }

  function chooseBottle(id: string, button: HTMLButtonElement) {
    setSelected(id);
    selectedButton.current = button;
    if (window.matchMedia("(max-width: 700px)").matches) {
      requestAnimationFrame(() => preview.current?.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }));
    }
  }

  return <div className="bottle-options-previewPage">
    <div className="bottle-options-toolbar">
      <div><strong>Bottle preview options</strong><p>{descriptions[variant]}</p></div>
      <nav aria-label="Preview designs">{variants.map((name, i) => <button key={name} type="button" aria-pressed={variant === i} onClick={() => chooseVariant(i)}><span>{i + 1}</span>{name}</button>)}</nav>
    </div>
    <section className="signature-hero" aria-labelledby="signature-heading">
      <div className="signature-heading">
        <div><h1 id="signature-heading">Know the bottle. Find the next one.</h1><p>Fragrance, understood through notes.</p></div>
        <div className="signature-search">
          <form action="/discover" role="search"><label><SearchIcon /><input type="search" name="q" placeholder="Search fragrances or brands" aria-label="Search fragrances" /></label><button type="submit" className="bench-button">Explore <ArrowIcon /></button></form>
          <Link href="/scan" className="signature-scan"><CameraIcon className="signature-scan-camera" /><span><strong>Scan a bottle</strong><span>Identify from a photo</span></span><ArrowIcon className="signature-scan-arrow" /></Link>
        </div>
      </div>
      <ul className={`hero-bottles bottle-options-bottles`} aria-label="Signature fragrances">
        {bottles.map(bottle => <li key={bottle.productId}>
          <button ref={button => { if (selected === bottle.productId) selectedButton.current = button; }} className="hero-bottle bottle-options-bottle" type="button" aria-label={`Preview ${homeBottleName(bottle)} by ${bottle.brand}`} aria-pressed={selected === bottle.productId} aria-controls="bottle-details-preview" onClick={event => chooseBottle(bottle.productId, event.currentTarget)}>
            <BottleThumbnail fragrance={bottle} src={bottle.bottleImage} eager />
            <span className="hero-bottle-caption"><span className="hero-bottle-name">{homeBottleName(bottle)}</span><span className="hero-bottle-brand">{bottle.brand}</span></span>
          </button>
        </li>)}
      </ul>
      <div ref={preview} id="bottle-details-preview" className="bottle-options-panelFrame">
        {current ? <section className="bottle-options-panel" data-variant={variant} aria-labelledby="bottle-preview-title">
          <div aria-live="polite"><Panel bottle={current} /></div>
          <button type="button" className="bottle-options-close" aria-label="Close fragrance preview" onClick={() => { setSelected(null); selectedButton.current?.focus(); }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
        </section> : <p className="bottle-options-empty">Choose a bottle to explore its scent.</p>}
      </div>
    </section>
    <div className="bottle-options-after"><p>Click any bottle to try this design.</p><span>Use 1, 2 or 3 to switch options.</span></div>
  </div>;
}
