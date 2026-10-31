import { createHmac, timingSafeEqual } from "node:crypto";
import { ipAddress } from "@vercel/functions";

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === new URL(request.url).origin || origin === process.env.BETTER_AUTH_URL;
}

export function requestKey(request: Request) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("Request protection is not configured");
  const address = ipAddress(request) ?? (process.env.VERCEL ? "unknown" : request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()) ?? "local";
  return createHmac("sha256", secret).update(`${new Date().toISOString().slice(0, 10)}:${address}`).digest("hex");
}

export function matchesSecret(value: string | null, secret: string | undefined) {
  if (!secret || !value) return false;
  const a = Buffer.from(value); const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export class BodyTooLarge extends Error {}

/** Enforce the limit while reading, including bodies with no Content-Length. */
export async function readBody(request: Request, maxBytes: number) {
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) throw new BodyTooLarge();
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const parts: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new BodyTooLarge(); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(size); let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.byteLength; }
  return result;
}
