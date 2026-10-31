import { Suspense } from "react";
import { AccountRecovery } from "@/components/account-recovery";
import { authEmailEnabled } from "@/lib/email";
export const metadata = { title: "Choose a new password", robots: { index: false, follow: false } };
export default function ResetPassword({ searchParams }: { searchParams: Promise<{ token?: string }> }) { return <Suspense><ResetContent searchParams={searchParams} /></Suspense>; }
async function ResetContent({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const { token } = await searchParams; return <AccountRecovery mode="reset" enabled={authEmailEnabled()} token={typeof token === "string" && token.length <= 4096 ? token : undefined} />; }
