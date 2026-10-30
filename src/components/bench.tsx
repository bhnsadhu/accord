"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { hueFor } from "@/lib/hues";
import { useAccord } from "@/lib/store";

type Mini = { productId: string; slug: string; name: string; brand: string; wheel: string | null };

/**
 * The strips you have picked up recently, laid on the bench in order:
 * a trail you can walk back along.
 */
export function Bench() {
  const { trail } = useAccord();
  const [items, setItems] = useState<Mini[]>([]);

  useEffect(() => {
    if (trail.length === 0) return;
    const controller = new AbortController();
    fetch(`/api/fragrances?ids=${trail.join(",")}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items: Mini[] }) => setItems(d.items))
      .catch(() => {});
    return () => controller.abort();
  }, [trail]);

  const shown = trail.length ? items : [];
  if (shown.length === 0) return null;
  return (
    <section aria-label="Recently opened" className="mt-6">
      <h2 className="text-sm text-ink-3">On your bench</h2>
      <ol className="mt-3 flex gap-2 overflow-x-auto pb-2">
        {shown.map((f) => (
          <li key={f.productId} className="shrink-0" style={{ "--hue": hueFor(f.wheel) } as CSSProperties}>
            <Link href={`/fragrance/${f.slug}`} className="lift strip-h strip-text flex h-11 max-w-64 items-center pr-4 text-sm [--stain-depth:30px]" title={`${f.brand} ${f.name}`}>
              <span className="stain-h" />
              <span className="relative truncate">{f.name}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
