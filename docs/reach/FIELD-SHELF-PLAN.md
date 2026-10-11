# Reach — Field & Shelf implementation plan

**Status:** plan only — **no code, no PR** until Ken approves.  
**Date:** 2026-10-11 (Asia/Taipei)  
**Variant:** **A — Field & Shelf** (Lizheng-style citing-paper field + labelled shelf of Ken’s papers)  
**Sources:** `TWO-DISC-BRIEF.md`, Opus / Website Manager opinions, Lizheng screenshots (`/workspace/redesign/screenshots/lizheng-city-*.png`), live OpenAlex snapshot (`influence.json` 2026-10-09 + `.cache/openalex` 2026-10-10), existing Ripple / Beeswarm / Clusters / Constellation builders.

---

## Locked decisions (Ken, 2026-10-11)

| Decision | Choice |
|---|---|
| Variant | **A — Field & Shelf** |
| Default corpus | **All** (~3,102 citing works / 24 papers) |
| “How it cites” | **Omit in v1** (no OpenAlex intent; no AI blurbs; S2 / curated later) |
| Outside-home coloring | **Fixed home-topic set from Lead papers** (~22 OpenAlex topics). Squares **do not recolor** when All ↔ Lead chip flips. Chip still **filters** which shelf items and which dots are shown. |

---

## 0. Recommendations Ken can override

These are **assumed defaults** for the plan; flag any change before build.

| Topic | Recommendation | Override note |
|---|---|---|
| Heat at rest | **Topic-distance bands only** (core = inside Lead home topics; ember = further). **Not** citing-paper citation count (dims newest third). | Recency or cites/yr heat if Ken asks |
| Links | Shelf hover → **light that paper’s citers, no fan**. Citing-square hover → **≤4** thin lines to shelf. | Never draw hub fans (392–799 lines) |
| Tooltip | Title, first author, venue, year, `Builds on: {Ken short titles}`, topic path / outside flag | No citation-sentence line in v1 |
| Panel | **Light on-brand** (`#fffcf7` paper / ink / ember / teal). Not Lizheng forest+mint. | Dark ink panel only if Ken asks later |
| Placement (preview) | Ship as **fifth viz toggle** on a draft PR beside Ripple / Beeswarm / Clusters / Constellation | After Ken picks a winner, **retire one** (open leftover) |
| Render | **Canvas 2D** squares + **HTML tooltip**; lazy-load tooltip payload (~250 KB gzip All) | SVG only if canvas a11y path fails |
| Click | Primary → **OpenAlex record**; DOI as secondary link in tooltip | DOI-primary if Ken prefers |
| Phone | Field as **static-ish hero**; shelf as **list**; search + “show me one”; nearest-square tap is bonus only | Full per-dot tap not required |
| Uncited Lead papers | **Show on shelf** as e.g. `2026 · 0 yet` | Hide only if Ken asks |
| Record types | **Keep current influence pipeline inclusion** (document types in Method/caption). **Do not** change headline N without Ken. | Peer reviews / preprint merge = separate decision |
| Shelf order | By **fine theme**, then year (matches Reach themes) | Year-only or count-sorted if Ken asks |
| Entrance | One fill in citation-year order (~2 s), then hold still; `prefers-reduced-motion` → final state immediately | No endless breathe / wandering spotlight |
| Density | **Constant** All ↔ Lead so Lead field visibly shrinks (~43% linear) | Equal panel size would inflate Lead |

---

## 1. Goals / non-goals

### Goals

1. **One square = one citing paper** that opens a real OpenAlex record (tenure-checkable).
2. Prove **scale + breadth** in one hero: ~3,102 squares; ember halo ≈ works outside Lead home topics (fixed definition).
3. Show **which of Ken’s papers a citer builds on** via shelf highlight / ≤4 lines — without inventing citation intent.
4. Stay **on-brand and quiet** (Lizheng calm, not Lizheng identity).
5. Land as a **preview** Ken can compare to Ripple / Beeswarm / Clusters / Constellation before any live merge.
6. Reuse the existing OpenAlex cache and Ripple distance scale — **no new fetch** for v1 layout.

### Non-goals (v1)

