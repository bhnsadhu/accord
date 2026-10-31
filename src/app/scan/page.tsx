import { PageShell, PageTitle } from "@/components/page-shell";
import type { Metadata } from "next";
import { Scanner } from "@/components/scanner";
import { ScentLensLink } from "@/components/scentlens-link";

export const metadata: Metadata = { title: "Scan a bottle" };

export default function ScanPage() {
  return (
    <PageShell width="workspace">
      <PageTitle>Scan a bottle</PageTitle>
      <p className="page-intro">
        Photograph the front label, straight on, with the bottle filling most of the frame. <ScentLensLink /> compares it with 24,642
        catalog fragrances and says plainly when it isn&rsquo;t sure.
      </p>
      <Scanner />
    </PageShell>
  );
}
