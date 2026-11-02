import "server-only";
import verified from "../../../data/media/bottles.json";
import catalog from "../../../data/media/catalog-index.json";
import release from "../../../data/media/catalog-release.json";
import type { BottleImage } from "./media";

// This index stays on the server. Clients receive only the images they display.
// Tuple: width, height, full name, brand, original source filename.
const entries = catalog as unknown as Record<string, [number, number, string, string, string]>;
const licensed: Readonly<Record<string, BottleImage>> = verified;
const enabled = release.status === "published" || process.env.ACCORD_CATALOG_IMAGES === "1";

/** Exact identity matches only. Recognition groups are deliberately not used. */
export function bottleImage(id: string): BottleImage | undefined {
  const entry = enabled ? entries[id] : undefined;
  if (!entry) return licensed[id];
  const [width, height, name, brand] = entry;
  return {
    productId: id, name, brand, concentration: "Catalog photograph",
    path: `/images/catalog/${release.sha256.slice(0, 12)}/${id}.webp`, thumbnail: `/images/catalog/${release.sha256.slice(0, 12)}/${id}-thumb.webp`,
    width, height, alt: `${name} by ${brand}, bottle photograph`,
    author: "doevent/perfume catalog", source: release.source,
    license: "Source details", licenseUrl: "/learn#catalog-images",
    checkedAt: "2026-11-01", changes: "Resized and WebP encoded. Full photograph retained.",
    provenanceNote: "Dataset labelled MIT. Individual photograph permissions are not documented by the dataset.",
    caption: "Catalog photograph. Packaging can vary by market and production year.",
    position: "center", fit: "contain", catalogPhoto: true,
  };
}

export function withBottleThumbnail<T extends { productId: string }>(fragrance: T): T & { bottleThumbnail?: string } {
  const image = bottleImage(fragrance.productId);
  return image ? { ...fragrance, bottleThumbnail: image.thumbnail } : fragrance;
}

export const bottleCoverage = new Set([
  ...Object.keys(licensed), ...(enabled ? Object.keys(entries) : []),
]).size;
