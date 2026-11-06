"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

/**
 * Eased wheel scrolling for the whole site. Touch scrolling stays native, and
 * visitors who ask for reduced motion get the browser's own scrolling. Modal
 * dialogs (quick find, bottle photos, the entrance gate) scroll themselves, and
 * the entrance locks the page while it plays, so Lenis waits through both.
 */
export function SmoothScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;

    const sync = () => {
      if (!lenis) return;
      if (root.classList.contains("accord-intro-active")) lenis.stop();
      else lenis.start();
    };
    const start = () => {
      if (lenis || motion.matches) return;
      // A touch tighter than the default 0.1 so the wheel never feels floaty.
      lenis = new Lenis({ autoRaf: true, lerp: 0.12, prevent: node => node.closest("dialog") !== null });
      sync();
    };
    const stop = () => { lenis?.destroy(); lenis = null; };
    const onMotionChange = () => (motion.matches ? stop() : start());

    start();
    motion.addEventListener("change", onMotionChange);
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => {
      motion.removeEventListener("change", onMotionChange);
      observer.disconnect();
      stop();
    };
  }, []);

  return null;
}
