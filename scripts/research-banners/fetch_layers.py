"""Fetch the top-down base imagery and data layers for the /research banners.

Four cities, four lenses. Each banner is one city seen straight down, with one
real data layer on a north-up UTM grid, so the overlay fits the image by
construction:

  urban-futures  Lagos      Sentinel-2 base + URBANMOD 2050 urban probability (SSP2, 5 km)
  heat           Shanghai   Sentinel-2 base + Landsat 8/9 summer land surface temperature
  flood-coasts   Jakarta    Sentinel-2 base + CoastalDEM inundation under IPCC AR6 sea level
  scaling-form   New York   Sentinel-2 base + built mass on nested H3 hexagons (L7 -> L6 -> L5), Nature Cities 2026

Earth Engine layers come from computePixels on the exact output grid. The
URBANMOD and CoastalDEM rasters are local files (Ken's Google Drive) and are
reprojected onto the same grid. Everything lands in data/<theme>.npz
(gitignored); make_banners.py renders from there.

    ~/miniforge3/envs/citygrowth/bin/python scripts/research-banners/fetch_layers.py [theme ...]
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
DRIVE = Path.home() / "Library/CloudStorage/GoogleDrive-kh3657@nyu.edu/My Drive"
URBANMOD = Path(os.environ.get(
    "URBANMOD_TIF",
    DRIVE / "Dissertation/Chp-1_CC_UHI/Urban_Expansion/URBANMOD2_size_2015_2050/world_SSP_tif/urban-ssp2-new.tif",
))
CITYMASS_DIR = Path(os.environ.get(
    "CITYMASS_DIR", DRIVE / "Grants_Fellowship/2024 NYU China Grant/_CityMass/_Revision1/data"
))  # Nested Nature Cities paper: Fig3_Mass_Neighborhood_H3_Resolution{5,6,7}_*.csv
CITYMASS_ID = 945  # New York (ID_HDC_G0), the paper's Fig. 3 inset city
SLR_DIR = Path(os.environ.get(
    "SLR_DIR", DRIVE / "Research_Projects/2021_UrbanExpansion_FloodRisk/results_slr_inundation"
))

W, H = 2180, 812  # @2x banner size

# centre lon, lat, metres per @2x pixel, UTM EPSG
FRAMES = {
    "urban-futures": dict(lon=3.50, lat=6.60, res=50, epsg=32631),
    "heat": dict(lon=121.40, lat=31.17, res=55, epsg=32651),
    "flood-coasts": dict(lon=106.38, lat=-6.03, res=22, epsg=32748),
    # anchor: put (lon, lat) -- the densest level-7 cell, Midtown South -- at this @2x pixel:
    # x as in the original nested-hex banner, y raised so lower Manhattan clears the page fade;
    # 44 m/px makes an H3 level-7 cell the same size as that banner's fine hexagons (radius ~14 px at 1x)
    "scaling-form": dict(lon=-73.98755, lat=40.74194, res=44, epsg=32618, anchor=(880, 250)),
}


def grid(theme: str):
    """Affine transform (rasterio order) and CRS for a theme's @2x grid."""
    from pyproj import Transformer
    from rasterio.transform import Affine

    f = FRAMES[theme]
    x, y = Transformer.from_crs(4326, f["epsg"], always_xy=True).transform(f["lon"], f["lat"])
    ax, ay = f.get("anchor", (W / 2, H / 2))
    x0, y0 = x - ax * f["res"], y + ay * f["res"]
    return Affine(f["res"], 0, x0, 0, -f["res"], y0), f"EPSG:{f['epsg']}"


def ee_pixels(image, theme: str, bands: list[str], strips: int = 4) -> np.ndarray:
    """computePixels on the theme's grid, in vertical strips to stay under EE's memory limit."""
    import ee

    t, crs = grid(theme)
    edges = np.linspace(0, W, strips + 1).astype(int)
    parts = []
    for x0, x1 in zip(edges[:-1], edges[1:]):
        arr = ee.data.computePixels({
            "expression": image.select(bands),
            "fileFormat": "NUMPY_NDARRAY",
            "grid": {
                "dimensions": {"width": int(x1 - x0), "height": H},
                "affineTransform": {
                    "scaleX": t.a, "shearX": 0, "translateX": t.c + x0 * t.a,
                    "shearY": 0, "scaleY": t.e, "translateY": t.f,
                },
                "crsCode": crs,
            },
        })
        parts.append(np.stack([arr[b].astype(np.float32) for b in bands], axis=-1))
    return np.concatenate(parts, axis=1)


