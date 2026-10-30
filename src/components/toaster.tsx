"use client";

import { useEffect } from "react";
import { useAccord } from "@/lib/store";
import { CloseIcon } from "./icons";

/** Surfaces save failures from the store; polite, dismissible, self-clearing. */
export function Toaster() {
  const { error, clearError } = useAccord();
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 6000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 md:bottom-8">
      {error && (
        <div className="pointer-events-auto flex items-center gap-3 bg-ink py-3 pl-4 pr-2 text-paper shadow-[var(--shadow-lifted)]" style={{ borderRadius: 4 }}>
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Dismiss" className="p-1.5 text-paper/80 hover:text-paper">
            <CloseIcon />
          </button>
        </div>
      )}
    </div>
  );
}
