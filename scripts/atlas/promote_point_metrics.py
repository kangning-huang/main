#!/usr/bin/env python3
"""Promote continuous city-layer metrics onto public/atlas/points.json.

Replaces coverage flags (1/0) and placeholder mass/heat flags with real
city/<id>.json values so the Atlas map can choropleth each study filter.

Field renames (honest continuous metrics):
  cool       → coolK          (layers.cooling.effectK, K)
  flood      → floodDmg       (layers.flood.dmgPct, %)
  expansion  → expansionSsp5  (layers.expansion.ssp5Km2, km²)
  jgr        → jgrNight       (layers.jgr.dNightC, °C)

Unchanged names, now continuous:
  massPerCapT  from layers.mass.massPerCapT (was flag 1)
  heatDayP     from layers.heat.dayP        (was flag 1)
  uhs          kept as-is

Idempotent. Does not modify city/*.json.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

# New points.json field order (replaces cool/flood/expansion/jgr).
NEW_FIELDS = [
    "id",
    "name",
    "iso",
    "lat",
    "lon",
    "pop15",
    "coverage",
    "massPerCapT",
    "slug",
    "heatDayP",
    "coolK",
    "floodDmg",
    "expansionSsp5",
    "jgrNight",
    "uhs",
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=Path("public/atlas"))
    args = ap.parse_args()

    points_path = args.out / "points.json"
    city_dir = args.out / "city"
    pts = json.loads(points_path.read_text())
    old_fields = list(pts["fields"])
    fi = {f: i for i, f in enumerate(old_fields)}

    # Prefer reading uhs from existing points row if present; else city JSON.
    layer_counts = {
        "mass": 0,
        "heat": 0,
        "cooling": 0,
        "flood": 0,
        "expansion": 0,
        "jgr": 0,
        "uhs": 0,
    }

    new_rows: list[list] = []
    for row in pts["rows"]:
        def get(name: str):
            i = fi.get(name)
            if i is None or i >= len(row):
                return None
            return row[i]

        uid = int(get("id"))
        city_path = city_dir / f"{uid}.json"
        layers = {}
        if city_path.exists():
            detail = json.loads(city_path.read_text())
            layers = detail.get("layers") or {}

        mass = layers.get("mass") or {}
        heat = layers.get("heat") or {}
        cooling = layers.get("cooling") or {}
        flood = layers.get("flood") or {}
        expansion = layers.get("expansion") or {}
        jgr = layers.get("jgr") or {}
        uhs_layer = layers.get("uhs") or {}

        mass_v = mass.get("massPerCapT")
        heat_v = heat.get("dayP")
        cool_v = cooling.get("effectK")
        flood_v = flood.get("dmgPct")
        exp_v = expansion.get("ssp5Km2")
        jgr_v = jgr.get("dNightC")
        # Prefer existing points uhs (already median p50); fall back to city layer.
        uhs_v = get("uhs")
        if uhs_v is None or uhs_v == "":
            uhs_v = uhs_layer.get("p50")
        if uhs_v == "":
            uhs_v = None

        def num(v):
            if v is None or v == "":
                return None
            try:
                return float(v)
            except (TypeError, ValueError):
                return None

        mass_v = num(mass_v)
        heat_v = num(heat_v)
        cool_v = num(cool_v)
        flood_v = num(flood_v)
        exp_v = num(exp_v)
        jgr_v = num(jgr_v)
        uhs_v = num(uhs_v)

        if mass_v is not None:
            layer_counts["mass"] += 1
        if heat_v is not None:
            layer_counts["heat"] += 1
        if cool_v is not None:
            layer_counts["cooling"] += 1
        if flood_v is not None:
            layer_counts["flood"] += 1
        if exp_v is not None:
            layer_counts["expansion"] += 1
        if jgr_v is not None:
            layer_counts["jgr"] += 1
        if uhs_v is not None:
            layer_counts["uhs"] += 1

        d = {
            "id": get("id"),
            "name": get("name"),
            "iso": get("iso"),
            "lat": get("lat"),
            "lon": get("lon"),
            "pop15": get("pop15"),
            "coverage": get("coverage"),
            "massPerCapT": mass_v,
            "slug": get("slug"),
            "heatDayP": heat_v,
            "coolK": cool_v,
            "floodDmg": flood_v,
            "expansionSsp5": exp_v,
            "jgrNight": jgr_v,
            "uhs": uhs_v,
        }
        new_rows.append([d[f] for f in NEW_FIELDS])

    pts["fields"] = NEW_FIELDS
    pts["rows"] = new_rows
    pts.setdefault("counts", {})["layers"] = layer_counts
    pts["version"] = max(7, int(pts.get("version") or 6) + 1)

    points_path.write_text(json.dumps(pts, separators=(",", ":")))
    print(f"Wrote {points_path}")
    print(f"fields={NEW_FIELDS}")
    print(f"layer counts: {layer_counts}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