- Tilted / faux-3D two discs, WebGL “city,” stacked plates.
- Fans of hundreds of lines from hub papers.
- “How it cites” sentences (Semantic Scholar, scite, or AI).
- Recoloring outside-home when the All/Lead chip flips.
- Changing which OpenAlex record types count (or merging preprint↔journal) without Ken.
- Copying Lizheng palette, “We’re building a city” copy, or constant motion.
- Shipping as the sole Reach viz or merging without Ken’s pick among the five previews.
- Using the interactive canvas as the printed dossier figure (static export is a later milestone).

---

## 2. Visual encoding

| Channel | Encoding | Notes |
|---|---|---|
| **Mark** | Axis-aligned **square** (≈3 px CSS, pixel-snapped) | Constant size — one square = one paper |
| **Position** | Lizheng-style packed field: cells sorted by **topic distance** from fixed Lead home set, then stable tie-break (year, then OpenAlex id) | Direction around the field means nothing (legend says so) |
| **Band / color** | **3 bands** (collapse Ripple’s 0–4): **core** `d=0` (ink), **neighbour** `d=1–2` (light ember), **further** `d≥3` or untagged (ember) | Same color whether All or Lead is selected |
| **Shelf** | Labelled row of Ken’s papers above the field | Lead: 11 full labels. All: theme ticks + short labels; full title on hover |
| **Shelf → field** | Hover/focus shelf item → light that paper’s citers; dim others ≈15%; **no lines** | Readout e.g. `ERL 2019 · 392 citing · 31% outside home topics` |
| **Field → shelf** | Hover/focus square → HTML tooltip + **≤4** thin lines to shelf papers it cites | 93% of All cite exactly one of Ken’s papers |
| **Uncited Lead** | Shelf chip with count `0 yet` + year | Still filterable; no lit squares |
| **Chip All/Lead** | Filters shelf membership and which squares are drawn; **does not** recompute home set or recolor | Constant density → Lead field smaller |
| **Panel** | Light paper background, ink squares, ember outside, teal for focus ring / search hit | Optional dark panel = later toggle, not default |
| **Motion** | Optional one-shot year-order fill; then static | Reduced-motion: no fill animation |

**Caption (All default, honest):**  
“3,102 squares — one per OpenAlex work that cites this corpus. Ember marks works outside the home topics of Ken’s lead papers. About four in five All squares cite only co-authored papers; use **First / last / corresponding** to narrow.”

Exact outside-% for the fixed Lead home set should be recomputed in the builder and written into `field-shelf.json` meta (Opus’s read-only estimate was ~50% of All against Lead’s 22; live influence currently reports 1,064/3,102 ≈ 34% against **view-dependent** home topics — the fixed Lead rule will differ and must be labelled).

---

## 3. Data model + build script

### 3.1 Inputs (reuse — do not refetch for layout)

| Input | Path (worktree-relative) | Role |
|---|---|---|
| Paper pins + themes | `data/influence/dois.json`, `data/influence/fine-themes.json` | Shelf membership, short titles, lens |
| OpenAlex works + citing lists | `.cache/openalex/works/`, `.cache/openalex/citing/` | Via `scripts/influence/lib/openalex.mjs` (`getWork`, `getCiting`) |
| Self-cite rule | Same as `fetch-influence.mjs` / Ripple | Exclude self-cites from dots |
| Live totals / Method copy | `src/data/influence.json` | Cross-check N; do not invent new N |
| Distance helpers | `scripts/influence/lib/ripple-layout.mjs` + Ripple `distance()` logic | Reuse `d ∈ {0,1,2,3,4}` then band |

### 3.2 Fixed home-topic set (Lead)

1. Load all pinned papers with `lens === "lead"` (and `status !== "pending"`).
2. Union OpenAlex `topics[]` (+ assigned primary topic) on those Lead works → set **H_lead** (and subfield / field / domain sets for distance), same as Ripple’s `addHome` but **Lead-only**, **once**.
3. Persist `homeTopicsLead: [{id, name, subfield, field, domain}, …]` and `homeTopicsLeadCount` in output meta.
4. For every citing work (All and Lead views), compute `d = distance(primary_topic)` against **H_lead** only. Store `band: "core"|"neighbour"|"further"` and `outside: d !== 0` (untagged → further / outside).
5. When building the Lead **filter**, only include citing works that cite ≥1 Lead paper; when All, include all non-self citers of any pinned paper. **Recolor never runs again.**

