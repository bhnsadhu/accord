import "server-only";
import { headers } from "next/headers";
import { auth } from "./auth";

/**
 * The signed-in user, or null for guests. Always checked against the session
 * table (not the signed cookie cache), so signing out elsewhere or deleting
 * the account revokes access immediately, even for a replayed cookie.
 */
export async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  return session?.user ?? null;
}
