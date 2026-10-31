"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { hueFor } from "@/lib/hues";
import { ArrowIcon, CloseIcon, SearchIcon } from "./icons";

type Hit = { productId: string; slug: string; name: string; brand: string; wheel: string | null; concentration?: string | null; year?: number | null };
// The four catalog examples shown in the approved search study. Not a ranking.
const STARTING_IDS = ["p14478", "p14483", "p14463", "p14470"];
const PaletteContext = createContext<{ open: (initial?: string) => void } | null>(null);

export function usePalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error("usePalette must be used inside PaletteProvider");
  return ctx;
}

/** Native modal focus, keyboard results, and a spacious inset search field. */
export function PaletteProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const listId = useId();
  const titleId = useId();
  const statusId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [q, setQ] = useState("");
  const [starters, setStarters] = useState<Hit[] | null>(null);
  const [starterError, setStarterError] = useState(false);
  const [response, setResponse] = useState<{ query: string; items: Hit[]; error: boolean } | null>(null);
  const [active, setActive] = useState(0);
  const query = q.trim();

  const open = useCallback((initial = "") => {
    setQ(initial);
    setActive(0);
    setStarterError(false);
    setIsOpen(true);
    dialog.current?.showModal();
    input.current?.focus();
    requestAnimationFrame(() => input.current?.select());
  }, []);
  const close = useCallback(() => { dialog.current?.close(); setIsOpen(false); }, []);

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
    if (!isOpen) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previous; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || (!query && starters)) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url = query ? `/api/search?q=${encodeURIComponent(query)}` : `/api/fragrances?ids=${STARTING_IDS.join(",")}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { items: Hit[] };
        if (controller.signal.aborted) return;
        if (query) setResponse({ query, items: data.items, error: false });
        else setStarters(data.items);
        setActive(0);
      } catch {
        if (controller.signal.aborted) return;
        if (query) setResponse({ query, items: [], error: true });
        else setStarterError(true);
      }
    }, query ? 120 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, isOpen, starters]);

  const current = response?.query === query;
  const shownHits = query ? (current ? response.items : []) : (starters ?? []);
  const loading = query ? !current : starters === null && !starterError;
  const error = query ? current && response.error : starterError;
  const message = error ? "Search is unavailable. You can continue in Discover." :
    loading ? (query ? "Searching fragrances." : "Loading a few fragrances to explore.") :
      query && !shownHits.length ? "No matching fragrance yet. Explore all results to adjust the search or request an entry." : "";
  const seeAll = query ? `/discover?q=${encodeURIComponent(query)}` : "/discover";
  const go = (href: string) => { close(); router.push(href); };
  const moveActive = (next: number) => {
    const index = Math.max(0, Math.min(next, shownHits.length));
    setActive(index);
    requestAnimationFrame(() => dialog.current?.querySelector(`[data-option-index="${index}"]`)?.scrollIntoView({ block: "nearest" }));
  };

  return (
    <PaletteContext.Provider value={{ open }}>
      {children}
      <dialog ref={dialog} aria-labelledby={titleId} className="quick-find" onClose={() => setIsOpen(false)} onClick={(e) => e.target === dialog.current && close()}>
        <div className="quick-find-surface">
          <header className="quick-find-header">
            <h2 id={titleId}>Find a fragrance</h2>
            <button type="button" className="quick-find-close" onClick={close} aria-label="Close search"><CloseIcon /></button>
          </header>
          <div className="quick-find-search">
            <label className="quick-find-field">
              <SearchIcon />
              <input
                ref={input} type="search" value={q} maxLength={80} autoComplete="off" spellCheck={false}
                onChange={(e) => { setQ(e.target.value); setActive(0); }}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === "Escape") { e.preventDefault(); close(); }
                  else if (e.key === "ArrowDown") { e.preventDefault(); moveActive(active + 1); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); moveActive(active - 1); }
                  else if (e.key === "Enter") {
                    e.preventDefault();
                    go(active < shownHits.length ? `/fragrance/${shownHits[active].slug}` : seeAll);
                  }
                }}
                role="combobox" aria-expanded="true" aria-controls={listId} aria-autocomplete="list"
                aria-activedescendant={`${listId}-${active}`} aria-describedby={message ? statusId : undefined}
                aria-label="Fragrance or brand" placeholder="Fragrance or brand" className="quick-find-input"
              />
            </label>
          </div>
          <div className="quick-find-content" tabIndex={0} role="region" aria-label="Fragrance matches">
            <p className="quick-find-caption">{query ? "Fragrances" : "A place to start"}</p>
            <p id={statusId} role="status" className="quick-find-status" hidden={!message}>{message}</p>
            <ul id={listId} role="listbox" aria-label="Fragrance results" className="quick-find-results">
              {shownHits.map((hit, i) => (
                <li key={hit.productId} id={`${listId}-${i}`} data-option-index={i} role="option" aria-selected={i === active}
                  onPointerMove={(e) => { if (e.pointerType === "mouse") setActive(i); }} onClick={() => go(`/fragrance/${hit.slug}`)} className="quick-find-result">
                  <span className="quick-find-blotter" aria-hidden="true" style={{ "--hue": hueFor(hit.wheel) } as CSSProperties} />
                  <span className="quick-find-result-copy"><span className="quick-find-result-name">{hit.name}</span><span className="quick-find-result-brand">{[hit.brand, hit.concentration, hit.year].filter(Boolean).join(" · ")}</span></span>
                </li>
              ))}
              <li id={`${listId}-${shownHits.length}`} data-option-index={shownHits.length} role="option" aria-selected={active === shownHits.length}
                onPointerMove={(e) => { if (e.pointerType === "mouse") setActive(shownHits.length); }} onClick={() => go(seeAll)}
                aria-label={query ? `See all results for “${query}”` : "Explore all fragrances"} className="quick-find-all">
                <span>Explore all results</span><ArrowIcon />
              </li>
            </ul>
          </div>
          <footer className="quick-find-footer">
            <Link href="/discover" onClick={close}>Explore notes and families</Link>
            <span className="quick-find-shortcuts" aria-hidden="true"><kbd>↑ ↓</kbd> to browse <kbd>esc</kbd> to close</span>
          </footer>
        </div>
      </dialog>
    </PaletteContext.Provider>
  );
}
