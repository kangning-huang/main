# Atlas of Urban Futures

Static city map for [kangning-huang.com/atlas](https://kangning-huang.com/atlas).

## What v1 includes

- World map of **4,015** GHSL Urban Centres (2015), drawn with **d3-geo + canvas** over Natural Earth land (`world-atlas` land-110m). No third-party map tiles.
- **Built mass / scaling** layer from `kangning-huang/nested-scaling-city-mass` (Nature Cities, in press). ~3,588 cities matched; match quality flagged when centroids disagree.
- Search + click → city card with real values from `public/atlas/city/<id>.json`.
- Paper link goes to the **publications** anchor (no Nature Cities DOI until it resolves).
- Greyed placeholders for urban expansion (ERL 2019) and SSA infrastructure (Nat Comms, in revision).

## What v1 deliberately skips

- Per-city static `/atlas/<slug>` pages (keeps the static export fast; cards load JSON on demand).
- Heat / flood / cooling layers (later PRs).
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
| `public/atlas/land-110m.json` | Natural Earth land topology |
| `public/atlas/pages.json` | Reserved for future static city pages (top 500) |
| `public/atlas/crosswalk.json` | UCDB ↔ city-mass match log |
