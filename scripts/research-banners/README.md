# Research-page theme banners: four cities, four lenses

Each `/research` theme opens with a 1090 × 406 banner. A banner shows one city seen straight down (a Sentinel-2 composite) with one real data layer. The layer sits on the same north-up UTM grid as the image, so it fits the ground by construction. Earlier versions laid flat overlays on an oblique Manhattan photo, which the Nov 2026 critique flagged.

| Banner | City | Layer | Source | Scheme |
|---|---|---|---|---|
| `urban-futures` | Lagos (≈109 × 41 km) | One square per 5 km model cell; the square's area and colour show the chance the cell becomes urban by 2050 (SSP2). Cells already urban in 2015, and water, are left as photo. | URBANMOD, Huang et al. 2019 *ERL* (`Dissertation/…/URBANMOD2_size_2015_2050/world_SSP_tif/urban-ssp2-new.tif`) | cividis |
| `heat` | Shanghai (≈120 × 45 km) | Summer (Jun–Sep) median land surface temperature. The colour follows blocks and roofs (1.5 px smoothing); the opacity follows the broad heat-island shape. | Landsat 8/9 C2 L2 `ST_B10`, 2020–2024 | magma |
| `flood-coasts` | Jakarta, Tangerang coast (≈48 × 18 km) | Land below the 100-year storm tide plus sea-level rise, for 2050 (pale) and 2100 (blue) under SSP5-8.5 (p50, medium confidence), with one outline on the 2100 limit. | Ken's CoastalDEM v2.1 + IPCC AR6 inundation (`Research_Projects/2021_UrbanExpansion_FloodRisk/results_slr_inundation`) | water blues |
| `scaling-form` | New York (≈96 × 36 km; the paper's Fig. 3 inset city) | The original nested-hex banner's style (`make_research_highlight_banner_nested.py`, `nested_v1`, in the Blog_Posts draft `bigger-cities-denser-neighborhoods`): navy duotone base, purple → teal → soft-gold level-7 cells with glowing cyan edges, cyan level-6 and ice-white level-5 strokes, and an amber cascade from the densest level-7 cell (Midtown South) to the level-6 and level-5 cells that contain it. The hexagons are the paper's real H3 cells, shaded by real built mass (Mt/km², log scale, 30th–99.5th pct); 44 m/px makes a level-7 cell the original's fine-hex size, and the peak sits at the original's focal point. | Nested *Nature Cities* 2026: `_CityMass/_Revision1/data/Fig3_Mass_Neighborhood_H3_Resolution{5,6,7}_*.csv`, city `ID_HDC_G0` 945 | the original's ramp |

The style follows the critique:
- a light, muted base that keeps photo detail;
- no glow;
- at most one line level, and no glow (except `scaling-form`, which keeps the original nested-hex banner's look);
- one shape per frame, with calm space around it.

Legends and captions (place · layer · source) are HTML in `src/app/research/page.tsx`. The page fades the lower third of each banner into the section title (CSS `mask-image`).

## Rebuild

```bash
# 1. fetch base imagery and layers to data/ (gitignored); needs Earth Engine (project ee-knhuang)
#    and the Google Drive files above (or override with URBANMOD_TIF=… SLR_DIR=… CITYMASS_DIR=…)
~/miniforge3/envs/citygrowth/bin/python scripts/research-banners/fetch_layers.py [theme …]

# 2. render public/research/<theme>.{jpg,webp} at 1x and @2x
~/miniforge3/envs/citygrowth/bin/python scripts/research-banners/make_banners.py [theme …]
```

To change a frame (centre, metres per pixel or UTM zone), edit `FRAMES` in `fetch_layers.py` and re-fetch that theme.

`scaling-form` has two settings, chosen by Ken from side-by-side options (Nov 2026):
- `HEX_FILL=0.8` scales the original banner's fill opacity, so the satellite shows through.
- `HEX_FADE=0.65` shrinks the original's radial falloffs round the peak, so hexagons dissolve toward the edges.

Override either at render time, e.g. `HEX_FILL=0.6 HEX_FADE=0.8 … make_banners.py scaling-form`.
