"use client";

import type { ComponentProps } from "react";
import { useAccord } from "@/lib/store";
import { StripFan } from "./strip";

/** The homepage fan, with strips you have already opened locked out of it. */
export function HomeFan(props: Omit<ComponentProps<typeof StripFan>, "locked">) {
  const { trail } = useAccord();
  return <StripFan {...props} locked={new Set(trail)} />;
}
