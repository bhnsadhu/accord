"use client";

import { useEffect } from "react";
import { useAccord } from "@/lib/store";

/** Lays the opened fragrance on the bench trail. Renders nothing. */
export function VisitTracker({ productId }: { productId: string }) {
  const { visit } = useAccord();
  useEffect(() => visit(productId), [productId, visit]);
  return null;
}
