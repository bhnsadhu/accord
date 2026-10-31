import Link from "next/link";
import { ArrowIcon, PlusIcon } from "./icons";
import type { FragranceDetail } from "@/lib/catalog/queries";
import { sourcesFor, type FragranceResearch, type ResearchSource } from "@/lib/catalog/research-schema";

export function SourceLinks({ research, field }: { research: FragranceResearch; field: ResearchSource["fields"][number] }) {
  const sources = sourcesFor(research, field);
  if (!sources.length) return null;
  return <span className="research-attribution">Source: {sources.map((source, index) => <span key={source.id}>{index > 0 && " · "}<a href={source.url}>{source.publisher}</a></span>)}</span>;
}

export function WearGuidance({ research }: { research: FragranceResearch | null }) {
  return <section id="wear" className="reference-section" aria-labelledby="wear-h">
    <div className="reference-section-heading"><h2 id="wear-h">Wearing it</h2><Link href="/learn#performance">Understand performance <ArrowIcon /></Link></div>
    {research?.wear.length ? <>
      <dl className="research-wear">{research.wear.map((report, i) => {
        const source = research.sources.find(s => s.id === report.sourceId)!;
        return <div key={`${report.aspect}-${i}`}><dt>{report.aspect}</dt><dd><p>{report.text}</p><a className="research-attribution" href={source.url}>{source.kind === "brand" ? "Brand guidance" : source.kind === "perfumer" ? "Perfumer’s account" : "Published observation"} · {source.publisher}</a></dd></div>;
      })}</dl>
      <p className="reference-caption mt-4">These are published descriptions, not measurements by Accord. Wear varies with skin, application and conditions.</p>
    </> : <p className="research-unlisted">Verified wear guidance is not listed yet. This fragrance’s notes and format alone cannot tell us its longevity or projection.</p>}
    <details className="reference-provenance"><summary>What to notice when you try it <PlusIcon /></summary><div><p>Try a small amount on skin and revisit it as it settles. Longevity is how long you can still smell it. Projection is how far it reaches; sillage is the trail it leaves as you move.</p><p>Try it in the setting you have in mind. Temperature, application and your own perception can change the experience.</p></div></details>
  </section>;
}

const fieldLabels: Record<ResearchSource["fields"][number], string> = { identity: "Product identity", summary: "Scent description", concentration: "Concentration", perfumers: "Perfumer", year: "Release year", noteStages: "Note stages", featuredNotes: "Featured notes", edition: "Related edition", wear: "Wear guidance", image: "Image permission" };

export function FragranceSources({ fragrance: f }: { fragrance: FragranceDetail }) {
  const research = f.research;
  return <details id="sources" className="reference-provenance research-sources">
    <summary>Sources and fragrance details <PlusIcon /></summary>
    <div>
      {research?.sources.length ? <><p>The scent description is an original summary of the sources below. Brand guidance describes the maker’s view; it is not an independent wear test.</p><ul className="research-source-list">{research.sources.map(source => <li key={source.id}><a href={source.url}>{source.title}</a><span>{source.publisher} · Checked {source.checkedAt}</span><span>{source.fields.map(field => fieldLabels[field]).join(" · ")}</span></li>)}</ul></> : <p>This entry has catalog facts. A separately researched scent description, perfumer and wear guidance have not yet been added.</p>}
      <p>{f.productId.startsWith("p") ? "The original listing comes from the doevent/perfume catalog, cleaned by ScentLens." : "This entry was added to Accord from the official sources above. It is searchable, but is not part of ScentLens’s trained bottle catalog."} Listed notes describe scent impressions, not an ingredient formula.</p>
      {f.accordsRaw && <p>Catalog family: {[...new Set([f.family, f.subfamily].filter(Boolean))].join(" · ") || "Not listed"}. Source accord phrase: “{f.accordsRaw}”.</p>}
      <Link href="/learn#catalog">Catalog coverage and sources <ArrowIcon /></Link>
    </div>
  </details>;
}
