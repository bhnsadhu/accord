"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { FragranceSummary } from "@/lib/catalog/queries";
import { hueFor } from "@/lib/hues";
import type { CollectionEntry, Shelf } from "@/lib/profile";
import { useAccord } from "@/lib/store";
import { ArrowIcon, HeartIcon, StarIcon } from "./icons";
import { StripRow } from "./strip";

type Tab = Shelf | "favourites";
const TABS: { id: Tab; label: string }[] = [
  { id: "owned", label: "Owned" },
  { id: "tried", label: "Tried" },
  { id: "wishlist", label: "Wishlist" },
  { id: "favourites", label: "Favourites" },
];

export function CollectionView() {
  const { ready, account, collection, saveEntry, removeEntry } = useAccord();
  const [tab, setTab] = useState<Tab>("owned");
  const [rows, setRows] = useState<Map<string, FragranceSummary>>(new Map());
  const ids = collection.map((e) => e.productId).join(",");

  useEffect(() => {
    if (!ids) return;
    const controller = new AbortController();
    // The API takes up to 60 ids per call.
    const chunks = ids.split(",").reduce<string[][]>((acc, id, i) => {
      (acc[Math.floor(i / 60)] ??= []).push(id);
      return acc;
    }, []);
    Promise.all(chunks.map((c) => fetch(`/api/fragrances?ids=${c.join(",")}`, { signal: controller.signal }).then((r) => r.json())))
      .then((parts: { items: FragranceSummary[] }[]) => setRows(new Map(parts.flatMap((p) => p.items).map((f) => [f.productId, f]))))
      .catch(() => {});
    return () => controller.abort();
  }, [ids]);

  const counts = useMemo(
    () => ({
      owned: collection.filter((e) => e.shelf === "owned").length,
      tried: collection.filter((e) => e.shelf === "tried").length,
      wishlist: collection.filter((e) => e.shelf === "wishlist").length,
      favourites: collection.filter((e) => e.favorite).length,
    }),
    [collection],
  );
  const loading = collection.some((e) => !rows.has(e.productId));
  const shown = collection.filter((e) => (tab === "favourites" ? e.favorite : e.shelf === tab));
  const profile = useMemo(() => tasteSummary(collection, rows), [collection, rows]);

  if (!ready) return <div className="mt-8 h-64" aria-busy="true" />;

  if (collection.length === 0) {
    return (
      <div className="mt-8 max-w-2xl">
        <p className="text-lg leading-relaxed text-ink-2">
          Nothing on your shelves yet. Open any fragrance and mark it Owned, Tried or Wishlist; rate what you&rsquo;ve tried and
          your recommendations follow.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/discover" className="inline-flex h-12 items-center gap-2 bg-ink px-5 font-medium text-paper hover:bg-ink-2" style={{ borderRadius: 4 }}>
            Browse fragrances <ArrowIcon />
          </Link>
          <Link href="/profile" className="inline-flex h-12 items-center px-2 font-medium underline">
            Add favourites
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-12 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <div role="tablist" aria-label="Shelves" className="grid grid-cols-2 gap-x-5 gap-y-1 border-b border-rule min-[420px]:flex min-[420px]:flex-wrap sm:gap-x-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className="-mb-px flex min-h-11 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent py-2 text-left text-[15px] text-ink-2 hover:text-ink aria-selected:border-ink aria-selected:font-semibold aria-selected:text-ink"
            >
              {t.label} <span className="font-mono text-xs text-ink-3 tabular">{counts[t.id]}</span>
            </button>
          ))}
        </div>
        <div role="tabpanel" className="mt-6 grid gap-3 [&_.strip-text]:flex-col [&_.strip-text>div]:w-full md:[&_.strip-text]:flex-row md:[&_.strip-text>div]:w-auto">
          {shown.length === 0 && <p className="text-ink-2">This shelf is empty.</p>}
          {shown.map((entry) => {
            const f = rows.get(entry.productId);
            if (!f) return loading ? <div key={entry.productId} className="strip-h h-24 animate-pulse opacity-60" /> : null;
            return (
              <StripRow key={entry.productId} fragrance={f} aside={<EntryControls entry={entry} onSave={saveEntry} onRemove={removeEntry} name={f.name} />} />
            );
          })}
        </div>
        {!account && (
          <p className="mt-8 text-sm text-ink-3">
            Saved on this device only.{" "}
            <Link href="/sign-up" className="text-ink-2 underline">
              Create an account
            </Link>{" "}
            and your collection moves with you.
          </p>
        )}
      </div>

      <aside aria-labelledby="profile-h" className="xl:sticky xl:top-8 xl:self-start">
        <h2 id="profile-h" className="text-xl font-semibold tracking-[-0.02em]">
          What your shelves say
        </h2>
        <p className="mt-1 text-sm text-ink-3">From fragrances you own, favourite or rated 4 or 5.</p>
        {profile.families.length === 0 ? (
          <p className="mt-4 text-ink-2">Own or rate a few more to see a pattern.</p>
        ) : (
          <>
            <div className="mt-5 flex h-3 overflow-hidden" style={{ borderRadius: 2 }} aria-hidden>
              {profile.families.map((w) => (
                <span key={w.name} style={{ width: `${w.share * 100}%`, background: hueFor(w.name) } as CSSProperties} />
              ))}
            </div>
            <ul className="mt-3 grid gap-1 text-[15px]">
              {profile.families.slice(0, 5).map((w) => (
                <li key={w.name} className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <i className="inline-block size-2 rounded-full" style={{ background: hueFor(w.name) }} />
                    {w.name}
                  </span>
                  <span className="font-mono text-sm text-ink-3 tabular">{Math.round(w.share * 100)}%</span>
                </li>
              ))}
            </ul>
            {profile.notes.length > 0 && <>
              <p className="mt-6 text-[13px] text-ink-3">Notes that recur</p>
              <p className="mt-1 text-[15px] text-ink-2">{profile.notes.join(", ")}</p>
            </>}
          </>
        )}
        <Link href="/for-you" className="mt-6 inline-flex items-center gap-2 font-medium hover:underline">
          Recommendations <ArrowIcon />
        </Link>
      </aside>
    </div>
  );
}

