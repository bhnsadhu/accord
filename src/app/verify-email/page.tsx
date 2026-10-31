import { AccountRecovery } from "@/components/account-recovery";
import { authEmailEnabled } from "@/lib/email";
export const metadata = { title: "Verify your email", robots: { index: false, follow: false } };
export default function VerifyEmail() { return <AccountRecovery mode="verify" enabled={authEmailEnabled()} />; }
