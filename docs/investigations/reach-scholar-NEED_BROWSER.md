# NEED_BROWSER — Google Scholar scrape (parent computerUse)

## Why
From the agent box (2026-10-20):
- `curl` Scholar → **HTTP 403** (“Sorry…”)
- Playwright/Chrome headless → **HTTP 403**
- No local `SERP_API_KEY` / `config/SerpApi-key.txt` (key only in GitHub Actions secrets)
- Codex CLI also failed: OpenAI `workspace routing discovery failed` / models 403

## Preferred unblock (no browser)
1. Ensure `secrets.SERP_API_KEY` is set on `kangning-huang/main`.
2. Run workflow: `.github/workflows/scholar-reach-prototype.yml` (`workflow_dispatch`).
3. Download the artifact `scholar-reach-sample` into `data/scholar-reach/`.

## If parent must use computerUse / ChatGPT desktop browser
Use a **residential / logged-in** session (not the box datacenter IP).

### URLs to open (in order)
1. Profile (cited-desc):  
   https://scholar.google.com/citations?user=s_domssAAAAJ&hl=en&view_op=list_works&sortby=citeddesc  
   **Extract:** for each row — title, year, “Cited by N” count, and the `cites=` id from the Cited-by link.

2. Citing pages for these lead papers (find `cites_id` from step 1 by title match):
   - ERL 2019 — *Projecting global urban land expansion and heat island intensification through 2050*  
     URL pattern: `https://scholar.google.com/scholar?cites=<CITES_ID>&hl=en&as_sdt=2005&sciodt=0,5&start=0`
   - Nat Sustain 2020 — research gaps / growing impacts (merge duplicates if shown twice)
   - JGR-A 2021 — nighttime heat stress

3. For **each citing result** on the first **2 pages** (start=0 and start=20):  
   **Extract:** title, authors line, year, venue/snippet, own “Cited by N”, result link.  
   Flag likely grey lit if venue/title mentions IPCC, report, thesis, dissertation, arXiv, CNKI, UNEP, World Bank.

### Save as
Write JSON to `/workspace/agent-tools/scholar-reach/raw/browser-sample.json` with shape:
```json
{
  "meta": { "asOf": "YYYY-MM-DD", "source": "browser" },
  "publications": [{ "title", "year", "citationCount", "citesId" }],
  "citing": {
    "<citesId>": [{ "title", "year", "venue", "scholarCitedBy", "link", "detectedGreyLit" }]
  }
}
```
Then re-run adapter (or place files under `data/scholar-reach/`) so `sample-field-shelf.json` can be built without inventing counts.
