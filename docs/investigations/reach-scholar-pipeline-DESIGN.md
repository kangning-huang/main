# Design: Reach Field & Shelf on Google Scholar

Date: 2026-10-20 (Asia/Shanghai)

## Why Scholar
Ken wants grey literature (IPCC reports, theses, CNKI, etc.) and wants **each citing work’s own citation count** to come from Google Scholar, not OpenAlex `cited_by_count`.

## Pipeline
```
1. google_scholar_author (author_id=s_domssAAAAJ)
   → publications[] with cited_by.value + cited_by.cites_id

2. Match pinned DOIs (data/influence/dois.json) → Scholar pubs (fuzzy title)

3. For each cites_id: google_scholar?cites=<id>&start=
   → organic_results[] with title, publication_info, inline_links.cited_by.total

4. Persist cache under data/scholar-reach/
   → sample-field-shelf.json (scholar-v0) → later adapt build-field-shelf.mjs
```

## Schema (`field-shelf/scholar-v0`)
- `papers[]`: doi, short, scholarCitesId, scholarCitationCount, citingFetched, citingGreyLit
- `squares[]`: id (`GS_…`), title, year, venue, **citedBy** (= Scholar), detectedGreyLit, paperIdxs, link
- Layout `x,y` omitted in v0; reuse `scripts/influence/lib/field-shelf-layout.mjs` once counts are stable

## Grey literature
Heuristic flag `detectedGreyLit` on title/venue/summary (IPCC, report, thesis, arXiv, CNKI, UNEP, …). Scholar includes these in `cites=` results; OpenAlex often does not.

## What Scholar cannot drive
| Reach view | Scholar? | Plan |
| --- | --- | --- |
| Field & Shelf square colour/position (citer impact) | **Yes** — `cited_by.total` | Primary migration target |
| Headline unique citing works | **Yes** (with weaker self-cite filter) | Replace OpenAlex count; label source |
| Where map (countries / orgs) | **No** affiliations | Keep OpenAlex **or** hide until enrichment |
| Topic / adaptive cards | **No** OpenAlex topics | Keep OpenAlex **or** drop |
| Self-citation removal | Weak (truncated author strings) | Document; optional name heuristics |

**Recommended UI split:** Scholar drives Field & Shelf + citation totals; Where/topics stay OpenAlex and are labelled “OpenAlex geography / topics” until a hybrid enrichment exists.

## Rate limits / cost
- SerpAPI: ~20 results/page. Full crawl ~5k links ≈ **250–300 searches** (prior estimate).
- Prototype (`--prototype`): 3 papers × 2 pages ≈ **~7 searches** (1 author page + 6 cite pages).
- Cache every response under `data/scholar-reach/`; weekly job only refreshes papers whose Scholar `citationCount` increased.
- Sleep ≥1s between SerpAPI calls.
- Direct `scholar.google.com` from this box’s IP → **HTTP 403**; do not scrape from datacenter without residential browser.

## Weekly routine (replace Monday OpenAlex)
1. Keep Sunday `update-scholar.yml` for profile totals / CV (already SerpAPI).
2. Add monthly (or weekly off-peak) `scholar-reach-refresh.yml`: run `fetch-citing.mjs` with cache, rebuild field-shelf when ready, commit `data/scholar-reach/` + generated JSON.
3. Do **not** re-enable OpenAlex `influence.yml` as the Field & Shelf source once Scholar path is production; optional OpenAlex job only for Where/topics.

## Security / ToS
- No official Scholar API; SerpAPI is the existing sanctioned path in this repo.
- Never commit `SerpApi-key.txt`. Use `secrets.SERP_API_KEY` in Actions.

## GitHub Action install
Workflow YAML is parked at `docs/reach/scholar-reach-prototype.workflow.yml` because the current `gh` OAuth token lacks `workflow` scope (same constraint as the old OpenAlex `influence.yml`). To activate:

```bash
cp docs/reach/scholar-reach-prototype.workflow.yml .github/workflows/scholar-reach-prototype.yml
git add .github/workflows/scholar-reach-prototype.yml
git commit -m "ci: enable Scholar Reach prototype workflow"
git push   # needs a PAT/token with workflow scope
```

Then: Actions → Scholar Reach prototype → Run workflow.
