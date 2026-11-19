import type { Metadata } from "next";
import { Suspense } from "react";
import { bottleImage } from "@/lib/catalog/bottle-media";
import { cachedFragrancesByIds, cachedSimilar } from "@/lib/catalog/cached";
import { HOME_BOTTLE_IDS } from "@/lib/home-bottles";
import { BottleDetailsPreview } from "./preview";

export const metadata: Metadata = { title: "Bottle preview options", robots: { index: false, follow: false } };

const stories: Record<string, { description: string; keyNotes: string[]; source: string }> = {
  p08355: {
    description: "Pink pepper and aromatic lavender meet a warm base of vanilla and amber wood.",
    keyNotes: ["Pink pepper", "Lavender", "Vanilla", "Amber wood"],
    source: "https://www.giorgioarmanibeauty-usa.com/fragrances/emporio-armani-stronger-with-you-intensely-eau-de-parfum/ww-00180-arm.html",
  },
  p14487: {
    description: "Sandalwood and cedar with soft iris, a little cardamom, and the dry texture of leather.",
    keyNotes: ["Sandalwood", "Cardamom", "Iris", "Leather"],
    source: "https://www.lelabofragrances.com/santal-33-147.html",
  },
  p12527: {
    description: "Fresh cypress and woody grapevine, grounded by earthy moss and the warmth of amber.",
    keyNotes: ["Cypress", "Grapevine", "Moss", "Amber"],
    source: "https://www.jomalone.com/our-stories/cypress-grapevine",
  },
  a09e1f2c0fabb: {
    description: "Supple leather with jasmine and cardamom, resting on patchouli and warm amber.",
    keyNotes: ["Leather", "Jasmine", "Cardamom", "Patchouli"],
    source: "https://www.tomfordbeauty.com/product/ombre-leather-eau-de-parfum",
  },
  p03345: {
    description: "Bright cardamom gives way to sweet toffee and a deep amber-wood finish.",
    keyNotes: ["Cardamom", "Toffee", "Amber wood"],
    source: "https://www.azzaro.com/en/fragrances/azzaro-the-most-wanted",
  },
  p03615: {
    description: "A warm blend of coffee, vanilla and Irish whiskey.",
    keyNotes: ["Coffee", "Vanilla", "Irish whiskey"],
    source: "https://www.youtube.com/watch?v=moZuNe3SGeI",
  },
};

export default function BottleDetailsPage({ searchParams }: PageProps<"/preview/bottle-details">) {
  return <Suspense fallback={<div className="site-frame py-16">Loading bottle previews...</div>}>
    <Preview searchParams={searchParams} />
  </Suspense>;
}

async function Preview({ searchParams }: Pick<PageProps<"/preview/bottle-details">, "searchParams">) {
  const [fragrances, params] = await Promise.all([cachedFragrancesByIds(HOME_BOTTLE_IDS), searchParams]);
  const bottles = await Promise.all(fragrances.map(async fragrance => ({
    ...fragrance,
    bottleImage: bottleImage(fragrance.productId)?.path,
    ...stories[fragrance.productId],
    related: (await cachedSimilar(fragrance.productId, 2)).map(({ fragrance, sharedNotes }) => ({ fragrance, sharedNotes })),
  })));
  const variant = Math.min(2, Math.max(0, Math.trunc(Number(params.v) || 1) - 1));
  return <BottleDetailsPreview bottles={bottles} initialVariant={variant} />;
}
