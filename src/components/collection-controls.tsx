"use client";

import Link from "next/link";
import { useId } from "react";
import type { Shelf } from "@/lib/profile";
import { useAccord } from "@/lib/store";
import { HeartIcon, StarIcon } from "./icons";

const SHELVES: { value: Shelf; label: string }[] = [
  { value: "owned", label: "Owned" },
  { value: "tried", label: "Tried" },
  { value: "wishlist", label: "Wishlist" },
];

/** Shelf, rating and favourite for one fragrance. Works for guests and accounts. */
export function CollectionControls({ productId }: { productId: string }) {
  const { entryFor, saveEntry, removeEntry, account, ready } = useAccord();
  const entry = entryFor(productId);
  const ratingId = useId();

  const update = (patch: Partial<{ shelf: Shelf; rating: number | null; favorite: boolean }>) =>
    saveEntry({
      productId,
      shelf: patch.shelf ?? entry?.shelf ?? "tried",
      rating: patch.rating !== undefined ? patch.rating : (entry?.rating ?? null),
      favorite: patch.favorite ?? entry?.favorite ?? false,
    });

  return (
    <div className={`grid gap-5 ${ready ? "" : "pointer-events-none opacity-60"}`} aria-busy={!ready}>
      <fieldset>
        <legend className="text-[13px] text-ink-3">In your collection</legend>
        <div className="mt-2 inline-flex bg-bench-deep p-1" style={{ borderRadius: 6 }}>
          {SHELVES.map((s) => {
            const on = entry?.shelf === s.value;
            return (
              <button
                key={s.value}
                type="button"
                aria-pressed={on}
                onClick={() => (on ? removeEntry(productId) : update({ shelf: s.value }))}
                className="h-10 px-4 text-[15px] text-ink-2 transition-[background-color,color,box-shadow] duration-300 hover:text-ink aria-pressed:bg-paper aria-pressed:font-medium aria-pressed:text-ink aria-pressed:shadow-[var(--shadow-paper)]"
                style={{ borderRadius: 4 }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-6">
        <div role="radiogroup" aria-labelledby={ratingId} className="flex items-center gap-1">
          <span id={ratingId} className="mr-2 text-[13px] text-ink-3">
            Your rating
          </span>
          {[1, 2, 3, 4, 5].map((n) => {
            const on = (entry?.rating ?? 0) >= n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={entry?.rating === n}
                aria-label={`${n} of 5`}
                onClick={() => update({ rating: entry?.rating === n ? null : n, shelf: entry?.shelf === "wishlist" || !entry ? "tried" : entry.shelf })}
                className={`rating-choice p-1 transition-colors ${on ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}
              >
                <StarIcon filled={on} />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-pressed={entry?.favorite ?? false}
          onClick={() => update({ favorite: !(entry?.favorite ?? false) })}
          className="collection-favourite flex items-center gap-2 text-[15px] text-ink-2 hover:text-ink aria-pressed:text-ink"
        >
          <HeartIcon filled={entry?.favorite ?? false} />
          {entry?.favorite ? "Favourite" : "Add to favourites"}
        </button>
      </div>

      {ready && !account && entry && (
        <p className="text-sm text-ink-3">
          Saved on this device.{" "}
          <Link href="/sign-up" className="text-ink-2 underline">
            Create an account
          </Link>{" "}
          to keep it everywhere.
        </p>
      )}
    </div>
  );
}
