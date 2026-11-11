#!/usr/bin/env python3
"""Write stock-sheet.csv: a starter stock sheet to import into Google Sheets.

One row per item option. In Google Sheets you edit Price, Quantity and Available;
leave the ID column alone — the website uses it to match rows to products.
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
text = (ROOT / "data" / "products.js").read_text(encoding="utf-8")
products = json.loads(text[text.index("["):text.rindex(";")])

out = ROOT / "stock-sheet.csv"
with open(out, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["ID", "Category", "Product", "Option", "Price", "Quantity", "Available", "Featured"])
    n = 0
    for p in sorted(products, key=lambda p: (p["type"], p["title"].lower())):
        for v in p["variants"]:
            price = int(v["price"]) if v["price"] == int(v["price"]) else v["price"]
            w.writerow([v["id"], p["type"], p["title"], " / ".join(v["o"]), price, "", "yes", ""])
            n += 1
print(f"Wrote {n} rows to {out}")
