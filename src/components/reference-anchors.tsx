"use client";

import { useEffect } from "react";

/** Resolve reference links after streamed content has actually reached the page. */
export function ReferenceAnchors({ identity }: { identity: string }) {
  useEffect(() => {
    let frame = 0;
    const reveal = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let id: string;
        try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
        if (!id) return;
        const target = document.querySelector<HTMLElement>(`main #${CSS.escape(id)}`);
        if (!target) return;
        if (target instanceof HTMLDetailsElement) target.open = true;
        target.scrollIntoView({ block: "start", behavior: "instant" });
      });
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", reveal); };
  }, [identity]);
  return null;
}
