"use client";

import { useEffect, useRef } from "react";

/** Submits the enclosing GET form when one of its selects changes. */
export function AutoSubmit() {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = marker.current?.closest("form");
    if (!form) return;
    const onChange = (e: Event) => {
      if (e.target instanceof HTMLSelectElement) form.requestSubmit();
    };
    form.addEventListener("change", onChange);
    return () => form.removeEventListener("change", onChange);
  }, []);
  return <span ref={marker} hidden />;
}
