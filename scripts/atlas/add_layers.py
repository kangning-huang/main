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
  flood  Liang, Hilaly, Gao, Guan, Li, Huang 2026, Scientific Reports
         (doi 10.1038/s41598-026-70981-w)
         WSF3D_*_FloodRisk_NEW_FINAL regional CSVs (~614 FUA rows with UC_IDs).
         Height-aware building damage share with/without FLOPROS protection,
         attached to every Atlas urban centre listed in UC_IDs.

Usage:
  python3 -I scripts/atlas/add_layers.py \
      --suhi SUHI_trends_1000_cities.csv --fua GHS_FUA_....gpkg \
      --cooling-dir urban-renewal-cooling-DID/web/public/data \
      --flood-dir /path/to/flood/csvs \
      --out public/atlas
Standard library only. Idempotent: re-running replaces these layers.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sqlite3
import unicodedata
from collections import defaultdict
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


def _fnum(row: dict, key: str) -> float | None:
    v = row.get(key)
    if v is None or v == "":
        return None
    try:
        return float(v)
    except ValueError:
        return None


def load_flood(flood_dir: Path) -> tuple[dict[int, dict], dict]:
    """Return {ucdb_id: flood_rec} and a join log.

    Card fields (derived only from published CSV columns, never invented):
      dmgPct      exDmg_mean * 100 — height-aware building damage share (%)
      dmgProtPct  exDmg_pros_mean * 100 — same with FLOPROS protection (%)
      protYears   flopros_merge_mean — modelled protection return period (years)
      heightM     height_mean — mean building height in the FUA (m)
    Skipped: counts/sums/stdDevs, exDep_*, exInunD_* (depth-only), flopros_model_*,
    .geo — intermediates / alternate metrics not needed for the card.
    """
    # Deduplicate identical regional exports by eFUA_ID (first wins; values match).
    fuas: dict[str, dict] = {}
    n_rows = 0
    n_skip_dmg = 0
    for path in sorted(flood_dir.glob("*.csv")):
        with open(path, newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                n_rows += 1
                eid = row.get("eFUA_ID") or ""
                if not eid or eid in fuas:
                    continue
                if _fnum(row, "exDmg_mean") is None:
                    n_skip_dmg += 1
                    continue
                fuas[eid] = row

    # UC -> candidate FUA rows (a centre can sit in several overlapping FUAs).
    by_uc: dict[int, list[dict]] = defaultdict(list)
    for row in fuas.values():
        for part in (row.get("UC_IDs") or "").split(";"):
            part = part.strip()
            if not part:
                continue
            by_uc[int(float(part))].append(row)

    return by_uc, {
        "rows": n_rows,
        "uniqueFua": len(fuas),
        "skippedNoDmg": n_skip_dmg,
        "uniqueUcIds": len(by_uc),
    }


def pick_flood(candidates: list[dict]) -> tuple[dict, str]:
    """Largest FUA by 2015 population; flag when several FUAs list the same UC."""
    best = max(candidates, key=lambda r: _fnum(r, "FUA_p_2015") or 0.0)
    # Distinct damage values → genuinely different FUAs, not duplicate exports.
    keys = {
        (
            round(_fnum(r, "exDmg_mean") or 0.0, 6),
            round(_fnum(r, "exDmg_pros_mean") or -1.0, 6),
            r.get("eFUA_ID"),
        )
        for r in candidates
    }
    quality = "exact" if len(keys) == 1 else "flagged"
    return best, quality


def flood_rec(row: dict, quality: str, n_ucs: int) -> dict:
    dmg = _fnum(row, "exDmg_mean")
    assert dmg is not None
    pros = _fnum(row, "exDmg_pros_mean")
    prot = _fnum(row, "flopros_merge_mean")
    height = _fnum(row, "height_mean")
    rec: dict = {
        "quality": quality,
        "fua": {
            "id": int(float(row["eFUA_ID"])),
            "name": row.get("eFUA_name") or "",
            "centres": n_ucs,
        },
        "dmgPct": round(dmg * 100, 2),
    }
    if pros is not None:
        rec["dmgProtPct"] = round(pros * 100, 2)
    if prot is not None:
        rec["protYears"] = int(round(prot))
    if height is not None:
        rec["heightM"] = round(height, 1)
    return rec


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--suhi", type=Path, required=True)
    ap.add_argument("--fua", type=Path, required=True)
    ap.add_argument("--cooling-dir", type=Path, required=True)
    ap.add_argument("--flood-dir", type=Path, required=True)
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
    log: dict = {"heat": {"rows": 0, "fuaExact": 0, "fuaAmbiguous": 0, "fuaUnmatched": [], "noAtlasCentre": 0, "centres": 0}}
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

    # ── flood: height-aware + protection-informed (Sci Rep 2026) ─────
    by_uc, flood_scan = load_flood(a.flood_dir)
    flood: dict[int, dict] = {}
    log["flood"] = {
        **flood_scan,
        "centres": 0,
        "exact": 0,
        "flagged": 0,
        "ucNotInAtlas": 0,
        "examples": {},
    }
    for uid, cands in by_uc.items():
        if uid not in atlas:
            log["flood"]["ucNotInAtlas"] += 1
            continue
        row, quality = pick_flood(cands)
        n_ucs = len([x for x in (row.get("UC_IDs") or "").split(";") if x.strip()])
        flood[uid] = flood_rec(row, quality, n_ucs)
        log["flood"]["exact" if quality == "exact" else "flagged"] += 1
    log["flood"]["centres"] = len(flood)
    for name in ("Shanghai", "Beijing", "New York", "Jakarta", "Wuhan"):
        hits = [uid for uid, p in atlas.items() if p["name"] == name]
        if not hits:
            log["flood"]["examples"][name] = None
            continue
        uid = max(hits, key=lambda i: atlas[i]["pop15"])
        log["flood"]["examples"][name] = flood.get(uid)

    # ── write ────────────────────────────────────────────────────────
    fields = base_fields + ["heatDayP", "cool", "flood"]
    new_rows = []
    for r in rows:
        uid = r[0]
        h = heat.get(uid)
        f = flood.get(uid)
        new_rows.append(
            r
            + [
                h["dayP"] if h else None,
                1 if uid in cooling else 0,
                1 if f else 0,
            ]
        )
        cp = a.out / "city" / f"{uid}.json"
        d = json.loads(cp.read_text())
        d["layers"].pop("heat", None)
        d["layers"].pop("cooling", None)
        d["layers"].pop("flood", None)
        if h:
            d["layers"]["heat"] = h
        if uid in cooling:
            d["layers"]["cooling"] = cooling[uid]
        if f:
            d["layers"]["flood"] = f
        cp.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")))
    pts["fields"] = fields
    pts["rows"] = new_rows
    pts["version"] = 3
    pts["sources"]["heat"] = {
        "paper": "10.1038/s41598-025-96045-z",
        "file": "SUHI_trends_1000_cities.csv",
        "key": "GHSL FUA (eFUA_name+ISO) -> UC_IDs",
    }
    pts["sources"]["cooling"] = {
        "paper": "10.1038/s44432-026-00009-1",
        "repo": "kangning-huang/urban-renewal-cooling-DID",
    }
    pts["sources"]["flood"] = {
        "paper": "10.1038/s41598-026-70981-w",
        "files": "WSF3D_*_FloodRisk_NEW_FINAL regional CSVs",
        "key": "UC_IDs -> GHSL UCDB ID_HDC_G0 (exact)",
        "fields": ["exDmg_mean", "exDmg_pros_mean", "flopros_merge_mean", "height_mean"],
    }
    pts["counts"]["layers"] = {
        "mass": sum(1 for r in rows if r[6]),
        "heat": len(heat),
        "cooling": len(cooling),
        "flood": len(flood),
    }
    pts_path.write_text(json.dumps(pts, ensure_ascii=False, separators=(",", ":")))
    (a.out / "layers-log.json").write_text(json.dumps(log, ensure_ascii=False, indent=1))
    summary = {
        k: {
            kk: (len(vv) if isinstance(vv, list) else vv)
            for kk, vv in v.items()
        }
        for k, v in log.items()
    }
    print(json.dumps(summary, indent=1))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
