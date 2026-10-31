import { PageShell, PageTitle } from "@/components/page-shell";
import type { Metadata } from "next";
import { AccountPanel } from "@/components/account-panel";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <PageShell width="account">
      <PageTitle>Account</PageTitle>
      <AccountPanel />
    </PageShell>
  );
}
