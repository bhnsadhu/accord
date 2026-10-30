import type { Metadata } from "next";
import { AccountPanel } from "@/components/account-panel";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-8 sm:px-8 lg:pt-12">
      <h1 className="text-[clamp(36px,4vw,56px)] font-semibold leading-none tracking-[-0.035em]">Account</h1>
      <AccountPanel />
    </div>
  );
}
