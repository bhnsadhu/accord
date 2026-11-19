import { PageShell, PageTitle } from "@/components/page-shell";
import type { Metadata } from "next";
import { Scanner } from "@/components/scanner";

export const metadata: Metadata = { title: "Scan a bottle" };

export default function ScanPage() {
  return (
    <PageShell width="workspace">
      <PageTitle>Scan a bottle</PageTitle>
      <p className="page-intro">
        Use a clear photo of the front label.
      </p>
      <Scanner />
    </PageShell>
  );
}
