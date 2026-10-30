"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FragranceSummary } from "@/lib/catalog/queries";
import type { PresentedSet } from "@/lib/reco/present";
import { useAccord } from "@/lib/store";
import { ArrowIcon } from "./icons";
import { MatchFigure, StripRow } from "./strip";

type State = { status: "loading" } | { status: "error" } | { status: "done"; data: PresentedSet };

/**
 * Recommendations from the live engine. Any change to the profile or the
 * collection (including the feedback buttons here) re-ranks the list.
 */
export function Recommendations() {
  const { ready, account, profile, collection, saveEntry } = useAccord();
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const signature = JSON.stringify([account?.id ?? null, profile, collection]);

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(account ? { k: 24 } : { k: 24, guest: { version: 1, profile, collection } }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: PresentedSet) => setState({ status: "done", data }))
      .catch((err) => {
        if ((err as Error).name !== "AbortError") setState({ status: "error" });
      });
    return () => controller.abort();
    // signature captures profile and collection content
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, signature, attempt]);

  if (state.status === "loading") {
    return (
      <div className="mt-8 grid gap-3" aria-busy="true" aria-label="Loading recommendations">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="strip-h h-28 animate-pulse opacity-60" />
        ))}
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="mt-8 bg-paper p-8" style={{ borderRadius: 4 }}>
        <p className="text-lg font-medium">Recommendations didn&rsquo;t load.</p>
        <button type="button" onClick={() => setAttempt((a) => a + 1)} className="mt-3 underline">
          Try again
        </button>
      </div>
    );
  }

  const { data } = state;
  if (data.kind === "starter") {
    return (
      <>
        <div className="mt-6 flex flex-col items-start gap-5 border-b border-rule pb-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-[36em] text-lg leading-relaxed text-ink-2">
            Accord doesn&rsquo;t know your taste yet. Add a few favourites or notes and this page becomes yours. Until then, here is
            the most characteristic fragrance of each accord family.
          </p>
          <Link href="/profile" className="inline-flex h-[52px] shrink-0 items-center gap-2 bg-ink px-6 font-medium text-paper hover:bg-ink-2" style={{ borderRadius: 4 }}>
            Build your profile <ArrowIcon />
          </Link>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {data.items.map(({ fragrance }) => (
            <StripRow key={fragrance.productId} fragrance={fragrance} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <p className="mt-5 max-w-[44em] text-ink-2">
        Ranked against all 24,642 fragrances. The number is how many of them each one outscored for you, as a percentile — a
        relative fit, not a promise you&rsquo;ll love it.{" "}
        <Link href="/profile" className="text-ink underline">
          Adjust your profile
        </Link>
      </p>
      {data.items.length === 0 ? (
        <p className="mt-8 text-lg">Nothing fits every rule you set. Avoid fewer notes or widen &ldquo;Worn as&rdquo;.</p>
      ) : (
        <ol className="mt-8 grid gap-3">
          {data.items.map((item) => (
            <li key={item.fragrance.productId}>
              <StripRow
                fragrance={item.fragrance}
                aside={
                  <div className="flex flex-col items-end gap-3">
                    {item.match !== null && <MatchFigure value={item.match} />}
                    <Feedback fragrance={item.fragrance} onSave={saveEntry} />
                  </div>
                }
              >
                <ul className="mt-1.5 grid gap-0.5 text-[15px] text-ink-2">
                  {item.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </StripRow>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function Feedback({ fragrance, onSave }: { fragrance: FragranceSummary; onSave: ReturnType<typeof useAccord>["saveEntry"] }) {
  return (
    <div className="relative z-10 flex gap-3 text-sm">
      <button
        type="button"
        onClick={() => onSave({ productId: fragrance.productId, shelf: "wishlist", rating: null, favorite: false })}
        className="text-ink-2 underline hover:text-ink"
        aria-label={`Add ${fragrance.name} to wishlist`}
      >
        Want to try
      </button>
      <button
        type="button"
        onClick={() => onSave({ productId: fragrance.productId, shelf: "tried", rating: 1, favorite: false })}
        className="text-ink-2 underline hover:text-ink"
        aria-label={`Tried ${fragrance.name}, not for me`}
      >
        Tried it, not for me
      </button>
    </div>
  );
}
