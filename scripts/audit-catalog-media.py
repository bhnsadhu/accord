"""Audit every Accord identity against the local ScentLens image catalog.

Read-only to both catalogs. Writes review artifacts locally, never publishes
images or assigns a license. Full names are matched without removing editions.
Run: python3 scripts/audit-catalog-media.py [--source ../scent-lens]
"""
from __future__ import annotations

import argparse
import collections
import csv
import hashlib
import io
import json
import pathlib
import re
import unicodedata
import zipfile
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]


def identity(brand: str, name: str) -> str:
    # Unlike recognition normalization, concentrations, Intense and years stay.
    text = unicodedata.normalize("NFKD", f"{brand}|{name}").casefold().replace("&", " and ")
    text = "".join(c for c in text if not unicodedata.combining(c))
    # Keep non-Latin names distinct too; ASCII-only folding can merge them.
    return " ".join("".join(c if c.isalnum() or c == "|" else " " for c in text).split())


def audit(source: pathlib.Path, out: pathlib.Path) -> dict:
    products = list(csv.DictReader((source / "artifacts/export/products.csv").open()))
    gallery = list(csv.DictReader((source / "artifacts/catalog/gallery.csv").open()))
    research = json.loads((ROOT / "data/research/fragrances.json").read_text())["entries"]
    products += [{"product_id": e["productId"], "brand": e["brand"], "name": e["name"], **(e.get("catalog") or {})}
                 for e in research if e["productId"].startswith("a")]
    by_identity = collections.defaultdict(list)
    source_groups = collections.defaultdict(set)
    for row in gallery:
        by_identity[identity(row["brand"], row["name"])].append(row)
        source_groups[row["product_id"]].add(row["name"])
    entries, files, conflicts = {}, {}, []
    with zipfile.ZipFile(source / "data/raw/images.zip") as archive:
        for i, product in enumerate(products):
            pid = product["product_id"]
            candidates = by_identity[identity(product["brand"], product["name"])]
            # Require an exact normalized identity, never a fuzzy or line match.
            inspected = []
            for row in candidates:
                name = row["image_name"]
                if name not in files:
                    try:
                        raw = archive.read("images/" + name)
                        with Image.open(io.BytesIO(raw)) as image:
                            image.load()
                            files[name] = {"width": image.width, "height": image.height,
                                           "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw), "ok": True}
                    except (KeyError, OSError, ValueError) as exc:
                        files[name] = {"ok": False, "error": type(exc).__name__}
                info = files[name]
                if info["ok"]:
                    inspected.append({"file": name, "sourceRow": row["row_id"], "sourceProduct": row["product_id"],
                                      "sourceName": row["name"], "sourceBrand": row["brand"], **info})
            inspected.sort(key=lambda x: (-x["width"] * x["height"], x["sourceRow"]))
            entry = {"productId": pid, "brand": product["brand"], "name": product["name"],
                     "status": "exact-source-match" if inspected else "needs-source", "candidates": inspected}
            entries[pid] = entry
            if len(source_groups[pid]) > 1:
                conflicts.append({"productId": pid, "displayName": product["name"],
                                  "recognitionGroupNames": sorted(source_groups[pid]),
                                  "selectedSourceName": inspected[0]["sourceName"] if inspected else None})
            if (i + 1) % 5000 == 0:
                print(f"Audited {i + 1:,} / {len(products):,} identities", flush=True)
    brands = collections.defaultdict(lambda: {"total": 0, "matched": 0})
    for e in entries.values():
        brands[e["brand"]]["total"] += 1
        brands[e["brand"]]["matched"] += e["status"] == "exact-source-match"
    summary = {"catalogEntries": len(entries), "sourceImageRows": len(gallery),
               "matchedEntries": sum(e["status"] == "exact-source-match" for e in entries.values()),
               "unmatchedEntries": [{k: e[k] for k in ("productId", "brand", "name")} for e in entries.values() if not e["candidates"]],
               "decodedImages": sum(f["ok"] for f in files.values()),
               "invalidImages": sum(not f["ok"] for f in files.values()),
               "recognitionGroupsWithMultipleNames": len(conflicts),
               "identityMethod": "Exact brand and full name, retaining concentration, flanker and year.",
               "rights": "Dataset declares MIT. Original photo permissions are not independently documented.",
               "scope": "Source identity and file integrity audit, not visual verification of every bottle label.",
               "brands": dict(sorted(brands.items()))}
    out.mkdir(parents=True, exist_ok=True)
    for filename, data in [("image-candidates.json", entries), ("image-audit.json", summary), ("edition-conflicts.json", conflicts)]:
        (out / filename).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({k: v for k, v in summary.items() if k != "brands"}, indent=2))
    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=pathlib.Path, default=ROOT.parent / "scent-lens")
    parser.add_argument("--out", type=pathlib.Path, default=ROOT / "output/catalog-expansion")
    args = parser.parse_args()
    audit(args.source, args.out)
