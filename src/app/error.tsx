"use client";
import Link from "next/link";
import { PageShell, PageTitle } from "@/components/page-shell";
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return <PageShell width="reading"><PageTitle>Let’s try that again.</PageTitle><p className="page-intro">This page couldn’t load. Try again in a moment.</p><div className="mt-8 flex flex-wrap items-center gap-6"><button onClick={retry} className="h-12 rounded-[4px] bg-ink px-6 font-medium text-paper">Try again</button><Link href="/">Back to Accord</Link></div></PageShell>;
}
