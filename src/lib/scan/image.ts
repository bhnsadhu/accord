/**
 * Server-side checks on an upload before anything else happens. The client
 * already resizes to at most 1024 px and recompresses, so a legitimate photo
 * is a few hundred KB.
 */
export const MAX_SCAN_BYTES = 2 * 1024 * 1024;
const MIN_SCAN_BYTES = 1024;

export type ImageCheck = { ok: true; type: "image/jpeg" | "image/png" | "image/webp" } | { ok: false; error: string };

/** Identify the format from magic bytes, never from the declared content type. */
export function sniffImage(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return "image/png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}

export function checkImage(bytes: Uint8Array): ImageCheck {
  if (bytes.length < MIN_SCAN_BYTES) return { ok: false, error: "That file is too small to be a photo." };
  if (bytes.length > MAX_SCAN_BYTES) return { ok: false, error: "That photo is too large. Try again; Accord shrinks photos before sending." };
  const type = sniffImage(bytes);
  if (!type) return { ok: false, error: "Use a JPEG, PNG or WebP photo." };
  return { ok: true, type };
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
