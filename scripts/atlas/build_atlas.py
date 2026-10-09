#!/usr/bin/env python3
"""Build the static data files for the Atlas of Urban Futures (v1).

Joins Ken Huang's research datasets onto one city key -- the GHSL Urban Centre
Database 2015 (R2019A) identifier ``ID_HDC_G0`` -- and writes:

  public/atlas/points.json          one compact row per mapped city
  public/atlas/city/<ID_HDC_G0>.json   per-city detail, fetched on click
  public/atlas/pages.json           the cities that get a static /atlas/<slug> page
  public/atlas/land-110m.json       Natural Earth land outlines (copied from world-atlas)

Nothing here estimates or imputes values. A city either has a matched record in
a source dataset, or it is marked "not covered".

Usage (see docs/atlas/README.md for how to fetch the inputs):

  python3 -I scripts/atlas/build_atlas.py \
      --ucdb-zip /path/GHS_STAT_UCDB2015MT_GLOBE_R2019A_V1_2.zip \
      --city-mass /path/nested-scaling-city-mass \
      --land node_modules/world-atlas/land-110m.json \
      --out public/atlas

Standard library only.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import math
import re
import shutil
import subprocess
import sys
import unicodedata
import zipfile
from pathlib import Path

UCDB_CSV = "GHS_STAT_UCDB2015MT_GLOBE_R2019A/GHS_STAT_UCDB2015MT_GLOBE_R2019A_V1_2.csv"
# The UCDB CSV is DOS code page 850 (e.g. "Uíge" is byte 0xA1); latin-1 garbles it.
UCDB_ENCODING = "cp850"

# UCDB centres without research data are still drawn (grey, "not covered") if at
# least this large, so that absence of data is visible instead of hidden.
UNCOVERED_MIN_POP = 300_000
# Number of covered cities that get a static page.
STATIC_PAGES = 500
# Match-quality thresholds.
EXACT_MAX_KM = 5.0
FLAGGED_MAX_KM = 75.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p = math.radians
    a = (
        math.sin(p(lat2 - lat1) / 2) ** 2
        + math.cos(p(lat1)) * math.cos(p(lat2)) * math.sin(p(lon2 - lon1) / 2) ** 2
    )
    return 2 * 6371.0 * math.asin(math.sqrt(a))


def norm_name(s: str | None) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def fnum(v: str | None) -> float | None:
    try:
        x = float(v)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    return x if math.isfinite(x) else None


def r(x: float | None, nd: int) -> float | None:
    return None if x is None else round(x, nd)


def load_ucdb(zip_path: Path) -> dict[int, dict]:
    with zipfile.ZipFile(zip_path) as z:
        text = z.read(UCDB_CSV).decode(UCDB_ENCODING)
    out: dict[int, dict] = {}
    for row in csv.DictReader(io.StringIO(text, newline="")):
        if not row.get("ID_HDC_G0"):
            continue  # the CSV carries blank padding rows
        uid = int(float(row["ID_HDC_G0"]))
        out[uid] = {
            "id": uid,
            "name": row["UC_NM_MN"].strip(),
            "names": [n.strip() for n in (row.get("UC_NM_LST") or "").split(";") if n.strip()],
            "country": row["CTR_MN_NM"].strip(),
            "iso": row["CTR_MN_ISO"].strip(),
            "region": row["GRGN_L1"].strip(),
            "lat": fnum(row["GCPNT_LAT"]),
            "lon": fnum(row["GCPNT_LON"]),
            "pop15": fnum(row["P15"]),
            "area_km2": fnum(row["AREA"]),
        }
    return out


def git_sha(repo: Path) -> str | None:
    try:
        return subprocess.check_output(["git", "-C", str(repo), "rev-parse", "HEAD"], text=True).strip()
    except Exception:
        return None


def load_city_mass(repo: Path) -> tuple[list[dict], dict, dict[int, dict]]:
    web = repo / "web" / "public" / "webdata"
    rows = json.loads((web / "cities_agg" / "global.json").read_text())
    global_fit = json.loads((web / "regression" / "global_city.json").read_text())
    nbhd: dict[int, dict] = {}
    for f in (web / "regression" / "city_neighborhood").glob("*.json"):
        d = json.loads(f.read_text())
        nbhd[int(d["city_id"])] = d
    return rows, global_fit, nbhd


def match_quality(src: dict, uc: dict | None) -> tuple[str, dict]:
    """Return (quality, details). quality in {"exact", "flagged", "unmatched"}."""
    if uc is None:
        return "unmatched", {"reason": "ID not found in GHSL UCDB 2015"}
    if src.get("country_iso") != uc["iso"]:
        return "unmatched", {"reason": f"country differs ({src.get('country_iso')} vs {uc['iso']})"}
    det: dict = {"sourceName": src.get("city")}
    dist = None
    if src.get("lat") is not None and src.get("lon") is not None and uc["lat"] is not None:
        dist = haversine_km(src["lat"], src["lon"], uc["lat"], uc["lon"])
        det["distanceKm"] = round(dist, 1)
    name_ok = norm_name(src.get("city")) in {norm_name(n) for n in [uc["name"], *uc["names"]]}
    det["nameMatch"] = name_ok
    if dist is not None and dist > FLAGGED_MAX_KM:
        return "unmatched", {**det, "reason": f"centroids {dist:.0f} km apart"}
    if name_ok and dist is not None and dist <= EXACT_MAX_KM:
        return "exact", det
    reasons = []
    if not name_ok:
        reasons.append("source name differs from UCDB name")
    if dist is None:
        reasons.append("source has no coordinates")
    elif dist > EXACT_MAX_KM:
        reasons.append(f"centroids {dist:.0f} km apart")
    return "flagged", {**det, "reason": "; ".join(reasons)}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ucdb-zip", type=Path, required=True)
    ap.add_argument("--city-mass", type=Path, required=True, help="clone of kangning-huang/nested-scaling-city-mass")
    ap.add_argument("--land", type=Path, required=True, help="world-atlas land-110m.json (Natural Earth)")
    ap.add_argument("--out", type=Path, default=Path("public/atlas"))
    args = ap.parse_args()

    ucdb = load_ucdb(args.ucdb_zip)
    mass_rows, global_fit, nbhd = load_city_mass(args.city_mass)
    beta = float(global_fit["slope"])

    # ── Join built-mass records onto UCDB ids ───────────────────────────
    mass_by_id: dict[int, dict] = {}
    crosswalk: list[dict] = []
    counts = {"exact": 0, "flagged": 0, "unmatched": 0}
    for src in mass_rows:
        uid = int(src["city_id"])
        q, det = match_quality(src, ucdb.get(uid))
        counts[q] += 1
        crosswalk.append({"source": "city-mass", "sourceId": uid, "ucdbId": uid if q != "unmatched" else None,
                          "quality": q, **det})
        if q == "unmatched":
            continue
        pop, mass = fnum(src.get("pop_total")), fnum(src.get("mass_total"))
        if not pop or not mass:
            counts[q] -= 1
            counts["unmatched"] += 1
            crosswalk[-1].update(quality="unmatched", ucdbId=None, reason="missing population or mass")
            continue
        lp_c, lm_c = fnum(src.get("log_pop_c")), fnum(src.get("log_mass_c"))
        resid = None if lp_c is None or lm_c is None else lm_c - beta * lp_c
        nb = nbhd.get(uid)
        mass_by_id[uid] = {
            "quality": q,
            "match": det,
            "pop": round(pop),
            "massT": round(mass),
            "massPerCapT": round(mass / pop, 1),
            # Ratio of observed to expected mass on the global city-level scaling
            # line fitted to country-centred logs (app's regression/global_city.json).
            "vsScaling": None if resid is None else round(10 ** resid, 3),
            "neighborhood": None if not nb else {
                "slope": nb["slope"], "lo": nb["slope_lo"], "hi": nb["slope_hi"],
                "n": nb["n"], "r2": nb["r2"],
            },
        }

    # ── Choose mapped cities ────────────────────────────────────────────
    mapped = [
        uc for uid, uc in ucdb.items()
        if uc["lat"] is not None and (uid in mass_by_id or (uc["pop15"] or 0) >= UNCOVERED_MIN_POP)
    ]
    mapped.sort(key=lambda c: -(c["pop15"] or 0))

    # Slugs: name, then name-iso, then name-iso-id on collision.
    used: set[str] = set()
    slug_of: dict[int, str] = {}
    for c in mapped:
        base = slugify(c["name"]) or "city"
        for cand in (base, f"{base}-{c['iso'].lower()}", f"{base}-{c['iso'].lower()}-{c['id']}"):
            if cand not in used:
                used.add(cand)
                slug_of[c["id"]] = cand
                break

    out = args.out
    city_dir = out / "city"
    if city_dir.exists():
        shutil.rmtree(city_dir)
    city_dir.mkdir(parents=True)

    points = []
    for c in mapped:
        m = mass_by_id.get(c["id"])
        cov = 0 if not m else (1 if m["quality"] == "exact" else 2)
        points.append([
            c["id"], c["name"], c["iso"], round(c["lat"], 3), round(c["lon"], 3),
            round(c["pop15"] or 0), cov, m["massPerCapT"] if m else None, slug_of[c["id"]],
        ])
        detail = {
            "id": c["id"], "slug": slug_of[c["id"]], "name": c["name"], "country": c["country"],
            "iso": c["iso"], "region": c["region"], "lat": r(c["lat"], 4), "lon": r(c["lon"], 4),
            "ucdb": {"pop15": r(c["pop15"], 0), "areaKm2": c["area_km2"]},
            "layers": {"mass": m},
        }
        (city_dir / f"{c['id']}.json").write_text(json.dumps(detail, ensure_ascii=False, separators=(",", ":")))

    # Static pages: largest covered cities only (a page must have something real to show).
    pages = [
        {"id": c["id"], "slug": slug_of[c["id"]], "name": c["name"], "country": c["country"]}
        for c in mapped if c["id"] in mass_by_id
    ][:STATIC_PAGES]

    meta = {
        "version": 1,
        "cityKey": "GHSL UCDB 2015 R2019A ID_HDC_G0",
        "sources": {
            "ucdb": "GHS Urban Centre Database 2015 R2019A V1.2 (Florczyk et al. 2019, JRC)",
            "cityMass": {"repo": "kangning-huang/nested-scaling-city-mass", "commit": git_sha(args.city_mass),
                         "globalCitySlope": global_fit},
        },
        "fields": ["id", "name", "iso", "lat", "lon", "pop15", "coverage", "massPerCapT", "slug"],
        "coverageCodes": {"0": "not covered", "1": "exact match", "2": "matched by GHSL ID, flagged"},
        "counts": {"mapped": len(points), "massMatch": counts, "pages": len(pages)},
    }
    (out / "points.json").write_text(json.dumps({**meta, "rows": points}, ensure_ascii=False, separators=(",", ":")))
    (out / "pages.json").write_text(json.dumps(pages, ensure_ascii=False, indent=0))
    (out / "crosswalk.json").write_text(json.dumps(crosswalk, ensure_ascii=False, separators=(",", ":")))
    shutil.copyfile(args.land, out / "land-110m.json")

    print(json.dumps(meta["counts"], indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
