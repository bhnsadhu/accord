import Link from "next/link";

export function AccountsPaused() {
  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Sign-in is temporarily paused</h1>
      <p className="mt-4 text-ink-2">Your account is safe. For now, collections and taste preferences save in this browser only.</p>
      <Link href="/collection" className="mt-6 inline-block font-medium">Continue to your collection →</Link>
    </div>
  );
}
