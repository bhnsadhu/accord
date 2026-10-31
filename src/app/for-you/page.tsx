import { PageShell, PageTitle } from "@/components/page-shell";
import type { Metadata } from "next";
import { Recommendations } from "@/components/recommendations";

export const metadata: Metadata = { title: "For you" };

export default function ForYouPage() {
  return (
    <PageShell>
      <PageTitle>For you</PageTitle>
      <Recommendations />
    </PageShell>
  );
}
