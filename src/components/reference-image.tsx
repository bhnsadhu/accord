import Image from "next/image";
import { noteImage } from "@/lib/catalog/media";

export { ImageCredit } from "./image-credit";

export function NotePhoto({ noteKey, className = "", full = false }: { noteKey: string; className?: string; full?: boolean }) {
  const photo = noteImage(noteKey);
  if (!photo) return null;
  return <Image src={photo.path} alt={full ? photo.alt : ""} width={photo.width} height={photo.height} loading={full ? "eager" : "lazy"} unoptimized className={`note-photo ${photo.kind === "structure" ? "note-photo-structure" : ""} ${className}`} />;
}
