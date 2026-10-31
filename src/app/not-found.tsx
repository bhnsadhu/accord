import { PageShell, PageTitle } from "@/components/page-shell";
import Link from "next/link";

export default function NotFound() {
  return (
    <PageShell width="reading">
      <PageTitle>No strip by that name.</PageTitle>
      <p className="mt-4 text-lg text-ink-2">The page or fragrance you followed doesn&rsquo;t exist in the catalog.</p>
      <Link href="/discover" className="mt-6 inline-block font-medium underline">
        Search the catalog
      </Link>
    </PageShell>
  );
}
