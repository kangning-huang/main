# Reach flow chart redesign — decision brief for Ken

**Status:** advice + **local preview only** — no live merge.  
**Date:** 2026-10-09  
**Live baseline:** `/reach` defaults to All (PR #69); section 1 is text-heavy; Sankey uses 4 themes → OpenAlex *fields* (Env Sci blob).  
**Inputs:** OpenAlex `influence.json` (2026-10-09), Claude Code **Opus 5.5** opinion (`claude-opus-flow-opinion.md`), Website Manager independent numbers.

---

## 1. What’s wrong today (3 sentences)

On All, **Urban futures = 81.4%** of theme→field flow (2,538 / 3,118 theme–work pairs); Lead is the same shape (81.3%). Age explains only ~9 points: under citations/year (floor 1 yr), urban futures is still **~72%** because Nat Commun / Nat Sustain 2020 really do ~115 cites/yr each. The bigger UI problems are (a) the wow Sankey sits under a wall of adaptive-topic prose, and (b) the right side still uses coarse *fields*, so Environmental Science swallows the story Ken asked for (subfields / keywords influenced).

---

## 2. Side-by-side: Opus vs Website Manager

### Left side (paper outflows)

| Topic | Claude Opus 5.5 | Website Manager | Agree? |
|---|---|---|---|
| Root cause of 81% blob | Mostly **real megahits** + coarse themes; age bias secondary (~9 pts) | Same reading from the numbers | **Agree** |
| Primary fix | **Finer themes** (split heat into heat-health / cooling / air-dust; keep expansion) | Same; also rename so “urban futures” isn’t a catch-all | **Agree** |
| Absolute vs cites/yr | Absolute **default**; labelled cites/yr **toggle** | Absolute default; cites/yr toggle; floor **1 year** (not 0.5) | **Agree** |
| Equal weight / log / hard caps | Reject for site | Reject | **Agree** |
| Age-cohort lanes | Filter, not main layout | Agree — optional chip later | **Agree** |
| Recent 2–3 yr citing window | Nice if data ready; estimate only until computed properly | Defer until pipeline has citing-year matrix (don’t invent) | **Agree** |
| Lead vs All | Keep megahits; label lens | Default All already; flow should respect active chip | **Agree** |
| Misclassification | Road-dust under “heat” inflates heat ~45% of that bin | Fix labels **before** celebrating heat’s rise under /yr | **Agree** |

### Right side

| Topic | Opus | Website Manager | Agree? |
|---|---|---|---|
| Primary Sankey right nodes | **Adaptive subfields** (30% rule), long tail → Other | Prefer **adaptive subfield + topic nodes already in JSON** (drop raw *field* parents from the ribbon) | **Mostly agree** |
| Topics | Tooltips / drill-down, not all as nodes | Show top topic nodes that already survived 30% split (e.g. Land Use and Ecosystem Services) as first-class right nodes | Mild differ |
| Keywords as nodes | **Never** (double-count, noise) | Agree — **chips in link/node tooltips or a strip under the chart**, not ribbon endpoints | **Agree** |

---

## 3. Left-side options (labeled) — real All-view numbers

Weights use non-self `citingNonSelf` per paper. Cites/yr = cites ÷ max(1, years since publication to 2026-10). Shares are of total weighted mass (a paper in two themes still isn’t split here — each paper has one theme).

### L1 — Keep 4 themes, absolute (today)

| Theme | Cites | Share |
|---|---:|---:|
| Urban futures | 2,538* | **81.4%** |
| Heat | 473* | 15.2% |
| Scaling & form | 95* | 3.0% |
| Flood & coasts | 12* | 0.4% |

\*theme–work pair counts from `views.all.flows` (slightly above unique works when a work cites two themes).

### L2 — Keep 4 themes, citations/year

| Theme | Cites/yr | Share |
|---|---:|---:|
| Urban futures | 371 | **71.5%** |
| Heat | 139 | 26.7% |
| Scaling & form | 7 | 1.4% |
| Flood & coasts | 2 | 0.4% |

Age correction helps heat; urban futures still dominates.

### L3 — Finer themes, absolute (**Opus’s preferred default**)

Hand remap (preview mapping; Ken to confirm dust → air-quality, forests/tree/AC/demolition → cooling):

| Fine theme | Cites | Share |
|---|---:|---:|
| Urban expansion & futures | 2,612 | **78.4%** |
| Scaling, form & methods | 228 | 6.8% |
| Air quality / dust | 220 | 6.6% |
| Heat exposure & health | 187 | 5.6% |
| Cooling & greening | 74 | 2.2% |
| Flood & coasts | 12 | 0.4% |

### L4 — Finer themes, citations/year (**best “growth” story**)

| Fine theme | Cites/yr | Share |
|---|---:|---:|
| Urban expansion & futures | 362 | **69.8%** |
| Heat exposure & health | 74 | 14.3% |
| Cooling & greening | 36 | 6.9% |
| Air quality / dust | 28 | 5.5% |
| Scaling, form & methods | 16 | 3.2% |
| Flood & coasts | 2 | 0.4% |

Cooling + heat-health together ≈ **21%** under /yr vs ~8% absolute — this is the honest “newer agenda” signal without log tricks.

### L5 — Rejected for v1

Equal weight per paper / log(1+c) / hard per-paper caps — inflate flood and hide real megahits (Opus + WM).

---

## 4. Right-side options (labeled)

### R1 — Adaptive subfield + topic nodes (recommended)

Use existing 30% adaptive list, **omit raw field parents** from the ribbon (Engineering, Social Sciences, … stay only if they never split — or fold small fields into Other). Live All snapshot (subfield/topic only):

| Node | Works | Level |
|---|---:|---|
| Land Use and Ecosystem Services | 718 | topic |
| Environmental Engineering | 511 | subfield |
| Ecology | 197 | subfield |
| Health, Toxicology and Mutagenesis | 146 | subfield |
| Management, Monitoring, Policy and Law | 106 | subfield |
| (+ remaining field-level / Other as thin tail) | | |

### R2 — Subfields only (no topics)

Stabler labels; loses the vivid “Land Use and Ecosystem Services” card that already beat the 30% rule.

### R3 — Keyword endpoints

Top citing-work keywords (All chips): urbanization 577 · urban expansion 324 · urban heat island 242 · land use change 199 · land surface temperature 142 · …  
**Do not use as Sankey right nodes** (multi-keyword double count). Use as tooltip chips / caption strip.

---

## 5. Recommended combos

### Opus 5.5: **L3 default + L4 toggle + R1 + keywords in tooltips**

Absolute finer themes by default (committee-checkable); “Per year since publication” toggle; adaptive subfields on the right; keywords only in tooltips.

### Website Manager: **same combo**, with two UI rules Ken asked for this round

1. **Flow chart first** under a short title + one-line stat; methods/tables/adaptive prose pushed below.  
2. Right ribbon = **R1** (not fields). Left = **L3**, toggle to **L4**. Respect All/Lead chip already on the page.

**Homepage H2 unchanged** (countries + distant subfields from All).

---

## 6. Preview shipped this round (not merged)

- Branch: `preview/reach-flow-front` (draft PR if push succeeds).  
- Layout: Sankey front-and-center; trimmed intro; Absolute ↔ Cites/yr toggle; left = finer themes; right = adaptive subfield/topic nodes.  
- Screenshots:  
  - `/workspace/redesign/screenshots/preview-reach-flow-absolute.png`  
  - `/workspace/redesign/screenshots/preview-reach-flow-cites-per-year.png`  
- Brief + Opus raw: this file + `claude-opus-flow-opinion.md`.

---

## 7. What we need from Ken

Reply e.g. `Left: L3+L4 toggle | Right: R1 | Layout: flow-first` (or mix).

Optional confirms:
1. OK to move ES&T road-dust / Atmos Environ dust / Toxics out of “heat” into **Air quality / dust**?  
2. OK **Cooling & greening** = Nat Clim Change forests + ES&T tree cooling + AC + demolition?  
3. Merge preview after you pick, or iterate first?


## Update 2026-10-09 evening
Ken chose **Try L4 + R1**. Preview defaults to cites/year; theme map at `data/influence/fine-themes.json`. Draft PR #71 only.
