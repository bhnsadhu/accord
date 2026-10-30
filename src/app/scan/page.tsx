import type { Metadata } from "next";
import { Scanner } from "@/components/scanner";
import { ScentLensLink } from "@/components/scentlens-link";

export const metadata: Metadata = { title: "Scan a bottle" };

export default function ScanPage() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pt-8 sm:px-8 lg:pt-12">
      <h1 className="text-[clamp(36px,4.4vw,60px)] font-semibold leading-[1] tracking-[-0.035em]">Scan a bottle</h1>
      <p className="mt-4 max-w-[38em] text-lg leading-relaxed text-ink-2">
        Photograph the front label, straight on, with the bottle filling most of the frame. <ScentLensLink /> compares it with 24,642
        catalog fragrances and says plainly when it isn&rsquo;t sure.
      </p>
      <Scanner />
    </div>
  );
}