def sentinel_rgb(theme: str, months: tuple[int, int]) -> np.ndarray:
    """Cloud-masked Sentinel-2 median composite, reflectance 0..1, H x W x 3."""
    import ee

    f = FRAMES[theme]
    pt = ee.Geometry.Point(f["lon"], f["lat"])
    region = pt.buffer(W * f["res"] * 0.75).bounds()
    cs = ee.ImageCollection("GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED")
    raw = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(region)
        .filterDate("2023-01-01", "2025-12-31")
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 60))
        .linkCollection(cs, ["cs_cdf"])
    )
    clear = raw.map(lambda im: im.updateMask(im.select("cs_cdf").gte(0.65)))
    season = clear.filter(ee.Filter.calendarRange(months[0], months[1], "month")).median()
    # fill pixels the season never saw clear with the clear median of the other months
    other = clear.filter(ee.Filter.calendarRange(months[0], months[1], "month").Not())
    other = other.filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20)).limit(12, "CLOUDY_PIXEL_PERCENTAGE")
    img = season.unmask(other.median()).select(["B4", "B3", "B2"]).divide(10000)
    return ee_pixels(img, theme, ["B4", "B3", "B2"])


def landsat_lst(theme: str) -> np.ndarray:
    """Summer (Jun-Sep) median land surface temperature, deg C, Landsat 8/9 C2 L2."""
    import ee

    f = FRAMES[theme]
    region = ee.Geometry.Point(f["lon"], f["lat"]).buffer(W * f["res"] * 0.75).bounds()

    def prep(im):
        qa = im.select("QA_PIXEL")
        clear = qa.bitwiseAnd(0b11111).eq(0)  # fill, dilated cloud, cirrus, cloud, shadow
        st = im.select("ST_B10").multiply(0.00341802).add(149.0 - 273.15)
        return st.updateMask(clear).rename("lst")

    col = (
        ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
        .merge(ee.ImageCollection("LANDSAT/LC09/C02/T1_L2"))
        .filterBounds(region)
        .filterDate("2020-01-01", "2024-12-31")
        .filter(ee.Filter.calendarRange(6, 9, "month"))
        .filter(ee.Filter.lt("CLOUD_COVER", 40))
        .map(prep)
    )
    return ee_pixels(col.median(), theme, ["lst"])[..., 0]


def water_occurrence(theme: str) -> np.ndarray:
    import ee

    img = ee.Image("JRC/GSW1_4/GlobalSurfaceWater").select("occurrence").unmask(0)
    return ee_pixels(img, theme, ["occurrence"])[..., 0]


def h3_levels(theme: str) -> dict:
    """The paper's built mass on H3 levels 5, 6 and 7, as hexagons in @2x pixel coordinates.

    For each level: polygon vertices (n x 6 x 2), total built mass (t) and area (km2).
    """
    import h3
    import pandas as pd
    from pyproj import Transformer

    t, crs = grid(theme)
    tr = Transformer.from_crs(4326, crs, always_xy=True)
    inv = ~t
    out = {}
    for res in (5, 6, 7):
        csv = sorted(CITYMASS_DIR.glob(f"Fig3_Mass_Neighborhood_H3_Resolution{res}_*.csv"))[-1]
        df = pd.read_csv(csv, usecols=["h3index", "ID_HDC_G0", "total_built_mass_tons"])
        df = df[df.ID_HDC_G0 == CITYMASS_ID].dropna(subset=["total_built_mass_tons"]).reset_index(drop=True)
        polys = []
        for h in df.h3index:
            ring = [inv * tr.transform(lon, lat) for lat, lon in h3.cell_to_boundary(h)]
            polys.append(ring[:6])
        out[f"poly{res}"] = np.array(polys, float)
        out[f"mass{res}"] = df.total_built_mass_tons.to_numpy(float)
        out[f"area{res}"] = np.array([h3.cell_area(h, unit="km^2") for h in df.h3index])
        print(f"  H3 level {res}: {len(df)} cells from {csv.name}")
    return out


