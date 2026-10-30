import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

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
    // No email provider on the free stack: accounts are usable immediately.
    requireEmailVerification: false,
  },
  socialProviders: github ? { github } : {},
  user: {
    // Cascading foreign keys remove the profile and collection with the user.
    deleteUser: { enabled: true },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  rateLimit: {
    enabled: true,
    // Serverless instances do not share memory; keep counters in Postgres.
    storage: "database",
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

export const githubEnabled = Boolean(github);
