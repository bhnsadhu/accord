import Link from "next/link";
import type { CSSProperties } from "react";
import type { FragranceSummary } from "@/lib/catalog/queries";
import { homeBottleName } from "@/lib/home-bottles";
import { BottleThumbnail } from "./bottle-thumbnail";

/** Each bottle leads straight to its fragrance, including without JavaScript. */
export function HomeBottles({ fragrances }: { fragrances: (FragranceSummary & { bottleImage?: string })[] }) {
  return <ul className="hero-bottles" aria-label="Signature fragrances">
    {fragrances.slice(0, 6).map((fragrance, i) => (
      <li key={fragrance.productId}>
        <Link
          className="hero-bottle"
          href={`/fragrance/${fragrance.slug}`}
          aria-label={`View ${fragrance.name} by ${fragrance.brand}`}
          style={{ "--intro-delay": `${i * 40}ms` } as CSSProperties}
        >
          <BottleThumbnail fragrance={fragrance} src={fragrance.bottleImage} eager />
          <span className="hero-bottle-caption">
            <span className="hero-bottle-name">{homeBottleName(fragrance)}</span>
            <span className="hero-bottle-brand">{fragrance.brand}</span>
          </span>
        </Link>
      </li>
    ))}
  </ul>;
}
