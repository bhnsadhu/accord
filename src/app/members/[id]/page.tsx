import { PageShell } from "@/components/page-shell";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Review, formatDate } from "@/components/community-section";
import { cachedMember } from "@/lib/community/cached";

// Member pages are rare and never prerendered; navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Member", robots: { index: false } };

export default function MemberPage({ params }: PageProps<"/members/[id]">) {
  return (
    <PageShell width="reference" className="knowledge-page">
      <Suspense fallback={<div className="reference-empty" aria-busy="true">Loading member</div>}><Member params={params} /></Suspense>
    </PageShell>
  );
}

async function Member({ params }: { params: Promise<{ id: string }> }) {
  const id = decodeURIComponent((await params).id).slice(0, 100);
  const member = await cachedMember(id);
  if (!member) notFound();
  return (
    <>
      <nav className="reference-wayfinding" aria-label="Member navigation"><Link href="/charts">Charts</Link><Link href="/discover">Discover</Link></nav>
      <p className="text-lg text-ink-2">Accord member</p>
      <h1 className="mt-1 text-[clamp(36px,4.5vw,64px)] font-semibold leading-[1.02] tracking-[-0.035em] text-balance">{member.name}</h1>
      <dl className="house-stats">
        <div><dt>Joined</dt><dd>{formatDate(member.joined)}</dd></div>
        <div><dt>Reviews</dt><dd className="font-mono tabular">{member.reviews.length}</dd></div>
      </dl>
      <section className="reference-section section-divider" aria-labelledby="member-reviews-h">
        <div className="reference-section-heading"><h2 id="member-reviews-h">Reviews</h2></div>
        {member.reviews.length ? <ol className="community-reviews">{member.reviews.map(r => <li key={r.id}><Review review={r} fragrance={r.fragrance} /></li>)}</ol> : <p className="reference-empty">No published reviews.</p>}
        <p className="reference-caption mt-4">Member pages show published reviews only. Collections and taste profiles stay private.</p>
      </section>
    </>
  );
}
