# Ripple Map — Design Doc

Oct 10, 2026 · @Kangning Huang

## Summary

The Ripple map replaces the top chart on /reach with a radial picture. Ken's research themes sit as sectors around a center, and keywords from citing works radiate outward as bubbles. A bubble's distance from the center shows how far that keyword sits from Ken's own research topics, so "reach" becomes literal geometry.

The current theme → subfield Sankey says where citing work is filed ("Land Use and Ecosystem Services", "Environmental Engineering"), not what it is about. Keywords such as urban birds, pollinators or PM2.5 say what it is about. A Sankey also implies that flows add up; keyword counts do not, because one citing work carries several keywords.

**Goals**

- Show what citing works study, in 30–50 concrete keywords.
- Show breadth honestly: how much of the citing vocabulary sits outside Ken's home fields.
- Read at a glance on a laptop and on a 380 px phone.
- Rebuild monthly inside the existing OpenAlex GitHub Action, with no hand editing beyond an alias file.

**Non-goals**

- Showing every keyword or every citing work; the topic cards and tables below keep that detail.
- Judging how a citation is used (method, data or background).
- Replacing the country map, institution list or growth panels.

## Audience and core message

The default view should leave every visitor with one sentence: this research is built on well beyond its home fields, by communities you can name. The geometry (radius) carries breadth; the sector labels and the lead-author lens carry identity.

| Visitor | What they need | How the Ripple map serves it |
| --- | --- | --- |
| Tenure reviewer | Evidence of influence beyond the subfield, at a glance | Headline share outside home topics; a visibly populated outer ring |
| Peer scientist | Which communities use which papers | Tap a keyword → its citing works and the cited paper |
| Prospective student | What problems the group's work touches | Concrete keywords grouped by theme |
| Journalist | A quotable, concrete example | Two or three callouts naming far-reaching keywords and landmark citing papers |

The headline is generated from data each month, in the form already on the page: "One in three works citing this research sits outside its home topics (1,064 of 3,102; OpenAlex, 2026-10-09)."

Open: Ken has not yet chosen whether breadth or identity leads. The design supports both; the choice sets the default lens and the headline wording.

## Visual encoding

Each visual channel carries one variable, and no channel implies that quantities add up.

&#91;embedded content: Ripple map schematic · six themes, four distance rings\]

The schematic shows the encoding only: sizes and positions are illustrative, and the example keywords come from the current topic cards. Phase 3 replaces it with the real layout.

| Element | Encodes | Rule |
| --- | --- | --- |
| Center disc | Citing works in the active lens | Label, e.g. "3,102 citing works" |
| Sector (angle) | The theme a keyword is mainly attached to | Six themes from fine-themes.json; angular width ∝ keywords shown, not citations |
| Theme arc, inner ring | The theme's citation volume | Band thickness ∝ citing works (or cites/yr), with the number as a label |
| Radius | The keyword's reach distance (see Data and metrics) | Continuous; dashed guide rings labelled same subfield, same field, same domain, other domain |
| Bubble area | Citing works in that theme carrying the keyword | Area ∝ count; a minimum size that stays tappable on a phone |
| Filled vs outline | New vs echo | Outline only = Ken's own papers in that theme also carry the keyword; filled = vocabulary the citers bring |
| Hue | Theme | Okabe–Ito palette, six hues, safe for color-blind readers |
| Links | Theme → keyword membership | Hidden at rest; drawn only when a theme is focused |

Sector width follows keyword count on purpose. The three 2020 coauthored papers carry 2,141 of 3,333 non-self citation links (64%). Width by citations would hand "Urban expansion & futures" about two-thirds of the circle and squeeze heat and scaling into slivers. Volume still shows, honestly, in the arc bands and bubble sizes.

Sector order puts related themes side by side, so shared keywords sit near both: Urban expansion & futures → Scaling, form & methods → Flood & coasts → Heat exposure & health → Cooling & greening → Air quality / dust.

**Labels.** The 20 largest bubbles are labelled at rest; the rest show on hover or tap. A label sits inside its bubble when it fits, otherwise just outside along the radius.

**Callouts.** Up to three, chosen from data each month: the largest keyword in the two outer rings, the keyword with the steepest three-year rise, and the largest bridge keyword (one shared by two or more themes).

## Data and metrics

