import { PageShell, PageTitle } from "@/components/page-shell";
import type { Metadata } from "next";
import { ProfileBuilder } from "@/components/profile-builder";
import { cachedFacets, cachedNotes } from "@/lib/catalog/cached";

export const metadata: Metadata = { title: "Your scent profile" };

export default async function ProfilePage() {
  const [notes, facets] = await Promise.all([cachedNotes(), cachedFacets()]);
  return (
    <PageShell width="workspace">
      <PageTitle>
        Tell Accord what you wear.
      </PageTitle>
      <p className="page-intro">
        Every part is optional. Three favourites or a handful of notes is enough for recommendations that explain themselves.
        Ratings you add later sharpen them.
      </p>
      <ProfileBuilder
        notes={notes.filter((n) => n.fragranceCount > 0).map((n) => ({ key: n.key, label: n.label, count: n.fragranceCount }))}
        wheels={facets.wheels.map((w) => w.value)}
        families={facets.families.map((f) => f.value)}
      />
    </PageShell>
  );
}
