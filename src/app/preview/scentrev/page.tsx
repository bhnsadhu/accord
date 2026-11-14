import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScentRevPreview } from "./preview";

export const metadata: Metadata = {
  title: "ScentRev preview",
  robots: { index: false, follow: false },
};

export default async function ScentRevPreviewPage() {
  // This experiment must stay unavailable in every deployed Next.js build.
  // Load the fixture only after the gate, never through a public API or asset.
  if (process.env.NODE_ENV !== "development") notFound();
  const { default: snapshot } = await import("../../../../data/research/scentrev-preview.json");
  return <ScentRevPreview snapshot={snapshot} />;
}
