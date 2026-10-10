# Ripple Map — Preview Report

**Branch:** `preview/reach-ripple` · **Status:** draft preview — do not merge until Ken says.
**Data as of:** 2026-10-10 (OpenAlex) · self-citations removed.
**Draft PR:** [#78](https://github.com/kangning-huang/main/pull/78) · HEAD `0381601` (`03816015fcf0579517935b6a76624299674e7a9f`).

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
- `urban-heat-island` ← `surface-urban-heat-island`, `urban-heat-island-intensity`, `surface-urban-heat-island-intensity`, `uhi-intensity`
- `urban-green-space` ← `green-spaces`
- `shared-socioeconomic-pathways` ← `socioeconomic-pathways`
- `ecosystem-service-value` ← `ecosystem-services-value`
- `land-use-and-land-cover` ← `land-use-land-cover`
- `urban-cooling` ← `urban-cooling-effect`

## Open aliases needing Ken (priority)

Full auto-detected list: `docs/reach/ripple-keyword-report.md` § Alias candidates.

**Already seeded (confirm or revert):** UHI family → urban-heat-island; green-spaces → urban-green-space; SSP spelling; ecosystem-service-value; land-use-and-land-cover; urban-cooling-effect.

**One acronym pair:** `scale-invariant-feature-transform` ↔ `sift` (methods) — accept?

**“urban X” ↔ “X” (51 pairs):** left separate on purpose. Highest-traffic on-map pairs: land use change; ecosystem services; land surface temperature; climate change adaptation; biodiversity conservation. Fold into `merge` or add to `rejected`.

## Deviations from `docs/reach/RIPPLE-MAP.md`

- **Sankey:** Ken settled **retire** (no Fields toggle).
- **maxDistance / rings:** max distance 3 (Ken's papers span all four OpenAlex domains); outer ring = same domain.
- **Flood:** emerging (12 works) — arc only, no bubbles.
- **Static SVG no-JS fallback:** not in this preview; table view covers a11y. Follow-up.
- **Time filter (Since 2023):** deferred.
- **Monthly workflow:** YAML at `docs/reach/influence.workflow.yml` (fetch + build-reach-flow + build-ripple). Not copied to `.github/workflows/` on this branch — current OAuth token lacks `workflow` scope. Activate at launch.
- **influence.json asOf** 2026-10-10; unique citing works still 3,102 / 116 countries.

## How to regenerate

```bash
node scripts/influence/fetch-influence.mjs   # optional cache warm
node scripts/influence/build-ripple.mjs --offline
```

Full per-theme tables: `docs/reach/ripple-keyword-report.md`.

## Screenshots

- `/workspace/redesign/screenshots/preview-ripple-1280.png` (also `preview-ripple-desktop-1280.png`)
- `/workspace/redesign/screenshots/preview-ripple-720.png`
- `/workspace/redesign/screenshots/preview-ripple-380.png` (also `preview-ripple-mobile-380.png`)
- Repo: `docs/reach/screenshots/preview-ripple-*.png`
- Dark theme: N/A (site has no dark mode).
