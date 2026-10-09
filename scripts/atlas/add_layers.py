#!/usr/bin/env python3
"""Merge additional paper layers into the Atlas files written by build_atlas.py.

Reads public/atlas/points.json + public/atlas/city/<id>.json (GHSL UCDB 2015 ids)
and adds, without estimating or imputing anything:

  heat   Huang et al. 2025, Scientific Reports (doi 10.1038/s41598-025-96045-z)
         SUHI_trends_1000_cities.csv - 2003-2020 trends of the p99 surface urban
         heat island, area-based (A) and population-weighted (P), per GHSL FUA.
         FUA -> urban centre via the GHSL FUA layer's UC_IDs; the value is
         attached to every Atlas urban centre inside that FUA.
  cooling Sun et al. 2026, npj Environmental Social Sciences (doi 10.1038/s44432-026-00009-1)
         city-level difference-in-differences cooling effects from the public
         app repo kangning-huang/urban-renewal-cooling-DID (web/public/data).

Usage:
  python3 -I scripts/atlas/add_layers.py \
      --suhi SUHI_trends_1000_cities.csv --fua GHS_FUA_UCDB2015_GLOBE_R2019A_54009_1K_V1_0.gpkg \
      --cooling-dir urban-renewal-cooling-DID/web/public/data --out public/atlas
Standard library only. Idempotent: re-running replaces these layers.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sqlite3
import unicodedata
from pathlib import Path


def norm(s: str | None) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def name_variants(name: str) -> list[str]:
    out = [name]
    m = re.match(r"^(.*?)\s*\[(.*)\]\s*$", name)
    if m:
        out += [m.group(1), m.group(2)]
    return [norm(x) for x in out if x.strip()]


def load_fua(path: Path) -> list[dict]:
    con = sqlite3.connect(path)
    t = con.execute("select table_name from gpkg_contents").fetchone()[0]
    rows = con.execute(f'select eFUA_ID, eFUA_name, Cntry_ISO, UC_IDs, FUA_p_2015 from "{t}"').fetchall()
    return [
        {"id": int(r[0]), "name": r[1] or "", "iso": r[2] or "",
         "ucs": [int(float(x)) for x in (r[3] or "").split(";") if x.strip()], "pop": r[4] or 0}
        for r in rows
    ]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--suhi", type=Path, required=True)
    ap.add_argument("--fua", type=Path, required=True)
    ap.add_argument("--cooling-dir", type=Path, required=True)
    ap.add_argument("--out", type=Path, default=Path("public/atlas"))
    a = ap.parse_args()

    pts_path = a.out / "points.json"
    pts = json.loads(pts_path.read_text())
    base_fields = ["id", "name", "iso", "lat", "lon", "pop15", "coverage", "massPerCapT", "slug"]
    rows = [r[: len(base_fields)] for r in pts["rows"]]
    atlas = {r[0]: dict(zip(base_fields, r)) for r in rows}

    # ── heat: SUHI trends (FUA) ──────────────────────────────────────
    fuas = load_fua(a.fua)
    by_key: dict[tuple[str, str], list[dict]] = {}
    for f in fuas:
        by_key.setdefault((f["iso"], norm(f["name"])), []).append(f)
    heat: dict[int, dict] = {}
    log = {"heat": {"rows": 0, "fuaExact": 0, "fuaAmbiguous": 0, "fuaUnmatched": [], "noAtlasCentre": 0, "centres": 0}}
    for r in csv.DictReader(open(a.suhi, newline="", encoding="utf-8")):
        log["heat"]["rows"] += 1
        cands = []
        for v in name_variants(r["City"]):
            cands = by_key.get((r["Country_ISO"], v), [])
            if cands:
                break
        if not cands:
            log["heat"]["fuaUnmatched"].append(f'{r["City"]} ({r["Country_ISO"]})')
            continue
        quality = "exact" if len(cands) == 1 else "flagged"
        log["heat"]["fuaExact" if quality == "exact" else "fuaAmbiguous"] += 1
        fua = max(cands, key=lambda f: f["pop"])
        centres = [u for u in fua["ucs"] if u in atlas]
        if not centres:
            log["heat"]["noAtlasCentre"] += 1
            continue
        val = lambda k: round(float(r[k]) * 10, 2)  # °C per decade
        rec = {
            "quality": quality,
            "fua": {"id": fua["id"], "name": r["City"], "centres": len(fua["ucs"])},
            "rank": int(r["Rank"]),
            "climate": r["Climate_zone"],
            "pop2020": int(float(r["Population_2020"])),
            "dayA": val("dSUHI_A_day_degC_per_yr"), "dayP": val("dSUHI_P_day_degC_per_yr"),
            "nightA": val("dSUHI_A_night_degC_per_yr"), "nightP": val("dSUHI_P_night_degC_per_yr"),
        }
        for u in centres:
            if u not in heat or heat[u]["pop2020"] < rec["pop2020"]:
                heat[u] = rec
    log["heat"]["centres"] = len(heat)

    # ── cooling: informal-settlement demolition DID ──────────────────
    cities = json.loads((a.cooling_dir / "cities.json").read_text())
    reg = json.loads((a.cooling_dir / "regression_results.json").read_text())["did_coefficients"]
    cooling: dict[int, dict] = {}
    for cname, info in cities.items():
        eff = reg.get(cname)
        if not eff:
            continue
        cand = [p for p in atlas.values() if p["iso"] == "CHN" and norm(p["name"]) == norm(cname)]
        if not cand:
            continue
        p = max(cand, key=lambda x: x["pop15"])
        cooling[p["id"]] = {
            "quality": "exact",
            # Settlement counts in the app data differ from the paper's sample
            # (77 demolished / 584 controls), so only the effect estimates are kept.
            "effectK": eff["effect"], "ciLo": eff["ci_lower"], "ciHi": eff["ci_upper"],
            "pooledK": reg["all"]["effect"],
        }
    log["cooling"] = {"centres": len(cooling), "cities": sorted(atlas[i]["name"] for i in cooling)}

    # ── write ────────────────────────────────────────────────────────
    fields = base_fields + ["heatDayP", "cool"]
    new_rows = []
    for r in rows:
        uid = r[0]
        h = heat.get(uid)
        new_rows.append(r + [h["dayP"] if h else None, 1 if uid in cooling else 0])
        cp = a.out / "city" / f"{uid}.json"
        d = json.loads(cp.read_text())
        d["layers"].pop("heat", None)
        d["layers"].pop("cooling", None)
        if h:
            d["layers"]["heat"] = h
        if uid in cooling:
            d["layers"]["cooling"] = cooling[uid]
        cp.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")))
    pts["fields"] = fields
    pts["rows"] = new_rows
    pts["version"] = 2
    pts["sources"]["heat"] = {"paper": "10.1038/s41598-025-96045-z", "file": "SUHI_trends_1000_cities.csv",
                              "key": "GHSL FUA (eFUA_name+ISO) -> UC_IDs"}
    pts["sources"]["cooling"] = {"paper": "10.1038/s44432-026-00009-1",
                                 "repo": "kangning-huang/urban-renewal-cooling-DID"}
    pts["counts"]["layers"] = {"mass": sum(1 for r in rows if r[6]), "heat": len(heat), "cooling": len(cooling)}
    pts_path.write_text(json.dumps(pts, ensure_ascii=False, separators=(",", ":")))
    (a.out / "layers-log.json").write_text(json.dumps(log, ensure_ascii=False, indent=1))
    print(json.dumps({k: {kk: (len(vv) if isinstance(vv, list) else vv) for kk, vv in v.items()} for k, v in log.items()}, indent=1))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