def warp_local(src_path: Path, theme: str, resampling: str = "nearest", src_crs=None) -> np.ndarray:
    import rasterio
    from rasterio.warp import Resampling, reproject

    t, crs = grid(theme)
    out = np.full((H, W), np.nan, np.float32)
    with rasterio.open(src_path) as src:
        reproject(
            source=rasterio.band(src, 1), destination=out,
            src_crs=src_crs or src.crs, dst_transform=t, dst_crs=crs,
            dst_nodata=np.nan, resampling=getattr(Resampling, resampling),
        )
    return out


def urbanmod_cells(theme: str) -> tuple[np.ndarray, np.ndarray]:
    """2050 urban probability on the grid, plus integer cell ids (5 km Mollweide cells)."""
    import rasterio
    from rasterio.warp import Resampling, reproject

    t, crs = grid(theme)
    prob = warp_local(URBANMOD, theme)
    with rasterio.open(URBANMOD) as src:
        ids = np.arange(src.width * src.height, dtype=np.float64).reshape(src.height, src.width)
        cell = np.full((H, W), -1, np.float64)
        reproject(source=ids, destination=cell, src_transform=src.transform, src_crs=src.crs,
                  dst_transform=t, dst_crs=crs, resampling=Resampling.nearest)
    prob[(prob < 0) | (prob > 1)] = np.nan
    return prob, cell.astype(np.int64)


def slr_mask(theme: str, scenario: str, year: int) -> np.ndarray:
    """Fraction (0..1, bilinear) of each pixel below the 100-year storm tide + sea-level rise."""
    import rasterio
    from rasterio.merge import merge

    tiles = sorted(SLR_DIR.glob(f"p50_medium_confidence_{scenario}_{year}_S0[67]E106.tif"))
    if not tiles:
        raise FileNotFoundError(f"no SLR tiles in {SLR_DIR}")
    srcs = [rasterio.open(p) for p in tiles]
    mosaic, tr = merge(srcs)
    crs = srcs[0].crs
    for s in srcs:
        s.close()

    import rasterio.warp as rw

    t, dst_crs = grid(theme)
    out = np.zeros((H, W), np.float32)
    rw.reproject(source=mosaic[0].astype(np.float32), destination=out, src_transform=tr, src_crs=crs,
                 dst_transform=t, dst_crs=dst_crs, resampling=rw.Resampling.bilinear)
    return out


def main(themes: list[str]) -> None:
    import ee

    ee.Initialize(project=os.environ.get("EE_PROJECT", "ee-knhuang"))
    DATA.mkdir(exist_ok=True)
    for theme in themes:
        print(f"[{theme}] fetching …", flush=True)
        if theme == "urban-futures":
            rgb = sentinel_rgb(theme, (11, 12))  # Harmattan dry season, fewest clouds
            prob, cell = urbanmod_cells(theme)
            np.savez_compressed(DATA / f"{theme}.npz", rgb=rgb, prob=prob, cell=cell)
        elif theme == "heat":
            rgb = sentinel_rgb(theme, (3, 5))
            lst = landsat_lst(theme)
            water = water_occurrence(theme)
            np.savez_compressed(DATA / f"{theme}.npz", rgb=rgb, lst=lst, water=water)
        elif theme == "flood-coasts":
            rgb = sentinel_rgb(theme, (6, 9))  # dry season
            water = water_occurrence(theme)
            m2050 = slr_mask(theme, "ssp585", 2050)
            m2100 = slr_mask(theme, "ssp585", 2100)
            np.savez_compressed(DATA / f"{theme}.npz", rgb=rgb, water=water, m2050=m2050, m2100=m2100)
        elif theme == "scaling-form":
            cached = DATA / f"{theme}.npz"
            # reuse the cached base image when only the hexagons change (delete the npz after moving the frame)
            rgb = np.load(cached)["rgb"] if cached.exists() else sentinel_rgb(theme, (4, 10))
            np.savez_compressed(DATA / f"{theme}.npz", rgb=rgb, **h3_levels(theme))
        print(f"[{theme}] saved {DATA / (theme + '.npz')}", flush=True)


if __name__ == "__main__":
    main(sys.argv[1:] or list(FRAMES))
