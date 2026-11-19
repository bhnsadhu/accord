"use client";

import Image from "next/image";
import { useState } from "react";

/** The catalog photo stays intact, with a readable fallback for missing images. */
export function BottleThumbnail({ fragrance, className = "", src, eager = false }: {
  fragrance: { name: string; bottleThumbnail?: string };
  className?: string;
  src?: string;
  eager?: boolean;
}) {
  const source = src ?? fragrance.bottleThumbnail;
  const [failedSource, setFailedSource] = useState<string>();
  return <span className={`bottle-thumbnail ${className}`} aria-hidden="true">
    {source && source !== failedSource
      ? <Image src={source} alt="" width={300} height={400} unoptimized loading={eager ? "eager" : "lazy"} onError={() => setFailedSource(source)} />
      : <span className="bottle-thumbnail-missing">Photo<br />not listed</span>}
  </span>;
}
