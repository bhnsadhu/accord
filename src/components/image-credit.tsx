import type { ReferenceImage } from "@/lib/catalog/media";

/** Shared by client bottle viewers without importing the note image catalog. */
export function ImageCredit({ image }: { image: ReferenceImage }) {
  const label = image.kind === "structure" ? "Structure" : image.kind === "illustration" ? "Illustration" : image.provenanceNote ? "Image source" : "Photo";
  return <span className="image-credit">{label}: <a href={image.source}>{image.author}</a> · <a href={image.licenseUrl}>{image.license}</a><span> Resized for Accord.</span></span>;
}
