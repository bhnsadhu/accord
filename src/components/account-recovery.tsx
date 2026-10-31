"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { PageShell, PageTitle } from "@/components/page-shell";
import { Field } from "@/components/auth-form";
import { authClient } from "@/lib/auth-client";

export function AccountRecovery({ mode, enabled, token }: { mode: "forgot" | "reset" | "verify"; enabled: boolean; token?: string }) {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const title = mode === "reset" ? "Choose a new password" : mode === "verify" ? "Check your email" : "Forgot your password?";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const result = mode === "reset"
        ? await authClient.resetPassword({ token, newPassword: String(form.get("password") ?? "") })
        : mode === "verify"
          ? await authClient.sendVerificationEmail({ email: String(form.get("email") ?? "").trim(), callbackURL: "/collection" })
          : await authClient.requestPasswordReset({ email: String(form.get("email") ?? "").trim(), redirectTo: "/reset-password" });
      if (result.error) {
        setError(result.error.status === 429 ? "Please wait a minute before trying again." : mode === "reset" ? "That link has expired or already been used. Request a new one below." : "We couldn't process that request. Please try again shortly.");
      } else setSent(true);
    } catch { setError("We couldn't connect. Check your connection and try again."); }
    finally { setPending(false); }
  }
  return <PageShell width="form"><PageTitle>{title}</PageTitle>
    <p className="page-intro">{mode === "reset" ? "Use at least 10 characters. Your other sessions will be signed out." : mode === "verify" ? "Open the verification link to finish signing in. Need a fresh link? Enter your email below." : "We’ll send a secure link so you can get back to your collection."}</p>
    {!enabled ? <p className="mt-8" role="status">Email recovery is temporarily unavailable. Please try again shortly.</p> : sent ? <div className="mt-8" role="status"><p>{mode === "reset" ? "Your password has been changed. Sign in with your new password." : "If this address is eligible, an email is on its way. Check your inbox and spam folder."}</p><Link className="mt-6 inline-block font-medium" href="/sign-in">Back to sign in</Link></div>
      : mode === "reset" && !token ? <div className="mt-8"><p>This reset link is missing or has expired.</p><Link href="/forgot-password" className="mt-4 inline-block font-medium">Request a new link</Link></div>
      : <form onSubmit={submit} className="mt-8 grid gap-5">
        {mode === "reset" ? <Field label="New password" name="password" type="password" autoComplete="new-password" required minLength={10} hint="At least 10 characters." /> : <Field label="Email" name="email" type="email" autoComplete="email" required />}
        {error && <p role="alert" className="text-alert">{error}</p>}
        <button className="h-[52px] rounded-[4px] bg-ink px-5 font-medium text-paper disabled:opacity-60" disabled={pending}>{pending ? "One moment…" : mode === "reset" ? "Save new password" : mode === "verify" ? "Send verification link" : "Send reset link"}</button>
        {mode === "reset" && error && <Link href="/forgot-password">Request a new reset link</Link>}
      </form>}
    {!sent && <Link href="/sign-in" className="mt-8 inline-block text-[15px]">Back to sign in</Link>}
  </PageShell>;
}
