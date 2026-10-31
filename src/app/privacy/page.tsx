import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, PageTitle } from "@/components/page-shell";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return <PageShell as="article" width="reading">
    <PageTitle>Your taste stays personal.</PageTitle>
    <p className="page-intro">What Accord saves, why it needs it, and how you stay in control.</p>
    <div className="mt-10 grid gap-10 text-[17px] leading-[1.65] text-ink-2 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-ink [&_p]:mt-3 [&_a]:font-medium [&_a]:text-ink">
      <section><h2>Browsing and your collection</h2><p>You can search the catalog without an account. As a guest, your shelves, ratings and taste preferences are saved in this browser. Clearing Accord’s site data removes them. Recent fragrance visits and interface preferences also stay on this device.</p><p>With an account, Accord saves your name, email, password hash, collection and taste profile in its database so they can follow you across devices. Ratings are private inputs to your recommendations. Accord does not publish reviews or public profiles.</p></section>
      <section><h2>Account security</h2><p>Necessary cookies keep you signed in. Session records include an IP address and browser information to support authentication and account security. Verification and password reset emails go through Resend. Verification links expire after one hour; reset links expire after 30 minutes. A password reset signs out your other sessions.</p><p>Accord uses request counters to limit abuse. Guest scan counters use a daily salted hash of your IP address. Hosting providers may also keep request and security logs. Accord does not use advertising cookies or sell your personal information.</p></section>
      <section><h2>When you scan a bottle</h2><p>Your photo is sent to ScentLens on Modal to identify the fragrance. Avoid including faces, documents or other private information. Accord does not add uploaded photos to its database or a training dataset. A photo fingerprint and recognition result, including text read from the label, may be cached for up to 24 hours to avoid scanning the same photo twice.</p><p>Scan processing uses temporary server memory and may use temporary files. These are not a personal photo library. Scanner limits keep the service within its free hosting allowance; search remains available when scans are paused.</p></section>
      <section><h2>Services that keep Accord running</h2><p>Vercel hosts the website, Neon stores account and catalog data, Resend delivers account emails, and Modal runs bottle recognition. Encrypted database backups are stored in a private GitHub repository’s Actions artifacts. These providers process the information needed for their part of the service, and may process it outside your country.</p></section>
      <section><h2>Retention and deletion</h2><p>Your account, profile and collection stay until you delete them from <Link href="/account">Account</Link>. You can download your collection and taste profile there too. Deletion removes active account data; encrypted backups expire after seven days.</p><p>Daily maintenance removes expired sessions and verification records, expired request limits, scan counters older than 35 days, cached scan results older than 24 hours, and missing-fragrance requests older than 90 days. Provider logs and recovery systems follow the providers’ own retention settings.</p></section>
      <section><h2>Questions about your data</h2><p>Accord is maintained by Bhanu Sadhu. Use the contact form on <a href="https://bhanusadhu.com/">bhanusadhu.com</a> for privacy questions or data requests. Please do not include passwords or recovery links.</p><p className="text-sm text-ink-3">Updated October 31, 2026.</p></section>
    </div>
  </PageShell>;
}
