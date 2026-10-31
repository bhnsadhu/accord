import { PageShell, PageTitle } from "@/components/page-shell";
import type { Metadata } from "next";
import Link from "next/link";
import { ScentLensLink } from "@/components/scentlens-link";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <PageShell as="article" width="reading">
      <PageTitle>How Accord works</PageTitle>
      <div className="mt-8 grid gap-10 text-[17px] leading-[1.65] text-ink-2 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-ink [&_strong]:font-semibold [&_strong]:text-ink">
        <section>
          <h2>The catalog</h2>
          <p className="mt-3">
            The original 24,642 fragrances from 1,255 brands were cleaned by <ScentLensLink /> from the public <strong>doevent/perfume</strong> dataset.
            Separately researched entries add original descriptions, verified facts and related versions, with sources on each page.
            Catalog photos and descriptions are not reused because their rights are unverified. Public reviews, ratings and prices are not part of Accord.
          </p>
          <p className="mt-3"><Link href="/learn#catalog" className="font-medium text-ink">See current coverage and sources.</Link></p>
        </section>
        <section>
          <h2>Reading a fragrance</h2>
          <p className="mt-3">
            Each catalog accord phrase (&ldquo;Woody Amber Fresher Citrus&rdquo;) is parsed into a family from the Michael Edwards
            fragrance wheel, a character (fresher, classical, crisp, richer) and facets. Notes are normalised so &ldquo;Jasmine
            (Grandiflorum)&rdquo; and &ldquo;Jasmine&rdquo; compare equal.
          </p>
          <p className="mt-3">New to the terminology? The <Link href="/learn" className="font-medium text-ink">fragrance guide</Link> explains notes, families and concentrations. The <Link href="/notes" className="font-medium text-ink">note library</Link> connects short reference descriptions to actual catalog entries.</p>
        </section>
        <section>
          <h2>Similarity</h2>
          <p className="mt-3">
            Two fragrances are compared on shared notes (55%), accord overlap (25%), catalog family (15%) and character (5%). Notes
            are weighted by rarity: sharing osmanthus says more than sharing musk, which half the catalog lists. The blend adapts
            the accord-aware similarity from the open-source{" "}
            <a href="https://github.com/mikeyoknow/fragrance-dna" className="font-semibold text-ink">
              Fragrance DNA
            </a>{" "}
            project.
          </p>
        </section>
        <section>
          <h2>Recommendations</h2>
          <p className="mt-3">
            Your profile becomes a weighted set of notes and accords: favourites and high ratings pull towards their notes, low
            ratings push away, and notes you avoid are excluded outright. Each fragrance is scored on fit to that profile, closeness
            to your single nearest favourite, and a personalized PageRank walk over the fragrance-note graph, then the list is
            diversified so it isn&rsquo;t ten versions of one bottle. Every reason shown is taken from that calculation.
          </p>
          <p className="mt-3">
            The match number is a percentile: the share of the catalog a fragrance outscored for you. It is not a probability that
            you&rsquo;ll like it. There is no usage data yet to measure that, so the weights were chosen on an offline test,
            documented in the source.
          </p>
        </section>
        <section>
          <h2>Recognition</h2>
          <p className="mt-3">
            Bottle scanning is{" "}
            <ScentLensLink />
            : OWLv2 detection, a fine-tuned SigLIP 2 image model, label reading and a calibrated decision to answer or abstain.
            Accord sends your photo for recognition and limits scans to stay within free hosting. Recognition results are cached for up to 24 hours; uploaded photos are not added to Accord’s database. <Link href="/privacy" className="font-medium text-ink">Read how photos are handled.</Link>
          </p>
        </section>
        <p>
          <Link href="/discover" className="font-medium text-ink underline">
            Start exploring
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
