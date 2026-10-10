# Reach — Two-disc / Citation-city brief for Ken

**Status:** design discussion only — **no code, no PR, no implementation plan yet.**  
**Date:** 2026-10-11 (Asia/Shanghai)  
**Inputs:** live study of [lizheng.ai/en](https://www.lizheng.ai/en) “We’re building a city.” (screenshots in `/workspace/redesign/screenshots/lizheng-city-*.png`); Ken’s two-disc proposal; OpenAlex influence snapshot (`influence.json` 2026-10-09 + citing cache 2026-10-10); Claude Code **Opus 5.5** (max effort); Website Manager independent opinion.

**Files**
- `/workspace/reach-design/claude-opus-two-disc-opinion.md` — full Opus reply (numbers, variants A–C)
- `/workspace/reach-design/website-manager-two-disc-opinion.md` — full Website Manager reply
- This brief — side-by-side + questions for you

**Implementation plan comes only after you answer the open questions below.**

---

## 1. Brief: Lizheng vs what you proposed (≈7 sentences)

Lizheng’s “city” is a **single dark panel of ~24,547 square dots** (community members), packed on a jittered grid **sorted by distance from center** and **heat-sorted** so active members glow in the core. Brightness/size encode engagement; hover shows a mint ring + member tooltip; click opens a profile. **There are no edges** — elegance is density, heat, and quiet (fade-in, breathe, wandering spotlight). Your idea keeps the strong part — **one mark = one real unit you can open** — but swaps members for **citing papers**, and adds a **second upper disc of your papers** plus **hover citation links** between the discs and a tooltip that includes **“how it cites my work.”** Live OpenAlex numbers: **All ≈ 3,102 unique citing works / 24 papers (~3,333 links)**; **Lead ≈ 573 / 11**; ~81.5% of All citers touch only co-authored papers. OpenAlex gives **binary** A→B cite links and metadata (title, authors, venue, year, topics) — **not** citation sentences or intent. So the aesthetic and the “dot = paper” unit transfer well; the stacked discs, always-on graph feel, and “how it cites” line are where the proposal needs refining before anyone builds.

---

## 2. Opus vs Website Manager

| Topic | Opus 5.5 | Website Manager | Agree? |
|---|---|---|---|
| Dot = citing paper is the right unit | Yes — more credible than aggregates | Yes | **Agree** |
| Borrow Lizheng’s single-plane, heat/core, quiet aesthetic | Yes | Yes | **Agree** |
| Literal **two stacked discs** (esp. tilted / faux-3D) | **Reject** — upper disc too small to be a field; vertical axis overloaded; lines mostly redundant | **Reject 3D**; offer a flattened “two bands” as one option | **Agree on rejecting 3D**; mild disagree on keeping two bands |
| Hover **fans of hundreds of lines** from your hubs | Never — light citers instead; ≤4 lines on citing-dot hover (93% of All cite exactly **one** of your papers) | Cap + focus mandatory | **Agree** |
| “How it cites” from OpenAlex | **Does not exist**; no AI invent; optional 10–20 hand-checked sentences or later S2 quotes | Same data gap; proxies = which paper + topic overlap chips | **Agree** |
| Best first prototype | **A. Field & Shelf** (one Lizheng-style field + labelled shelf of your papers) | **V1 Citation City** (one field + small constellation/legend of your papers) | **Agree in substance** (same idea, different name) |
| Cartesian volume alternative | **B. Foundations** (year-ordered columns of squares per paper) | — (WM’s V3 is theme-row small multiples) | Related, not identical |
| Small multiples | **C. Paper Fields** (one mini-field per paper) | **V3 Linked small multiples** (theme rows) | Same family |
| Default corpus for the field | Follow page **All** default; **constant density** so Lead visually shrinks; caption states co-author share | Prefer honesty about All swamp; Lead-first paint if All feels muddy — but honor your earlier **C2 = default All** with LOD | **Mostly agree** (All default + honesty) |
| Heat at rest | Prefer **nothing** (or topic-distance via position+color); citing-paper citation count **dims newest third** | Heat open (cites-to-Ken / outside-home / year) | **Partial** — both warn against naïve heat |
| Palette | Stay on-brand (paper/ink/ember/teal); don’t copy forest+mint | Dark panel OK as mood, not required | **Agree** don’t clone Lizheng identity |
| Placement vs Ripple / Beeswarm / Clusters / Constellation | Don’t add a 5th without **retiring one**; A reuses Ripple distance → can replace | Complementary question (“who cites me”) ≠ keyword reach; fifth option or section swap after you pick | **Agree** decide placement before build |
| Canvas vs SVG | Canvas/WebGL points; HTML tooltip; lazy-load ~250 KB compressed All tooltips | Same | **Agree** |

**Shared bottom line:** Keep **dots = citing papers** and **hover reveals connection to your work**. Drop **tilted two-disc 3D**. Do **not** claim citation intent you don’t have. Prototype a **single field + shelf/legend of your papers** (Opus A / WM V1) unless you explicitly want volume towers (B) or per-paper mini-fields (C).

---

## 3. Named variants to choose among

### **A — Field & Shelf** *(Opus pick ≈ WM “Citation City”)*
- **Layout:** One flat Lizheng-style field of citing-paper squares; your papers as a **labelled shelf/row** above (not a second dense disc). Sort field by **topic distance** from your home topics (reuse Ripple scale): core = inside your topics, ember halo = further out.
- **Links:** Hover **your** paper → **light its citers, no fan**. Hover a **citing** square → tooltip + **≤4** thin lines to the shelf.
- **Tooltip v1:** title, first author, venue, year, “Builds on: {your short titles}”, topic path / outside flag — **no “how it cites” sentence** unless you later add curated or S2 quotes.
- **Corpus:** Follow All/Lead chip; constant density so Lead shrinks honestly.
- **Phone:** Field as hero picture; shelf → list; search + “show me one”; tap-nearest-square is bonus only.
- **Pros:** Closest to your sketch + Lizheng calm; strong **press** hero (“N squares, one per citing paper”); tenure-checkable DOIs.  
- **Cons:** Per-paper counts need shelf labels or hover; All view is mostly co-author citers unless caption/chip are clear; phone can’t pick one of 3k dots by finger.

### **B — Foundations** *(Opus; volume / career skyline)*
- **Layout:** Your papers on a ground row (by year); above each, a **column of squares** = its citing works in arrival order (hairline every 100). Led = solid labels; coauthor = outline.
- **Links:** None needed (column = the link). Multi-cite works appear in multiple columns; hover rings twins.
- **Pros:** Best **tenure** (counts match OpenAlex per paper; growth visible; prints as vector). Strong **phone** (rotate to rows).  
- **Cons:** Rewards megahit papers; weaker “breadth” unless ember accent; overlaps Growth section; less Lizheng “wow.”

### **C — Paper Fields** *(Opus; WM-adjacent small multiples)*
- **Layout:** One mini-field per paper (area ∝ citers, same distance packing); tiny papers in a “newer / smaller” strip.
- **Pros:** Shows **which of your papers travel** (outside-% differs a lot by paper); strong dossier compare; good phone cards.  
- **Cons:** Loses single “3,102 in one city” image; Lead view is thin (mostly ERL); more labels.

*(WM’s literal **Two bands** — flat upper oval of your papers + lower oval of citers — is closer to your wording but both sides agree it is weaker than A once links are capped and the upper “disc” must be labelled anyway. Treat Two bands as a rejected decorative cousin of A unless you insist on seeing it in a preview.)*

| | Tenure | Press | Phone | Closest to your sketch |
|---|---|---|---|---|
| **A Field & Shelf** | OK (+ static print) | **Strong** | OK | **Closest** |
| **B Foundations** | **Strong** | OK | **Strong** | Medium |
| **C Paper Fields** | **Strong** | OK | **Strong** | Medium |

---

## 4. Open questions for you *(answer these before any implementation plan)*

**Must-answer first (change data + caption):**
1. **Primary message** — Should this prove **breadth** (outside your topics), **scale** (N real citing papers), **per-paper volume**, or **growth**? (Picks A vs B vs C.)
2. **Default corpus** — Field opens on **All** (page C2) or **Lead**? (In All, ~4/5 squares cite only co-authored papers.)
3. **“Outside my topics”** — One **fixed** home-topic set (Lead’s ~22 vs All’s ~44), or change with the chip (squares recolor on toggle)?
4. **Record types** — Count peer reviews, preprints, chapters, dissertations, editorials as dots? Merge preprint↔published? OK if headline N changes?

**Product / copy:**
5. **“How it cites”** — (a) omit in v1, (b) measure Semantic Scholar coverage on Lead first, (c) quote S2 sentences with attribution, and/or (d) **10–20 hand-checked** “how it’s used” notes like `curated-uses.json`?
6. **Heat at rest** — Nothing / topic-distance only (recommended) / recency / citing-paper cites-per-year?
7. **Shelf order** — By year, by fine theme, or by citation count?
8. **Uncited lead papers** — Show as “2026 · 0 yet” or hide until they have citers?

**Placement & craft:**
9. **Panel** — Light paper (on-brand, prints) or dark ink panel (Lizheng mood, only dark surface on a light site)?
10. **Where it lives** — Replace Reach section 01 / become its own block / **retire one** of Ripple·Beeswarm·Clusters·Constellation? Or fifth toggle?
11. **Phone bar** — Is “tap your paper + search” enough, or must every square be tappable? OK to lazy-load ~250 KB compressed All tooltips on first interaction?
12. **Click target** — Open **DOI** (often paywalled) or **OpenAlex** record? Need a static light **dossier/PDF** figure?

If you only answer four: **1, 2, 3, 5** (message, default corpus, home-topics rule, “how it cites”).

---

## 5. What we will *not* do until you answer

- No implementation plan, no preview PR, no canvas spike.
- No AI-generated “how it cites” blurbs.
- No copying Lizheng’s forest/mint brand or “We’re building a city” copy.

**Shared recommendation if you say “just pick one to prototype later”:** **A — Field & Shelf**, All chip respected, topic-distance bands, light-citers not line-fans, honest tooltip without citation intent, retire or swap one existing Reach viz rather than stacking a fifth forever.

Reply with your picks (e.g. `A + All + omit how-it-cites + fixed home topics = Lead’s 22 + retire Constellation`) and we’ll write the implementation plan next.
