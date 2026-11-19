import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { BottleThumbnail } from "@/components/bottle-thumbnail";
import { homeBottleName } from "@/lib/home-bottles";
import type { PreviewBottle } from "./types";


function Identity({ bottle }: { bottle: PreviewBottle }) {
  return <div className="bottle-options-identity">
    <p>{bottle.brand}{bottle.productId === "p03345" ? " · Eau de Parfum Intense" : ""}</p>
    <h2 id="bottle-preview-title">{homeBottleName(bottle)}</h2>
  </div>;
}

function OpenFragrance({ bottle }: { bottle: PreviewBottle }) {
  return <Link href={`/fragrance/${bottle.slug}`} className="bottle-options-open">View fragrance <ArrowIcon /></Link>;
}

export function DetailsRow({ bottle }: { bottle: PreviewBottle }) {
  return <div className="bottle-options-detailsRow">
    <Identity bottle={bottle} />
    <div className="bottle-options-rowNotes"><p>{bottle.keyNotes.join(" · ")}</p><OpenFragrance bottle={bottle} /></div>
  </div>;
}

export function ScentCard({ bottle }: { bottle: PreviewBottle }) {
  return <div className="bottle-options-scentCard">
    <Identity bottle={bottle} />
    <div className="bottle-options-story">
      <p>{bottle.description}</p>
      <div className="bottle-options-storyLinks"><OpenFragrance bottle={bottle} /><a href={bottle.source} target="_blank" rel="noreferrer">Notes source</a></div>
    </div>
  </div>;
}

export function RelatedBottles({ bottle }: { bottle: PreviewBottle }) {
  return <div className="bottle-options-relatedPanel">
    <div className="bottle-options-relatedIdentity"><Identity bottle={bottle} /><p>{bottle.keyNotes.slice(0, 3).join(" · ")}</p><OpenFragrance bottle={bottle} /></div>
    <div className="bottle-options-relatedList">
      <p>Follow the notes</p>
      <div>{bottle.related.length ? bottle.related.map(({ fragrance, sharedNotes }) => (
        <Link href={`/fragrance/${fragrance.slug}`} key={fragrance.productId} className="bottle-options-relatedBottle">
          <BottleThumbnail fragrance={fragrance} />
          <span><strong>{fragrance.name}</strong><span>{fragrance.brand}</span><small>{sharedNotes.length ? `Shares ${sharedNotes.slice(0, 2).join(" and ").toLowerCase()}` : "Related scent profile"}</small></span>
          <ArrowIcon />
        </Link>
      )) : <Link href={`/fragrance/${bottle.slug}#similar-h`} className="bottle-options-open">Explore similar fragrances <ArrowIcon /></Link>}</div>
    </div>
  </div>;
}
