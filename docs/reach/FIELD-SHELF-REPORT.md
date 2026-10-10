# Reach Field & Shelf — Preview Report

**Branch:** `preview/reach-field-shelf` @ `c1a45ef` (forked from `preview/reach-constellation`, PR #80 tip `b9030ef`) · **Status:** draft — **do not merge**.
**UI:** `/reach?viz=field-shelf` (on this branch `/reach` opens on Field & Shelf; `?viz=ripple`, `beeswarm`, `clusters`, `constellation` open the others). The toggle reads **Ripple | Beeswarm (A) | Clusters (C) | Constellation | Field & Shelf**; the banner reads “PREVIEW — Ripple | Beeswarm | Clusters | Constellation | Field & Shelf — not merged”.
**Data:** the OpenAlex snapshot behind `influence.json` (as of 2026-10-10; cached citing lists, no new fetch), self-citations removed by the same strict per-paper rule. Every count below is recounted from the cache by `scripts/influence/build-field-shelf.mjs`; nothing is estimated or hand-entered.
**Plan:** [`FIELD-SHELF-PLAN.md`](FIELD-SHELF-PLAN.md) · per-run detail: [`field-shelf-report.md`](field-shelf-report.md) (rewritten by every build).

## What it is

One square per OpenAlex work that cites Ken's papers (3,102 in All, 573 in Lead), packed into a calm field by topic distance from the **fixed home topics of his 11 lead papers**: ink in the core (a home topic), light ember for neighbours (same subfield or field), ember further out (same domain, another domain, or no topic). Direction means nothing. His papers stand above the field as a shelf of spines, grouped by theme and then year, each with its count of non-self citing works (“0 yet” when nobody cites it so far).

- Hover or Tab to a spine → its citers light up, the rest dim to 15 %, and the readout says e.g. `ERL 2019 · 392 citing · 37% outside home topics`. No line fans.
- Hover a square → a card (title, first author, venue, year, “Builds on”, band and topic, OpenAlex link, DOI secondary) and at most 4 thin lines back to the spines it cites. Click → the OpenAlex record in a new tab.
- Search (title, any author, venue, year) lights hits in teal; ↑ ↓ locate them, Enter opens OpenAlex. “Show me one” picks a random outside-home article or review (within the lit paper's citers if one is pinned).
- Phone (< 720 px): the field is a picture (sticky while a paper is open), the shelf is a list with counts and outside share; tap a paper for its band split and most-cited citers; search and “Show me one” open a card. A tap on the field picks the nearest square (bonus).
- URL: `?viz=field-shelf&lens=all|lead&shelf=<doi>&fs=<OpenAlex id>`. “Show as table” lists every square (title, year, venue, builds on, band and distance).

| | Ripple | Beeswarm (A) | Clusters (C) | Constellation | **Field & Shelf** |
| --- | --- | --- | --- | --- | --- |
| Unit | keyword bubble | keyword bubble | keyword bubble | keyword disc + paper star | **one square per citing work** |
| Position | radius = reach distance | x = reach distance | co-occurrence | embedding neighbourhoods | **centre → edge = topic distance (fixed lead set)** |
| Unique | polar breadth headline | readable facets | keyword links | drift and bridges | **scale + breadth in one picture; every square opens a real record** |
| Phone | strip | rows | smaller map | region cards | **hero field + shelf list + search** |

## Decisions applied

| Decision | Applied as |
| --- | --- |
| Variant | A — Field & Shelf (locked) |
| Default corpus | All, 3,102 squares (locked); the page-level All / Lead chip filters squares and shelf |
| “How it cites” | Omitted (locked): no citation-intent text anywhere |
| Home topics | Fixed **Lead set**: 22 OpenAlex topics, computed once (locked). Squares never change colour with the chip — the builder asserts it |
| Heat at rest | Topic-distance bands only: core d = 0 ink · neighbour d = 1–2 light ember · further d ≥ 3 or untagged ember |
| Links | Shelf hover lights citers (dim ≈ 15 %), no fan; square hover ≤ 4 lines |
| Panel | Light, on-brand (`#fffcf7` paper, ink, ember, teal); no forest / mint |
| Render | Canvas 2D squares (3 px, pixel-snapped at any device pixel ratio, 6 px staggered grid, ±1 px jitter) + HTML card; tooltip payloads lazy-loaded |
| Click | OpenAlex record; DOI secondary in the card |
| Uncited lead papers | On the shelf as “0 yet” (phone list: `year · 0 yet`) |
| Shelf order | Fine theme (Reach order), then year |
| Entrance | One fill in citation-year order (~2 s) when the field first scrolls into view; reduced motion → final state at once |
| Density | Constant: Lead is packed at the same pitch, so it is visibly smaller (linear × 0.43) in the same frame; All ↔ Lead glide (700 ms, none with reduced motion) |
| Record types | Same inclusion as the influence pipeline (articles, preprints, chapters, peer reviews, …); “Show me one” prefers articles and reviews with a venue |

## Sanity checks (all PASS, from the builder)

| Check | Result |
| --- | --- |
| `views.all.totals.citingWorks` vs `influence.json` `views.all.totals.uniqueCitingWorks` | **3,102 = 3,102** |
| `views.lead.totals.citingWorks` vs `influence.json` Lead | **573 = 573** |
| Non-self citing links (Σ paperIdxs over squares) | 3,333 = 3,333 (All) · 579 = 579 (Lead) |
| Self-citations removed | 322 = 322 (All) · 44 = 44 (Lead) |
| Papers | 24 (11 lead) = 24 (11 lead) |
| Every paper's non-self citing works vs `influence.json` `papers[].citingNonSelf` | all 24 match |
| Co-author-only share of All | 81.5 % = 81.5 % (2,529 of 3,102) |
| Max `paperIdxs.length` | **4** in All (≤ 4 lines per square) · 2 in Lead |
| One square per OpenAlex id | 3,102 unique · 573 unique |
| Every shelf paper present, including 0-cite | All 24 · Lead **11** (Discover Env 2024, npj ESS 2026, Sci Rep 2026 show “0 yet”) |
| Lead squares ⊂ All squares; Lead squares point only at lead papers | yes |
| No square changes band between All and Lead | yes |
| Squares never touch | min gap 1 px in both views |

The builder exits non-zero and writes nothing if any of these fail on the same snapshot date as `influence.json`.

## Fixed home topics (H_lead)

The union of OpenAlex `topics[]` plus the assigned topic on the 11 lead papers: **22 topics** in 16 subfields, 6 fields and 2 domains (so distances run 0–4).

| Topic | Subfield | Field | Domain | On lead papers |
| --- | --- | --- | --- | --- |
| Advanced Multi-Objective Optimization Algorithms | Computational Theory and Mathematics | Computer Science | Physical Sciences | IJGIS 2013 |
| Remote Sensing and Land Use | Atmospheric Science | Earth and Planetary Sciences | Physical Sciences | Urban Climate 2021 |
| Artificial Immune Systems Applications | Biomedical Engineering | Engineering | Physical Sciences | IJGIS 2013 |
| Earthquake and Tsunami Effects | Civil and Structural Engineering | Engineering | Physical Sciences | Sci Rep 2026 |
| Remote-Sensing Image Classification | Media Technology | Engineering | Physical Sciences | Remote Sensing 2025 |
| Synthetic Aperture Radar (SAR) Applications and Techniques | Aerospace Engineering | Engineering | Physical Sciences | Remote Sensing 2025 |
| Climate Change and Health Impacts | Health, Toxicology and Mutagenesis | Environmental Science | Physical Sciences | JGR-A 2021, Sci Rep 2025 |
| Climate variability and models | Global and Planetary Change | Environmental Science | Physical Sciences | ERL 2019, JGR-A 2021 |
| Flood Risk Assessment and Management | Global and Planetary Change | Environmental Science | Physical Sciences | Remote Sensing 2025, Sci Rep 2026 |
| Forest Management and Policy | Global and Planetary Change | Environmental Science | Physical Sciences | Nat Clim Change 2022 |
| Land Use and Ecosystem Services | Global and Planetary Change | Environmental Science | Physical Sciences | ERL 2019, IJGIS 2013, Urban Climate 2021, Sci Rep 2025, npj ESS 2026 |
| Species Distribution and Climate Change | Ecological Modeling | Environmental Science | Physical Sciences | Nat Clim Change 2022 |
| Urban Arborization and Environmental Studies | Management, Monitoring, Policy and Law | Environmental Science | Physical Sciences | Nat Clim Change 2022 |
| Urban Green Space and Health | Health, Toxicology and Mutagenesis | Environmental Science | Physical Sciences | JAPA 2026 |
| Urban Heat Island Mitigation | Environmental Engineering | Environmental Science | Physical Sciences | ERL 2019, JGR-A 2021, Urban Climate 2021, Sci Rep 2025, npj ESS 2026 |
| Urban Planning and Landscape Design | Management, Monitoring, Policy and Law | Environmental Science | Physical Sciences | JAPA 2026 |
| Belt and Road Initiative | Economics and Econometrics | Economics, Econometrics and Finance | Social Sciences | Discover Env 2024 |
| Climate Change Policy and Economics | Economics and Econometrics | Economics, Econometrics and Finance | Social Sciences | Discover Env 2024 |
| Sustainable Finance and Green Bonds | Finance | Economics, Econometrics and Finance | Social Sciences | Discover Env 2024 |
| Disaster Management and Resilience | Sociology and Political Science | Social Sciences | Social Sciences | Sci Rep 2026 |
| Human Mobility and Location-Based Analysis | Transportation | Social Sciences | Social Sciences | JAPA 2026 |
| Urban and Rural Development Challenges | Urban Studies | Social Sciences | Social Sciences | npj ESS 2026 |

## Band shares

| View | Citing works | Core (d 0) | Neighbour (d 1–2) | Further (d ≥ 3 or no topic) | Outside home (d ≠ 0) |
| --- | ---: | ---: | ---: | ---: | ---: |
| All | 3,102 | 1,566 (50.5 %) | 1,284 (41.4 %) | 252 (8.1 %) | **1,536 (49.5 %)** |
| Lead | 573 | 370 (64.6 %) | 154 (26.9 %) | 49 (8.6 %) | **203 (35.4 %)** |

| View | d = 0 | 1 | 2 | 3 | 4 | no topic |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| All | 1,566 | 680 | 604 | 40 | 211 | 1 |
| Lead | 370 | 91 | 63 | 10 | 39 | 0 |

**Outside-% is recomputed, not reused.** `influence.json` (and the Ripple) count a work as outside when its topic is not among the 44 topics of *all 24* pinned papers: 1,064 of 3,102 (34.3 %) in All, 167 of 573 in Lead. Field & Shelf measures against the fixed lead set, so it reports 1,536 of 3,102 (All) and 203 of 573 (Lead). The headline (“Half sit outside the topics of Ken's lead papers”) and the method line under the legend name the rule and cite the Ripple's 1,064 for comparison. `influence.json` is unchanged.

## How many of Ken's papers a citing work cites

| View | 1 paper | 2 | 3 | 4 | max |
| --- | ---: | ---: | ---: | ---: | ---: |
| All | 2,896 (93.4 %) | 183 | 21 | 2 | 4 |
| Lead | 567 (99.0 %) | 6 | 0 | 0 | 2 |

Co-author share: **2,529 of 3,102 All squares (81.5 %) cite only co-authored papers.** The All caption says so (“About four in five All squares (81.5 %) cite only co-authored papers; use First / last / corresponding to narrow”).

## Shelf

| # | Paper | Lens | Citing (non-self) | Outside home | Core / neighbour / further |
| ---: | --- | --- | ---: | ---: | --- |
| 1 | IJGIS 2013 · land-use allocation | lead | 79 | 33 (42 %) | 46 / 29 / 4 |
| 2 | ERL 2019 · urban expansion to 2050 | lead | 392 | 144 (37 %) | 248 / 101 / 43 |
| 3 | Nat Commun 2020 · SSP urban land projections | co-author | 799 | 317 (40 %) | 482 / 256 / 61 |
| 4 | Nat Sustain 2020 · global urban change 1985–2015 | co-author | 773 | 362 (47 %) | 411 / 299 / 63 |
| 5 | Nat Sustain 2020 · urban growth & biodiversity | co-author | 569 | 325 (57 %) | 244 / 251 / 74 |
| 6 | IJGIS 2012 · MACO land-use allocation | co-author | 133 | 55 (41 %) | 78 / 49 / 6 |
| 7 | IEEE TGRS 2013 · multisensor registration | co-author | 94 | 86 (91 %) | 8 / 85 / 1 |
| 8 | JAPA 2026 · rhythmized urban parks | lead | 1 | 0 (0 %) | 1 / 0 / 0 |
| 9 | RSE 2015 · snow depth retrieval | co-author | 10 | 10 (100 %) | 0 / 10 / 0 |
| 10 | Discover Env 2024 · Belt and Road heat/flood | lead | **0 yet** | — | — |
| 11 | Remote Sensing 2025 · inundation mapping | lead | 2 | 1 (50 %) | 1 / 1 / 0 |
| 12 | Sci Rep 2026 · height-aware flood risk | lead | **0 yet** | — | — |
| 13 | JGR-A 2021 · nighttime heat stress | lead | 63 | 12 (19 %) | 51 / 11 / 1 |
| 14 | Urban Climate 2021 · urban climate forecasts | lead | 19 | 5 (26 %) | 14 / 5 / 0 |
| 15 | Nat Clim Change 2025 · urban overheating mortality | co-author | 65 | 7 (11 %) | 58 / 7 / 0 |
| 16 | Nature Cities 2025 · urban browning heat stress | co-author | 31 | 5 (16 %) | 26 / 3 / 2 |
| 17 | Sci Rep 2025 · urban density & heat | lead | 9 | 4 (44 %) | 5 / 3 / 1 |
| 18 | Nat Clim Change 2022 · urban forests | lead | 14 | 5 (36 %) | 9 / 5 / 0 |
| 19 | ES&T 2024 · AC usage & indoor–outdoor heat | co-author | 7 | 0 (0 %) | 7 / 0 / 0 |
| 20 | ES&T 2025 · urban tree cooling | co-author | 53 | 7 (13 %) | 46 / 6 / 1 |
| 21 | npj ESS 2026 · demolition & cooling | lead | **0 yet** | — | — |
| 22 | Atmos Environ 2018 · dust emissions | co-author | 86 | 85 (99 %) | 1 / 83 / 2 |
| 23 | ES&T 2019 · road dust PM2.5 | co-author | 131 | 131 (100 %) | 0 / 128 / 3 |
| 24 | Toxics 2025 · air pollution & anxiety visits | co-author | 3 | 3 (100 %) | 0 / 3 / 0 |

Order: Reach themes (Urban expansion & futures, Form & methods, Flood & coasts, Heat exposure & health, Cooling & greening, Air quality / dust), then the hand-pinned year in `dois.json` (which matches the short labels; OpenAlex dates IJGIS 2013 and Nat Sustain 2020 · urban growth a year earlier and JAPA 2026 to 2025). The plan's example readout said “ERL 2019 · 392 citing · 31 % outside”; the computed value against the fixed lead set is **37 %**, and that is what the page shows. Co-authored papers outside the lead topics (air quality, dust, snow, registration) read as almost entirely “outside” — a property of the fixed lead rule, which the caption states.

## Record types

Every OpenAlex record type the pipeline counts is a square: articles 2,656, preprints 141, book chapters 90, peer reviews 66, conference papers 57, reviews 32, dissertations 22, data papers 18, editorials 5, reference entries 4, books 4, reports 4, other / conference abstract / paratext 1 each (All). 111 All squares have no venue and 3 no DOI (the card then links OpenAlex only). “Show me one” draws from outside-home articles and reviews with a venue: 1,296 (All) / 160 (Lead).

## Colour checks (dataviz validator, surface `#fffcf7`)

- Bands are ordinal, so the ember arm was validated with `--ordinal`: neighbour `#dd9270` (60 % ember on paper) → further `#c74b16` passes (monotone lightness, single hue, light end 2.44 : 1).
- All pairs of ink / light ember / ember: worst ΔE 16.8 normal vision, 15.3 deuteranopia (≥ 15 / ≥ 8). Ink is the neutral “inside” class, so the categorical band and chroma checks do not apply to it.
- Light ember is below 3 : 1 against paper, so meaning never rests on colour alone: the legend names and counts each band, the card prints the band and distance in words, and the table lists them.
- Teal `#0d7377` is reserved for focus: the hovered square's ring, its lines, the cited spines and search hits (drawn one pixel larger on every side).

## Payload sizes and git

| File | Raw | gzip | Loaded |
| --- | ---: | ---: | --- |
| `src/data/field-shelf.json` (layout, both views) | 158 KB | 45 KB | with the page |
| `public/data/field-shelf-tooltips-all.json` | 1.0 MB | 347 KB | first hover / search / “Show me one” / table in All |
| `public/data/field-shelf-tooltips-lead.json` | 198 KB | 69 KB | prefetched when Lead is chosen (the All file also serves Lead) |

Both tooltip files are committed: each is well under the 2 MB limit and both regenerate from the cache with the layout. The All file is larger than the plan's ~250 KB gzip estimate because it carries authors 2–25 of every work so search can find co-authors, not only first authors (titles 112 KB gzip, author names 88 KB gzip).

## Verification

- `node scripts/influence/build-field-shelf.mjs --offline`: all checks pass (0 requests, 48 cache hits).
- `npm run build`: passes; `/reach` is prerendered (static export). `src/data/blog-posts.json`, rewritten by the build's blog fetch, is not committed.
- Static export in Chrome: the only console error on `/reach` is React #418, a text hydration mismatch that is **pre-existing**: the Where section's country names differ between Node's ICU and Chrome's (“Hong Kong SAR China” vs “Hong Kong”). PR #80's build shows the same error. With those names stubbed in a throwaway build, `/reach` logged **no errors** for `?viz=field-shelf` (All, Lead, with `shelf=` and `fs=`), `ripple` and `constellation`.
- Browser checks (Playwright, static export): 3,102 squares drawn (27,918 px at 1×); focusing the ERL 2019 spine shows its readout and lights exactly 392 squares, dimming 2,710; Enter pins it (`?shelf=`), Esc clears; search “seto” finds 6 works (Karen Seto as co-author), ↓ locates the first (`?fs=`), Enter opens OpenAlex; “Show me one” pins an outside-home article and announces its title; a click on a square opens its OpenAlex record, a click on empty space clears; Lead draws 573 squares and 11 spines; the table lists titles. Phone (380 × 820, 2×): hero drawn, “Show me one” card, a tapped paper expands and the hero stays under the site header while scrolling.
- `npx tsc --noEmit` and ESLint (React Compiler rules) pass on every new or changed file.

## Screenshots

- Required: `/workspace/redesign/screenshots/preview-reach-field-shelf-1280.png`, `…-380.png`, `…-hover.png` (copies in `docs/reach/screenshots/`). The hover shot shows an IPCC AR6 chapter that cites four of Ken's papers: card plus four lines to ERL 2019, Nat Commun 2020 and both Nat Sustain 2020 papers.
- Review states (not committed): `/workspace/redesign/screenshots/preview-reach-field-shelf-{1280-lead,1280-shelf,1280-search,1280-zh,720,380-paper}.png`. Regenerate with `CHROMIUM_PATH=/usr/bin/google-chrome node scripts/reach/field-shelf-screenshots.mjs <baseUrl> <outDir…>` (`ONLY=` to pick).

## Known issues and open questions

- The page intro above the chip still describes the Ripple (“Keywords from the works that cite Ken's papers…”). Left as is so the five previews share one intro; reword at merge if Field & Shelf wins.
- Theme names are fitted for the narrowest desktop stage (lg at 1024 px), so some use two lines even where one would fit.
- The field is not keyboard-navigable square by square (3,102 stops); keyboard and screen-reader users reach every work through the shelf, search and table, as the plan specifies.
- `next dev` shows the same pre-existing hydration notice on every `/reach` view.
- Open for Ken (from the plan): which viz to retire, a dark panel, Semantic Scholar / curated “how it cites”, shelf order, a static dossier figure.
