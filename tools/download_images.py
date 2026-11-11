#!/usr/bin/env python3
"""Save every product photo in the Shopify export into images/ (large) and images/thumb/ (small).

Usage:  python3 tools/download_images.py [path/to/products.csv]
Then re-run tools/build_products.py so the site uses the local copies.
"""
import csv
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "products.csv"
SIZES = {"images": 1200, "images/thumb": 500}


def local_name(url):
    return Path(urlsplit(url).path).name


def fetch(job):
    url, folder, width = job
    dest = ROOT / folder / local_name(url)
    if dest.exists() and dest.stat().st_size > 0:
        return None
    sep = "&" if "?" in url else "?"
    req = urllib.request.Request(f"{url}{sep}width={width}", headers={"User-Agent": "catalogue-image-fetch"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        dest.write_bytes(data)
        return None
    except Exception as e:  # report and carry on with the rest
        return f"{url} ({width}px): {e}"


def main():
    with open(SRC, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    urls = sorted({r[k].strip() for r in rows for k in ("Image Src", "Variant Image") if r.get(k, "").strip()})
    names = [local_name(u) for u in urls]
    assert len(set(names)) == len(names), "two photos share a file name"
    for folder in SIZES:
        (ROOT / folder).mkdir(parents=True, exist_ok=True)
    jobs = [(u, folder, w) for u in urls for folder, w in SIZES.items()]
    with ThreadPoolExecutor(8) as pool:
        errors = [e for e in pool.map(fetch, jobs) if e]
    print(f"{len(urls)} photos, {len(jobs) - len(errors)} files OK, {len(errors)} failed")
    for e in errors:
        print("  FAILED", e)


if __name__ == "__main__":
    main()
