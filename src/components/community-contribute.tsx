"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { deleteReviewAction, helpfulAction, myCommunityAction, reminderAction, reportAction, saveReviewAction, saveVoteAction } from "@/app/actions/community";
import type { MyCommunity } from "@/lib/community/repo";
import { LONGEVITY, OCCASIONS, OCCASION_LABEL, READS, REMINDS_LIMIT, REPORT_REASONS, REVIEW_MAX, REVIEW_MIN, SEASONS, SEASON_LABEL, SILLAGE, VALUE, type WearVote } from "@/lib/community/rules";
import { useAccord } from "@/lib/store";
import { CloseIcon, SearchIcon } from "./icons";

type Ctx = { productId: string; mine: MyCommunity | null; loaded: boolean; signedIn: boolean; ready: boolean; reload: () => Promise<void> };
const CommunityContext = createContext<Ctx | null>(null);
const useCommunity = () => {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error("CommunityProvider missing");
  return ctx;
};

/** Loads the signed-in member's own votes once and shares them with every control on the page. */
export function CommunityProvider({ productId, children }: { productId: string; children: ReactNode }) {
  const { account, ready } = useAccord();
  const [state, setState] = useState<{ key: string | null; mine: MyCommunity | null }>({ key: null, mine: null });
  const key = account ? `${account.id}:${productId}` : null;

  const reload = useCallback(async () => {
    if (!key) return;
    const mine = await myCommunityAction(productId);
    setState({ key, mine });
  }, [key, productId]);

  useEffect(() => {
    if (!key) return;
    let live = true;
    myCommunityAction(productId).then(mine => { if (live) setState({ key, mine }); }).catch(() => {});
    return () => { live = false; };
  }, [key, productId]);

  const loaded = Boolean(key) && state.key === key;
  return (
    <CommunityContext.Provider value={{ productId, mine: loaded ? state.mine : null, loaded, signedIn: Boolean(account), ready, reload }}>
      {children}
    </CommunityContext.Provider>
  );
}