The map adds one OpenAlex field to the citing works the pipeline already fetches after self-citation removal: each work's `keywords` list. Each entry has a slug id, a display name and a score from 0 to 1. The PNAS 2022 paper on biodiversity and urban land expansion, for example, carries 11 keywords, from "urban land expansion" (0.98) and "terrestrial vertebrates" (0.97) down to "urban clusters" (0.42) ([OpenAlex record](https://api.openalex.org/works/doi:10.1073/pnas.2117297119?select=id,keywords,primary_topic)).

**Pipeline steps**

1. Keep keywords with score ≥ 0.5, which drops weak tags like "urban clusters".
2. Merge aliases: OpenAlex slug ids first, then a hand-kept `keyword-aliases.json` (UHI → urban heat island, plural and spelling variants). Each run lists new candidate merges for Ken to accept.
3. Drop generic keywords: a short stoplist plus any keyword carried by more than 15% of all citing works.
4. Assign each citing work to themes through the paper it cites (fine-themes.json). A work citing two themes counts once in each.
5. Score every keyword within every theme and keep the top K per theme.
6. Compute each kept keyword's reach distance.
7. Flag echo keywords: the keyword also appears, at score ≥ 0.5, on one of Ken's own papers in that theme.
8. Flag bridge keywords: a second theme holds at least 25% of the keyword's citing works.

**Distinctiveness.** For keyword k and theme t, n\_kt counts citing works in t that carry k, N\_t counts all citing works in t, and n\_k and N are the totals across themes. A keyword is placed in the theme where its score s is highest, and needs n\_kt ≥ 3 and lift > 1 to be shown.

```latex
\mathrm{lift}(k,t)=\frac{n_{k,t}/N_t}{n_k/N},\qquad s_{k,t}=n_{k,t}\,\log\mathrm{lift}(k,t)
```

**Keywords per theme.** Large themes get more bubbles, but with a ceiling, so Urban expansion cannot crowd out the rest. A theme with fewer than 20 citing works shows its arc marked "emerging" and no bubbles; today that is Flood & coasts.

```latex
K_t=\min\!\left(12,\ \max\!\left(3,\ \mathrm{round}\!\left(\tfrac{1}{2}\sqrt{N_t}\right)\right)\right)
```

**Reach distance.** The home set H is the OpenAlex topics on Ken's papers, which the pipeline already computes for the "34% outside" figure. Today it pools all pinned papers in both lenses; a per-lens home set would make the lead view stricter. Each citing work w gets a distance d(w) from its assigned topic (the pipeline's existing rule: top topic scored 0.5 or more, else the primary topic) to the nearest home topic, using the OpenAlex hierarchy topic → subfield → field → domain. A keyword's radius is the mean distance over the works that carry it.

```latex
d(w)=\begin{cases}0 & \text{topic in } H\\ 1 & \text{same subfield}\\ 2 & \text{same field}\\ 3 & \text{same domain}\\ 4 & \text{other domain}\end{cases}\qquad \rho_k=\rho_0+(\rho_1-\rho_0)\,\frac{\bar d_k}{4}
```

Here ρ0 and ρ1 are the inner and outer plot radii. A keyword with fewer than 5 topic-tagged works is placed at its theme's median distance.

**Weights.** Absolute mode counts citing works. Per-year mode weights each work by 1 / max(1, years since the cited paper), matching the current chart.

**Starting parameters** (tune in phase 1)

| Parameter | Start value | Raise it to… |
| --- | --- | --- |
| Keyword score threshold | 0.5 | keep only core tags |
| Generic-keyword cutoff | 15% of citing works | keep broad terms |
| Minimum works per keyword in a theme | 3 | cut noise in small themes |
| Keywords per theme | 3 to 12 | show more detail |
| Bridge share | 25% | flag fewer bridges |
| Minimum theme size for bubbles | 20 citing works | hide more small themes |
| Labels at rest | 20 | label more, at the cost of clutter |

## Interaction

At rest the map shows sectors, bubbles, 20 labels and the callouts, with no links. Every interaction works by tap as well as hover, and reuses the page's existing lens and weight toggles.

| Action | Result |
| --- | --- |
| Hover or tap a theme arc | Other sectors dim; links draw from the arc to its keywords, including bridges placed in other sectors; a panel lists the theme's papers with non-self citing counts |
| Hover or tap a keyword | Panel: citing works carrying it, share outside home topics, which of Ken's papers they cite, and the three most-cited citing works with DOI links |
| Tap empty space or press Esc | Back to rest |
| Lens: All papers / First, last or corresponding author | Switches to that lens's pre-built data; the home set H changes with it |
| Weight: Absolute / Cites per year | Resizes bubbles and arc bands; positions stay put |
| Time filter (phase 4): All years / Since 2023 | Shows the vocabulary of recent citing work |

