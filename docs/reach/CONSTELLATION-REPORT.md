# Reach Constellation Map — Preview Report

**Branch:** `preview/reach-constellation` · **Status:** draft — do not merge; does not replace live Ripple.  
**UI:** `/reach` PREVIEW toggle **Ripple | Beeswarm (A) | Clusters (C) | Constellation** (`?viz=constellation`).  
**Data:** same OpenAlex snapshot as Ripple (`asOf` 2026-10-10; 3,102 citing works All / 573 Lead; self-cites removed). Never invent numbers.

## What it answers

| | Ripple | Beeswarm (A) | Clusters (C) | **Constellation** |
| --- | --- | --- | --- | --- |
| Question | How far from home topics? | Same, with Cartesian axes | What travels with what? | Which **neighbourhoods** use the work, and which **papers connect** them? |
| Position | Radius = reach distance | X = reach distance | Co-occurrence layout | Embedding neighbourhoods (axes meaningless) |
| Unique | Polar breadth | Readable facets | VOSviewer-style links | **Drift** arrows + **bridge** stars |
| Phone | Strip | Same rows | Crowded | **Region cards** (no tiny map) |

## Regions (All lens)

| Region | Color | Citing works (mapped) | Keywords shown |
| --- | --- | ---: | ---: |
| Urban expansion & land use | `#1baf7a` mint | 1,124 | 15 |
| Urban heat & cooling | `#eb6834` orange | 693 | 14 |
| Urban biodiversity & green space | `#2a78d6` blue | 632 | 12 |
| Air pollution & dust | `#d55181` pink | 144 | 6 |
| Image registration | `#0d366b` navy | 34 | 3 |

**5 regions · 50 keywords · 13 paper stars** (All). Lead lens: same 5 regions, **3 stars** (ERL 2019, IJGIS 2013, JGR-A 2021). Silhouette chose k=5 (0.322) over 4/6/7.

Mapped keyword coverage: **2,093 of 3,102** All citing works carry at least one shown keyword.

## Paper stars (≥30 non-self citing works)

| Paper | Lens | Works | Drift (keyword-steps) | Bridge |
| --- | --- | ---: | ---: | --- |
| Nat Commun 2020 | coauthor | 799 | 1.51 | — |
| Nat Sustain 2020 · mapping | coauthor | 773 | 0.50 | land-use + heat |
| Nat Sustain 2020 · biodiversity | coauthor | 569 | 0.92 | biodiversity + land-use |
| ERL 2019 | lead | 392 | 0.32 | heat + land-use |
| IJGIS 2012 | coauthor | 133 | 2.42 | — |
| ES&T 2019 | coauthor | 131 | 0.20 | — |
| IEEE TGRS 2013 | coauthor | 94 | 0.34 | — |
| Atmos Environ 2018 | coauthor | 86 | 1.33 | — |
| IJGIS 2013 | lead | 79 | 1.79 | — |
| Nat Clim Change 2025 | coauthor | 65 | 1.21 | — |
| JGR-A 2021 | lead | 63 | 0.73 | — |
| ES&T 2025 | coauthor | 53 | 1.29 | — |
| Nature Cities 2025 | coauthor | 31 | 1.30 | — |

No star reaches δ ≥ 3, so **no drift arrows at rest** (artifact default). “Show all drift” or selecting a star draws them. Largest drift at rest callout: IJGIS 2012 (2.4 steps).

Papers below the 30-cite threshold are folded into region cards (see `constellation-keyword-report.md`).

## Embedding / projection

- **Engine used:** `sentence-transformers/all-MiniLM-L6-v2` (384-d) + **UMAP 0.5.7** (cosine, 15 neighbors, min_dist 0.3, seed `20261010`).
- Each keyword vector = mean of (label embedding + mean of titles of citing works carrying that keyword).
- Regions = clustering on embeddings; k ∈ [4,7] by cosine silhouette.
- Layout written to `src/data/constellation.json`; Procrustes onto `data/influence/constellation-layout-prev.json` when present.
- Python helper: `scripts/influence/constellation_embed.py` (+ `requirements-constellation.txt`). Fallback TF-IDF/MDS path: `scripts/influence/lib/constellation-fallback.mjs` (not used for this JSON).
- Rebuild: `node scripts/influence/build-constellation.mjs` (needs local venv with sentence-transformers + umap-learn).

## Deviations from the Claude artifact schematic

1. **5 regions, not 4** — silhouette preferred k=5; biodiversity pulled out of land-use as its own mint-adjacent blue region (`#2a78d6` rather than artifact’s single mint land-use blob).
2. **No rest-state drift arrows** — max δ ≈ 2.4 &lt; artifact threshold δ ≥ 3; arrows available via “Show all drift” / selection.
3. **Biodiversity color** — artifact painted only mint / orange / remote-sensing blue / air pink; the fifth region uses Okabe–Ito-safe blue `#2a78d6` so remote-sensing stays navy `#0d366b` (never yellow).
4. **Phone** — artifact suggested a square map with fewer labels; we ship **region cards** per the Ken brief (&lt;720), which matches readability better.
5. **Headline** — uses measured max drift (“never more than 2.4 keyword-steps…”) instead of a schematic-only line.

Otherwise encodings match: light theme, ~8% region fills, ~45% disc fills, solid vs hollow echo, solid/hollow lead/coauthor stars, faint paper→keyword lines, Absolute / cites-per-year, All/Lead lens, `?viz=constellation&paper=…&kw=…`.

## Screenshots

- `/workspace/redesign/screenshots/preview-reach-constellation-1280.png`
- `/workspace/redesign/screenshots/preview-reach-constellation-380.png`
- Repo: `docs/reach/screenshots/preview-reach-constellation-*.png`
- Design source copies: `docs/reach/screenshots/constellation-artifact-*.png`, `docs/reach/CONSTELLATION-MAP.md`

## PR

**Draft PR:** (filled after open) · HEAD SHA: (filled after commit). Base: `main` (follow-on to viz-alt #79 / Ripple #78). **Do not merge** until Ken picks a Reach viz.
