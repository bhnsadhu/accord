import Image from "next/image";
import { noteImage } from "@/lib/catalog/media";

export { ImageCredit } from "./image-credit";

export function NotePhoto({ noteKey, className = "", full = false, thumbnail = true }: { noteKey: string; className?: string; full?: boolean; thumbnail?: boolean }) {
  const photo = noteImage(noteKey);
  if (!photo) return null;
  const preview = thumbnail && !full ? photo.thumbnail : undefined;
  return <Image src={preview ?? photo.path} alt={full ? photo.alt : ""} width={preview ? 192 : photo.width} height={preview ? 192 : photo.height} loading={full ? "eager" : "lazy"} unoptimized className={`note-photo ${photo.kind === "structure" ? "note-photo-structure" : ""} ${className}`} />;
}
