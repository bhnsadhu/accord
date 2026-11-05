import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { waitUntil } from "@vercel/functions";
import { authEmailEnabled, sendAuthMail } from "@/lib/email";
import { reportFailure } from "@/lib/observability";
import { revalidateTag } from "next/cache";
import { memberFootprint } from "@/lib/community/repo";
import { communityTag } from "@/lib/community/rules";

// Fragrances a member contributed to, captured just before their account is deleted.
const footprints = new Map<string, string[]>();

const github =
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? { clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET }
    : undefined;

export const auth = betterAuth({
  appName: "Accord",
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    requireEmailVerification: authEmailEnabled(),
    resetPasswordTokenExpiresIn: 30 * 60,
    revokeSessionsOnPasswordReset: true,
    ...(authEmailEnabled() ? { sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      waitUntil(sendAuthMail({ to: user.email, url, kind: "reset" }).catch(() => reportFailure("password_reset_email_failed")));
    } } : {}),
  },
  emailVerification: {
    sendOnSignUp: authEmailEnabled(), sendOnSignIn: authEmailEnabled(),
    autoSignInAfterVerification: true, expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      waitUntil(sendAuthMail({ to: user.email, url, kind: "verify" }).catch(() => reportFailure("verification_email_failed")));
    },
  },
  socialProviders: github ? { github } : {},
  user: {
    // Cascading foreign keys remove the profile and collection with the user.
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        footprints.set(user.id, await memberFootprint(db, user.id));
      },
      // Reviews, votes and ratings vanish with the account; cached public pages must not keep showing them.
      afterDelete: async (user) => {
        const ids = footprints.get(user.id) ?? [];
        footprints.delete(user.id);
        for (const id of ids) revalidateTag(communityTag(id), { expire: 0 });
        revalidateTag("community", { expire: 0 });
        revalidateTag(`member:${user.id}`, { expire: 0 });
      },
    },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  rateLimit: {
    enabled: true,
    // Serverless instances do not share memory; keep counters in Postgres.
    storage: "database",
    customRules: {
      "/request-password-reset": { window: 60, max: 3 },
      "/send-verification-email": { window: 60, max: 3 },
      "/sign-up/email": { window: 60, max: 3 },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

export const githubEnabled = Boolean(github);
