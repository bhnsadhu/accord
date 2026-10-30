import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowIcon, PlusIcon } from "@/components/icons";
import { FAMILY_GUIDE, GUIDE_SOURCES } from "@/lib/fragrance-guide";
import { hueFor } from "@/lib/hues";

export const metadata: Metadata = { title: "Understand fragrance", description: "A short guide to fragrance notes, families, concentrations and wearing perfume, with paths into Accord’s catalog." };

export default function LearnPage() {
  return <article className="knowledge-page fragrance-guide">
    <nav className="reference-wayfinding" aria-label="Guide navigation"><Link href="/discover">Discover</Link><Link href="/notes">Note library</Link></nav>
    <h1>Understand fragrance.</h1>
    <p className="knowledge-lead">A few useful words can change how you explore a scent.</p>
    <nav className="guide-contents" aria-label="In this guide"><a href="#reading">Notes and accords</a><a href="#families">Families</a><a href="#concentration">Concentration</a><a href="#wearing">On your skin</a></nav>

    <section id="reading" className="reference-section" aria-labelledby="reading-h">
      <h2 id="reading-h">From a note to a fragrance</h2>
      <div className="guide-reading-grid">
        <div><h3>Note</h3><p>A recognisable scent impression: rose, sandalwood, leather. A note can come from a material or a blend that recreates it. It is not a complete ingredient list.</p><Link href="/notes">Get to know the notes <ArrowIcon /></Link></div>
        <div><h3>Accord</h3><p>Several materials working together as one impression. Amber and leather are useful examples. A list of accords describes qualities, not their percentages in the bottle.</p><Link href="/discover?wheel=Amber">Explore amber fragrances <ArrowIcon /></Link></div>
      </div>
      <details className="guide-question"><summary>What do top, heart and base mean?<PlusIcon /></summary><div><p>They describe how a scent unfolds: the first impression, its developing center, and the more persistent drydown. They overlap rather than switch on a fixed schedule.</p><p>Accord’s catalog does not assign these layers. A note’s position in a list does not make it a top or base note.</p></div></details>
      <p className="reference-caption mt-4">Further reading: <a href={GUIDE_SOURCES.glossary.href}>{GUIDE_SOURCES.glossary.label}</a>.</p>
    </section>

    <section id="families" className="reference-section" aria-labelledby="families-h">
      <div className="reference-section-heading"><h2 id="families-h">Find your way by family</h2><a href={GUIDE_SOURCES.wheel.href}>About the fragrance wheel <ArrowIcon /></a></div>
      <p className="reference-caption">Families group fragrances by their overall character. Accord uses the fourteen wheel families in its catalog. Open one to explore.</p>
      <div className="guide-family-list">{Object.entries(FAMILY_GUIDE).map(([family, description]) => <details key={family} name="guide-family" className="guide-family" style={{ "--hue": hueFor(family) } as CSSProperties}>
        <summary><span className="guide-family-swatch" aria-hidden /><span>{family}</span><PlusIcon /></summary>
        <div><p>{description}</p><Link href={`/discover?wheel=${encodeURIComponent(family)}`}>Explore {family.toLowerCase()} <ArrowIcon /></Link></div>
      </details>)}</div>
    </section>

    <section id="concentration" className="reference-section guide-copy" aria-labelledby="concentration-h">
      <h2 id="concentration-h">Read the version, too.</h2>
      <p>Eau de cologne, eau de toilette, eau de parfum and extrait describe fragrance formats. Concentration varies between houses, and a different version can also have a different composition.</p>
      <p>Check the full name when you compare. An eau de toilette and an eau de parfum with the same name are not necessarily the same scent at different strengths.</p>
      <p className="reference-caption">Accord displays a format when it is explicit in the catalog name. It does not estimate oil percentages.</p>
      <a href={GUIDE_SOURCES.wearing.href}>Read more at The Perfume Society <ArrowIcon /></a>
    </section>

    <section id="wearing" className="reference-section" aria-labelledby="wearing-h">
      <h2 id="wearing-h">Give it time on your skin.</h2>
      <p className="guide-copy">Use a blotter to compare first impressions, then try your shortlist on skin. Come back to it later. Notice what changes and whether you still enjoy it.</p>
      <details className="guide-question"><summary>Longevity, projection and sillage<PlusIcon /></summary><div><dl className="guide-terms"><div><dt>Longevity</dt><dd>How long you can detect the fragrance.</dd></div><div><dt>Projection</dt><dd>How far the scent radiates around the wearer.</dd></div><div><dt>Sillage</dt><dd>The scent trail left as someone moves.</dd></div></dl><p>Accord does not have measured performance or community votes for these attributes. A family, note list or concentration alone cannot supply those measurements.</p><a href={GUIDE_SOURCES.language.href}>The language of scent <ArrowIcon /></a></div></details>
      <details className="guide-question"><summary>Is there a right season or occasion?<PlusIcon /></summary><div><p>Weather and setting can change what feels comfortable. Try a scent in the conditions where you want to wear it. Seasonal labels and gender labels are starting points, not rules.</p></div></details>
      <details className="guide-question"><summary>How should I read a similarity score?<PlusIcon /></summary><div><p>Accord compares catalog notes, family and character. The score helps you build a shortlist. It is not a public rating, a probability that you will like it, or proof that two fragrances smell identical.</p><Link href="/how-it-works">See how the comparison works <ArrowIcon /></Link></div></details>
      <p className="reference-caption mt-6">References: <a href={GUIDE_SOURCES.families.href}>fragrance families</a>, <a href={GUIDE_SOURCES.ingredients.href}>ingredients</a>, and <a href={GUIDE_SOURCES.wearing.href}>choosing and wearing perfume</a> from The Perfume Society.</p>
    </section>

    <aside className="knowledge-next"><div><h2>Start with a fragrance you know.</h2><p>Read its notes, compare a few neighbours, and save what you want to try.</p></div><Link href="/discover">Find a fragrance <ArrowIcon /></Link></aside>
  </article>;
}
