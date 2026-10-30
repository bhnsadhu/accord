"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { hueFor } from "@/lib/hues";
import type { TasteProfile } from "@/lib/profile";
import { useAccord } from "@/lib/store";
import { ArrowIcon, CloseIcon, SearchIcon } from "./icons";

type Note = { key: string; label: string; count: number };
type Hit = { productId: string; slug: string; name: string; brand: string; wheel: string | null };

const QUICK_NOTES = 28;

export function ProfileBuilder({ notes, wheels, families }: { notes: Note[]; wheels: string[]; families: string[] }) {
  const { profile, saveProfile, collection, saveEntry, removeEntry, ready } = useAccord();
  const router = useRouter();
  const [draft, setDraft] = useState<TasteProfile>(profile);
  const [base, setBase] = useState<TasteProfile>(profile);
  const [saving, setSaving] = useState(false);
  // Adopt the stored profile when it arrives or changes elsewhere.
  if (base !== profile) {
    setBase(profile);
    setDraft(profile);
  }

  const labelOf = useMemo(() => new Map(notes.map((n) => [n.key, n.label])), [notes]);
  const toggle = (field: "likedNotes" | "dislikedNotes" | "likedAccords" | "families", value: string) =>
    setDraft((d) => {
      const has = d[field].includes(value);
      const next = { ...d, [field]: has ? d[field].filter((v) => v !== value) : [...d[field], value] };
      // A note cannot be both liked and avoided.
      if (!has && field === "likedNotes") next.dislikedNotes = next.dislikedNotes.filter((v) => v !== value);
      if (!has && field === "dislikedNotes") next.likedNotes = next.likedNotes.filter((v) => v !== value);
      return next;
    });

  const favourites = collection.filter((e) => e.favorite);

  const save = async () => {
    setSaving(true);
    await saveProfile(draft);
    setSaving(false);
    router.push("/for-you");
  };

  return (
    <div className={`mt-12 grid gap-14 ${ready ? "" : "pointer-events-none opacity-60"}`}>
      <Step title="Fragrances you love" hint="Search and add a few. They become favourites in your collection.">
        <FavouriteSearch
          onAdd={(hit) => saveEntry({ productId: hit.productId, shelf: "owned", rating: null, favorite: true })}
          exclude={new Set(favourites.map((f) => f.productId))}
        />
        <FavouriteList ids={favourites.map((f) => f.productId)} onRemove={removeEntry} />
      </Step>

      <Step title="Notes you like" hint="The most common notes first. Pick as many as feel right.">
        <NotePicker notes={notes} selected={draft.likedNotes} onToggle={(k) => toggle("likedNotes", k)} />
      </Step>

      <Step title="Notes you avoid" hint="Fragrances listing these are left out of your recommendations entirely.">
        <NotePicker notes={notes} selected={draft.dislikedNotes} onToggle={(k) => toggle("dislikedNotes", k)} tone="avoid" />
      </Step>

      <Step title="Accord families" hint="From the fragrance wheel. Each colour is the stain you'll see on strips.">
        <ul className="flex flex-wrap gap-2">
          {wheels.map((w) => (
            <li key={w}>
              <Chip on={draft.likedAccords.includes(w)} onClick={() => toggle("likedAccords", w)}>
                <i className="inline-block size-2.5 rounded-full" style={{ background: hueFor(w) } as CSSProperties} />
                {w}
              </Chip>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[13px] text-ink-3">Catalog families</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {families.map((f) => (
            <li key={f}>
              <Chip on={draft.families.includes(f)} onClick={() => toggle("families", f)}>
                {f}
              </Chip>
            </li>
          ))}
        </ul>
      </Step>

      <Step title="Worn as" hint="Unisex fragrances are always included.">
        <div className="inline-flex bg-bench-deep p-1" style={{ borderRadius: 6 }} role="radiogroup" aria-label="Worn as">
          {(["any", "feminine", "masculine"] as const).map((g) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={draft.gender === g}
              onClick={() => setDraft((d) => ({ ...d, gender: g }))}
              className="h-10 px-4 text-[15px] capitalize text-ink-2 aria-checked:bg-paper aria-checked:font-medium aria-checked:text-ink aria-checked:shadow-[var(--shadow-paper)]"
              style={{ borderRadius: 4 }}
            >
              {g === "any" ? "Anything" : g}
            </button>
          ))}
        </div>
      </Step>

      <div className="sticky bottom-20 z-10 flex flex-wrap items-center justify-between gap-4 border-t border-ink bg-bench py-5 md:bottom-0">
        <p className="text-sm text-ink-2">
          {favourites.length} favourites · {draft.likedNotes.length} notes liked
          {draft.likedNotes.length > 0 && <span className="text-ink-3"> ({draft.likedNotes.slice(0, 3).map((k) => labelOf.get(k) ?? k).join(", ")}{draft.likedNotes.length > 3 ? "…" : ""})</span>}
          {" "}· {draft.dislikedNotes.length} avoided
        </p>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex h-[52px] items-center gap-2 bg-ink px-6 font-medium text-paper transition-[background-color] hover:bg-ink-2 disabled:opacity-60"
          style={{ borderRadius: 4 }}
        >
          {saving ? "Saving…" : "Save and see recommendations"} <ArrowIcon />
        </button>
      </div>
    </div>
  );
}

