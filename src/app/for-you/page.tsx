import type { Metadata } from "next";
import { Recommendations } from "@/components/recommendations";

export const metadata: Metadata = { title: "For you" };

export default function ForYouPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-8 sm:px-8 lg:px-16 lg:pt-12">
      <h1 className="text-[clamp(36px,4vw,56px)] font-semibold leading-none tracking-[-0.035em]">For you</h1>
      <Recommendations />
    </div>
  );
}
