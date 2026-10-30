import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-16 sm:px-8">
      <h1 className="text-[clamp(36px,4vw,56px)] font-semibold leading-none tracking-[-0.035em]">No strip by that name.</h1>
      <p className="mt-4 text-lg text-ink-2">The page or fragrance you followed doesn&rsquo;t exist in the catalog.</p>
      <Link href="/discover" className="mt-6 inline-block font-medium underline">
        Search the catalog
      </Link>
    </div>
  );
}