export function ContributePanel({ productId, name }: { productId: string; name: string }) {
  const { signedIn, ready, loaded } = useCommunity();
  const { account } = useAccord();
  if (!ready) return <div className="community-contribute" aria-busy="true"><p className="text-ink-3">Loading your votes</p></div>;
  if (!signedIn) {
    return (
      <div className="community-contribute community-contribute-guest">
        <div>
          <h3 className="community-heading">Add what you noticed</h3>
          <p className="reference-caption">Members vote on longevity, sillage and seasons, write reviews and link fragrances that smell alike. Your star rating comes from your collection.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/sign-up" className="community-button community-button-primary">Create a free account</Link>
          <Link href="/sign-in" className="community-button">Sign in</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="community-contribute" aria-busy={!loaded}>
      <VoteForm key={loaded ? "loaded" : "loading"} productId={productId} />
      <ReviewForm key={loaded ? "r-loaded" : "r-loading"} productId={productId} name={name} author={account?.name ?? "you"} />
      <RemindPicker productId={productId} name={name} />
    </div>
  );
}

const emptyVote = (productId: string): WearVote => ({ productId, longevity: null, sillage: null, reads: null, value: null, seasons: [], occasions: [] });

function VoteForm({ productId }: { productId: string }) {
  const { mine, loaded } = useCommunity();
  const [vote, setVote] = useState<WearVote>(() => mine?.vote ?? emptyVote(productId));
  const [status, setStatus] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const seq = useRef(0);

  const save = (next: WearVote) => {
    const previous = vote;
    setVote(next);
    const id = ++seq.current;
    start(async () => {
      const result = await saveVoteAction(next);
      if (id !== seq.current) return;
      if (result.ok) setStatus("Saved");
      else { setVote(previous); setStatus(result.error); }
    });
  };

  const scale = (field: "longevity" | "sillage" | "reads" | "value", title: string, labels: readonly string[]) => (
    <fieldset className="community-vote-group">
      <legend>{title}</legend>
      <div>
        {labels.map((label, i) => {
          const on = vote[field] === i + 1;
          return <button key={label} type="button" aria-pressed={on} disabled={!loaded} onClick={() => save({ ...vote, [field]: on ? null : i + 1 })}>{label}</button>;
        })}
      </div>
    </fieldset>
  );

  const multi = <T extends string>(field: "seasons" | "occasions", title: string, values: readonly T[], labels: Record<T, string>) => (
    <fieldset className="community-vote-group">
      <legend>{title}</legend>
      <div>
        {values.map(v => {
          const list = vote[field] as string[];
          const on = list.includes(v);
          return <button key={v} type="button" aria-pressed={on} disabled={!loaded} onClick={() => save({ ...vote, [field]: on ? list.filter(x => x !== v) : [...list, v] } as WearVote)}>{labels[v]}</button>;
        })}
      </div>
    </fieldset>
  );

  return (
    <section aria-labelledby="vote-h" className="community-vote">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id="vote-h" className="community-heading">Your wear vote</h3>
        <p className="text-sm text-ink-3" role="status">{pending ? "Saving" : status ?? "Choose any that apply. Select again to clear."}</p>
      </div>
      <div className="community-vote-grid">
        {scale("longevity", "Longevity", LONGEVITY)}
        {scale("sillage", "Sillage", SILLAGE)}
        {multi("seasons", "Season", SEASONS, SEASON_LABEL)}
        {multi("occasions", "Time of day", OCCASIONS, OCCASION_LABEL)}
        {scale("reads", "Reads as", READS)}
        {scale("value", "Value", VALUE)}
      </div>
    </section>
  );
}

function ReviewForm({ productId, name, author }: { productId: string; name: string; author: string }) {
  const { mine, loaded, reload } = useCommunity();
  const { entryFor } = useAccord();
  const existing = mine?.review ?? null;
  const [body, setBody] = useState(existing?.body ?? "");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const id = useId();
  const rating = entryFor(productId)?.rating ?? null;
  const length = body.trim().length;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    start(async () => {
      const result = await saveReviewAction(productId, body);
      if (!result.ok) return setMessage(result.error);
      setMessage(result.data.status === "hidden" ? "Saved. It stays hidden while reports are reviewed." : "Published.");
      setOpen(false);
      await reload();
    });
  };
  const remove = () => start(async () => {
    const result = await deleteReviewAction(productId);
    if (!result.ok) return setMessage(result.error);
    setBody("");
    setMessage("Review deleted.");
    setOpen(false);
    await reload();
  });

  if (!open) {
    return (
      <section className="community-review-cta" aria-label="Your review">
        <div>
          <h3 className="community-heading">{existing ? "Your review" : `Review ${name}`}</h3>
          <p className="reference-caption">{existing ? (existing.status === "hidden" ? "Hidden while reports are reviewed." : "Published below.") : "Describe how it smelled on you, how it changed and when you would wear it."}</p>
          {message && <p className="mt-1 text-sm text-ink-2" role="status">{message}</p>}
        </div>
        <button type="button" className="community-button" disabled={!loaded} onClick={() => setOpen(true)}>{existing ? "Edit review" : "Write a review"}</button>
      </section>
    );
  }
  return (
    <form className="community-review-form" onSubmit={submit}>
      <label htmlFor={id} className="community-heading">{existing ? "Edit your review" : `Review ${name}`}</label>
      <p className="reference-caption">Posted publicly as <strong className="text-ink">{author}</strong>{rating ? ` with your ${rating} of 5 collection rating` : ". Rate it in your collection to show stars with it"}. No links.</p>
      <textarea id={id} value={body} onChange={e => setBody(e.target.value)} rows={7} maxLength={REVIEW_MAX + 200} required aria-describedby={`${id}-count`} placeholder="The opening, how it settles, how long it lasted and who you think would enjoy it." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span id={`${id}-count`} className={`font-mono text-[13px] tabular ${length > REVIEW_MAX || (length > 0 && length < REVIEW_MIN) ? "text-alert" : "text-ink-3"}`}>{length} / {REVIEW_MAX}{length < REVIEW_MIN ? ` (at least ${REVIEW_MIN})` : ""}</span>
        <div className="flex flex-wrap gap-3">
          {existing && <button type="button" className="community-button" onClick={remove} disabled={pending}>Delete</button>}
          <button type="button" className="community-button" onClick={() => { setOpen(false); setBody(existing?.body ?? ""); }} disabled={pending}>Cancel</button>
          <button type="submit" className="community-button community-button-primary" disabled={pending || length < REVIEW_MIN || length > REVIEW_MAX}>{pending ? "Saving" : existing ? "Save changes" : "Publish review"}</button>
        </div>
      </div>
      {message && <p className="text-sm text-alert" role="alert">{message}</p>}
    </form>
  );
}

