#!/usr/bin/env python3
"""Build Cooler Cities / UHS city stats for the Atlas.

Paper (Zhang et al., PNAS 2026, doi:10.1073/pnas.2617717123):
  "We derive the UHS indices based on 10-meter grids and aggregate them for
   232,874 spatial units at the 500-meter spatial resolution"
  "All analyses are based on a spatial unit at the 500 m spatial resolution.
   The used datasets … are aggregated into 500 m … by upsampling or downsampling."

Atlas rule: block-reduce each 10 m GeoTIFF to 500 m mean of valid UHS pixels,
then compute city percentiles on those 500 m cell means inside the GHSL UCDB
2015 polygon (ID_HDC_G0). Ship 500 m stats only.

Valid UHS: finite and > 0. TIFFs have nodata=None and often a large share of
exact zeros outside homogeneous clusters (e.g. Brisbane ~60% zeros); treating
0 as fill avoids pulling medians to zero. True boundary pixels with UHS=0 are
rare and omitted.
"""
from __future__ import annotations

import csv
import json
import math
import re
import sys
import unicodedata
import zipfile
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path

import geopandas as gpd
import numpy as np
import rasterio
from rasterio.features import geometry_mask
from rasterio.warp import transform as rio_transform
from rasterio.windows import from_bounds as window_from_bounds
from shapely.geometry import mapping, shape
from shapely.ops import transform as shapely_transform

ZIP = Path("/Users/kh3657/Downloads/uhs-figshare/UHS_All_Continents.zip")
UCDB = Path("/Users/kh3657/atlas-uhs-brainstorm/data/GHS_UCDB2015.gpkg")
S4 = Path("/Users/kh3657/atlas-uhs-brainstorm/data/s4_cities.json")
POINTS = Path("/Users/kh3657/atlas-uhs-brainstorm/data/atlas_points_slim.json")
OUT = Path("/Users/kh3657/atlas-uhs-brainstorm/out")
TARGET_M = 500.0
MIN_FRAC_IN_BLOCK = 0.02  # keep 500 m cell if ≥2% of 10 m pixels are valid

# Hand overrides when PIP+name fail (UCDB naming quirks).
# SanDiego raster → UCDB 21 “Tijuana” (GHSL San Diego–Tijuana binational centre).
FORCED_UCDB = {"SanDiego": 21, "San_Diego": 21}



def norm_name(s: str | None) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "", s.lower())


# TIFF stem -> preferred display / S4 name
ALIASES = {
    "Hong_Kong": "Hong Kong",
    "Xian": "Xi'an",
    "Xi_an": "Xi'an",
    "Rio_de_Janeiro": "Rio de Janeiro",
    "Sao_Paulo": "Sao Paulo",
    "Ho_Chi_Minh": "Ho Chi Minh",
    "Ho_Chi_Minh_City": "Ho Chi Minh City",
    "New_York": "New York",
    "Los_Angeles": "Los Angeles",
    "San_Antonio": "San Antonio",
    "San_Diego": "San Diego",
    "SanDiego": "San Diego",
    "Cape_Town": "Cape Town",
    "Mexico_City": "Mexico City",
    "Buenos_Aires": "Buenos Aires",
    "Abu_Dhabi": "Abu Dhabi",
    "Kuala_Lumpur": "Kuala Lumpur",
    "St_Petersburg": "St Petersburg",
}


def display_name(stem: str) -> str:
    if stem in ALIASES:
        return ALIASES[stem]
    return stem.replace("_", " ")


def list_tiffs(zpath: Path) -> list[dict]:
    out = []
    with zipfile.ZipFile(zpath) as z:
        for n in z.namelist():
            if not n.lower().endswith(".tif"):
                continue
            base = n.split("/")[-1]
            if not base.startswith("DIST_MERGED_") or not base.endswith(".tif"):
                continue
            stem = base[len("DIST_MERGED_") : -4]
            continent = n.split("/")[1] if n.count("/") >= 2 else "?"
            out.append({"stem": stem, "path": n, "continent": continent, "name": display_name(stem)})
    out.sort(key=lambda r: r["name"].lower())
    return out


