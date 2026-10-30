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
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  const deleteAccount = async () => {
    setPending(true);
    setError(null);
    const result = await authClient.deleteUser();
    setPending(false);
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
  };

  return (
    <div className="mt-8 grid gap-10">
      <dl className="grid gap-px bg-rule sm:grid-cols-2">
        <div className="bg-paper p-5">
          <dt className="text-[13px] text-ink-3">Name</dt>
          <dd className="mt-1 text-lg font-medium">{account.name}</dd>
        </div>
        <div className="bg-paper p-5">
          <dt className="text-[13px] text-ink-3">Email</dt>
          <dd className="mt-1 truncate text-lg font-medium">{account.email}</dd>
        </div>
      </dl>
      <button type="button" onClick={signOut} className="justify-self-start font-medium underline">
        Sign out
      </button>

      <section className="border-t border-rule pt-8" aria-labelledby="delete-h">
        <h2 id="delete-h" className="text-xl font-semibold tracking-[-0.02em]">
          Delete account
        </h2>
        <p className="mt-2 text-ink-2">
          Permanently removes your account, profile and all {collection.length} collection entries. This can&rsquo;t be undone.
        </p>
        <label className="mt-5 grid max-w-sm gap-1.5 text-[15px]">
          Type <b className="font-mono">delete</b> to confirm
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11 bg-paper px-3 shadow-[var(--shadow-paper)] outline-none focus-visible:outline-2 focus-visible:outline-focus"
            style={{ borderRadius: 4 }}
            autoComplete="off"
          />
        </label>
        {error && (
          <p role="alert" className="mt-3 text-alert">
            {error}
          </p>
        )}
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
