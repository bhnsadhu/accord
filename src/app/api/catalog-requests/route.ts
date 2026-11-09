/** Retired form: old tabs must not create requests that will wait for manual review. */
export async function POST() {
  return Response.json(
    { error: "Fragrance requests are no longer available. Explore the catalog by name, house or note." },
    { status: 410 },
  );
}
