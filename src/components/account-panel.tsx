"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useAccord } from "@/lib/store";

export function AccountPanel() {
  const { ready, account, collection } = useAccord();
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  if (!ready) return <div className="mt-8 h-40" aria-busy="true" />;
  if (!account) {
    return (
      <p className="mt-6 text-lg text-ink-2">
        You&rsquo;re browsing as a guest.{" "}
        <Link href="/sign-in" className="text-ink underline">
          Sign in
        </Link>{" "}
        or{" "}
        <Link href="/sign-up" className="text-ink underline">
          create an account
        </Link>
        .
      </p>
    );
  }

  const signOut = async () => {
    setError(null);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error();
      router.push("/");
      router.refresh();
    } catch { setError("Couldn't sign out. Check your connection and try again."); }
  };

  const exportData = async () => {
    setExporting(true); setError(null);
    try {
      const response = await fetch("/api/me", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      const url = URL.createObjectURL(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = "accord-collection.json"; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError("Couldn't download your data. Please try again."); }
    finally { setExporting(false); }
  };

  const deleteAccount = async () => {
    setPending(true);
    setError(null);
    try {
    const result = await authClient.deleteUser();
    if (result.error) {
      setError(
        result.error.status === 400 || result.error.status === 403
          ? "For safety, sign out and back in, then delete again."
          : "Couldn't delete the account. Try again.",
      );
      return;
    }
    router.push("/");
    router.refresh();
    } catch { setError("Couldn't delete the account. Check your connection and try again."); }
    finally { setPending(false); }
  };

  return (
    <div className="mt-8 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-10">
      <dl className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-px bg-rule sm:grid-cols-2">
        <div className="min-w-0 bg-paper p-5">
          <dt className="text-[13px] text-ink-3">Name</dt>
          <dd className="mt-1 text-lg font-medium">{account.name}</dd>
        </div>
        <div className="min-w-0 bg-paper p-5">
          <dt className="text-[13px] text-ink-3">Email</dt>
          <dd className="mt-1 truncate text-lg font-medium">{account.email}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button type="button" onClick={exportData} disabled={exporting} className="min-h-11 font-medium disabled:opacity-60">{exporting ? "Preparing download…" : "Download your data"}</button>
        <button type="button" onClick={signOut} className="min-h-11 font-medium">Sign out</button>
        <Link href="/privacy" className="min-h-11 content-center text-ink-2">Privacy</Link>
      </div>
      {error && <p role="alert" className="text-alert">{error}</p>}

      <section className="border-t border-rule pt-8" aria-labelledby="delete-h">
        <h2 id="delete-h" className="text-xl font-semibold tracking-[-0.02em]">
          Delete account
        </h2>
        <p className="mt-2 text-ink-2">
          Permanently removes your account, profile and all {collection.length} collection entries. This can&rsquo;t be undone.
        </p>
        <label className="mt-5 grid max-w-sm gap-1.5 text-[15px]">
          <span>Type <b className="font-semibold">delete</b> to confirm</span>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11 bg-paper px-3 shadow-[var(--shadow-paper)] outline-none focus-visible:outline-2 focus-visible:outline-focus"
            style={{ borderRadius: 4 }}
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          disabled={confirm !== "delete" || pending}
          onClick={deleteAccount}
          className="mt-4 h-11 bg-alert px-5 font-medium text-paper disabled:opacity-40"
          style={{ borderRadius: 4 }}
        >
          {pending ? "Deleting…" : "Delete my account"}
        </button>
      </section>
    </div>
  );
}
