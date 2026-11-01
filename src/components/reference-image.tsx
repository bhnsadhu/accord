import Image from "next/image";
import { noteImage, type ReferenceImage } from "@/lib/catalog/media";

export function ImageCredit({ image }: { image: ReferenceImage }) {
  return <span className="image-credit">Photo: <a href={image.source}>{image.author}</a> · <a href={image.licenseUrl}>{image.license}</a><span> Resized for Accord.</span></span>;
}

export function NotePhoto({ noteKey, className = "", full = false }: { noteKey: string; className?: string; full?: boolean }) {
  const photo = noteImage(noteKey);
  if (!photo) return null;
  return <Image src={photo.path} alt={full ? photo.alt : ""} width={photo.width} height={photo.height} unoptimized className={`note-photo ${className}`} />;
}
