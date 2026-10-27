# Atlas of Urban Futures

Static city map for [kangning-huang.com/atlas](https://kangning-huang.com/atlas).

## What v1 includes

- World map of **4,015** GHSL Urban Centres (2015) on a **MapLibre** map with **CARTO Positron / Dark Matter** vector basemaps (light/dark via `prefers-color-scheme`). City dots (paper-count palette) are painted on a 2D canvas overlay above the basemap (stacking-context + `translateZ(0)` so WebGL cannot hide them; resize re-fits the camera so `map.project` stays aligned). MapLibre loads asynchronously so `/atlas/points.json` + first equirect paint are not blocked on the ~1MB maplibre chunk; the page also preloads `points.json`. Selecting a city zooms to a tight city frame (~2°) with a prominent halo+core marker.
- **Built mass / scaling** layer from `kangning-huang/nested-scaling-city-mass` (Nature Cities, 2026; DOI 10.1038/s44284-026-00532-x). ~3,588 cities matched; match quality flagged when centroids disagree.
- Search + click → city card with real values from `public/atlas/city/<id>.json`.
- Paper link goes to the **publications** anchor (no Nature Cities DOI until it resolves).
- City-card panel + map filter for **PNAS Cooler Cities / UHS** (Zhang et al. 2026): per-city median and range of 500 m mean UHS inside GHSL UCDB 2015; IQR heat illustration from the paper’s pooled slope (−0.156 °C / +100 m daytime). DOI + Figshare links. Credit Zhang et al.
- Greyed placeholder for SSA infrastructure (Nat Comms, in revision).

## What v1 deliberately skips

- Per-city static `/atlas/<slug>` pages (keeps the static export fast; cards load JSON on demand).
- Expansion (ERL 2019) and nighttime heat stress (JGR 2021) layers shipped.
- SSA infrastructure layer (later PRs). Optional: COG/PMTiles UHS raster overlay.
- Expansion layer numbers (crosswalk not built in this export).

## Regenerate

```bash
python3 -I scripts/atlas/build_atlas.py \
  --ucdb-zip /path/GHS_STAT_UCDB2015MT_GLOBE_R2019A_V1_2.zip \
  --city-mass /path/nested-scaling-city-mass \
  --land node_modules/world-atlas/land-110m.json \
  --out public/atlas
```

Inputs are not committed. The script never invents values: unmatched cities stay `coverage: 0` / “not covered”.

## Files

| Path | Role |
| --- | --- |
| `public/atlas/points.json` | Compact rows for the map |
| `public/atlas/city/*.json` | Per-city detail for the card |
| `public/atlas/land-110m.json` | Natural Earth land topology (kept for rebuild scripts; UI uses CARTO tiles) |
| `public/atlas/pages.json` | Reserved for future static city pages (top 500) |
| `public/atlas/crosswalk.json` | UCDB ↔ city-mass match log |

## Cooler Cities / UHS stats

Offline (workstation) build from Figshare `UHS_All_Continents.zip`:

```bash
# on a machine with rasterio + geopandas; zip kept outside the repo
python3 -I scripts/atlas/build_uhs_citystats.py   # emits out/uhs.json
python3 -I scripts/atlas/merge_uhs.py --uhs public/atlas/layers/uhs.json --out public/atlas
```

Aggregation matches the paper: 10 m UHS → 500 m mean of valid (UHS>0) pixels, then city percentiles inside the UCDB polygon. Do not rank cities by median×slope.
