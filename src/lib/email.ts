import "server-only";
import { createHmac } from "node:crypto";
import { db } from "@/db";
import { consumeBudget } from "@/lib/security/budget";
import { reportFailure } from "@/lib/observability";

export function authEmailEnabled() {
  return process.env.AUTH_EMAIL_ENABLED === "true" && Boolean(process.env.RESEND_API_KEY || (process.env.NODE_ENV !== "production" && process.env.AUTH_EMAIL_TEST_INBOX));
}

type AuthMail = { to: string; url: string; kind: "verify" | "reset" };
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendAuthMail({ to, url, kind }: AuthMail) {
  if (!authEmailEnabled()) throw new Error("Email delivery is not configured");
  if (new URL(url).origin !== new URL(process.env.BETTER_AUTH_URL!).origin) throw new Error("Unexpected authentication link origin");
  // Test mailbox is a private local file, never a web endpoint or production fallback.
  if (process.env.NODE_ENV !== "production" && process.env.AUTH_EMAIL_TEST_INBOX) {
    const { appendFile, mkdir } = await import("node:fs/promises");
    const { dirname } = await import("node:path");
    await mkdir(dirname(process.env.AUTH_EMAIL_TEST_INBOX), { recursive: true });
    await appendFile(process.env.AUTH_EMAIL_TEST_INBOX, JSON.stringify({ to, url, kind }) + "\n", { mode: 0o600 });
    return;
  }
  const recipient = createHmac("sha256", process.env.BETTER_AUTH_SECRET!).update(to.toLowerCase()).digest("hex");
  const allowed = await consumeBudget(db, [
    { scope: "0:email:daily", limit: 70, seconds: 86400 },
    { scope: "0:email:monthly", limit: 2000, seconds: 1, calendarMonth: true },
    { scope: `email:recipient:${recipient}`, limit: 3, seconds: 3600 },
  ]);
  if (!allowed) { reportFailure("auth_email_budget_exhausted"); return; }
  const title = kind === "verify" ? "Verify your email" : "Reset your password";
  const lead = kind === "verify" ? "Confirm this email address to keep your Accord collection across devices." : "Choose a new password for your Accord account. This link expires in 30 minutes.";
  const text = `${title}\n\n${lead}\n\n${url}\n\nIf you did not request this, you can ignore this email.\n\nAccord`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", signal: AbortSignal.timeout(10_000),
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.AUTH_EMAIL_FROM ?? "Accord <accounts@bhanusadhu.com>", to: [to], subject: `${title} · Accord`, text,
      html: `<div style="font-family:Arial,sans-serif;color:#17191d;max-width:520px;margin:40px auto;line-height:1.6"><p style="font-size:28px">Accord</p><h1 style="font-size:24px">${title}</h1><p>${lead}</p><p style="margin:28px 0"><a href="${escape(url)}" style="display:inline-block;background:#17191d;color:#fff;padding:12px 20px;border-radius:4px;text-decoration:none">${title}</a></p><p>If you did not request this, you can ignore this email.</p><p style="font-size:13px">If the button does not work, copy this link:<br>${escape(url)}</p></div>` }),
  });
  if (!response.ok) throw new Error(`Email delivery failed (${response.status})`);
}
