import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { githubEnabled } from "@/lib/auth";
import { authEmailEnabled } from "@/lib/email";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return <AuthForm mode="sign-in" github={githubEnabled} emailEnabled={authEmailEnabled()} />;
}