### 3.3 Output artifacts

| File | Contents | Load |
|---|---|---|
| `src/data/field-shelf.json` | Layout + ids for All and Lead views; shelf; meta; band counts; captions | With page (keep lean: positions + ids + band + citesPaperIndex[]) |
| `public/data/field-shelf-tooltips-all.json` (gzip via build or brotli if already used) | Per-citing-work tooltip payload keyed by OpenAlex short id | **Lazy** on first hover/search/“show me one” |
| `public/data/field-shelf-tooltips-lead.json` | Same, Lead subset | Lazy (small; can prefetch on Lead chip) |
| `docs/reach/field-shelf-report.md` | Sanity report: home topic list, band shares, multi-cite histogram, zero-cite Lead papers, N vs `influence.json` | Review only |

**Suggested `field-shelf.json` sketch (conceptual):**

```text
meta: {
  asOf, schema: "field-shelf/v1",
  defaultView: "all",
  homeTopicsRule: "lead-fixed",
  homeTopicsLeadCount, homeTopicsLead: [...],
  recordTypesNote: "same inclusion as influence pipeline",
  density: "constant",
  headlineAll / headlineLead
}
views.all | views.lead: {
  field: { width, height, cell, cx, cy },  // packing params
  squares: [{ id, x, y, band, paperIdxs[] }],  // paperIdxs into shelf
  shelf: [{ doi, short, year, theme, lens, citeCount, x }],
  bands: { core, neighbour, further },
  totals: { citingWorks, outsideHome, papers }
}
```

Tooltip payload (lazy): `{ id, title, author1, venue, year, openalexUrl, doiUrl?, buildsOn: [short…], topicPath, outside, type }`.

### 3.4 Builder steps (`scripts/influence/build-field-shelf.mjs`)

1. Read `dois.json` + `fine-themes.json`; skip pending DOIs.
2. Build **H_lead** from Lead works in cache.
3. For each pinned paper, load citing list; apply self-cite filter; attach `cites: [doi…]`.
4. Dedupe citing works by OpenAlex id (All unique ≈ 3,102; multi-cite papers get `paperIdxs` length 2–4).
5. Assign distance/band vs **H_lead**.
6. Pack squares (reuse or port Lizheng-style polar/grid sort-by-distance from `reach-alt-layout` / new `field-shelf-layout.mjs`): sort by `d`, then year, then id; place into elliptical (or rect) field at constant cell size.
7. Build shelf geometry (theme groups, label collision).
8. Write `field-shelf.json` + tooltip shards + markdown report.
9. Assert: `views.all.totals.citingWorks` equals `influence.json` totals within existing tolerance; Lead matches 573; max `paperIdxs.length` ≤ 4; every Lead shelf item present including 0-cite.

**Wire into package scripts:** `node scripts/influence/build-field-shelf.mjs` after cache exists (same as Ripple). No change to monthly fetch unless cache missing.

---

## 4. Interaction + URL state

### Desktop

| Action | Result |
|---|---|
| Hover / focus shelf paper | Light citers; dim rest; update readout; no line fan |
| Hover / focus square | Tooltip; ≤4 lines to shelf; teal focus ring |
| Click / Enter on square | Open **OpenAlex** work URL (new tab); tooltip also offers DOI if present |
| All / Lead chip | Filter shelf + squares; keep colors; resize field for constant density |
| Search (author / title / venue / year) | Match against lazy tooltip index once loaded; highlight hits; jump first |
| “Show me one” | Pick a random **journal-article-like** square outside home band if possible; open tooltip (avoid peer-review types in the random pool even if they remain as dots — soft preference, document in UI copy) |
| Esc / mouse leave | Clear hover state |

### URL state (shareable preview)

Use existing Reach query pattern if present; otherwise:

| Param | Values | Default |
|---|---|---|
| `viz` | `ripple` \| `beeswarm` \| `clusters` \| `constellation` \| **`field-shelf`** | preview default can be `field-shelf` on the draft PR only |
| `lens` | `all` \| `lead` | `all` |
| `fs` | OpenAlex short id of focused square (optional) | — |
| `shelf` | doi or short slug of focused shelf paper (optional) | — |

