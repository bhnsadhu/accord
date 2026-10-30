"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAccord } from "@/lib/store";
import { usePalette } from "./command-palette";
import { SearchIcon } from "./icons";

const LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/for-you", label: "For you" },
  { href: "/collection", label: "Collection" },
  { href: "/scan", label: "Scan" },
];

export function Nav() {
  const pathname = usePathname();
  const { account, ready } = useAccord();
  const palette = usePalette();

  return (
    <header className="relative z-20">
      <nav aria-label="Main" className="accord-navigation mx-auto flex h-[72px] max-w-[1440px] items-center gap-6 px-4 sm:px-8 lg:px-16">
        <Link href="/" className="accord-wordmark flex items-center gap-2.5 text-[21px] font-bold tracking-[-0.03em]">
          <Image src="/brand/accord-wordmark.svg" alt="Accord" width={111} height={30} unoptimized />
        </Link>
        <ul className="desktop-sections hidden items-center gap-7 pl-6 text-[15px] md:flex">
          {LINKS.map((l) => {
            const current = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={current ? "page" : undefined}
                  className="text-ink-2 transition-colors hover:text-ink aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-ink"
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="ml-auto flex items-center gap-3 text-[15px]">
          <button
            type="button"
            onClick={() => palette.open()}
            className="flex h-9 items-center gap-2 px-2 text-ink-2 transition-colors hover:text-ink"
            aria-keyshortcuts="Meta+K Control+K"
          >
            <SearchIcon />
            <span className="sr-only">Find a fragrance</span>
            <kbd aria-hidden className="hidden font-mono text-xs text-ink-3 sm:inline">
              ⌘K
            </kbd>
          </button>
          {!ready ? (
            <span className="h-9 w-20" aria-hidden />
          ) : account ? (
            <Link href="/account" className="max-w-40 truncate text-ink hover:underline">
              {account.name}
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="hidden text-ink hover:underline sm:inline">
                Sign in
              </Link>
              <Link href="/profile" className="border border-ink px-3.5 py-1.5 transition-colors hover:bg-ink hover:text-paper" style={{ borderRadius: 4 }}>
                Your taste
              </Link>
            </>
          )}
        </div>
      </nav>
      <MobileTabs pathname={pathname} />
    </header>
  );
}

function MobileTabs({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Sections" className="mobile-sections fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-4 text-center text-[13px]">
        {LINKS.map((l) => {
          const current = pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={current ? "page" : undefined}
                className="block py-3.5 text-ink-2 aria-[current=page]:font-semibold aria-[current=page]:text-ink"
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
