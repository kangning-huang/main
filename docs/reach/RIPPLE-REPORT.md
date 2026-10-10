# Ripple Map — Preview Report

**Branch:** `preview/reach-ripple` · **Status:** draft preview — do not merge until Ken says.
**Data as of:** 2026-10-10 (OpenAlex) · self-citations removed.

## Ken-settled defaults applied

1. **Breadth** headline; default lens = All.
2. Theme rename: **Form & methods** (ZH: 形态与方法). Nature Cities scaling DOI still omitted.
3. **Sankey retired** from `/reach` — no Fields toggle. `ReachFlowChart.tsx` / `reach-flow.json` remain in-repo unused.
4. Phone: unrolled strip (`RippleStrip`) under 720 px.
5. Citing-work cache under `/.cache/` — gitignored.

## Outside-home headline

- **All:** One in three works citing this research sits outside its home topics (1,064 of 3,102; OpenAlex, 2026-10-10).
- **Lead:** More than one in four works citing this research sits outside its home topics (167 of 573; OpenAlex, 2026-10-10).

## Keywords shown on the map (All lens)

### Urban expansion & futures — 2433 citing works

| Keyword | Works | d̄ | Echo | Bridge |
| --- | ---: | ---: | --- | --- |
| urban expansion | 346 | 0.20 | echo |  |
| land use change | 247 | 0.24 | echo |  |
| land use and land cover change | 149 | 0.10 | new |  |
| ecosystem services | 147 | 0.28 | new |  |
| Shared Socioeconomic Pathways | 143 | 0.29 | echo |  |
| urban biodiversity | 124 | 0.71 | new |  |
| urban sprawl | 107 | 0.32 | new |  |
| urban-rural gradient | 62 | 0.85 | new |  |
| habitat fragmentation | 51 | 0.96 | new |  |
| species richness | 42 | 1.02 | new |  |
| urban biodiversity conservation | 29 | 1.17 | new |  |
| urban birds | 28 | 1.00 | new |  |

### Form & methods — 228 citing works

| Keyword | Works | d̄ | Echo | Bridge |
| --- | ---: | ---: | --- | --- |
| multi-objective optimization | 26 | 0.31 | echo | expansion |
| land allocation | 25 | 0.08 | echo | expansion |
| genetic algorithm | 17 | 0.29 | new | expansion |
| land use optimization | 17 | 0.29 | new | expansion |
| image registration | 15 | 0.13 | echo |  |
| ant colony optimization | 15 | 0.20 | echo | expansion |
| urban land use planning | 5 | 0.60 | new | expansion |
| multi-criteria decision making | 5 | 1.40 | new | expansion |

### Flood & coasts — 12 citing works (emerging, no bubbles)

_No bubbles (emerging or empty)._

### Heat exposure & health — 186 citing works

| Keyword | Works | d̄ | Echo | Bridge |
| --- | ---: | ---: | --- | --- |
| urban heat island | 69 | 0.04 | echo | expansion |
| land surface temperature | 36 | 0.06 | new | expansion |
| heat waves | 17 | 0.06 | new | expansion |
| urban thermal environment | 15 | 0.07 | new | expansion |
| extreme heat | 13 | 0.00 | echo | expansion |
| wet bulb globe temperature | 9 | 0.00 | echo |  |
| potential evapotranspiration | 6 | 1.83 | new |  |

### Cooling & greening — 73 citing works

| Keyword | Works | d̄ | Echo | Bridge |
| --- | ---: | ---: | --- | --- |
| climate change adaptation | 11 | 0.09 | echo | expansion |
| urban cooling | 10 | 0.00 | echo | expansion |
| urban trees | 9 | 0.00 | echo | expansion |
| urban forests | 6 | 0.50 | echo | expansion |

### Air quality / dust — 218 citing works

| Keyword | Works | d̄ | Echo | Bridge |
| --- | ---: | ---: | --- | --- |
| PM2.5 | 65 | 0.43 | echo |  |
| PM10 | 37 | 0.32 | echo |  |
| vehicle emissions | 28 | 0.61 | new |  |
| particulate matter | 27 | 0.48 | new |  |
| dust storms | 23 | 0.17 | new |  |
| road dust | 22 | 1.14 | new |  |
| health risk assessment | 16 | 1.50 | new |  |

## Callouts (All)

- **farthest:** species richness — {"dMean":1.02,"outside":30,"works":42}
- **rising:** particulate matter — {"recentShare":0.202,"priorShare":0.062,"recent":18,"prior":6,"windows":{"recent":[2023,2025],"prior":[2020,2022]}}
- **bridge:** urban heat island — {"totalWorks":313,"byTheme":{"heat-health":69,"expansion":228}}

## Alias file (seeded)

