# Semantic Scholar citing-works database (`data/s2-reach/`)

Built 2026-10-28 as a candidate second source for `/reach`. Nothing on the site reads it yet.

## What was collected

| Path | What it is |
|---|---|
| `scripts/semantic-scholar/fetch-s2-citations.mjs` | Fetch script. Reads the pinned DOIs, one batch call for paper metadata, then `/paper/{id}/citations` per paper. Same strict self-citation rule as the OpenAlex pipeline (shared S2 author ID or normalized full name). |
| `data/s2-reach/latest.json` (+ dated copy) | `totals`, `papers[]` (per cited paper: S2 counts next to the OpenAlex counts from `src/data/influence.json`), `works[]` (unique citing works: DOI, title, year, venue, publication types, S2 fields, citation counts, authors with S2 IDs, open-access PDF, and per-cite `isInfluential`, `intents`, `contexts`). |
| `data/s2-reach/cache/<s2PaperId>.json` | Raw citation rows per cited paper, so a rate-limited run resumes. Delete to force a refresh. |

- **Source:** Semantic Scholar Graph API, anonymous (no key).
- **Input:** the 28 DOIs in `data/influence/dois.json`, the same list the OpenAlex page uses.
- **Transformations:** deduplicated by S2 paper ID, self-citations flagged (not dropped), and contexts capped at three per citation.

Run: `node scripts/semantic-scholar/fetch-s2-citations.mjs` (add `S2_API_KEY=…` for a dedicated rate limit; the anonymous pool returns frequent 429s, and this run took about 45 min).

## Coverage vs OpenAlex (27 papers both sources have)

| | Semantic Scholar | OpenAlex |
|---|---|---|
| Citing links, non-self | 3,217 | 3,472 |
| Unique citing works | 2,982 (non-self) | 3,230 |
| Self-citations flagged | 217 | 310 removed |

- S2 is about 7% smaller overall. It is lower on older and highly cited papers (Nat Commun 2020: 739 vs 801) and higher on several recent ones (Sci Rep 2025: 16 vs 9; Nat Clim Change 2025: 79 vs 68; Nature Cities 2025: 39 vs 33).
- Nature Cities 2026 *Nested economies* is not yet in S2.
- Grey literature is essentially absent: 91 citing works have no DOI, of which 4 are arXiv. S2 does not fill the IPCC, thesis or report gap that motivated the Google Scholar crawl.
### Work-by-work overlap

From `scripts/semantic-scholar/compare-openalex.py`, which writes `data/s2-reach/compare-openalex.json`. The 3,230 OpenAlex IDs in `field-shelf.json` were resolved to DOIs one work at a time; single-work lookups do not count against OpenAlex's daily budget.

| | Works |
|---|---|
| In both sources | 2,700 (2,658 matched by DOI, 42 by title and year) |
| OpenAlex only | 545 |
| Semantic Scholar only | 282 |
| Union | 3,512 (+9% over OpenAlex alone) |

- **OpenAlex-only** is partly noise. It includes 68 Copernicus open-discussion comments ("Reply on RC1", type `peer-review`) and 101 preprints (53 SSRN, 41 Research Square), which are often earlier versions of a published paper that S2 merges. It also contains real grey literature that S2 lacks, notably IPCC AR6 WGIII chapters (*Emissions Trends and Drivers*; *Urban Systems and Other Settlements*), plus 19 dissertations and 78 book chapters.
- **Semantic Scholar-only** is mostly recent: 97 are dated 2026, which OpenAlex has not linked yet, and 31 have no year. It also includes well-cited articles that OpenAlex lacks, e.g. *Surface warming in global cities is substantially more rapid than in rural background* (Commun Earth Environ 2022) and *Rising infrastructure inequalities accompany urbanization and economic development* (Nat Commun 2025). Some of these may be works the stricter OpenAlex rule removed as self-citations (OpenAlex removed 310 against S2's 217); not checked one by one.
- **Both sources have false links:** reference-matching errors in unrelated fields, e.g. a perovskite-memristor paper (OpenAlex) and a ceramics up-conversion paper (S2).
- **24 S2-only works are flagged highly influential.**

## What S2 adds that OpenAlex does not

- **Highly influential citations:** 122 citation links from 118 citing works are flagged `isInfluential`, meaning S2 judges that the citing paper builds substantially on the cited one. Examples: *Heat Waves: Physical Understanding and Scientific Challenges* (Reviews of Geophysics 2023), *Large disagreements in estimates of urban land across scales* (Nat Commun 2024), *Urbanization exacerbates continental- to regional-scale warming* (One Earth 2024).
- **Citation intent** (where S2 could classify it): background 405, methodology 122, result 15.
- **Citing sentences** for 992 citing works. These make it possible to show *how* a paper is used, not only who cites it.

S2 lacks institutions and countries, so the Where map and Who uses it views still need OpenAlex.