Chip + viz toggle write to `history.replaceState` (no clutter). Deep-link `?viz=field-shelf&lens=all` for Ken’s review.

### Preview chrome

- Fifth tab/label: **Field & Shelf** beside Ripple | Beeswarm | Clusters | Constellation.
- Banner: “Preview — not on the live site until you pick a viz.”
- Short legend under field: core / neighbour / further + “Direction means nothing.”

---

## 5. Mobile / a11y / fallback

### Mobile (&lt; ~720 px)

- **Field:** static hero (one paint; optional year-fill once). Not the primary picker.
- **Shelf:** vertical list with cite counts and outside-% per paper; tap → light field + list of top citers (from lazy payload).
- **Search + “Show me one”** required.
- Nearest-square hit-test on field tap = **bonus only** (All ≈ 100 squares under a fingertip).
- Lead view remains usable (wider spacing).

### Accessibility

- Shelf items and search results are real buttons/links in the DOM (not canvas-only).
- Canvas has `role="img"` + accessible name summarizing band counts; detailed exploration via shelf list + “Show as table” (id, year, venue, builds-on, outside).
- Keyboard: tab shelf → tab search → arrow among search hits; Enter opens OpenAlex.
- `prefers-reduced-motion`: skip fill animation.
- Focus rings use teal; contrast on paper background meets WCAG AA for text chrome (squares themselves are decorative density + meaning via legend).

### Fallback

- No canvas / reduced data: shelf list + band count summary + link to OpenAlex search of citing works.
- Tooltip fetch failure: show id + “Builds on” from layout file only; omit title until retry.
- Print / dossier: **out of scope for first preview PR**; note static SVG/PNG export of Lead view as milestone M4.

---

## 6. File list & milestones

### Likely files (preview branch, e.g. `preview/reach-field-shelf`)

| Path | Action |
|---|---|
| `scripts/influence/build-field-shelf.mjs` | **Add** builder |
| `scripts/influence/lib/field-shelf-layout.mjs` | **Add** packing + shelf layout |
| `scripts/influence/lib/openalex.mjs` | **Reuse** (no API change) |
| `src/data/field-shelf.json` | **Add** generated |
| `public/data/field-shelf-tooltips-{all,lead}.json` | **Add** generated (git-lfs or generate-in-CI; prefer generate from cache in CI like other large artifacts — if too large for git, document “build locally / CI artifact”) |
| `docs/reach/field-shelf-report.md` | **Add** generated report |
| `src/components/reach/FieldShelf.tsx` | **Add** section shell + toggle hook-in |
| `src/components/reach/FieldShelfCanvas.tsx` | **Add** canvas draw / hit-test |
| `src/components/reach/FieldShelfShelf.tsx` | **Add** shelf UI |
| `src/components/reach/FieldShelfTooltip.tsx` | **Add** HTML tooltip + lazy fetch |
| `src/components/reach/FieldShelfPhone.tsx` | **Add** list + hero |
| `src/components/reach/ReachVizToggle.tsx` (or RippleSection / ReachAltMarks) | **Edit** add 5th option |
| `src/app/reach/page.tsx` (or section parent) | **Edit** wire preview |
| `docs/reach/FIELD-SHELF-PLAN.md` | Optional copy of this plan into repo on PR |

Do **not** delete Ripple / Beeswarm / Clusters / Constellation in the preview PR.

### Milestones

| # | Milestone | Exit criteria |
|---|---|---|
| **M0** | Plan approved | Ken OK on recommendations / open leftovers |
| **M1** | Data spike | Builder dry-run: H_lead list printed; band counts; N match; tooltip byte size measured |
| **M2** | Canvas spike | 3k squares + shelf hover light + ≤4 lines at 60 fps desktop; reduced-motion path |
| **M3** | **Draft preview PR** | Fifth viz live on preview URL; All default; screenshots desktop+phone; report attached; **not merged** |
| **M4** | Ken review | Pick Field & Shelf vs others; decide what to retire; optional dark panel; optional static Lead export |
| **M5** | Optional merge | Retire chosen viz; remove preview banner; Method footnote on fixed home-topic rule; caption honesty on coauthor share |