See `data/influence/keyword-aliases.json`. Merges applied this run:
- `merge` → {"urban-heat-island":["surface-urban-heat-island","urban-heat-island-intensity","surface-urban-heat-island-intensity","uhi-intensity"],"urban-green-space":["green-spaces"],"shared-socioeconomic-pathways":["socioeconomic-pathways"],"ecosystem-service-value":["ecosystem-services-value"],"land-use-and-land-cover":["land-use-land-cover"],"urban-cooling":["urban-cooling-effect"]}
- `labels` → {}
- `stoplist` → []
- `rejected` → [["bees","building-energy-efficiency"]]

## Alias candidates for Ken (accept → add to `merge`; reject → add to `rejected`)

Detected automatically (plural, spelling, acronym and “… effect” variants among keywords on ≥3 All-lens works). Nothing here is merged until it is in `data/influence/keyword-aliases.json`.

### Plural, spelling and acronym variants (1)

- `scale-invariant-feature-transform` (scale-invariant feature transform, 4) ↔ `sift` (SIFT, 3)

### “urban X” / “surface X” / “X intensity” ↔ “X” — one decision: fold the modifier or keep both (51)

- **on map** · `land-use-change` (land use change, 264) ↔ `urban-land-use-change` (urban land use change, 23)
- **on map** · `ecosystem-services` (ecosystem services, 159) ↔ `urban-ecosystem-services` (urban ecosystem services, 7)
- **on map** · `land-surface-temperature` (land surface temperature, 157) ↔ `urban-land-surface-temperature` (urban land surface temperature, 4)
- **on map** · `climate-change-adaptation` (climate change adaptation, 105) ↔ `urban-climate-change-adaptation` (urban climate adaptation, 22)
- **on map** · `biodiversity-conservation` (biodiversity conservation, 86) ↔ `urban-biodiversity-conservation` (urban biodiversity conservation, 29)
- **on map** · `population-density` (population density, 88) ↔ `urban-population-density` (urban population density, 6)
- **on map** · `land-use-planning` (land use planning, 55) ↔ `urban-land-use-planning` (urban land use planning, 12)
- **on map** · `road-dust` (road dust, 22) ↔ `urban-road-dust` (urban road dust, 5)
- `climate-change` (climate change, 88) ↔ `urban-climate-change` (urban climate change, 3)
- `impervious-surfaces` (impervious surfaces, 81) ↔ `urban-impervious-surfaces` (urban impervious surfaces, 5)
- `land-cover-change` (land cover change, 66) ↔ `urban-land-cover-change` (urban land cover change, 6)
- `green-infrastructure` (green infrastructure, 48) ↔ `urban-green-infrastructure` (urban green infrastructure, 16)
- `land-use` (land use, 42) ↔ `urban-land-use` (urban land use, 19)
- `population-growth` (population growth, 46) ↔ `urban-population-growth` (urban population growth, 11)
- `land-use` (land use, 42) ↔ `land-use-intensity` (land use intensity, 12)
- `urban-heat-mitigation` (urban heat mitigation, 36) ↔ `heat-mitigation` (heat mitigation, 17)
- `air-pollution` (air pollution, 29) ↔ `urban-air-pollution` (urban air pollution, 21)
- `land-use-efficiency` (land use efficiency, 24) ↔ `urban-land-use-efficiency` (urban land use efficiency, 20)
- `climate-resilience` (climate resilience, 24) ↔ `urban-climate-resilience` (urban climate resilience, 18)
- `air-quality` (air quality, 29) ↔ `urban-air-quality` (urban air quality, 10)
- `thermal-comfort` (thermal comfort, 32) ↔ `urban-thermal-comfort` (urban thermal comfort, 5)
- `carbon-storage` (carbon storage, 33) ↔ `urban-carbon-storage` (urban carbon storage, 3)
- `air-temperature` (air temperature, 26) ↔ `surface-air-temperature` (surface air temperature, 9)
- `land-cover` (land cover, 17) ↔ `urban-land-cover` (urban land cover, 16)
- `air-temperature` (air temperature, 26) ↔ `urban-air-temperature` (urban air temperature, 6)
- `heat-stress` (heat stress, 22) ↔ `urban-heat-stress` (urban heat stress, 10)
- `urban-land-expansion` (urban land expansion, 26) ↔ `land-expansion` (land expansion, 3)
- `construction-land-expansion` (construction land expansion, 23) ↔ `urban-construction-land-expansion` (urban construction land expansion, 6)
- `heat-exposure` (heat exposure, 20) ↔ `urban-heat-exposure` (urban heat exposure, 8)
- `spatial-planning` (spatial planning, 20) ↔ `urban-spatial-planning` (urban spatial planning, 7)
- `landscape-pattern` (landscape pattern, 21) ↔ `urban-landscape-pattern` (urban landscape pattern, 4)
- `wind-speed` (wind speed, 22) ↔ `surface-wind-speed` (surface wind speed, 3)
- `tree-cover` (tree cover, 16) ↔ `urban-tree-cover` (urban tree cover, 8)
- `flood-risk` (flood risk, 19) ↔ `urban-flood-risk` (urban flood risk, 5)
- `greenhouse-gas-emissions` (greenhouse gas emissions, 18) ↔ `urban-greenhouse-gas-emissions` (urban greenhouse gas emissions, 4)
- `water-bodies` (water bodies, 14) ↔ `urban-water-bodies` (urban water bodies, 4)
- `blue-green-spaces` (green and blue spaces, 13) ↔ `urban-blue-green-spaces` (urban blue-green spaces, 3)
- `green-space-planning` (green space planning, 8) ↔ `urban-green-space-planning` (urban green space planning, 6)
- `development-scenarios` (development scenarios, 9) ↔ `urban-development-scenarios` (urban development scenarios, 5)
- `water-cycle` (water cycle, 7) ↔ `urban-water-cycle` (urban water cycle, 5)
- `heat-risk` (heat risk, 6) ↔ `urban-heat-risk` (urban heat risk, 6)
- `land-consumption` (land consumption, 9) ↔ `urban-land-consumption` (urban land consumption, 3)
- `water-supply` (water supply, 8) ↔ `urban-water-supply` (urban water supply, 3)
- `urban-water-management` (urban water management, 7) ↔ `water-management` (water management, 4)
- `noise-pollution` (noise pollution, 6) ↔ `urban-noise-pollution` (urban noise, 4)
- `global-sensitivity-analysis` (global sensitivity analysis, 4) ↔ `sensitivity-analysis` (sensitivity analysis, 4)
- `forest-management` (forest management, 4) ↔ `urban-forest-management` (urban forest management, 4)
- `conservation-planning` (conservation planning, 5) ↔ `urban-conservation-planning` (urban conservation planning, 3)
- `urban-blue-spaces` (urban blue spaces, 4) ↔ `blue-spaces` (blue spaces, 3)
- `urban-wildlife-conservation` (urban wildlife conservation, 3) ↔ `wildlife-conservation` (wildlife conservation, 3)
- `scaling-laws` (scaling laws, 3) ↔ `urban-scaling-laws` (urban scaling laws, 3)