function Step({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="mt-1.5 text-ink-2">{hint}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Chip({ on, onClick, children, tone }: { on: boolean; onClick: () => void; children: ReactNode; tone?: "avoid" }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex items-center gap-2 border px-3.5 py-1.5 text-[15px] transition-[background-color,border-color,color] duration-300 ${
        on
          ? tone === "avoid"
            ? "border-alert bg-alert text-paper"
            : "border-ink bg-ink text-paper"
          : "border-rule bg-paper text-ink hover:border-ink-3"
      }`}
      style={{ borderRadius: 999 }}
    >
      {children}
    </button>
  );
}

function NotePicker({ notes, selected, onToggle, tone }: { notes: Note[]; selected: string[]; onToggle: (key: string) => void; tone?: "avoid" }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? notes.filter((n) => n.label.toLowerCase().includes(q)).slice(0, 40) : notes.slice(0, QUICK_NOTES);
  const extra = selected.filter((k) => !shown.some((n) => n.key === k));
  const byKey = new Map(notes.map((n) => [n.key, n]));
  return (
    <div>
      <label className="flex h-11 max-w-sm items-center gap-2 bg-paper px-3 shadow-[var(--shadow-paper)]" style={{ borderRadius: 4 }}>
        <SearchIcon className="text-ink-3" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Find among ${notes.length} notes`}
          aria-label={tone === "avoid" ? "Find a note to avoid" : "Find a note you like"}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-3"
        />
      </label>
      <ul className="mt-4 flex flex-wrap gap-2">
        {[...extra.map((k) => byKey.get(k)).filter((n): n is Note => Boolean(n)), ...shown].map((n) => (
          <li key={n.key}>
            <Chip on={selected.includes(n.key)} onClick={() => onToggle(n.key)} tone={tone}>
              {n.label}
            </Chip>
          </li>
        ))}
        {shown.length === 0 && <li className="text-ink-3">No note matches “{query}”.</li>}
      </ul>
    </div>
  );
}

function FavouriteSearch({ onAdd, exclude }: { onAdd: (hit: Hit) => void; exclude: Set<string> }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  useEffect(() => {
    const query = q.trim();
    if (!query) return;
    const controller = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((d: { items: Hit[] }) => setHits(d.items))
        .catch(() => {});
    }, 140);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q]);
  return (
    <div className="max-w-xl">
      <label className="flex h-12 items-center gap-2 bg-paper px-3 shadow-[var(--shadow-paper)]" style={{ borderRadius: 4 }}>
        <SearchIcon className="text-ink-3" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a fragrance you love"
          aria-label="Search a fragrance you love"
          className="min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-ink-3"
        />
      </label>
      {q.trim() && hits.length > 0 && (
        <ul className="mt-1 bg-paper py-1 shadow-[var(--shadow-paper)]" style={{ borderRadius: 4 }}>
          {hits
            .filter((h) => !exclude.has(h.productId))
            .map((h) => (
              <li key={h.productId}>
                <button
                  type="button"
                  onClick={() => {
                    onAdd(h);
                    setQ("");
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-bench focus-visible:bg-bench"
                >
                  <span className="h-5 w-1.5 shrink-0" style={{ background: hueFor(h.wheel) }} />
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{h.name}</span>
                    <span className="text-ink-3"> · {h.brand}</span>
                  </span>
                  <span className="ml-auto text-sm text-ink-2">Add</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

function FavouriteList({ ids, onRemove }: { ids: string[]; onRemove: (id: string) => void }) {
  const [items, setItems] = useState<Hit[]>([]);
  const key = ids.join(",");
  useEffect(() => {
    if (!key) return;
    fetch(`/api/fragrances?ids=${key}`)
      .then((r) => r.json())
      .then((d: { items: Hit[] }) => setItems(d.items))
      .catch(() => {});
  }, [key]);
  const shown = key ? items.filter((f) => ids.includes(f.productId)) : [];
  if (!shown.length) return null;
  return (
    <ul className="mt-5 flex flex-wrap gap-2">
      {shown.map((f) => (
        <li key={f.productId} className="lift" style={{ "--hue": hueFor(f.wheel) } as CSSProperties}>
          <div className="strip-h flex h-11 items-center gap-2 pl-10 pr-2 text-[15px]">
            <span className="stain-h" style={{ "--stain-depth": "40px" } as CSSProperties} />
            <Link href={`/fragrance/${f.slug}`} className="relative max-w-56 truncate hover:underline">
              {f.name}
            </Link>
            <button type="button" onClick={() => onRemove(f.productId)} aria-label={`Remove ${f.name}`} className="relative p-1 text-ink-3 hover:text-ink">
              <CloseIcon width={16} height={16} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
