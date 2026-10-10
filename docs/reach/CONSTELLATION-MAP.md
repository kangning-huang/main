# Constellation Map — Design Doc

**Source:** Claude artifact [Constellation Map](https://claude.ai/artifact/SQemvhHFqyBdgzRQwyWwdC#cb051937-7260) (Kangning Huang, 2026-10-10).  
**Status:** preview prototype on `preview/reach-constellation` — compare with Ripple / Beeswarm / Clusters; **do not merge to live**.  
**Schematic:** `docs/reach/constellation-schematic.svg` · screenshots in `docs/reach/screenshots/constellation-artifact-*.png`.

## Summary

The Constellation map visualizes the **vocabulary of citing works** as a light-theme “sky.” Keywords are discs near related keywords; Ken’s papers are stars connected by faint lines to the keywords their citers use. Unlike the Ripple map (how far work traveled), Constellation answers: *which neighbourhoods of research did it land in, and which papers connect them?*

**Drift:** each major paper is placed twice — once from its own title/abstract keywords (**aim**), once from its citers’ keywords (**landing**). A dashed arrow connects them; a long arrow means the field used the paper differently from its original framing.

## Goals / non-goals

**Goals**
- Named regions (4–7) filled with concrete keywords
- Papers that sit at the intersection of two regions (**bridges**)
- Drift between a paper’s content and its citers’ content
- A static picture that reads without interaction; interaction adds detail

**Non-goals**
- Exact distances (2D projection; only neighbourhoods carry meaning)
- Replacing Ripple (tabs / toggle over the same dataset)
- A star for every paper (few citing works → fold into theme)

## Constellation vs Ripple

| | Ripple | Constellation |
| --- | --- | --- |
| Question | How far from Ken’s home topics did citing work go? | Which research neighbourhoods use the work, and which papers connect them? |
| Headline | One aggregate breadth % | Named regions + a few drift arrows |
| Position | Radius = reach distance; angle = theme | Closeness = similar meaning; **axes mean nothing** |
| Unique | New vs echo vocabulary; polar breadth | Drift arrows; bridge papers |
| Phone | Unrolls into a strip | Region labels + region cards (no crowded map) |
| Build | Counting in Node | Text embeddings + 2D projection |

## Visual encoding (must match artifact)

- **Light theme** (paper white), not black sky
- Soft elliptical **regions** at ~**8%** opacity; keyword discs at ~**45%** fill
- Keyword disc **area ∝ citing works**; **filled** = new citing vocabulary; **hollow** = **echo** (also on Ken’s papers)
- Paper **stars**: solid = lead, hollow = coauthor; labels like `ERL 2019`
- Faint lines from each paper to its top keywords at rest
- **Drift**: hollow aim dot → dashed arrow → landing star when δ is large
- Painted region colors (map from fine themes / silhouette clusters):
  - Land use & biodiversity — mint `#1baf7a`
  - Urban heat & health — orange `#eb6834`
  - Remote-sensing / methods — blue `#0d366b` / `#9ec5f4` (**not yellow**)
  - Air pollution — pink `#d55181`
- Legend line: *Closeness = similar topics; directions mean nothing.*

## Interaction

Every action works by tap as well as hover; none moves a star (toggles change sizes, visibility, lines only).

| Action | Result |
| --- | --- |
| Paper star | Others dim; lines to all its keywords; drift arrow; panel (title, citing works, share by region, drift in keyword-steps, top 3 citers) |
| Keyword | Lines to papers whose citers use it; panel (works, region, top 3 citers with DOI links) |
| Region label | Tint strengthens; panel lists keywords by size + feeding papers |
| Lens All / Lead | Coauthor stars hide; keyword sizes recompute |
| Absolute / Cites per year | Sizes change |
| Show all drift | Every paper’s drift arrow |

URL: `?viz=constellation&paper=…&kw=…` (plus existing `?lens=` / `?weight=`).

**Phone &lt;720:** region labels + region cards — do not cram the full map.

## Starting parameters

| Param | Value |
| --- | --- |
| Min citing works for keyword pool | 3 |
| Keywords shown | 40–60 total; 3–15 per region |
| Regions | 4–7 by silhouette |
| Embedding | Prefer `all-MiniLM-L6-v2` |
| UMAP | cosine, 15 neighbors, min_dist 0.3, fixed seed; input sorted by slug; Procrustes to prior layout when available |
| Paper star threshold | ≥30 non-self citing works |
| Drift arrows at rest | 4 largest with δ ≥ 3 |
| Bridge | ≥25% citer keyword weight in each of two regions |

Positions from **text similarity**, not co-occurrence (more stable under small keyword shifts).

## Formulas

\[
L_p=\frac{\sum_k w_{pk}\,x_k}{\sum_k w_{pk}},\qquad
A_p=\frac{\sum_k \sigma_{pk}\,x_k}{\sum_k \sigma_{pk}},\qquad
\delta_p=\frac{\lVert L_p-A_p\rVert}{\tilde d_{\mathrm{nn}}}
\]

- \(w_{pk}\): weight of keyword \(k\) among citers of paper \(p\)
- \(\sigma_{pk}\): weight of keyword \(k\) on paper \(p\) itself (title/abstract / OpenAlex keywords)
- \(\tilde d_{\mathrm{nn}}\): mean nearest-neighbour keyword distance (keyword-steps)
- Landing \(L_p\), aim \(A_p\), drift \(\delta_p\)

## Data contract

Stored as `src/data/constellation.json` — see `docs/reach/constellation-data-contract.ts`:

```ts
interface ConstellationView {
  meta: { asOf: string; model: string; params: Record<string, number | string> };
  regions: { id: string; en: string; zh: string; color: string; x: number; y: number; works: number }[];
  keywords: {
    id: string; en: string; zh?: string; region: string;
    x: number; y: number; works: number; perYear: number; echo: boolean;
    papers: string[];
    top: { doi: string; title: string; year: number; citedBy: number }[];
  }[];
  papers: {
    doi: string; short: string; lens: "lead" | "coauthor"; works: number;
    landing: [number, number]; aim: [number, number]; drift: number;
    bridge: [string, string] | null;
    lines: string[];
  }[];
}
type ConstellationData = { all: ConstellationView; lead: ConstellationView };
```

## File plan

| Path | Role |
| --- | --- |
| `scripts/influence/build-constellation.mjs` (+ helpers) | Build layout + JSON from OpenAlex / ripple cache |
| `src/data/constellation.json` | Generated data (`all` + `lead`) |
| `src/components/reach/ConstellationMap.tsx` | Desktop SVG map |
| `src/components/reach/ConstellationPhone.tsx` (or cards in same file) | &lt;720 region cards |
| `src/lib/constellation.ts` | Typed loaders |
| Update `RippleSection` / `reach-alt` | Fourth viz toggle **Constellation** |
| `ReachMethod` | Brief Constellation note |
| `docs/reach/CONSTELLATION-REPORT.md` | Regions, paper count, embedding approach, deviations |

## Determinism & risks

- Seeded UMAP; sort inputs by slug; Procrustes to previous month when a prior layout exists
- If a region’s top-5 keywords no longer match `region-names.json`, warn and propose a name — never silently rename
- **Risk:** readers treat axes as meaningful → no axes/grid; legend line above
- **Risk:** UMAP warps large distances → claim neighbourhoods only; report drift in keyword-steps, never quote inter-region distances

## Embedding fallback (CI / box)

Prefer Python `sentence-transformers` (`all-MiniLM-L6-v2`) + `umap-learn` offline into `constellation.json`. If that is unavailable in the influence scripts, document a faithful fallback (e.g. TF-IDF + PCA/MDS on keyword+paper text that still clusters by theme). Do **not** invent citation counts.

## Comparison recommendation (from artifact)

Build a shared keyword pipeline; ship Ripple as default when launching; keep Constellation as a second tab if drift arrows stay readable. This preview exists so Ken can choose among Ripple / Beeswarm / Clusters / Constellation.
