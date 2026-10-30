import "server-only";
import { headers } from "next/headers";
import { auth } from "./auth";

/** The signed-in user from the verified session cookie, or null for guests. */
export async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}
