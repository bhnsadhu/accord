import Link from "next/link";
import { ArrowIcon, StarIcon } from "./icons";
import { StripRow } from "./strip";
import { CommunityProvider, ContributePanel, ReviewActions } from "./community-contribute";
import { cachedCommunity, cachedReminders } from "@/lib/community/cached";
import type { CommunitySummary, ReviewItem } from "@/lib/community/repo";
import { LONGEVITY, OCCASIONS, OCCASION_LABEL, READS, SEASONS, SEASON_LABEL, SILLAGE, VALUE, leading, percent } from "@/lib/community/rules";

const SHELF_LABEL = { owned: "Owns it", tried: "Tried it", wishlist: "Wants to try it" } as const;

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** A compact line for the top of the fragrance page. */
export async function CommunityGlance({ productId }: { productId: string }) {
  const c = await cachedCommunity(productId);
  const parts = [
    c.ratings.count ? `${c.ratings.count} ${c.ratings.count === 1 ? "rating" : "ratings"}` : null,
    c.reviewCount ? `${c.reviewCount} ${c.reviewCount === 1 ? "review" : "reviews"}` : null,
    c.shelves.owned ? `${c.shelves.owned} ${c.shelves.owned === 1 ? "owns" : "own"} it` : null,
    c.shelves.wishlist ? `${c.shelves.wishlist} ${c.shelves.wishlist === 1 ? "wants" : "want"} it` : null,
  ].filter(Boolean);
  return (
    <a href="#community" className="community-glance">
      {c.ratings.average !== null ? (
        <><StarIcon filled /><strong className="font-mono tabular">{c.ratings.average.toFixed(1)}</strong><span>{parts.join(" · ")}</span></>
      ) : (
        <span>{parts.length ? parts.join(" · ") : "No member ratings yet"}</span>
      )}
    </a>
  );
}

export async function CommunitySection({ productId, name, hue }: { productId: string; name: string; hue: string }) {
  const c = await cachedCommunity(productId);
  const reminders = await cachedReminders(productId, c.reminds);
  return (
    <CommunityProvider productId={productId}>
      <div className="community-summary" style={{ "--hue": hue } as React.CSSProperties}>
        <RatingSummary c={c} />
        <WearVotes c={c} />
      </div>
      <ContributePanel productId={productId} name={name} />

      <div className="community-block">
        <div className="reference-section-heading"><h3 className="community-heading">Reminds members of</h3></div>
        {reminders.length ? (
          <div className="grid gap-3">
            {reminders.map(r => (
              <StripRow key={r.productId} fragrance={r.fragrance} aside={<div><div className="font-mono text-2xl font-medium tabular">{r.members}</div><div className="text-xs text-ink-3">{r.members === 1 ? "member" : "members"}</div></div>} />
            ))}
          </div>
        ) : (
          <p className="research-unlisted">No member has linked this fragrance to another yet. The catalog comparison below is calculated from listed notes.</p>
        )}
      </div>

      <div id="reviews" className="community-block">
        <div className="reference-section-heading">
          <h3 className="community-heading">Reviews <span className="font-mono text-ink-3 tabular">{c.reviewCount}</span></h3>
        </div>
        {c.reviews.length ? (
          <ol className="community-reviews">{c.reviews.map(r => <li key={r.id}><Review review={r} /></li>)}</ol>
        ) : (
          <p className="research-unlisted">No reviews yet. Reviews come from Accord members and appear here as soon as they are written.</p>
        )}
        {c.reviewCount > c.reviews.length && <p className="reference-caption mt-4">Showing the {c.reviews.length} most helpful of {c.reviewCount} reviews.</p>}
      </div>
    </CommunityProvider>
  );
}

function RatingSummary({ c }: { c: CommunitySummary }) {
  const max = Math.max(1, ...c.ratings.distribution);
  return (
    <div className="community-card">
      <h3 className="community-label">Member rating</h3>
      {c.ratings.average !== null ? (
        <p className="community-score"><strong className="tabular">{c.ratings.average.toFixed(2)}</strong><span> / 5 from {c.ratings.count} {c.ratings.count === 1 ? "rating" : "ratings"}</span></p>
      ) : (
        <p className="community-score community-score-empty">No ratings yet</p>
      )}
      {c.ratings.count === 0 ? <p className="reference-caption mt-2">Rate it in your collection above. The average appears once members rate it.</p> : <ul className="community-bars" aria-label="Rating distribution">
        {[5, 4, 3, 2, 1].map(star => {
          const n = c.ratings.distribution[star - 1];
          return (
            <li key={star}>
              <span className="w-14">{star} {star === 1 ? "star" : "stars"}</span>
              <span className="community-bar" aria-hidden><i style={{ width: `${(n / max) * 100}%` }} /></span>
              <span className="font-mono tabular">{n}</span>
            </li>
          );
        })}
      </ul>}
      <dl className="community-shelves">
        {(["owned", "tried", "wishlist"] as const).map(s => (
          <div key={s}><dt>{SHELF_LABEL[s]}</dt><dd className="font-mono tabular">{c.shelves[s]}</dd></div>
        ))}
      </dl>
      <p className="reference-caption mt-3">Ratings and shelves come from members’ collections. Each member counts once.</p>
    </div>
  );
}

function Scale({ title, labels, counts }: { title: string; labels: readonly string[]; counts: number[] }) {
  const total = counts.reduce((a, b) => a + b, 0);
  const top = leading(counts);
  return (
    <div className="community-scale">
      <h4>{title}<span>{top !== null ? labels[top] : total ? "Split" : "No votes"}</span></h4>
      <ul>
        {labels.map((label, i) => (
          <li key={label} data-leading={top === i || undefined}>
            <span>{label}</span>
            <span className="community-bar" aria-hidden><i style={{ width: `${percent(counts[i], total)}%` }} /></span>
            <span className="font-mono tabular">{counts[i]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WearVotes({ c }: { c: CommunitySummary }) {
  const w = c.wear;
  if (!w.voters) {
    return (
      <div className="community-card community-wear">
        <h3 className="community-label">How it wears, according to members</h3>
        <p className="community-score community-score-empty">No wear votes yet</p>
        <p className="reference-caption mt-2">Members vote on six things. The counts for each answer appear here as soon as someone votes.</p>
        <ul className="community-wear-topics">{["Longevity", "Sillage", "Season", "Time of day", "Reads as", "Value"].map(t => <li key={t}>{t}</li>)}</ul>
      </div>
    );
  }
  return (
    <div className="community-card community-wear">
      <h3 className="community-label">How it wears, according to members</h3>
      <p className="reference-caption">From {w.voters} {w.voters === 1 ? "member" : "members"}. Wear varies with skin, amount and weather.</p>
      <div className="community-scales">
        <Scale title="Longevity" labels={LONGEVITY} counts={w.longevity} />
        <Scale title="Sillage" labels={SILLAGE} counts={w.sillage} />
        <Scale title="Season" labels={SEASONS.map(s => SEASON_LABEL[s])} counts={SEASONS.map(s => w.seasons[s])} />
        <Scale title="Time of day" labels={OCCASIONS.map(o => OCCASION_LABEL[o])} counts={OCCASIONS.map(o => w.occasions[o])} />
        <Scale title="Reads as" labels={READS} counts={w.reads} />
        <Scale title="Value" labels={VALUE} counts={w.value} />
      </div>
    </div>
  );
}

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

export function CommunityLinks() {
  return <Link href="/charts">Member charts <ArrowIcon /></Link>;
}
