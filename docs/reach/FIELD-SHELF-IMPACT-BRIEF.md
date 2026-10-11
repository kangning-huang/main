# Field & Shelf → citation-impact field (Ken, 2026-10-11)

## Goal
Live https://kangning-huang.com/reach Field & Shelf: dots encode how highly cited each **citing paper itself** is (OpenAlex `cited_by_count`), not topic distance. High-impact citers sit toward the **middle**. Draft PR only until user merges — actually: branch, PR, **squash-merge**, verify live, screenshots.

## Encoding (replace topic bands)
1. **Color** = citing work’s own `cited_by_count`, **log scale**. Sequential ember–ink on-brand (paper `#fffcf7`, ink `#141211`, ember `#c74b16` / light `#dd9270`). Not topic/field colors. Prefer discrete bins for canvas batching (e.g. 0 · 1–9 · 10–99 · 100–999 · ≥1000) with a continuous-feeling sequential ramp; document exact breaks.
2. **Layout:** sort pack by `cited_by_count` **descending** into `packField` (centre = most cited), then year, then OpenAlex id. Direction still means nothing.
3. **Remove** field/topic / outside-home **banding from the field encoding and legend**. Field must not encode topics. Shelf + links + tooltips stay. Outside-% may remain as a faint secondary line on the page if cheap, but not as the field story / headline.
4. **Legend:** color = citing paper’s citations (log); nearer centre = more cited. Optional honest readout of counts in high bins (≥100, ≥1000) if cheap.
5. **Headline:** rewrite for impact (e.g. how many citing works are themselves highly cited) — not “outside home topics”.
6. Rebuild `field-shelf.json` + tooltip JSONs from OpenAlex cache. `cited_by_count` is already on citing works in `.cache/openalex/citing/`. Use `--offline`. **Never invent counts** — use OpenAlex value; treat missing/null as 0 only if the API field is absent (still real data).

## Square schema (v2)
Change squares from `[idNum, x, y, band, year, paperIdxs]` to:
`[idNum, x, y, citedBy, year, paperIdxs]`
where `citedBy` is integer OpenAlex `cited_by_count`.

Bump `meta.schema` to `field-shelf/v2`. Update `$comment`, `squareFields`, meta notes. Keep distance/outsideHome in totals/meta for optional footnote if still computed, but stop shipping `band` on squares and stop using `view.bands` for colour. Add `meta.impact` / `views.*.impact` with bin breaks, colors, and counts per lens (all/lead).

## Files to change
- `scripts/influence/build-field-shelf.mjs` — sort by citedBy desc; emit citedBy; impact bins + headline; report
- `src/lib/field-shelf.ts` — types, IMPACT_COLORS / colorForCitedBy, decode squares, drop band-as-encoding (keep distanceText only if tip still has d for optional faint tip line — **prefer showing cited-by count in tooltip instead of band**)
- `src/components/reach/FieldShelfCanvas.tsx` — paint by impact bin, not band
- `src/components/reach/FieldShelf.tsx` — legend, reading guide, canvasLabel, table column (Citations not Distance), shelf fan (single teal α, no band tint), headline area
- `src/components/reach/FieldShelfTooltip.tsx` — show citing work’s cited_by_count with swatch; remove BandSwatch-as-distance (or repurpose as impact swatch)
- Phone copy if it mentions bands
- Rebuild: `node scripts/influence/build-field-shelf.mjs --offline`
- Cache is at `/workspace/main/.cache/openalex` (symlink to prior worktree). OPENALEX_CACHE_DIR if needed.

## Ship
- Branch: `feature/reach-field-impact` (already checked out from latest main)
- Commit, push, open PR, **squash-merge** as kangning-huang
- After Pages deploy (~1–2 min), verify live
- Screenshots to `/workspace/redesign/screenshots/live-reach-field-impact-{desktop,hover,legend}.png`
- Report: color scale breaks, # dots in top bins (≥100, ≥1000) for All and Lead, PR # + SHA

## Checks
- All citing works count still 3102 / Lead 573 (match influence.json if same asOf)
- Every square has real citedBy ≥ 0
- Highest citedBy squares land near field.cx/cy
- No Math.random in layout
- Typecheck / build passes
- Do not leave preview banner or other viz toggles

## Style
Match existing Field & Shelf code voice (comments, bilingual en/zh, tabular-nums, paper surface).
