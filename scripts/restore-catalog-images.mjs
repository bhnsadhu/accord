// Restore immutable, same-origin static assets without a paid image service.
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const root = path.resolve(import.meta.dirname, "..");
const release = JSON.parse(await readFile(path.join(root, "data/media/catalog-release.json"), "utf8"));
const local = process.argv[2];
if (!local && release.status !== "published") {
  console.log("Catalog photos not published; using the licensed reference set.");
  process.exit(0);
}
if (!/^[a-f0-9]{64}$/.test(release.sha256) || release.bytes > 900_000_000 || release.entries > 30_000) {
  throw new Error("Invalid catalog release bounds");
}
const temp = await mkdtemp(path.join(tmpdir(), "accord-media-"));
const target = path.join(root, "public/images/catalog", release.sha256.slice(0, 12));
try {
  const archive = path.join(temp, "photos.tar");
  let stream;
  if (local) stream = createReadStream(path.resolve(local));
  else {
    if (!/^https:\/\/github\.com\/bhnsadhu\/accord\/releases\/download\/[a-z0-9.-]+\/catalog-photos\.tar$/.test(release.url)) {
      throw new Error("Unexpected catalog download location");
    }
    const response = await fetch(release.url, { signal: AbortSignal.timeout(600_000) });
    if (!response.ok || !response.body) throw new Error(`Catalog download failed: ${response.status}`);
    stream = Readable.fromWeb(response.body);
  }
  const hash = createHash("sha256");
  let bytes = 0;
  const verify = new Transform({ transform(chunk, _encoding, done) {
    bytes += chunk.length;
    if (bytes > release.bytes) return done(new Error("Catalog download exceeds pinned size"));
    hash.update(chunk); done(null, chunk);
  } });
  await pipeline(stream, verify, createWriteStream(archive));
  if (bytes !== release.bytes || hash.digest("hex") !== release.sha256) throw new Error("Catalog checksum mismatch");
  const files = execFileSync("tar", ["-tf", archive], { encoding: "utf8", maxBuffer: 12_000_000 }).trim().split("\n");
  if (files.length !== release.files || files.some(file => !/^(p\d{5}|a[a-f0-9]{12})(-thumb)?\.webp(\.json)?$/.test(file))) {
    throw new Error("Catalog archive contains unexpected paths");
  }
  // Provenance sidecars remain in the release archive, not in the public CDN.
  const photos = files.filter(file => file.endsWith(".webp"));
  if (photos.length !== release.entries * 2) throw new Error("Catalog image count mismatch");
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  execFileSync("tar", ["-xf", archive, "--no-same-owner", "-C", target]);
  if (!local) {
    const sidecars = files.filter(file => file.endsWith(".json"));
    for (let i = 0; i < sidecars.length; i += 200) {
      await Promise.all(sidecars.slice(i, i + 200).map(file => rm(path.join(target, file))));
    }
  }
  console.log(`Restored ${release.entries.toLocaleString("en-US")} bottle photographs and thumbnails.`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
