import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AutoSubmit } from "@/components/auto-submit";
import { Bench } from "@/components/bench";
import { CloseIcon, SearchIcon } from "@/components/icons";
import { StripRow } from "@/components/strip";
import { cachedFacets, cachedNotes, cachedSearch } from "@/lib/catalog/cached";
import type { SearchParams } from "@/lib/catalog/queries";
import { GENDER_LABEL, hueFor } from "@/lib/hues";

export const metadata: Metadata = { title: "Discover" };

type Raw = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

function parse(raw: Raw): SearchParams {
  const gender = one(raw.gender);
  const sort = one(raw.sort);
  return {
    q: one(raw.q),
    wheel: one(raw.wheel),
    facet: one(raw.facet),
    family: one(raw.family),
    notes: one(raw.note) ? [one(raw.note)!] : undefined,
    excludeNotes: one(raw.without) ? [one(raw.without)!] : undefined,
    gender: gender === "feminine" || gender === "masculine" || gender === "unisex" ? gender : undefined,
    sort: sort === "name" || sort === "newest" || sort === "oldest" || sort === "relevance" ? sort : undefined,
    page: Math.min(Math.max(Number.parseInt(one(raw.page) ?? "1", 10) || 1, 1), 400),
    pageSize: 24,
  };
}

function href(raw: Raw, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    const value = one(v);
    if (value && k !== "page") params.set(k, value);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) params.delete(k);
    else params.set(k, v);
  }
  const s = params.toString();
  return s ? `/discover?${s}` : "/discover";
}