## Deviations from `docs/reach/RIPPLE-MAP.md`

- **Sankey:** design left open “Fields toggle vs retire”; Ken settled **retire** (see `STEERING-RETIRE-SANKEY.md`).
- **maxDistance / rings:** builder uses max distance 3 (Ken's papers already span all four OpenAlex domains), so the outer ring is “same domain” rather than “other domain”.
- **Sector width:** by keywords shown, as designed; Flood is emerging (12 works) with arc only.
- **Static SVG no-JS fallback:** not shipped in this preview; JS circle/strip + table view cover a11y. Follow-up.
- **Time filter (All years / Since 2023):** deferred to phase 4.
- **build-reach-flow** still runs in the monthly workflow so `reach-flow.json` stays warm; the Sankey UI is not wired.
- **influence.json asOf** bumped to 2026-10-10 when the cache was warmed; unique citing works still 3,102 / 116 countries (same as prior snapshot aside from timestamps).

## How to regenerate

```bash
# Optional: warm citing-work cache (gitignored under /.cache/)
node scripts/influence/fetch-influence.mjs
# Offline rebuild from cache + influence.json
node scripts/influence/build-ripple.mjs --offline
# Or online:
node scripts/influence/build-ripple.mjs
```

Full per-theme tables (including candidates not shown): `docs/reach/ripple-keyword-report.md`.

## Screenshots

- `/workspace/redesign/screenshots/preview-ripple-1280.png` (also `preview-ripple-desktop-1280.png`)
- `/workspace/redesign/screenshots/preview-ripple-720.png`
- `/workspace/redesign/screenshots/preview-ripple-380.png` (also `preview-ripple-mobile-380.png`)
- Repo copies: `docs/reach/screenshots/preview-ripple-*.png`
- Dark theme: N/A (site has no dark mode).

## PR

_Filled after open: PR # and HEAD SHA._
## Open aliases needing Ken (priority)

Full auto-detected list: `docs/reach/ripple-keyword-report.md` § Alias candidates.

**Already seeded in `keyword-aliases.json` (confirm or revert):**
- UHI family → `urban-heat-island`
- `green-spaces` → `urban-green-space`
- SSP spelling variants
- ecosystem-service-value / land-use-and-land-cover / urban-cooling-effect

**One acronym pair:** `scale-invariant-feature-transform` ↔ `sift` (methods theme) — accept?

**“urban X” ↔ “X” (51 pairs):** builder left these separate on purpose so “urban land use change” does not vanish into “land use change”. Highest-traffic pairs already on the map:
- land use change ↔ urban land use change
- ecosystem services ↔ urban ecosystem services
- land surface temperature ↔ urban land surface temperature
- climate change adaptation ↔ urban climate change adaptation
- biodiversity conservation ↔ urban biodiversity conservation

Ken: fold any of these, or add to `rejected` so they stop appearing as candidates.
