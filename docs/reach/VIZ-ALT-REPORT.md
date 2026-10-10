# Reach viz alternatives A + C — Preview Report

**Branch:** `preview/reach-viz-alt` · **Status:** draft — do not merge; does not replace live Ripple.  
**Data:** same OpenAlex snapshot as Ripple (`src/data/ripple.json`, as of 2026-10-10; 3,102 citing works All / 573 Lead; self-cites removed).  
**UI:** `/reach` PREVIEW toggle **Ripple | Beeswarm (A) | Clusters (C)** (`?viz=beeswarm|clusters`).

## How each encodes the same numbers

| Channel | Ripple (current) | **A Beeswarm** | **C Clusters** |
| --- | --- | --- | --- |
| Reach distance | Radius (polar rings) | **X-axis** per theme row (home → subfield → field → domain) | **Not encoded** as position — see panel / callouts |
| Volume | Bubble area + theme arc thickness | Bubble area | Bubble area |
| Theme | Sector angle + hue | **Row** + hue | Hue (+ spatial clustering by co-occurrence) |
| Relatedness | Implicit (same sector) | None beyond row | **2D distance + light links** (co-occurrence) |
| New vs echo | Filled vs outline | Same | Same |

**A** is the Cartesian reading of Ripple’s reach×theme encoding (faceted beeswarm).  
**C** is a VOSviewer-style map: association-strength layout over citing-work keyword co-occurrence (`method: "cooccurrence"` in `reach-clusters.json`; Spearman similarity-vs-distance ≈ −0.69). Links drawn for pairs sharing ≥8 citing works. Air-quality keywords sit apart honestly (few cross-theme bridges). Two keywords with &lt;2 shared partners are listed as unlinked, not forced into the map.

## Pros / cons vs Ripple (for Ken)

| | Pros | Cons |
| --- | --- | --- |
| **Ripple** | “Reach” is literal geometry; one glance at outer ring = breadth; compact on desktop | Polar axes are unfamiliar; angle ≠ volume (by design); phone becomes a strip anyway |
| **A Beeswarm** | Familiar axes; easy to compare themes side-by-side; mobile = same encoding (no mode switch) | Tall on phone; less “wow” than the circle; y within a row is only anti-overlap |
| **C Clusters** | Shows *what travels with what*; good for “communities”; air-dust detachment is a real story | Does **not** show reach distance as position — can be misread as geography; denser labels |

**Recommendation for choosing a default later:** keep **Ripple** if the tenure message is breadth-at-a-glance; prefer **A** if reviewers struggle with polar charts; use **C** as a second panel (“who cites with whom”) rather than a replacement for reach distance.

## Screenshots

- `/workspace/redesign/screenshots/preview-reach-A-1280.png`
- `/workspace/redesign/screenshots/preview-reach-A-380.png`
- `/workspace/redesign/screenshots/preview-reach-C-1280.png`
- `/workspace/redesign/screenshots/preview-reach-C-380.png`
- Repo: `docs/reach/screenshots/preview-reach-A-*.png`, `preview-reach-C-*.png`

## Regenerate layouts

```bash
node scripts/influence/build-reach-beeswarm.mjs   # → src/data/reach-beeswarm.json
node scripts/influence/build-reach-clusters.mjs   # → src/data/reach-clusters.json
```

Both read only `src/data/ripple.json` (no invented counts).

## PR

_Filled after open._
