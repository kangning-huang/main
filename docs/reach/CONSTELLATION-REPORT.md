# Reach Constellation Map — Preview Report

**Branch:** `preview/reach-constellation` (forked from `preview/reach-viz-alt`, PR #79 tip `2c51eaa`) · **Status:** draft — **do not merge**; Ripple stays the default view.
**UI:** `/reach?viz=constellation`. The PREVIEW toggle reads **Ripple | Beeswarm (A) | Clusters (C) | Constellation**; the banner reads “PREVIEW — Ripple | Beeswarm | Clusters | Constellation — not merged”.
**Data:** the same OpenAlex snapshot as the Ripple (as of 2026-10-10; 3,102 citing works All / 573 Lead; self-citations removed by the strict per-paper rule). Every count is recounted from the cached citing lists. Nothing is estimated or hand-entered.
**Design:** [`CONSTELLATION-MAP.md`](CONSTELLATION-MAP.md) · per-run detail (pool, seeds, aim matches, exclusions): [`constellation-keyword-report.md`](constellation-keyword-report.md).

## What it answers, next to the other three

| | Ripple | Beeswarm (A) | Clusters (C) | **Constellation** |
| --- | --- | --- | --- | --- |
| Question | How far from home topics? | Same, on Cartesian rows | What travels with what? | Which **neighbourhoods** use the work, and which **papers connect** them? |
| Position | Radius = reach distance | x = reach distance | Co-occurrence (VOS) | Text-embedding neighbourhoods; axes and directions mean nothing |
| Unique | Polar breadth headline | Readable facets | Keyword links | **Drift** (aim → landing) and **bridge** stars |
| Phone | Strip | Same rows | Smaller map | **Region cards** (no map) |

## 1. Regions

k = 5, chosen by cosine silhouette among 4–7 (0.292 · **0.322** · 0.272 · 0.294). Names and colours come from `data/influence/region-names.json`, matched by each region's top five keywords. Citing works = works in the lens carrying at least one of the region's keywords drawn in that lens.

| Region (`id`) | Colour | Keywords shown (All / Lead) | Citing works All | Lead | Largest keywords (All-lens works) |
| --- | --- | ---: | ---: | ---: | --- |
| Urban expansion & land use (`land-use`) | `#1baf7a` mint | 15 / 14 | 1,124 | 198 | urban expansion (369), land use change (264), land use and land cover change (163), urban planning (152), Shared Socioeconomic Pathways (149) |
| Urban heat & cooling (`heat`) | `#eb6834` orange | 14 / 14 | 693 | 236 | urban heat island (314), land surface temperature (157), climate change adaptation (105), climate change (88), impervious surfaces (81) |
| Urban biodiversity & green space (`biodiversity`) | `#2a78d6` blue | 12 / 11 | 632 | 86 | urban green space (166), ecosystem services (159), urban biodiversity (125), biodiversity conservation (86), urban-rural gradient (64) |
| Air pollution & dust (`air`) | `#d55181` pink | 6 / 1 | 144 | 3 | PM2.5 (79), PM10 (42), vehicle emissions (31), dust storms (23), aerosol optical depth (19) |
| Image registration (`remote-sensing`) | `#0d366b` navy | 3 / 0 | 34 | 0 | image registration (15), feature matching (12), remote sensing image registration (12) |

50 keywords shown in All (43 labelled at rest; the rest on hover), 40 drawn in Lead (keywords with fewer than 3 lead-lens works hide; Image registration has none, so that region and its chip drop out of the Lead view). 2,093 of 3,102 All citing works (418 of 573 Lead) carry at least one shown keyword. The land-use optimisation keywords (land allocation, multi-objective optimization, genetic algorithm) fall inside Urban expansion & land use rather than forming their own region at k = 5.

## 2. Stars

A paper is a star with **≥ 30 non-self citing works**: **13 in All** (3 lead-author, 10 coauthored) and **3 in Lead** (ERL 2019, IJGIS 2013, JGR-A 2021). The other 11 papers have 0–19 citing works; they are listed in the region panels and phone cards under their dominant region (Urban Climate 2021 with 19, Nat Clim Change 2022 with 14, and so on).

| Star | Lens | Non-self citing works | Own keywords sit mostly in → citers' mostly in | Drift (keyword-steps) | Bridge (≥ 25% in each) |
| --- | --- | ---: | --- | ---: | --- |
| Nat Commun 2020 · SSP urban land projections | coauthor | 799 | land use → land use | 1.51 | — |
| Nat Sustain 2020 · global urban change 1985–2015 | coauthor | 773 | land use → land use | 0.50 | land use 54% + heat 29% |
| Nat Sustain 2020 · urban growth & biodiversity | coauthor | 569 | biodiversity → biodiversity | 0.92 | biodiversity 55% + land use 35% |
| ERL 2019 · urban expansion to 2050 | lead | 392 | **land use → heat** | 0.32 | heat 52% + land use 32% |
| IJGIS 2012 · MACO land-use allocation | coauthor | 133 | land use → land use | 2.42 | — |
| ES&T 2019 · road dust PM2.5 | coauthor | 131 | air → air | 0.20 | — |
| IEEE TGRS 2013 · multisensor registration | coauthor | 94 | image registration → image registration | 0.34 | — |
| Atmos Environ 2018 · dust emissions | coauthor | 86 | air → air | 1.33 | — |
| IJGIS 2013 · land-use allocation | lead | 79 | land use → land use | 1.79 | — |
| Nat Clim Change 2025 · urban overheating mortality | coauthor | 65 | heat → heat | 1.21 | — |
| JGR-A 2021 · nighttime heat stress | lead | 63 | heat → heat | 0.73 | — |
| ES&T 2025 · urban tree cooling | coauthor | 53 | heat → heat | 1.29 | — |
| Nature Cities 2025 · urban browning heat stress | coauthor | 31 | heat → heat | 1.30 | — |

**No star reaches δ ≥ 3**, so no drift arrow shows at rest, in either lens (the design's rule: the 4 largest with δ ≥ 3). The headline says so instead of promising arrows: “Papers sit where their citers are, never more than 2.4 keyword-steps from where they aimed.” A legend line explains that “Show all drift” or selecting a star draws the arrows. One keyword-step (mean nearest-neighbour distance between shown discs) = 42.1 map units of the 760-wide map.

## 3. Embedding and projection actually used (no fallback)

- **Model:** `sentence-transformers/all-MiniLM-L6-v2` (384-d, sentence-transformers 3.3.1, CPU), run offline by `scripts/influence/constellation_embed.py`. The output is committed in `src/data/constellation.json`; nothing ML runs in Next.js.
- **Keyword vectors:** the MiniLM embedding of the keyword's label plus the titles of every All-lens citing work that carries it (the label counts as one title), renormalised. Label-only vectors were tested first and rejected: they cluster by shared words (“urban X”, “land X”), placing PM2.5 beside flood susceptibility mapping and land surface temperature beside land use change.
- **Pool:** the 200 keywords on the most All-lens citing works (≥ 3; OpenAlex keyword score ≥ 0.5; the Ripple's alias merges; “urbanization” dropped as generic at 19.4%; 24 place names that would otherwise qualify, such as China and Yangtze River Delta, dropped via `data/influence/constellation-config.json`), plus each star's three most distinctive citer keywords (n · ln lift) — 205 in all.
- **Regions:** k-means (seed 7) on the unit vectors for k = 4–7, k by cosine silhouette. Shown keywords: 50 (target 52, 3–15 per region, slots ∝ √ region works). Each region takes its stars' seed keywords first, then keywords by citing works × (silhouette + 0.25).
- **Positions:** UMAP 0.5.7 (cosine, 15 neighbours, min_dist 0.3, seed 20261010) of the 50 shown keywords, inputs sorted by slug; Procrustes onto `data/influence/constellation-layout-prev.json` (written by each run). A region far from all others slides rigidly to within 2 keyword-steps of its nearest neighbour (this run: Air pollution & dust 3.57 steps). Inter-region distances are therefore not meaningful, as the design doc warns. Discs moved ≤ 0.16 and stars ≤ 0.46 keyword-steps to clear overlaps; 0 disc overlaps remain.
- **Landing** L = Σ w·x / Σ w over the shown keywords that the paper's non-self citers carry (w = citing works). **Aim** A = Σ σ·x / Σ σ over the paper's own title and OpenAlex keywords. An exact match counts at its disc; otherwise a term votes for its 2 nearest map keywords at cosine ≥ 0.55, else it has no counterpart and is left out (every match is listed in the keyword report). **Drift** δ = |L − A| / keyword-step.
- **Fallback:** `--engine=tfidf` (`scripts/influence/lib/constellation-fallback.mjs`, TF-IDF + MDS in Node) exists for machines without Python. It was **not** used, because MiniLM + UMAP installed and ran here.
- **Rebuild:** `uv venv .venv-constellation --python 3.12 && VIRTUAL_ENV=.venv-constellation uv pip install -r scripts/influence/requirements-constellation.txt`, then `node scripts/influence/build-constellation.mjs --offline` (reads `.cache/openalex`).

## 4. Deviations from the artifact schematic

1. **Five regions, split differently.** The silhouette picked k = 5. Biodiversity separates from land use (the schematic's single “Land use & biodiversity”), and the methods region is Image registration only, because the optimisation keywords sit with land use.
2. **Fifth colour.** Biodiversity uses `#2a78d6`, the documented reference-palette blue (not an Okabe–Ito value). Remote sensing / image registration stays navy `#0d366b`, never yellow.
3. **Colour validation (dataviz validator, paper `#fffcf7`).** The prescribed four fail the all-pairs checks: mint ↔ pink CVD ΔE 4.1 (deutan), and orange ↔ pink normal-vision ΔE 12.7. On this map, mint ↔ pink (land use ↔ air) is the one failing pair that touches; orange and pink do not. Mint is 2.75:1 on paper. Mitigation: every region carries a direct name, regions are separated by gutters, every keyword is labelled or named on hover, and a table view exists. Kept as prescribed.
4. **No drift arrows at rest** (max δ 2.4 < 3). Arrows appear on “Show all drift” or when a star is selected. The headline states the measured maximum.
5. **Bridge label** “· bridge” is rendered muted after the paper name; the schematic uses one style.
6. **Echo** is a hollow ring (`fill="none"`), as in the schematic. New vocabulary is a 45% fill with a stroke. Stars have a 9-unit outer radius (schematic ≈ 10.5).
7. **Phone (< 720 px): region cards, not a map.** Each card shows the top 8 keywords (“Show all N” for more), the stars landing there, bridges from neighbours, and the papers too small for a star. Details open inside the card.
8. **Legend** is HTML below the map (same items as the schematic, plus a keyword-size key and the drift note). The schematic title becomes the section headline.

Interaction matches the design table: hover, tap or Tab on a star, keyword or region name dims the rest and fills the panel (title, citing works, region shares, drift, top three citers with DOI links). The All / Lead lens and Citing works / Cites per year toggles change sizes, visibility and lines, never positions. URL: `?viz=constellation&paper=<doi>&kw=<slug>&region=<id>&drift=all` (plus `?lens=` / `?weight=`).

## 5. Screenshots, PR, HEAD

- Required: `/workspace/redesign/screenshots/preview-reach-constellation-1280.png`, `/workspace/redesign/screenshots/preview-reach-constellation-380.png` (copies in `docs/reach/screenshots/`).
- Review states (not committed): `/workspace/redesign/screenshots/preview-reach-constellation-{1280-paper,1280-keyword,1280-lead,1280-all-drift,1280-zh,720}.png`. Regenerate any of them with `CHROMIUM_PATH=/usr/bin/google-chrome node scripts/reach/constellation-screenshots.mjs <baseUrl> <outDir…>` (`ONLY=` to pick).
- **Draft PR [#80](https://github.com/kangning-huang/main/pull/80)**, stacked on #79 (base `preview/reach-ripple`, as #79). Implementation commit `b5d3eff`; later commits touch `docs/reach/` only.
- Checks on the final commit: `npm run build` passes (static export, `/reach` prerendered). The static export logs no console errors on `/reach?viz=constellation`. An independent recount from the cached citing lists matches every count in `constellation.json` exactly, in both lenses: citing works, mapped works, the works of all 50 keywords, the 5 regions and every star. `src/data/blog-posts.json`, rewritten by the build's blog fetch, was not committed.

## 6. Preview toggle

Confirmed: `/reach` shows **Ripple | Beeswarm (A) | Clusters (C) | Constellation**. Ripple stays the default; `?viz=constellation` opens the Constellation, and a keyword in focus carries over when switching between views that both show it.

## Known issues

- `next dev` reports a hydration-text mismatch on every `/reach` view. It is pre-existing: PR #79's code shows the same, and the production export logs no errors.
- In the heat region, the stars sit close together (JGR-A 2021, ERL 2019, ES&T 2025, Nat Clim Change 2025, Nature Cities 2025), because their citers use the same vocabulary. Labels stay clear, but the cluster is dense.
