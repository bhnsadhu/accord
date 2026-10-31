import { AccountRecovery } from "@/components/account-recovery";
import { authEmailEnabled } from "@/lib/email";
export const metadata = { title: "Reset your password", robots: { index: false, follow: false } };
export default function ForgotPassword() { return <AccountRecovery mode="forgot" enabled={authEmailEnabled()} />; }
