# Reach (`/reach`) — who builds on Ken's work

The `/reach` page and the homepage one-liner show the fields, institutions and countries of the works that cite Ken's **lead-author** papers. All of it comes from **OpenAlex**, with self-citations removed. The page is static: it renders at build time from `src/data/influence.json`.

## Files

| Path | What it is |
|---|---|
| `data/influence/dois.json` | **Pinned DOI list** (hand-edited). `lens: "lead"` = default lens; `lens: "coauthor"` = reported separately, never mixed in. Each entry records where its DOI came from. |
| `data/influence/curated-uses.json` | Hand-curated non-journal uses (e.g. WRI Resource Watch). Each entry needs a verification trail. |
| `scripts/influence/fetch-influence.mjs` | Fetch + self-citation filter + aggregation. Writes the two files below. |
| `src/data/influence.json` | Latest snapshot; the page imports it. |
| `data/influence/YYYY-MM-DD.json` | Dated monthly snapshots (identical format). These become the growth series for the dossier. |
| `scripts/influence/build-world-map.mjs` → `src/data/world-map.json` | One-off: Natural Earth 1:110m countries, pre-projected (Equal Earth) to SVG paths. Re-run only to change the basemap. |
| `docs/reach/influence.workflow.yml` | Monthly run (1st of month, 03:00 UTC) + manual dispatch. **Not yet active** — see below. |

## Enabling the monthly workflow (one-time)

The agent's GitHub token can't create workflow files, so the workflow ships in `docs/reach/`. Activate it with:

```bash
git mv docs/reach/influence.workflow.yml .github/workflows/influence.yml
git commit -m "Enable monthly Reach workflow" && git push
```

## Running it

```bash
# Fetch, print a summary, write nothing
node scripts/influence/fetch-influence.mjs --dry-run

# Fetch and write src/data/influence.json + data/influence/<today>.json
node scripts/influence/fetch-influence.mjs
```

The script has no npm dependencies. A run makes about 50 requests, which cost about $0.004 against OpenAlex's free daily budget. If any request fails after five retries, the script exits non-zero and writes nothing, so a bad run never overwrites the last good snapshot.

On GitHub: **Actions → Update Reach (OpenAlex influence) → Run workflow**. Tick *dry run* to test without committing.

## Adding `OPENALEX_API_KEY` (optional)

Runs work without a key. A key raises the daily budget, which helps if the DOI list grows a lot.

1. Create a free account at <https://openalex.org> and copy your API key from account settings.
2. In GitHub, go to **kangning-huang/main → Settings → Secrets and variables → Actions → New repository secret**.
   - Name: `OPENALEX_API_KEY`
   - Value: the key
3. Optional: under the **Variables** tab, add `OPENALEX_MAILTO` = an email address for OpenAlex's polite pool.

To run locally with a key: `OPENALEX_API_KEY=... node scripts/influence/fetch-influence.mjs`.

## Self-citation rule (strict)

For each cited paper, a citing work is **dropped if it shares any author with that paper**. That means anyone in its author list, not only Ken. A match is any of:

1. the same OpenAlex author ID;
2. the same ORCID;
3. the same normalized full name: order-, accent- and case-insensitive, so "Kangning Huang" matches "Huang Kangning". Initials-only names such as "K. Huang" are not matched, because they are too ambiguous.

Rule 3 catches split OpenAlex profiles. It may over-remove when an unrelated person has exactly the same full name as a co-author. That is the conservative direction. Counts per rule are stored in `totals.selfCitationsRemovedBy`.

## How each view is computed

All aggregation runs on the filtered set of citing works. OpenAlex `group_by` on `cites:` can't drop self-citations, so it isn't used for that.

1. **Reach across fields:** the OpenAlex primary-topic *field* of each citing work, linked to the theme of the paper it cites (themes come from `dois.json`). Subfield labels are noisy, so spot-check the top fields before quoting them.
2. **Who uses it:** OpenAlex/ROR institution types of citing authors. Caveat: OpenAlex types the Chinese Academy of Sciences as `government`.
3. **Where:** for each country, *observed* = citing works with at least one author there. *Expected* = Σ over citing works of the country's share of all OpenAlex works in that work's field, from the earliest lead paper's year to now. The denominators come from `group_by=authorships.institutions.country_code`, one call per field. The map shades observed ÷ expected; countries with fewer than 5 citing works are hatched.
4. **Standing on it:** the ten citing works with the highest OpenAlex `cited_by_count`, plus the curated uses.
5. **Growth:** unique citing works per year per theme. Papers from 2025 onward are listed as **"early"** chips, not drawn as bars. Citing works dated before the cited paper are dropped as OpenAlex date errors (the count is shown on the page).

**Homepage one-liner:** "Cited by researchers in N fields across M countries". N and M are `totals.fieldsCount` and `totals.countriesCount`. The line is hidden automatically if the snapshot is not `meta.mode: "live"`.

## Rules

- Never mix Google Scholar numbers into `/reach`. The Scholar chart stays on `/publications`.
- Never populate `dois.json` from OpenAlex author search.
- Don't add DOIs for in-press papers until the DOI resolves. In particular, don't add the Nature Cities paper ("Nested economies of scale in global city mass") before it is live.
- Sample mode: if `meta.mode` is ever `"sample"`, the page shows a red "SAMPLE DATA" banner and the homepage line disappears. No sample fixture is committed, because the real pipeline works.

## Adding a paper

1. Add `{ doi, short, year, theme, themeSource, lens, doiSource }` to `data/influence/dois.json`.
2. Run the script, or wait for the monthly run.

## v2 (C2 + F5 + H2) — 2026-10-09

- Dual precomputed views: `views.all` / `views.lead` in `src/data/influence.json`.
- UI filter always defaults to **All** (auto-flip removed per Ken, 2026-10-09); co-author-only share (81.5%) is still recorded in meta.
- Adaptive 30% taxonomy (field → subfield → topic) powers the main cards; theme→field Sankey is secondary.
- Homepage: `Cited in M countries — from A to B` using the **All** view distant subfields outside Ken’s home OpenAlex subfields.
- Nature Cities Nested economies DOI deliberately omitted; AC usage DOI corrected to `10.1021/acs.est.4c00424` (publications list had a 404 DOI).
- Regenerate: `OPENALEX_MAILTO=kh3657@nyu.edu node scripts/influence/fetch-influence.mjs`
