import { db } from "@/db";
import { getCollection, getProfile } from "@/lib/collection/repo";
import { currentUser } from "@/lib/session";

/** The signed-in user's own profile and collection. Guests get 401. */
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const [profile, collection] = await Promise.all([getProfile(db, user.id), getCollection(db, user.id)]);
  return Response.json(
    { user: { id: user.id, name: user.name, email: user.email }, profile, collection },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
