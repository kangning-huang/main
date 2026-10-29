# Google Scholar citing-works database (`data/scholar-reach/`)

Started 2026-10-28. **Status: stopped by Ken on 2026-10-28 after a Scholar CAPTCHA, at 8 of ~260 pages** (145 citing works, all from the 2020–2021 slices of *Global projections of future urban land expansion…*, Nat Commun 2020). Nothing on the site reads this data.

## Why a browser crawl

Google Scholar has no API and returns HTTP 403 to datacenter IPs, and the earlier SerpAPI prototype (#148) covered only 3 papers. This crawl runs inside Ken's logged-in Chrome tab instead.

## Files

| Path | What it is |
|---|---|
| `scripts/scholar-reach/browser-crawl.js` | Crawler pasted into a `scholar.google.com` tab. It reads the profile's 41 cited entries (5,076 citations) and fetches each "Cited by" list at 20 per page. Papers with more than 500 citations are sliced by year, because Scholar shows at most 1,000 results per query. |
| `scripts/scholar-reach/receiver.py` | Localhost relay and writer. It is needed because Chrome blocks a direct fetch from `scholar.google.com` to localhost. |
| `data/scholar-reach/raw/_papers.json` | The profile rows: title, byline, count and `cites` ID per paper. |
| `data/scholar-reach/raw/<citesId>_<year\|all>_s<start>.json` | (gitignored; local only) One results page as parsed: title, byline, Scholar author IDs, own `citedBy`, cluster ID, versions, URL, full-text link and snippet. |
| `scripts/scholar-reach/build-scholar-db.mjs` | Merge step. It runs offline and makes no network calls. |
| `data/scholar-reach/citing-works.json` | Deduplicated citing works (by Scholar cluster ID). Bylines are parsed into authors, venue, year and source. Each work is tagged with the cited papers it cites, a grey-literature flag and self-citation flags. |
| `data/scholar-reach/cited-papers.json` | Ken's papers with coverage per paper. 34 of 41 are matched by title to a site DOI, which gives each its lens and theme from `dois.json`. |

## Transformations and caveats

- **Self-citation:** `selfCitationOf` is strict: Ken's Scholar ID is linked, or "K Huang" is listed. `sharedAuthorInitials` records loose initials overlap as a review hint only, because Scholar gives initials and common names such as "X Li" collide.
- **Truncated bylines:** Scholar cuts author lists and venues with "…" (`authorsTruncated`, `venueTruncated`).
- **No affiliations, countries or fields:** Scholar cannot drive the Where map or the field views.
- **Year slices** miss citing works that have no year.

## Resuming

1. Solve the CAPTCHA in any Scholar tab, then in the crawler tab's console run `__st.resume = true`.
2. If the tab was closed, restart `receiver.py`, reopen the profile (`pagesize=100`) and paste `browser-crawl.js`. Click OPEN RELAY, then run `gsStart()`. Finished slices are skipped (state is kept in localStorage `gsCrawl`).
3. Run `node scripts/scholar-reach/build-scholar-db.mjs`.

Scholar raised a CAPTCHA after about 2 minutes at an 8–16 s pace, so slow the delay to 25–45 s before resuming. The full crawl will need several CAPTCHA solves.

## Coverage vs OpenAlex

Not yet computable from 145 rows. For reference, OpenAlex has 3,230 unique non-self citing works for the 27 pinned DOIs, and Semantic Scholar has 2,982 (see `S2-DB.md`).
