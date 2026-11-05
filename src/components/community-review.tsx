"use client";

import Link from "next/link";
import { useState } from "react";
import { StarIcon } from "./icons";
import { ReviewActions } from "./community-contribute";
import type { ReviewItem } from "@/lib/community/repo";
import { SHELF_LABEL, formatDate } from "@/lib/community/rules";


export function Review({ review: r, fragrance }: { review: ReviewItem; fragrance?: { name: string; brand: string; slug: string } }) {
  return (
    <article className="community-review">
      <header>
        <div className="min-w-0">
          {fragrance && <Link href={`/fragrance/${fragrance.slug}#reviews`} className="community-review-subject">{fragrance.brand} · <strong>{fragrance.name}</strong></Link>}
          <p><Link href={`/members/${encodeURIComponent(r.authorId)}`} className="font-medium text-ink">{r.author}</Link>{r.shelf && <span> · {SHELF_LABEL[r.shelf]}</span>}</p>
          <p className="text-[13px] text-ink-3"><time dateTime={r.createdAt}>{formatDate(r.createdAt)}</time>{r.edited && " · Edited"}</p>
        </div>
        {r.rating !== null && (
          <span className="community-stars" role="img" aria-label={`Rated ${r.rating} of 5`}>
            {[1, 2, 3, 4, 5].map(n => <StarIcon key={n} filled={n <= r.rating!} aria-hidden />)}
          </span>
        )}
      </header>
      <div className="community-review-body">{r.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>
      {!fragrance && <ReviewActions reviewId={r.id} authorId={r.authorId} helpful={r.helpful} />}
    </article>
  );
}


const SORTS = { helpful: "Most helpful", newest: "Newest", rating: "Highest rated" } as const;

/** A fragrance's reviews with a sort the reader controls. Ties keep the server's helpful order. */
export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  const [sort, setSort] = useState<keyof typeof SORTS>("helpful");
  const sorted = sort === "helpful" ? reviews : [...reviews].sort((a, b) =>
    sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : (b.rating ?? 0) - (a.rating ?? 0) || b.helpful - a.helpful);
  return (
    <>
      {reviews.length > 1 && (
        <div className="community-review-sort mb-4" role="group" aria-label="Sort reviews">
          {Object.entries(SORTS).map(([key, label]) => <button key={key} type="button" aria-pressed={sort === key} onClick={() => setSort(key as keyof typeof SORTS)}>{label}</button>)}
        </div>
      )}
      <ol className="community-reviews">{sorted.map(r => <li key={r.id}><Review review={r} /></li>)}</ol>
    </>
  );
}