**Test (from Opus):** three readers × 30 s — (1) what is a square? (2) mostly inside or outside home topics? (3) roughly how many cite ERL 2019? (4) find one citer by author on phone. If (3) fails → put counts on shelf labels. If (1)/(2) fail → revisit encoding before merge.

---

## 7. Risks & mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| **All swamp by coauthors** | ~81.5% of All citers touch only co-authored papers; hubs are Nat Commun / Nat Sustain | Default All with **explicit caption**; Lead chip one click away; shelf marks `lens`; constant-density Lead shrink |
| **3k dots / hit-testing** | Fine on mouse (~6 px spacing); impossible as primary on phone | Phone = list + search + “show me one”; canvas hit-test desktop-first |
| **Spaghetti lines** | Hub hover would draw 392–799 lines | **Never** line-fan from shelf; only ≤4 lines from citing square |
| **Fixed vs live outside-%** | Fixed Lead home set changes the outside share vs today’s influence headline (1,064/3,102) | Recompute in builder; Method note: “Field & Shelf outside = vs Lead home topics, fixed”; don’t silently reuse old % |
| **Bad records as dots** | Peer reviews, empty venues, preprint duplicates openable | Keep pipeline inclusion per Ken; soften “show me one” away from junk types; Method documents types |
| **Tooltip weight** | ~0.9 MB raw / ~250 KB gzip All | Lazy load; Lead prefetch; don’t block LCP |
| **Label collision on All shelf** | 24 papers | Theme grouping + short labels + hover title |
| **Zero-cite Lead papers** | Look like failure | Show `year · 0 yet` |
| **Fifth viz fatigue** | Four previews already | Preview only; **retire one** after Ken picks (open leftover) |
| **Brand clash** | Lizheng forest/mint | Light paper panel; ember/teal only |
| **Print / dossier** | Canvas doesn’t print | Defer static Lead export to M4/M5 |

---

## 8. Open leftovers for Ken

Answer anytime; none block writing the preview if the §0 recommendations stand.

1. **Which viz to retire** after a winner is chosen — Ripple, Beeswarm, Clusters, Constellation, or Field & Shelf itself if another wins? *(Recommend: if Field & Shelf ships, retire **Constellation** or **Ripple** — Field & Shelf reuses Ripple’s distance story in a clearer “who cites me” unit.)*
2. **Dark ink panel** as an optional toggle, or never?
3. **Semantic Scholar / curated “how it cites”** later — measure Lead coverage first, hand-check 10–20 (`curated-uses.json` pattern), or skip indefinitely?
4. **Shelf order** — confirm theme→year vs year-only vs cite-count.
5. **Static dossier figure** (Lead, light, annotated bands) needed for tenure PDF?
6. **Tooltip random pool** — exclude peer-review / no-venue types from “Show me one” only, or also hide those dots? *(Plan assumes: still dots, softer random.)*
7. **Git vs CI for tooltip JSON** — commit Lead tooltips; generate All in CI / on build?

---

## 9. Effort estimate

| Work | Estimate |
|---|---|
| M1 data spike + report | **0.5–1 day** |
| M2 canvas + shelf interactions | **1–1.5 days** |
| M3 phone list, search, lazy tooltips, toggle chrome, screenshots, draft PR | **1–1.5 days** |
| Polish / a11y / Method copy | **0.5 day** |
| **Total to draft preview PR** | **≈ 3–4 focused days** (one implementer familiar with Reach builders) |
| M5 merge + retire another viz | **+0.5–1 day** after Ken’s pick |
| Optional: S2 coverage spike | **+1 day** separate track |
| Optional: static dossier export | **+0.5 day** |

Parallelism: M1 can start immediately after plan approval; UI can stub with fake 500 squares while M1 finishes, but **do not** merge without real OpenAlex-backed `field-shelf.json`.

---

## 10. Explicitly out of this plan

- Writing application code or opening a PR.
- Changing `influence.json` headline numbers or self-cite rules.
- Implementing Foundations (B) or Paper Fields (C).
- Reintroducing the Fields Sankey.

---

*End of plan. Short chat brief: `FIELD-SHELF-PLAN-SUMMARY.md`.*
