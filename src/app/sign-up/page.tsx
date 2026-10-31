import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { githubEnabled } from "@/lib/auth";
import { authEmailEnabled } from "@/lib/email";

export const metadata: Metadata = { title: "Create an account" };

export default function SignUpPage() {
  return <AuthForm mode="sign-up" github={githubEnabled} emailEnabled={authEmailEnabled()} />;
}
