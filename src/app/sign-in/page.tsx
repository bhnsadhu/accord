import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { authEmailEnabled } from "@/lib/email";
import { accountsEnabled } from "@/lib/availability";
import { AccountsPaused } from "@/components/accounts-paused";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  if (!accountsEnabled()) return <AccountsPaused />;
  const { githubEnabled } = await import("@/lib/auth");
  return <AuthForm mode="sign-in" github={githubEnabled} emailEnabled={authEmailEnabled()} />;
}
