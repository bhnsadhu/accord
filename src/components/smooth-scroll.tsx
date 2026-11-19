"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

/**
 * Eased wheel scrolling for the whole site. Touch scrolling stays native, and
 * visitors who ask for reduced motion get the browser's own scrolling. Modal
 * dialogs (quick find and bottle photos) scroll themselves.
 */
export function SmoothScroll() {
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;

    const start = () => {
      if (lenis || motion.matches) return;
      // A touch tighter than the default 0.1 so the wheel never feels floaty.
      lenis = new Lenis({ autoRaf: true, lerp: 0.12, prevent: node => node.closest("dialog") !== null });
    };
    const stop = () => { lenis?.destroy(); lenis = null; };
    const onMotionChange = () => (motion.matches ? stop() : start());

    start();
    motion.addEventListener("change", onMotionChange);
    return () => {
      motion.removeEventListener("change", onMotionChange);
      stop();
    };
  }, []);

  return null;
}
