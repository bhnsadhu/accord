"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { hueFor } from "@/lib/hues";
import { SearchIcon } from "./icons";

type Hit = { productId: string; slug: string; name: string; brand: string; wheel: string | null };

const PaletteContext = createContext<{ open: (initial?: string) => void } | null>(null);

export function usePalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error("usePalette must be used inside PaletteProvider");
  return ctx;
}

/**
 * ⌘K quick find. A native <dialog> keeps focus inside while it is open and
 * returns it on close; arrow keys move through results, Enter opens one, and
 * "See all" hands the query to the full Discover page.
 */
export function PaletteProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const open = useCallback((initial = "") => {
    setQ(initial);
    dialog.current?.showModal();
    requestAnimationFrame(() => input.current?.select());
  }, []);
  const close = useCallback(() => dialog.current?.close(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) close();
        else open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    const query = q.trim();
    if (!query) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState("loading");
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { items: Hit[] };
        setHits(data.items);
        setActive(0);
        setState("idle");
      } catch (err) {
        if ((err as Error).name !== "AbortError") setState("error");
      }
    }, 120);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const shownHits = q.trim() ? hits : [];
  const go = (href: string) => {
    close();
    router.push(href);
  };
  const seeAll = `/discover?q=${encodeURIComponent(q.trim())}`;

  return (
    <PaletteContext.Provider value={{ open }}>
      {children}
      <dialog
        ref={dialog}
        aria-label="Find a fragrance"
        className="quick-find m-0 mx-auto mt-[12vh] w-[min(640px,calc(100vw-32px))] bg-transparent p-0 backdrop:bg-ink/25"
        onClick={(e) => e.target === dialog.current && close()}
      >
        <div className="bg-paper shadow-[var(--shadow-lifted)]" style={{ borderRadius: 4 }}>
          <label className="flex items-center gap-3 border-b border-paper-edge px-4 py-2">
            <SearchIcon className="shrink-0 text-ink-2" />
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, shownHits.length));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter" && q.trim()) {
                  e.preventDefault();
                  go(active < shownHits.length ? `/fragrance/${shownHits[active].slug}` : seeAll);
                }
              }}
              role="combobox"
              aria-expanded={Boolean(q.trim())}
              aria-controls={listId}
              aria-activedescendant={q.trim() ? `${listId}-${active}` : undefined}
              aria-label="Fragrance or brand"
              placeholder="Fragrance or brand"
              className="h-12 min-w-0 flex-1 bg-transparent px-2 text-base sm:text-lg placeholder:text-ink-3"
            />
            <kbd className="font-mono text-xs text-ink-3">esc</kbd>
          </label>
          <ul id={listId} role="listbox" aria-label="Fragrance results" hidden={!q.trim()} className="max-h-[52vh] overflow-y-auto py-2">
            {shownHits.map((hit, i) => (
              <li
                key={hit.productId}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(`/fragrance/${hit.slug}`)}
                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 aria-selected:bg-bench"
              >
                <span className="h-5 w-1.5 shrink-0" style={{ background: hueFor(hit.wheel) } as CSSProperties} />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{hit.name}</span>
                  <span className="text-ink-3"> · {hit.brand}</span>
                </span>
              </li>
            ))}
            {q.trim() && (
              <li
                id={`${listId}-${shownHits.length}`}
                role="option"
                aria-selected={active === shownHits.length}
                onMouseEnter={() => setActive(shownHits.length)}
                onClick={() => go(seeAll)}
                className="cursor-pointer px-4 py-2.5 text-ink-2 aria-selected:bg-bench"
              >
                {state === "error" ? "Search is unavailable. See all results instead" : `See all results for “${q.trim()}”`}
              </li>
            )}
          </ul>
          {!q.trim() && <p className="px-4 py-5 text-ink-3">Type a name or brand. Notes and families live in Discover.</p>}
          {q.trim() && state === "idle" && shownHits.length === 0 && (
            <p role="status" className="px-4 pb-4 text-ink-3">No name or brand matches. Try fewer letters.</p>
          )}
        </div>
      </dialog>
    </PaletteContext.Provider>
  );
}
