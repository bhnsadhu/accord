import type { Metadata } from "next";
import { CollectionView } from "@/components/collection-view";

export const metadata: Metadata = { title: "Collection" };

export default function CollectionPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-8 sm:px-8 lg:px-16 lg:pt-12">
      <h1 className="text-[clamp(36px,4vw,56px)] font-semibold leading-none tracking-[-0.035em]">Collection</h1>
      <CollectionView />
    </div>
  );
}