Position changes animate briefly; `prefers-reduced-motion` turns animation off.

The view lives in the URL (`?lens=lead&theme=heat&kw=urban-heat-island`), so a journalist or reviewer can share the exact state they saw.

Keyboard: Tab moves through theme arcs, then each sector's keywords from largest to smallest; Enter opens the panel.

## Mobile, accessibility and fallback

On a phone the circle unrolls into a strip with the same encoding: angle becomes a row per theme, and radius becomes the horizontal axis, home topics at the left and other domains at the right. A full circle at 380 px leaves bubbles too small to tap and labels too small to read. The strip keeps both and needs no sideways scrolling, which the current Sankey does.

| Viewport | Layout |
| --- | --- |
| 720 px and wider | Full ripple circle |
| Under 720 px | Unrolled strip: one beeswarm row per theme; vertical guide lines replace the guide rings |
| No JavaScript, print, social preview | Static SVG of the default view, rendered at build time |

**Accessibility**

- Hue is never the only cue: sectors carry text labels, and new vs echo uses filled vs outline.
- Okabe–Ito palette, checked in both light and dark themes.
- A "Show as table" link opens the same data: keyword, theme, citing works, reach distance, new or echo.
- The SVG carries a title and a description that state the headline and the callouts.
- Every bubble keeps a hit area of at least 24 × 24 CSS px (WCAG 2.2 target size).

## Implementation

The Ripple map follows the current Sankey's pattern: a Node builder writes JSON at build time, and a client component draws hand-rolled SVG from it. The browser computes nothing but hover state, so the page stays a static export.

**What exists today** (repo kangning-huang/main at commit 50a314f, 10 Oct 2026)

- Next.js 16, static export to GitHub Pages. The only chart libraries are d3-geo and topojson-client, for the map; the Sankey in `ReachFlowChart.tsx` is hand-rolled React SVG with English and Chinese labels.
- `fetch-influence.mjs` already requests `keywords` and `topics` for every citing work, but keeps only the first 8 keyword names, ignores their scores, and stores no per-work data in the snapshot.
- `build-reach-flow.mjs` re-fetches every citing work itself, applies fine-themes.json and the 1 / years-since weighting, and counts citation links, so a work citing two papers in one theme counts twice.
- The monthly workflow is staged at `docs/reach/influence.workflow.yml` and is not active. It runs only `fetch-influence.mjs`, so `reach-flow.json` is refreshed by hand. The page's Method note says the data refresh monthly, which is not yet true.

**Files**

| Path | Change | Role |
| --- | --- | --- |
| `scripts/influence/lib/openalex.mjs` | New | Shared fetch, retry, self-citation filter and an on-disk cache of citing works per paper, so all builders reuse one set of requests per run |
| `scripts/influence/build-ripple.mjs` | New | Pipeline steps 1–8 and the layout; writes `src/data/ripple.json` with an `all` block and a `lead` block |
| `data/influence/keyword-aliases.json` | New, hand-edited | Synonym merges and the generic-keyword stoplist (JSON, because the influence scripts have no npm dependencies) |
| `data/influence/keyword-zh.json` | New, hand-edited | Chinese labels for shown keywords; the builder lists missing ones; English is the fallback |
| `src/components/reach/RippleMap.tsx` | New | Circle layout, 720 px and wider |
| `src/components/reach/RippleStrip.tsx` | New | Unrolled strip under 720 px, same data |
| `src/components/reach/ReachFlowChart.tsx` | Kept | Behind a "Fields" toggle until the Sankey is retired |
| `.github/workflows/influence.yml` | Move and extend | Activate the staged workflow; add `build-reach-flow` and `build-ripple` steps |

**Counting rule.** A citing work counts once per theme if it is a non-self citation of at least one paper in that theme. This differs from the Sankey's link count, so the two charts' theme totals will not match exactly; the Method note should say so.

**Layout at build time.** Each bubble gets a polar target: its sector's angle, spread by rank, and the radius ρ\_k. About 300 rounds of pairwise collision relaxation then nudge bubbles mostly along the angle. The run is deterministic (sorted input, no randomness) and starts from last month's positions, so bubbles do not jump between snapshots. This stays within the scripts' no-dependency rule; d3-force as a devDependency is the fallback, at the cost of `npm ci` in the workflow.