def load_ucdb(path: Path) -> gpd.GeoDataFrame:
    gdf = gpd.read_file(path)
    # normalize id column
    id_col = "ID_HDC_G0" if "ID_HDC_G0" in gdf.columns else None
    if id_col is None:
        for c in gdf.columns:
            if "HDC" in c.upper() or c.upper().endswith("ID"):
                print("candidate id", c)
        raise SystemExit(f"no ID_HDC_G0 in {list(gdf.columns)}")
    name_col = "UC_NM_MN" if "UC_NM_MN" in gdf.columns else None
    gdf = gdf[[id_col, name_col, "geometry"]].copy()
    gdf["ucdb_id"] = gdf[id_col].astype(int)
    gdf["ucdb_name"] = gdf[name_col].astype(str)
    gdf["norm"] = gdf["ucdb_name"].map(norm_name)
    if gdf.crs is None:
        gdf = gdf.set_crs("EPSG:4326")
    else:
        gdf = gdf.to_crs("EPSG:4326")
    return gdf


def footprint_centroid_lonlat(ds) -> tuple[float, float]:
    """Centroid of valid (UHS>0) pixels in lon/lat; fallback to bbox center."""
    # Sample sparsely for speed on large rasters
    h, w = ds.height, ds.width
    row_step = max(1, h // 200)
    col_step = max(1, w // 200)
    data = ds.read(1, out_shape=(max(1, h // row_step), max(1, w // col_step)), resampling=rasterio.enums.Resampling.nearest)
    # Approximate geotransform for out_shape
    # Better: use indexes of valid in full read if small, else windowed
    if h * w <= 8_000_000:
        arr = ds.read(1)
        rows, cols = np.where(np.isfinite(arr) & (arr > 0))
        if len(rows) == 0:
            cx = (ds.bounds.left + ds.bounds.right) / 2
            cy = (ds.bounds.bottom + ds.bounds.top) / 2
        else:
            # subsample
            if len(rows) > 50_000:
                idx = np.linspace(0, len(rows) - 1, 50_000).astype(int)
                rows, cols = rows[idx], cols[idx]
            xs, ys = rasterio.transform.xy(ds.transform, rows, cols)
            cx = float(np.mean(xs))
            cy = float(np.mean(ys))
    else:
        arr = data
        # map out_shape pixels back roughly via bounds
        ys = np.linspace(ds.bounds.top, ds.bounds.bottom, arr.shape[0], endpoint=False)
        xs = np.linspace(ds.bounds.left, ds.bounds.right, arr.shape[1], endpoint=False)
        yy, xx = np.meshgrid(ys, xs, indexing="ij")
        m = np.isfinite(arr) & (arr > 0)
        if not m.any():
            cx = (ds.bounds.left + ds.bounds.right) / 2
            cy = (ds.bounds.bottom + ds.bounds.top) / 2
        else:
            cx = float(xx[m].mean())
            cy = float(yy[m].mean())
    lons, lats = rio_transform(ds.crs, "EPSG:4326", [cx], [cy])
    return float(lons[0]), float(lats[0])


def name_sim(a: str, b: str) -> float:
    return SequenceMatcher(None, norm_name(a), norm_name(b)).ratio()


def match_city(tif: dict, lon: float, lat: float, ucdb: gpd.GeoDataFrame, points: list[dict]) -> dict:
    """Spatial PIP first; name as check. Prefer atlas points that are inside same polygon."""
    from shapely.geometry import Point

    pt = Point(lon, lat)
    hits = ucdb[ucdb.contains(pt)]
    best = None
    if len(hits) == 1:
        row = hits.iloc[0]
        best = {
            "ucdb_id": int(row.ucdb_id),
            "ucdb_name": row.ucdb_name,
            "match": "pip",
            "name_sim": name_sim(tif["name"], row.ucdb_name),
        }
    elif len(hits) > 1:
        # pick best name similarity among PIP hits
        scored = [(name_sim(tif["name"], r.ucdb_name), r) for _, r in hits.iterrows()]
        scored.sort(key=lambda x: -x[0])
        sim, row = scored[0]
        best = {
            "ucdb_id": int(row.ucdb_id),
            "ucdb_name": row.ucdb_name,
            "match": "pip_multi",
            "name_sim": sim,
        }
    else:
        # nearest UCDB centroid among name-similar atlas points / UCDB
        # try name match against atlas points first (already UCDB ids)
        scored = []
        for p in points:
            sim = name_sim(tif["name"], p["name"])
            if sim < 0.75:
                continue
            dlat = float(p["lat"]) - lat
            dlon = float(p["lon"]) - lon
            dist2 = dlat * dlat + dlon * dlon
            scored.append((sim, -dist2, p))
        scored.sort(reverse=True)
        if scored:
            sim, _, p = scored[0]
            best = {
                "ucdb_id": int(p["id"]),
                "ucdb_name": p["name"],
                "match": "name_near",
                "name_sim": sim,
            }
        else:
            # nearest UCDB polygon by distance to centroid
            ucdb_c = ucdb.copy()
            ucdb_c["dist"] = ucdb_c.geometry.centroid.distance(pt)
            row = ucdb_c.nsmallest(1, "dist").iloc[0]
            best = {
                "ucdb_id": int(row.ucdb_id),
                "ucdb_name": row.ucdb_name,
                "match": "nearest",
                "name_sim": name_sim(tif["name"], row.ucdb_name),
            }
    best["tif_name"] = tif["name"]
    best["tif_stem"] = tif["stem"]
    best["continent"] = tif["continent"]
    best["lon"] = lon
    best["lat"] = lat
    return best


def block_reduce_mean(arr: np.ndarray, factor: int, min_frac: float) -> np.ndarray:
    """Mean of valid (>0 finite) pixels in factor×factor blocks. Invalid blocks -> nan."""
    h, w = arr.shape
    nh, nw = h // factor, w // factor
    if nh == 0 or nw == 0:
        return np.full((0, 0), np.nan, dtype=np.float64)
    cropped = arr[: nh * factor, : nw * factor]
    valid = np.isfinite(cropped) & (cropped > 0)
    cropped = np.where(valid, cropped, 0.0).astype(np.float64)
    counts = valid.reshape(nh, factor, nw, factor).sum(axis=(1, 3))
    sums = cropped.reshape(nh, factor, nw, factor).sum(axis=(1, 3))
    out = np.full((nh, nw), np.nan, dtype=np.float64)
    need = min_frac * factor * factor
    ok = counts >= need
    out[ok] = sums[ok] / counts[ok]
    return out


def zonal_stats_500(ds, geom_ll, factor: int) -> dict:
    """Compute 500 m mean UHS percentiles inside UCDB polygon (lon/lat geom)."""
    # Reproject geom to raster CRS
    from pyproj import Transformer
    from shapely.ops import transform as shp_transform

    transformer = Transformer.from_crs("EPSG:4326", ds.crs, always_xy=True)
    geom_r = shp_transform(lambda x, y: transformer.transform(x, y), geom_ll)

    # Window to geom bounds intersect raster
    minx, miny, maxx, maxy = geom_r.bounds
    win = window_from_bounds(minx, miny, maxx, maxy, transform=ds.transform)
    win = win.intersection(rasterio.windows.Window(0, 0, ds.width, ds.height))
    if win.width < 1 or win.height < 1:
        return {"n500": 0, "error": "no_overlap"}

    # Round window to factor alignment relative to full raster
    row_off = int(win.row_off)
    col_off = int(win.col_off)
    # expand to include full blocks
    row_off_a = (row_off // factor) * factor
    col_off_a = (col_off // factor) * factor
    row_end = int(math.ceil((win.row_off + win.height) / factor) * factor)
    col_end = int(math.ceil((win.col_off + win.width) / factor) * factor)
    row_end = min(row_end, ds.height)
    col_end = min(col_end, ds.width)
    # trim to multiple of factor
    h = ((row_end - row_off_a) // factor) * factor
    w = ((col_end - col_off_a) // factor) * factor
    if h < factor or w < factor:
        return {"n500": 0, "error": "window_too_small"}

    win2 = rasterio.windows.Window(col_off_a, row_off_a, w, h)
    arr = ds.read(1, window=win2)
    transform = ds.window_transform(win2)

    # Mask: True where OUTSIDE geom (geometry_mask invert=False default)
    mask_out = geometry_mask([mapping(geom_r)], out_shape=arr.shape, transform=transform, invert=False)
    arr = arr.astype(np.float64)
    arr[mask_out] = np.nan

    # Coverage: valid UHS area / UCDB area (approx via pixel counts at 10 m)
    px_area = abs(ds.transform.a * ds.transform.e)  # m^2
    n_valid_10 = int(np.sum(np.isfinite(arr) & (arr > 0)))
    try:
        ucdb_area = float(geom_r.area)  # in projected CRS m^2
    except Exception:
        ucdb_area = float("nan")
    coverage = (n_valid_10 * px_area / ucdb_area) if ucdb_area and ucdb_area > 0 else float("nan")

    reduced = block_reduce_mean(arr, factor, MIN_FRAC_IN_BLOCK)
    vals = reduced[np.isfinite(reduced)]
    if vals.size == 0:
        return {
            "n500": 0,
            "n10_valid": n_valid_10,
            "coverage": round(coverage, 4) if math.isfinite(coverage) else None,
            "error": "no_valid_500",
        }

    pcts = np.percentile(vals, [10, 25, 50, 75, 90])
    return {
        "n500": int(vals.size),
        "n10_valid": n_valid_10,
        "coverage": round(float(coverage), 4) if math.isfinite(coverage) else None,
        "mean": round(float(vals.mean()), 1),
        "p10": round(float(pcts[0]), 1),
        "p25": round(float(pcts[1]), 1),
        "p50": round(float(pcts[2]), 1),
        "p75": round(float(pcts[3]), 1),
        "p90": round(float(pcts[4]), 1),
        "max": round(float(vals.max()), 1),
        "pixel_m": round(float(abs(ds.transform.a)), 3),
        "factor": factor,
    }


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    s4 = json.loads(S4.read_text())
    s4_names = [n for names in s4.values() for n in names]
    points = json.loads(POINTS.read_text())
    print("loading UCDB…", flush=True)
    ucdb = load_ucdb(UCDB)
    print(f"UCDB polygons: {len(ucdb)}", flush=True)

    tiffs = list_tiffs(ZIP)
    print(f"TIFFs: {len(tiffs)}", flush=True)
    assert len(tiffs) == 101

    inventory = []
    crosswalk = []
    cities = {}
    errors = []

    for i, tif in enumerate(tiffs, 1):
        vsi = f"/vsizip/{ZIP}/{tif['path']}"
        print(f"[{i:03d}/101] {tif['name']} ({tif['continent']})", flush=True)
        try:
            with rasterio.open(vsi) as ds:
                px = abs(ds.transform.a)
                factor = max(1, int(round(TARGET_M / px)))
                inv = {
                    "stem": tif["stem"],
                    "name": tif["name"],
                    "continent": tif["continent"],
                    "path": tif["path"],
                    "crs": str(ds.crs),
                    "width": ds.width,
                    "height": ds.height,
                    "dtype": ds.dtypes[0],
                    "nodata": ds.nodata,
                    "pixel_m": px,
                    "factor_500": factor,
                }
                lon, lat = footprint_centroid_lonlat(ds)
                inv["centroid_lon"] = lon
                inv["centroid_lat"] = lat
                inventory.append(inv)

                m = match_city(tif, lon, lat, ucdb, points)
                crosswalk.append(m)

                geom_row = ucdb[ucdb.ucdb_id == m["ucdb_id"]]
                if geom_row.empty:
                    errors.append({**m, "error": "ucdb_id_missing"})
                    continue
                geom = geom_row.iloc[0].geometry
                stats = zonal_stats_500(ds, geom, factor)
                rec = {
                    **m,
                    **stats,
                    "quality": (
                        "exact"
                        if m["match"].startswith("pip") and m["name_sim"] >= 0.8
                        else "flagged"
                        if m["name_sim"] >= 0.6
                        else "review"
                    ),
                }
                cities[str(m["ucdb_id"])] = rec
                print(
                    f"    -> UCDB {m['ucdb_id']} {m['ucdb_name']} sim={m['name_sim']:.2f} "
                    f"p50={rec.get('p50')} n500={rec.get('n500')} cov={rec.get('coverage')}",
                    flush=True,
                )
        except Exception as e:
            errors.append({"tif": tif["name"], "error": repr(e)})
            print(f"    ERROR {e!r}", flush=True)

    # Uniqueness gate
    ids = [int(k) for k in cities]
    id_counts = Counter(ids)
    dupes = [i for i, c in id_counts.items() if c > 1]
    unmatched_s4 = []
    matched_norms = {norm_name(v.get("tif_name", "")) for v in cities.values()}
    matched_norms |= {norm_name(v.get("ucdb_name", "")) for v in cities.values()}
    for n in s4_names:
        if norm_name(n) not in matched_norms and not any(
            name_sim(n, v.get("tif_name", "")) >= 0.85 or name_sim(n, v.get("ucdb_name", "")) >= 0.85
            for v in cities.values()
        ):
            unmatched_s4.append(n)

    meta = {
        "doi": "10.1073/pnas.2617717123",
        "doiUrl": "https://doi.org/10.1073/pnas.2617717123",
        "figshare": "https://figshare.com/articles/dataset/UHS_for_all_101_cities/33027635",
        "paper": "Zhang et al., Toward Cooler Cities by Larger Homogeneous Functional Clusters, PNAS 2026",
        "authors": "Zhang et al.",
        "slope_day_per_100m": -0.156,
        "slope_night_per_100m": -0.085,
        "aggregation": (
            "10 m UHS GeoTIFF block-reduced to 500 m mean of valid (UHS>0) pixels "
            f"(factor≈{TARGET_M}/pixel_size), then city percentiles on 500 m cell means "
            "inside GHSL UCDB 2015 polygon. Matches paper analysis unit (N≈233k at 500 m)."
        ),
        "valid_pixel_rule": "finite and UHS > 0 (zeros treated as outside-cluster fill)",
        "n_cities": len(cities),
        "n_unique_ucdb": len(id_counts),
        "duplicate_ucdb_ids": dupes,
        "unmatched_s4_names": unmatched_s4,
        "errors": errors,
    }

    # Emit uhs.json (Atlas shape)
    uhs_json = {
        "meta": {
            "doi": meta["doi"],
            "doiUrl": meta["doiUrl"],
            "figshare": meta["figshare"],
            "paper": meta["paper"],
            "authors": meta["authors"],
            "slope_day": -0.156,
            "slope_night": -0.085,
            "per_m": 100,
            "aggregation": meta["aggregation"],
            "cityKey": "ID_HDC_G0",
            "n": len(cities),
        },
        "cities": {},
    }
    for uid, rec in cities.items():
        uhs_json["cities"][uid] = {
            "p10": rec.get("p10"),
            "p25": rec.get("p25"),
            "p50": rec.get("p50"),
            "p75": rec.get("p75"),
            "p90": rec.get("p90"),
            "mean": rec.get("mean"),
            "max": rec.get("max"),
            "coverage": rec.get("coverage"),
            "n500": rec.get("n500"),
            "tifName": rec.get("tif_name"),
            "ucdbName": rec.get("ucdb_name"),
            "quality": rec.get("quality"),
            "nameSim": round(float(rec.get("name_sim", 0)), 3),
            "match": rec.get("match"),
        }

    (OUT / "uhs.json").write_text(json.dumps(uhs_json, indent=2))
    (OUT / "uhs_meta_qa.json").write_text(json.dumps(meta, indent=2))

    # Crosswalk CSV
    with open(OUT / "uhs_crosswalk.csv", "w", newline="") as fh:
        fields = [
            "tif_stem",
            "tif_name",
            "continent",
            "ucdb_id",
            "ucdb_name",
            "match",
            "name_sim",
            "lon",
            "lat",
            "quality",
            "p50",
            "n500",
            "coverage",
        ]
        w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for rec in cities.values():
            w.writerow(rec)

    with open(OUT / "uhs_inventory.csv", "w", newline="") as fh:
        if inventory:
            w = csv.DictWriter(fh, fieldnames=list(inventory[0].keys()))
            w.writeheader()
            w.writerows(inventory)

    # Summary
    p50s = [v["p50"] for v in cities.values() if v.get("p50") is not None]
    p50s.sort()
    print("\n=== SUMMARY ===")
    print(f"matched cities: {len(cities)} unique ids: {len(id_counts)} dupes: {dupes}")
    print(f"unmatched S4 names: {unmatched_s4}")
    print(f"errors: {len(errors)}")
    if p50s:
        print(
            f"p50 metres: min={p50s[0]} median={p50s[len(p50s)//2]} max={p50s[-1]} n={len(p50s)}"
        )
    print(f"wrote {OUT/'uhs.json'} ({(OUT/'uhs.json').stat().st_size} bytes)")
    return 0 if len(cities) >= 95 and not dupes else 1


if __name__ == "__main__":
    sys.exit(main())
