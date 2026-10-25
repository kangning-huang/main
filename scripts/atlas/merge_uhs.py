#!/usr/bin/env python3
"""Merge precomputed UHS city stats into Atlas points.json and city/<id>.json.

Input: public/atlas/layers/uhs.json (from build_uhs_citystats.py).
Idempotent. Does not invent values.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--uhs", type=Path, default=Path("public/atlas/layers/uhs.json"))
    ap.add_argument("--out", type=Path, default=Path("public/atlas"))
    args = ap.parse_args()

    uhs = json.loads(args.uhs.read_text())
    cities = uhs["cities"]
    print(f"UHS cities: {len(cities)}")

    points_path = args.out / "points.json"
    pts = json.loads(points_path.read_text())
    fields = list(pts["fields"])
    if "uhs" not in fields:
        fields.append("uhs")
    fi = {f: i for i, f in enumerate(pts["fields"])}
    new_rows = []
    n_set = 0
    for row in pts["rows"]:
        d = {f: row[i] if i < len(row) else None for i, f in enumerate(pts["fields"])}
        uid = str(int(d["id"]))
        if uid in cities and cities[uid].get("p50") is not None:
            d["uhs"] = cities[uid]["p50"]
            n_set += 1
        else:
            d["uhs"] = None
        new_rows.append([d.get(f) for f in fields])
    pts["fields"] = fields
    pts["rows"] = new_rows
    pts.setdefault("counts", {}).setdefault("layers", {})["uhs"] = n_set
    # bump version lightly
    pts["version"] = int(pts.get("version") or 5) + 1 if "uhs" not in pts.get("fields", []) else max(6, int(pts.get("version") or 5))
    # simpler: set version 6
    pts["version"] = 6
    points_path.write_text(json.dumps(pts, separators=(",", ":")))
    print(f"points.json: set uhs on {n_set} rows; fields={fields}")

    n_city = 0
    for uid, rec in cities.items():
        path = args.out / "city" / f"{uid}.json"
        if not path.exists():
            print(f"  missing city json {uid}")
            continue
        detail = json.loads(path.read_text())
        layer = {
            "quality": rec.get("quality") or "exact",
            "p10": rec["p10"],
            "p25": rec["p25"],
            "p50": rec["p50"],
            "p75": rec["p75"],
            "p90": rec["p90"],
            "mean": rec.get("mean"),
            "coverage": rec.get("coverage"),
            "n500": rec.get("n500"),
            "tifName": rec.get("tifName"),
            "match": {
                "sourceName": rec.get("tifName") or "",
                "nameSim": rec.get("nameSim"),
                "method": rec.get("match"),
            },
        }
        detail.setdefault("layers", {})["uhs"] = layer
        path.write_text(json.dumps(detail, separators=(",", ":")))
        n_city += 1
    print(f"city jsons updated: {n_city}")

    log_path = args.out / "layers-log.json"
    log = json.loads(log_path.read_text()) if log_path.exists() else {}
    log["uhs"] = {
        "centres": n_set,
        "mode": "city-stats-500m",
        "paper": uhs["meta"].get("paper"),
        "doi": uhs["meta"].get("doi"),
        "dataUrl": uhs["meta"].get("figshare"),
        "aggregation": uhs["meta"].get("aggregation"),
        "slope_day": uhs["meta"].get("slope_day"),
        "slope_night": uhs["meta"].get("slope_night"),
        "note": "Per-city percentiles of 500 m mean UHS inside UCDB 2015; illustration slope from paper pooled DML.",
    }
    log_path.write_text(json.dumps(log, indent=2) + "\n")
    print("layers-log.json updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
