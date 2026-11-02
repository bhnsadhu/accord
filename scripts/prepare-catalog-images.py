"""Prepare a local, reproducible photo batch from the exact-identity audit.

No network or publication. Originals stay untouched. Two bounded WebP sizes
retain the entire source image, without AI reconstruction or background removal.
"""
import argparse
import hashlib
import io
import json
import pathlib
import tarfile
import zipfile
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parents[1]
REVISION = "9d2db452d8f0d649c4bfb0189a2fcc5282028a3c"
SOURCE = f"https://huggingface.co/datasets/doevent/perfume/tree/{REVISION}"


def prepare(source, audit_dir, out, limit):
    candidates = json.loads((audit_dir / "image-candidates.json").read_text())
    entries = [(pid, e) for pid, e in candidates.items() if e["candidates"]]
    if limit:
        entries = entries[:limit]
    photos = out / "images"
    photos.mkdir(parents=True, exist_ok=True)
    # Zip reads happen on the main thread; image encoders work independently.
    def convert(item):
        pid, entry, raw = item
        candidate = entry["candidates"][0]
        if hashlib.sha256(raw).hexdigest() != candidate["sha256"]:
            raise ValueError(f"Source changed since audit: {pid}")
        with Image.open(io.BytesIO(raw)) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            image.thumbnail((640, 800), Image.Resampling.LANCZOS)
            image.save(photos / f"{pid}.webp", "WEBP", quality=83, method=4)
            width, height = image.size
            image.thumbnail((96, 120), Image.Resampling.LANCZOS)
            image.save(photos / f"{pid}-thumb.webp", "WEBP", quality=78, method=4)
        provenance = {"source": SOURCE, "sourceFile": candidate["file"],
                      "sourceSha256": candidate["sha256"], "sourceRow": candidate["sourceRow"],
                      "brand": entry["brand"], "name": entry["name"],
                      "identity": "exact brand and full edition name",
                      "license": "Dataset declares MIT; underlying photograph permissions undocumented.",
                      "changes": "Resized and WebP encoded. Full photograph retained."}
        provenance["prompt"] = f"Source: {SOURCE}. File: {candidate['file']}. {provenance['license']} {provenance['changes']}"
        for suffix in ("", "-thumb"):
            (photos / f"{pid}{suffix}.webp.json").write_text(json.dumps(provenance, ensure_ascii=False) + "\n")
        return pid, [width, height, entry["name"], entry["brand"], candidate["file"]]

    with zipfile.ZipFile(source / "data/raw/images.zip") as archive:
        inputs = ((pid, e, archive.read("images/" + e["candidates"][0]["file"])) for pid, e in entries)
        index = {}
        # Batches bound memory rather than submitting the entire source archive.
        with ThreadPoolExecutor(max_workers=6) as pool:
            batch = []
            for item in inputs:
                batch.append(item)
                if len(batch) == 150:
                    index.update(pool.map(convert, batch))
                    batch = []
                    if len(index) % 3000 == 0:
                        print(f"Prepared {len(index):,} / {len(entries):,}", flush=True)
            index.update(pool.map(convert, batch))
    (out / "catalog-index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")) + "\n")
    # Tar format is extracted by the build only after a pinned checksum passes.
    target = out / "catalog-photos.tar"
    with tarfile.open(target, "w", format=tarfile.USTAR_FORMAT) as archive:
        for path in sorted(photos.iterdir()):
            info = archive.gettarinfo(path, arcname=path.name)
            info.uid = info.gid = info.mtime = 0
            info.uname = info.gname = ""
            info.mode = 0o644
            with path.open("rb") as content:
                archive.addfile(info, content)
    size = target.stat().st_size
    digest = hashlib.sha256()
    with target.open("rb") as content:
        for chunk in iter(lambda: content.read(1024 * 1024), b""):
            digest.update(chunk)
    manifest = {"status": "local-review", "revision": REVISION, "entries": len(index),
                "files": len(index) * 4, "bytes": size,
                "sha256": digest.hexdigest(),
                "url": None, "source": SOURCE}
    (out / "catalog-release.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(manifest, indent=2), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=pathlib.Path, default=ROOT.parent / "scent-lens")
    parser.add_argument("--audit", type=pathlib.Path, default=ROOT / "output/catalog-expansion")
    parser.add_argument("--out", type=pathlib.Path, default=ROOT / "output/catalog-expansion/prepared")
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()
    prepare(args.source, args.audit, args.out, args.limit)
