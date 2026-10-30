import Link from "next/link";
import { CameraIcon, SearchIcon } from "./icons";

/**
 * The bench's working search: a real GET form to /discover, so it works
 * before hydration, with Scan beside it.
 */
export function SearchBar({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action="/discover" role="search" className="flex flex-col gap-3 sm:flex-row">
      <label className="flex h-[60px] w-full items-center sm:flex-1 gap-3 bg-paper px-[18px] shadow-[var(--shadow-paper)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus" style={{ borderRadius: 4 }}>
        <SearchIcon className="shrink-0 text-ink-2" />
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          placeholder="Fragrance, brand or note"
          aria-label="Search fragrances"
          className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-ink-3"
        />
        <kbd className="hidden border border-paper-edge px-1.5 py-0.5 font-mono text-xs text-ink-3 sm:inline" style={{ borderRadius: 3 }}>
          ⌘K
        </kbd>
      </label>
      <Link
        href="/scan"
        className="flex h-[60px] items-center justify-center gap-2.5 bg-ink px-5 font-medium text-paper transition-[background-color] hover:bg-ink-2"
        style={{ borderRadius: 4 }}
      >
        <CameraIcon />
        Scan a bottle
      </Link>
    </form>
  );
}