type Found = { productId: string; name: string; brand: string; year?: number | null; concentration?: string | null };

function RemindPicker({ productId, name }: { productId: string; name: string }) {
  const { mine, loaded, reload } = useCommunity();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ q: string; items: Found[] }>({ q: "", items: [] });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const picked = mine?.reminds ?? [];
  const id = useId();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then(r => r.json() as Promise<{ items: Found[] }>)
        .then(data => setResults({ q, items: data.items.filter(i => i.productId !== productId) }))
        .catch(() => {});
    }, 200);
    return () => { clearTimeout(t); controller.abort(); };
  }, [query, productId]);

  const toggle = (other: Found | string, on: boolean) => start(async () => {
    const otherId = typeof other === "string" ? other : other.productId;
    const result = await reminderAction(productId, otherId, on);
    setMessage(result.ok ? (on ? "Linked. It appears in the list above." : "Removed.") : result.error);
    if (result.ok) { setQuery(""); await reload(); }
  });

  const shown = query.trim().length >= 2 && results.q === query.trim() ? results.items : [];
  return (
    <section className="community-remind" aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`} className="community-heading">Does {name} remind you of something?</h3>
      <p className="reference-caption">Link up to {REMINDS_LIMIT} fragrances it smells like to you.</p>
      {picked.length > 0 && (
        <ul className="community-remind-picked">
          {picked.map(other => (
            <li key={other.productId}><span><span className="text-ink-3">{other.brand}</span> {other.name}</span><button type="button" onClick={() => toggle(other.productId, false)} disabled={pending} aria-label={`Remove ${other.name}`}><CloseIcon /></button></li>
          ))}
        </ul>
      )}
      {picked.length < REMINDS_LIMIT && (
        <div className="community-remind-search">
          <label><SearchIcon aria-hidden /><span className="sr-only">Find a fragrance it reminds you of</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or house" disabled={!loaded} autoComplete="off" /></label>
          {shown.length > 0 && (
            <ul>
              {shown.slice(0, 6).map(item => (
                <li key={item.productId}><button type="button" disabled={pending || picked.some(p => p.productId === item.productId)} onClick={() => toggle(item, true)}><span className="min-w-0"><span className="text-ink-3">{item.brand}</span> {item.name}{(item.year || item.concentration) && <span className="block text-[13px] text-ink-3">{[item.concentration, item.year].filter(Boolean).join(" · ")}</span>}</span><span className="ml-auto shrink-0 text-sm text-ink-2">{picked.some(p => p.productId === item.productId) ? "Linked" : "Link"}</span></button></li>
              ))}
            </ul>
          )}
        </div>
      )}
      {message && <p className="mt-2 text-sm text-ink-2" role="status">{message}</p>}
    </section>
  );
}

export function ReviewActions({ reviewId, authorId, helpful }: { reviewId: number; authorId: string; helpful: number }) {
  const { mine, signedIn, reload } = useCommunity();
  const { account } = useAccord();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const own = account?.id === authorId;
  const marked = mine?.helpful.includes(reviewId) ?? false;
  const reported = mine?.reported.includes(reviewId) ?? false;

  const mark = () => start(async () => {
    const result = await helpfulAction(reviewId);
    if (!result.ok) setMessage(result.error);
    await reload();
  });
  const report = (reason: string) => start(async () => {
    const result = await reportAction(reviewId, reason);
    setMessage(result.ok ? "Thanks. The owner will review it." : result.error);
    await reload();
  });

  return (
    <footer className="community-review-actions">
      {own ? (
        <span className="text-ink-3">{helpful} {helpful === 1 ? "member" : "members"} found this helpful</span>
      ) : signedIn ? (
        <button type="button" aria-pressed={marked} onClick={mark} disabled={pending}>Helpful <span className="font-mono tabular">{helpful}</span></button>
      ) : (
        <span className="text-ink-3">{helpful > 0 ? `${helpful} found this helpful` : ""}</span>
      )}
      {signedIn && !own && (
        reported ? <span className="text-ink-3">Reported</span> : (
          <details className="community-report">
            <summary>Report</summary>
            <div>{Object.entries(REPORT_REASONS).map(([key, label]) => <button key={key} type="button" onClick={() => report(key)} disabled={pending}>{label}</button>)}</div>
          </details>
        )
      )}
      {message && <span className="text-ink-2" role="status">{message}</span>}
    </footer>
  );
}