export default function DiscoverPage({ searchParams }: PageProps<"/discover">) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-8 sm:px-8 lg:px-16 lg:pt-12">
      <h1 className="text-[clamp(36px,4vw,56px)] font-semibold leading-none tracking-[-0.035em]">Discover</h1>
      <Bench />
      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: Promise<Raw> }) {
  const raw = await searchParams;
  const params = parse(raw);
  const [result, facets, notes] = await Promise.all([cachedSearch(params), cachedFacets(), cachedNotes()]);
  const noteLabel = new Map(notes.map((n) => [n.key, n.label]));
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const active = [
    params.wheel && { label: params.wheel, clear: "wheel" },
    params.facet && { label: params.facet, clear: "facet" },
    params.family && { label: `${params.family} family`, clear: "family" },
    params.notes?.[0] && { label: `with ${noteLabel.get(params.notes[0]) ?? params.notes[0]}`, clear: "note" },
    params.excludeNotes?.[0] && { label: `without ${noteLabel.get(params.excludeNotes[0]) ?? params.excludeNotes[0]}`, clear: "without" },
    params.gender && { label: GENDER_LABEL[params.gender], clear: "gender" },
  ].filter(Boolean) as { label: string; clear: string }[];

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
      <aside aria-label="Filters" className="order-2 lg:order-1">
        <form action="/discover" className="grid gap-8">
          <AutoSubmit />
          {params.q && <input type="hidden" name="q" value={params.q} />}
          {params.wheel && <input type="hidden" name="wheel" value={params.wheel} />}
          {params.facet && <input type="hidden" name="facet" value={params.facet} />}
          {params.family && <input type="hidden" name="family" value={params.family} />}
          <FilterSelect label="Has note" name="note" value={params.notes?.[0]} options={notes.map((n) => [n.key, n.label])} />
          <FilterSelect label="Without note" name="without" value={params.excludeNotes?.[0]} options={notes.map((n) => [n.key, n.label])} />
          <FilterSelect
            label="Worn as"
            name="gender"
            value={params.gender}
            options={Object.entries(GENDER_LABEL)}
          />
          <noscript>
            <button type="submit" className="h-10 bg-ink px-4 text-paper" style={{ borderRadius: 4 }}>
              Apply
            </button>
          </noscript>
        </form>

        <FilterGroup title="Accord family">
          {facets.wheels.map((w) => (
            <FilterLink key={w.value} href={href(raw, { wheel: params.wheel === w.value ? undefined : w.value })} active={params.wheel === w.value} count={w.count}>
              <i className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: hueFor(w.value) }} />
              {w.value}
            </FilterLink>
          ))}
        </FilterGroup>
        <FilterGroup title="Facet">
          {facets.facets.slice(0, 14).map((f) => (
            <FilterLink key={f.value} href={href(raw, { facet: params.facet === f.value ? undefined : f.value })} active={params.facet === f.value} count={f.count}>
              {f.value}
            </FilterLink>
          ))}
        </FilterGroup>
        <FilterGroup title="Family">
          {facets.families.map((f) => (
            <FilterLink key={f.value} href={href(raw, { family: params.family === f.value ? undefined : f.value })} active={params.family === f.value} count={f.count}>
              {f.value}
            </FilterLink>
          ))}
        </FilterGroup>
      </aside>

      <section aria-label="Results" className="order-1 min-w-0 lg:order-2">
        <form action="/discover" role="search" className="flex h-[56px] items-center gap-3 bg-paper px-4 shadow-[var(--shadow-paper)]" style={{ borderRadius: 4 }}>
          <SearchIcon className="shrink-0 text-ink-2" />
          <input
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Fragrance or brand"
            aria-label="Search fragrances"
            className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-ink-3"
          />
          {Object.entries(raw).map(([k, v]) =>
            k !== "q" && k !== "page" && one(v) ? <input key={k} type="hidden" name={k} value={one(v)} /> : null,
          )}
        </form>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
          <p className="text-sm text-ink-2" aria-live="polite">
            <span className="font-mono tabular">{result.total.toLocaleString("en-US")}</span> {result.total === 1 ? "fragrance" : "fragrances"}
          </p>
          {active.map((a) => (
            <Link
              key={a.clear}
              href={href(raw, { [a.clear]: undefined })}
              className="flex items-center gap-1.5 bg-paper py-1 pl-3 pr-2 text-sm shadow-[var(--shadow-paper)] hover:text-ink"
              style={{ borderRadius: 2 }}
              aria-label={`Remove filter: ${a.label}`}
            >
              {a.label} <CloseIcon width={14} height={14} className="text-ink-3" />
            </Link>
          ))}
          <div className="ml-auto flex gap-4 text-sm">
            {(params.q ? (["relevance", "name", "newest"] as const) : (["name", "newest", "oldest"] as const)).map((s) => {
              const current = (params.sort ?? (params.q ? "relevance" : "name")) === s;
              return (
                <Link key={s} href={href(raw, { sort: s })} aria-current={current ? "true" : undefined} className="capitalize text-ink-3 hover:text-ink aria-[current=true]:text-ink aria-[current=true]:underline">
                  {s}
                </Link>
              );
            })}
          </div>
        </div>

        {result.items.length === 0 ? (
          <div className="mt-10 bg-paper p-8" style={{ borderRadius: 4 }}>
            <p className="text-lg font-medium">No fragrance matches all of that.</p>
            <p className="mt-2 text-ink-2">Remove a filter, or search with fewer letters. Notes are filters on the left, not search words.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {result.items.map((f) => (
              <StripRow
                key={f.productId}
                fragrance={f}
                meta={
                  <>
                    {f.wheel && <> · {f.wheel}</>}
                    {f.year && <> · {f.year}</>}
                  </>
                }
              />
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav aria-label="Pages" className="mt-8 flex items-center justify-between font-mono text-sm tabular">
            {result.page > 1 ? (
              <Link href={href(raw, { page: String(result.page - 1) })} className="hover:underline">
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-ink-3">
              {result.page} / {pages}
            </span>
            {result.page < pages ? (
              <Link href={href(raw, { page: String(result.page + 1) })} className="hover:underline">
                Next →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 border-t border-rule pt-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-3 grid gap-0.5">{children}</ul>
    </section>
  );
}

function FilterLink({ href, active, count, children }: { href: string; active: boolean; count: number; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "true" : undefined}
        className="flex items-center gap-2.5 py-1.5 text-[15px] text-ink-2 hover:text-ink aria-[current=true]:font-semibold aria-[current=true]:text-ink"
      >
        {children}
        <span className="ml-auto font-mono text-xs text-ink-3 tabular">{count.toLocaleString("en-US")}</span>
      </Link>
    </li>
  );
}

function FilterSelect({ label, name, value, options }: { label: string; name: string; value?: string; options: [string, string][] }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <span className="relative block">
      <select
        name={name}
        defaultValue={value ?? ""}
        className="h-10 w-full appearance-none bg-paper pl-3 pr-9 text-[15px] font-normal shadow-[var(--shadow-paper)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        style={{ borderRadius: 4 }}
      >
        <option value="">Any</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-2" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="m2.5 4.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      </span>
    </label>
  );
}

function ResultsSkeleton() {
  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16" aria-busy="true" aria-label="Loading results">
      <div className="hidden lg:block" />
      <div className="grid gap-3">
        <div className="h-14 bg-paper/60" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="strip-h h-24 animate-pulse opacity-60" />
        ))}
      </div>
    </div>
  );
}
