import type { Metadata } from "next";
import { ProfileBuilder } from "@/components/profile-builder";
import { cachedFacets, cachedNotes } from "@/lib/catalog/cached";

export const metadata: Metadata = { title: "Your scent profile" };

export default async function ProfilePage() {
  const [notes, facets] = await Promise.all([cachedNotes(), cachedFacets()]);
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pt-8 sm:px-8 lg:pt-12">
      <h1 className="text-[clamp(36px,4.4vw,60px)] font-semibold leading-[1] tracking-[-0.035em] text-balance">
        Tell Accord what you wear.
      </h1>
      <p className="mt-5 max-w-[36em] text-lg leading-relaxed text-ink-2">
        Every part is optional. Three favourites or a handful of notes is enough for recommendations that explain themselves.
        Ratings you add later sharpen them.
      </p>
      <ProfileBuilder
        notes={notes.filter((n) => n.fragranceCount > 0).map((n) => ({ key: n.key, label: n.label, count: n.fragranceCount }))}
        wheels={facets.wheels.map((w) => w.value)}
        families={facets.families.map((f) => f.value)}
      />
    </div>
  );
}