function tasteSummary(collection: CollectionEntry[], rows: Map<string, FragranceSummary>) {
  const liked = collection.filter((e) => e.favorite || (e.rating ?? 0) >= 4 || (e.shelf === "owned" && e.rating === null));
  const wheels = new Map<string, number>();
  const notes = new Map<string, number>();
  let total = 0;
  for (const e of liked) {
    const f = rows.get(e.productId);
    if (!f) continue;
    if (f.wheel) {
      wheels.set(f.wheel, (wheels.get(f.wheel) ?? 0) + 1);
      total++;
    }
    for (const n of f.notes) notes.set(n, (notes.get(n) ?? 0) + 1);
  }
  return {
    families: [...wheels].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, share: n / total })),
    notes: [...notes].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n]) => n),
  };
}

function EntryControls({
  entry,
  name,
  onSave,
  onRemove,
}: {
  entry: CollectionEntry;
  name: string;
  onSave: (e: CollectionEntry) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  return (
    <div className="flex flex-col items-start gap-1 md:items-end">
      <div className="flex flex-wrap items-center gap-1">
        <div className="flex items-center" role="radiogroup" aria-label={`Rate ${name}`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={entry.rating === n}
              aria-label={`${n} of 5`}
              onClick={() => onSave({ ...entry, rating: entry.rating === n ? null : n })}
              className={`flex size-10 items-center justify-center ${(entry.rating ?? 0) >= n ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}
            >
              <StarIcon filled={(entry.rating ?? 0) >= n} width={18} height={18} />
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={entry.favorite}
          aria-label={entry.favorite ? `Remove ${name} from favourites` : `Add ${name} to favourites`}
          onClick={() => onSave({ ...entry, favorite: !entry.favorite })}
          className="flex size-10 items-center justify-center text-ink-2 hover:text-ink aria-pressed:text-ink"
        >
          <HeartIcon filled={entry.favorite} width={18} height={18} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 text-sm">
        <label className="sr-only" htmlFor={`shelf-${entry.productId}`}>
          Shelf for {name}
        </label>
        <select
          id={`shelf-${entry.productId}`}
          value={entry.shelf}
          onChange={(e) => onSave({ ...entry, shelf: e.target.value as Shelf })}
          className="min-h-10 bg-transparent px-2 text-ink-2"
        >
          <option value="owned">Owned</option>
          <option value="tried">Tried</option>
          <option value="wishlist">Wishlist</option>
        </select>
        <button type="button" onClick={() => onRemove(entry.productId)} className="min-h-10 px-2 text-ink-3 underline hover:text-ink">
          Remove
        </button>
      </div>
    </div>
  );
}
