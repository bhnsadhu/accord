"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode, github }: { mode: "sign-in" | "sign-up"; github: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const signUp = mode === "sign-up";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setPending(true);
    setError(null);
    const result = signUp
      ? await authClient.signUp.email({ email, password, name: String(form.get("name") ?? "").trim() || email.split("@")[0] })
      : await authClient.signIn.email({ email, password });
    setPending(false);
    if (result.error) {
      setError(
        result.error.status === 429
          ? "Too many attempts. Wait a minute and try again."
          : signUp
            ? (result.error.message ?? "Couldn't create the account.")
            : "That email and password don't match an account.",
      );
      return;
    }
    router.push("/collection");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-10 sm:pt-16">
      <h1 className="text-[clamp(32px,4vw,48px)] font-semibold leading-none tracking-[-0.035em]">
        {signUp ? "Create an account" : "Sign in"}
      </h1>
      <p className="mt-4 text-ink-2">
        {signUp
          ? "Keep your collection, ratings and profile across devices. Anything you saved as a guest comes with you."
          : "Welcome back. Your shelves are where you left them."}
      </p>
      <form onSubmit={submit} className="mt-8 grid gap-4" noValidate={false}>
        {signUp && <Field label="Name" name="name" autoComplete="name" />}
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={signUp ? "new-password" : "current-password"}
          required
          minLength={signUp ? 10 : undefined}
          hint={signUp ? "At least 10 characters." : undefined}
        />
        {error && (
          <p role="alert" className="text-[15px] text-alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 h-[52px] bg-ink font-medium text-paper transition-[background-color] hover:bg-ink-2 disabled:opacity-60"
          style={{ borderRadius: 4 }}
        >
          {pending ? "One moment…" : signUp ? "Create account" : "Sign in"}
        </button>
      </form>
      {github && (
        <button
          type="button"
          onClick={() => authClient.signIn.social({ provider: "github", callbackURL: "/collection" })}
          className="mt-3 h-[52px] w-full border border-ink font-medium hover:bg-paper"
          style={{ borderRadius: 4 }}
        >
          Continue with GitHub
        </button>
      )}
      <p className="mt-8 text-[15px] text-ink-2">
        {signUp ? "Already have an account? " : "New to Accord? "}
        <Link href={signUp ? "/sign-in" : "/sign-up"} className="font-semibold text-ink">
          {signUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}

function Field({ label, hint, ...input }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-1.5 text-[15px] font-medium">
      {label}
      <input
        {...input}
        className="h-12 bg-paper px-3.5 text-[17px] font-normal shadow-[var(--shadow-paper)] outline-none focus-visible:outline-2 focus-visible:outline-focus"
        style={{ borderRadius: 4 }}
      />
      {hint && <span className="text-sm font-normal text-ink-3">{hint}</span>}
    </label>
  );
}
