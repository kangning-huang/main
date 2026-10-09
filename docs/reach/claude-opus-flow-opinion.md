## Main finding

The 81% isn't mostly about paper age. Even after dividing by years since publication, **urban futures still has about 72%** in the All view, because the three 2020 Nat Commun / Nat Sustain papers really are cited about 115 times a year. Age bias explains about 9 points. Two other things matter more: how the themes are drawn, and the fact that two road-dust papers are filed under "heat."

## A) Left-side options, ranked

1. **Finer themes + absolute counts (default).** Split into: Urban expansion & futures · Heat exposure & health · Cooling & greening · Air quality/dust · Flood & coasts · Scaling & form/methods.
   - Pros: honest, and easy for a committee or journalist to read. It shows that "heat" is really three areas.
   - Cons: urban futures still dominates. Some reassignments are judgement calls, so publish the mapping.
2. **Citations per year toggle ("influence rate").**
   - Pros: corrects age bias in a way you can defend, and it's easy to explain.
   - Cons: the floor of 0.5 years inflates papers from 2025–26 (1 citation becomes 2/yr). Use a floor of 1 year, or leave out papers less than 12 months old.
3. **Last 2–3 years of citing works.**
   - Pros: answers "what's live now", and journalists like it.
   - Cons: needs `counts_by_year` per citing work. Old megahits are still being cited at full speed, so the shift is small.
4. **Age-cohort lanes** (≤2019 / 2020–22 / 2023+) as the first column.
   - Pros: shows the pipeline.
   - Cons: adds a third Sankey stage and breaks up the themes. Better as a filter than as a layout.
5. **Log scale, or each paper weighted equally.** Not recommended. Both reward having many papers rather than influence, and a skeptical reader will call it massaging.
6. **Cap per paper.** Arbitrary, and it hides real megahits. Avoid.

## B) Rough share changes (All view, computed from your per-paper numbers)

| Weighting | Urban futures | Heat | Scaling | Flood |
|---|---|---|---|---|
| Absolute | 81% | 15% | 3% | 0.4% |
| Cites/yr | 72% | 27% | 1.4% | 0.4% |
| Recent window (estimate*) | ~73–76% | ~22–25% | ~1% | <1% |
| log(1+c) per paper | 44% | 46% | 6.5% | 4.4% |
| Each paper weighted equally (21 papers with citations) | 29% | 52% | 9.5% | 9.5% |

Lead view: absolute is UF 81 / heat 18. Cites/yr is UF 70 / heat 28.

*The recent-window row assumes old papers kept a steady rate. Compute it properly before showing it.

**Finer themes, cites/yr (All):**

| Theme | Cites/yr | Share |
|---|---|---|
| Expansion/futures | 371 | 72% |
| Heat exposure & health | 58 | 11% |
| Cooling & greening | 53 | 10% |
| Air quality/dust | 27 | 5% |
| Methods/scaling | 7 | ~1.5% |
| Flood | 1 | <1% |

Same split on absolute counts: about 80 / 5 / 4 / 7 / 3 / 0.4%. The cooling and mortality papers from 2025 only become visible under the per-year view.

## C) Right side

- **Nodes: adaptive subfields** using your existing 30% rule. Break the Environmental Science blob into subfields (Global & Planetary Change, Pollution, Ecology, and so on), and group the long tail into "Other."
- **Topics:** show in tooltips or a drill-down. There are too many to be nodes, and their labels are inconsistent.
- **Citing-work keywords: never as nodes.** Each work has several keywords, so they double-count flow, and they're noisy. Show them as a top-5 chip list in the tooltip for each link.

## D) Recommended combo

**Finer six themes on the left, absolute counts by default, a labelled "Per year since publication" toggle, adaptive subfields on the right, and keywords in tooltips.**

Why: committee members will check the absolute numbers against Google Scholar, so those need to be the default and match. The toggle gives an honest, one-sentence way to show that the heat, cooling and health work is growing fastest. The finer themes do more than any reweighting to stop "urban futures vs. everything" from hiding real breadth.

## E) Pitfalls

- **Double counting.** A citing work that cites papers in two themes shows up twice: your 3,118 theme–work pairs vs. 2,745 citations to urban-futures papers alone. Either split each citing work's weight by 1/k across the themes it cites, or say in the caption that flows are counted per link.
- **Misclassification.** Road-dust and dust papers labelled "heat" inflate heat by about 45%. Fix the labels before reweighting, or the result looks like gerrymandering in reverse.
- **Making themes look equal.** Log scale or equal weight per paper would make flood look as big as heat, with 12 citations behind it. Reporters will notice.
- **Hiding real megahits.** Nat Commun/Nat Sustain 2020 are real influence. Keep them in every view, and label lead vs. co-author clearly rather than shrinking them.
- **Small-number noise on new papers.** A 2026 paper with 1–2 citations gets an exaggerated per-year rate. Set a minimum citation count or a minimum age, or grey these papers out.
- **Unstated weighting.** Whatever weighting is active should appear in the chart title (e.g. "Citations per year, self-citations removed, 2026-10-09").

I wrote a short version of this to the plan file and made no code changes.
