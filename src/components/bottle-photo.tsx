"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { BottleImage } from "@/lib/catalog/media";
import { CloseIcon, SearchIcon } from "./icons";
import { ImageCredit } from "./reference-image";

export function BottlePhoto({ image }: { image: BottleImage }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previous; };
  }, [open]);
  const close = () => dialog.current?.close();
  return <figure className="bottle-photo">
    <button type="button" className="bottle-photo-trigger" aria-label={`Enlarge ${image.name} bottle photo`} onClick={() => { dialog.current?.showModal(); setOpen(true); }}>
      <Image src={image.path} alt={image.alt} width={image.width} height={image.height} unoptimized loading="eager" style={{ objectPosition: image.position, objectFit: image.fit === "contain" ? "contain" : "cover" }} />
      <span className="bottle-photo-zoom"><SearchIcon width={16} height={16} /> View bottle</span>
    </button>
    <figcaption><p>{image.caption}</p><ImageCredit image={image} /></figcaption>
    <dialog ref={dialog} className="bottle-dialog" aria-labelledby={titleId} onClose={() => setOpen(false)} onClick={e => e.target === dialog.current && close()}>
      <header><h2 id={titleId}>{image.name}<span>{image.brand} · {image.concentration}</span></h2><button type="button" aria-label="Close bottle photo" onClick={close}><CloseIcon /></button></header>
      <Image src={image.path} alt={image.alt} width={image.width} height={image.height} unoptimized loading="eager" />
      <footer><p>{image.caption}</p><ImageCredit image={image} /></footer>
    </dialog>
  </figure>;
}
