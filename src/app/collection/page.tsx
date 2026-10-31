import { PageShell, PageTitle } from "@/components/page-shell";
import type { Metadata } from "next";
import { CollectionView } from "@/components/collection-view";

export const metadata: Metadata = { title: "Collection" };

export default function CollectionPage() {
  return (
    <PageShell>
      <PageTitle>Collection</PageTitle>
      <CollectionView />
    </PageShell>
  );
}