**Data contract** (`src/data/ripple.json`, one block per lens)

```ts
interface RippleView {
  meta: { asOf: string; params: Record<string, number>; outsideHome: number; citingWorks: number };
  themes: {
    id: string; en: string; zh: string; color: string;
    works: number; perYear: number; emerging: boolean;
    angle: [start: number, end: number];
  }[];
  keywords: {
    id: string; en: string; zh?: string;
    theme: string; also: string[];          // placement theme; bridge themes
    works: number; perYear: number; lift: number; dMean: number;
    echo: boolean; bridge: boolean;
    circle: { x: number; y: number; r: number };
    strip: { x: number; y: number; r: number };
    top: { doi: string; title: string; year: number; citedBy: number; cites: string[] }[];
  }[];
  callouts: { kind: "farthest" | "rising" | "bridge"; keyword: string }[];
}
type RippleData = { all: RippleView; lead: RippleView };
```

## Risks and mitigations

The largest risk is a sector whose label promises more than its papers deliver; the rest are handled by rules already in this design.

| Risk | What a viewer would see | Mitigation |
| --- | --- | --- |
| Sector label outruns its papers | "Scaling, form & methods" filled with land-use optimization and image-registration keywords. Its cited papers are IJGIS 2012 (MACO), IEEE TGRS 2013 and JAPA 2026; no scaling paper is in the DOI list yet, because the Nature Cities paper's DOI is embargoed | Rename the sector "Form & methods" until the scaling paper resolves, or split TGRS 2013 into its own remote-sensing sector |
| Generic keywords | "urbanization" in every sector | Stoplist, the 15% rule and lift ranking |
| Coauthored 2020 papers dominate | The circle reads as a land-use chart | Sector width by keywords shown, a cap of 12 per theme, and the lead lens |
| Keyword drift between snapshots | Bubbles appear, vanish or jump month to month | Alias file, minimum counts, layout seeded from last month, and a printed diff of shown keywords per run |
| Topic misclassification | A keyword lands in the wrong ring | Mean over at least 5 works; guide rings instead of exact values; the panel shows the underlying share |
| Radius read as quality | "Outer = better" or "outer = fringe" | Plain ring labels and a one-line legend: farther out means cited from fields further from Ken's own |
| Totals differ from the Sankey | A reviewer spots two theme totals | Counting-rule note in Method |
| Monthly refresh not running | The page claims a monthly refresh that does not happen | Activate the staged workflow before launch |

## Open decisions and milestones

Five decisions are Ken's to make; the first two should be settled before phase 2.

- [ ] Lead message: breadth ("this work travels far beyond urban science") or identity ("these communities build on the heat and urban-form agenda"). Sets the default lens and the headline.
- [ ] Rename "Scaling, form & methods" or split IEEE TGRS 2013 into its own sector.
- [x] **Settled (Ken, 2026-10-10):** Retire the Fields Sankey at Ripple launch — do not keep it behind a Fields toggle. Ripple is the only section-01 chart. (`ReachFlowChart.tsx` / `reach-flow.json` may remain in-repo unused until a later cleanup PR.)
- [ ] Phone layout: unrolled strip (recommended) or packed bubbles.
- [ ] Commit the citing-work cache for reproducible builds, or keep it out of git.

**Milestones**

1. Housekeeping: activate the staged monthly workflow and add `build-reach-flow` to it. Gate: one green scheduled run.
2. Keyword table: `build-ripple.mjs` computes counts, lift and reach distance, and prints the top 20 keywords per theme. Gate: Ken reads each list and agrees a colleague would recognize the theme from it; the alias file is seeded.
3. Static prototype: `RippleMap.tsx` draws the default view with labels and callouts, no interaction. Gate: someone new to the page can state the headline after one look.
4. Interaction and reach: panels, toggles, URL state, the phone strip, the table view and Chinese labels. Gate: usable at 380 px and by keyboard alone.
5. Launch: the Ripple map takes section 01 and the Method note is updated. Gate: two consecutive monthly runs with a stable layout.

**Validation checks**

- Each theme's `works` in ripple.json equals an independent count of unique non-self citing works for that theme.
- Ten keywords drawn at random: their top citing works are visibly about that keyword.
- Two runs on the same cache produce byte-identical ripple.json.
- Screenshots at 1280, 720 and 380 px, in light and dark themes, show no overlapping labels.
