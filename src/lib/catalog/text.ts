/** Lowercase, strip diacritics and punctuation, collapse whitespace. */
export function foldText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function slugify(input: string): string {
  return foldText(input).replace(/ /g, "-");
}

// ScentLens owns p IDs. New researched entries use a separate immutable namespace.
const PRODUCT_ID = /^(p\d{5}|a[0-9a-f]{12})$/;

export function isProductId(value: string): boolean {
  return PRODUCT_ID.test(value);
}

/** URL slug for a fragrance: readable prefix, stable ScentLens id suffix. */
export function fragranceSlug(brand: string, name: string, productId: string): string {
  const readable = slugify(`${brand} ${name}`).slice(0, 80).replace(/-+$/, "");
  return readable ? `${readable}-${productId}` : productId;
}

/** Extract the product id from a slug produced by fragranceSlug, or a bare id. */
export function productIdFromSlug(slug: string): string | null {
  const match = /(?:^|-)(p\d{5}|a[0-9a-f]{12})$/.exec(slug);
  return match ? match[1] : null;
}
