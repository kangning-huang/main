# Atlas multi-layer inventory (2026-10-09)

City key for the Atlas: **GHSL UCDB 2015 R2019A `ID_HDC_G0`**.

## Papers with usable city-level results — ADDED

| Paper | Status | Source | City key | # cities on Atlas | Variables shown |
| --- | --- | --- | --- | --- | --- |
| Nested economies of scale in global city mass (Nature Cities, in press) | already in v1 | `kangning-huang/nested-scaling-city-mass` | UCDB id | 3,588 | mass/capita, vs scaling |
| Declining urban density attenuates rising population exposure to surface heat extremes (Sci Rep 2025, doi 10.1038/s41598-025-96045-z) | **added** | Drive `SUHI_trends_1000_cities.csv` (id `11gWQ_dj2HAZIHo9nldjkslZyV-7Wkg5l`; NHK share, CC BY) + GHSL FUA gpkg from `Global_Urban_Heatwave_Risk` | FUA name+ISO → `UC_IDs` | 1,362 UCDB centres (988 FUAs) | day/night A & P SUHI extreme trends (°C/decade, 2003–2020) |
| Unveiling the causal link between informal settlement demolition and urban cooling (npj Env Soc Sci 2026, doi 10.1038/s44432-026-00009-1) | **added** | `kangning-huang/urban-renewal-cooling-DID` `web/public/data/{cities,regression_results}.json` | name → Beijing/Shanghai/Guangzhou UCDB | 3 | DID cooling effect K + 95% CI |
| Height-Aware and Protection-Informed Flood Assessment (Sci Rep 2026, doi 10.1038/s41598-026-70981-w) | **added** | Drive NEW_FINAL regional CSVs in `/workspace/atlas-layers/raw/flood/` (614 FUA rows) | `UC_IDs` → UCDB `ID_HDC_G0` (exact; multi-FUA UCs flagged, largest FUA kept) | 867 UCDB centres (565 unique FUAs with exDmg) | height-aware damage % (exDmg_mean), with FLOPROS protection (exDmg_pros_mean), protection return period (flopros_merge_mean), mean building height |

## Papers with city-level data found — NOT YET published on Atlas

| Paper | Status | Source found | Why skipped / gap |
| --- | --- | --- | --- |
| Projecting global urban land expansion… through 2050 (ERL 2019) | published | `URBANMOD-ZIPF/results/urban_land.csv` — **country/region** SSP totals, not per-city | No per-city expansion numbers in that repo; city-level GEE outputs not on Drive in a joinable table. Marked **coming**. |
| Persistent increases in nighttime heat stress (JGR 2021) | published | No per-city CSV found on Drive in this pass | WRF mega-region results; needs Ken pointer. |
| Toward Cooler Cities by Larger Homogeneous Functional Clusters (PNAS, in press) | in press | SI PDFs on Drive; no clean 101-city CSV located | Marked **coming** (in press + no table). |
| Infrastructure reach… SSA (Nat Comms, in revision) | under review | — | **coming** (do not publish unpublished). |
| Global multi-city heat perception (Nat Comms AIP) | under review | — | **coming**. |
| Beyond land exposure… coastal inundation (Ecological Indicators, submitted) | submitted | — | skip. |

## Other notes

- Cooling app settlement counts (e.g. Shanghai 55 demolished) differ from the paper sample (77 / 584); Atlas shows only DID coefficients.
- Flood CSVs are at FUA grain with multi-UC `UC_IDs`; ready to join once Ken green-lights.
- Map UX (Ken override): **same-size dots**; color = paper count (1 / 2 / 3 / 4 / 5 / 6); grey = 0; filter chips optional.

## Flood layer join notes (2026-10-09)

- **867** Atlas centres covered; **440** UC_IDs in the CSVs are not among the 4,015 mapped Atlas centres (smaller UCDB centres omitted from the map).
- **5** centres flagged (urban centre listed in more than one overlapping FUA with different damage values; largest FUA by 2015 population used) — e.g. Jakarta.
- **Wuhan** (UCDB 11549) is **not** in the NEW_FINAL `UC_IDs` columns despite the paper highlight quoting Wuhan’s 100-year protection. Atlas shows “Not covered” for Wuhan until Ken points at the matching row/file.
- Card fields used: `exDmg_mean`, `exDmg_pros_mean`, `flopros_merge_mean`, `height_mean`. Skipped: counts/sums/stdDevs, `exDep_*`, `exInunD_*` (depth-only), `flopros_model_*`, `.geo`.
