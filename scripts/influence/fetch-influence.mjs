#!/usr/bin/env node
/**
 * Reach pipeline: who builds on Ken's work, from OpenAlex.
 *
 * Input:   data/influence/dois.json        (pinned DOI list — never author search)
 * Output:  src/data/influence.json         (latest snapshot, read at build time by /reach)
 *          data/influence/YYYY-MM-DD.json  (dated snapshot, for the growth series)
 *
 * Usage:
 *   node scripts/influence/fetch-influence.mjs            # fetch + write both files
 *   node scripts/influence/fetch-influence.mjs --dry-run  # fetch + print summary, write nothing
 *
 * Env:
 *   OPENALEX_API_KEY  optional; sent as `api_key` (higher daily budget). Works without it.
 *   OPENALEX_MAILTO   optional; sent as `mailto` (polite pool).
 *
 * Self-citation rule (strict): a citing work is dropped if it shares ANY author
 * with the cited paper — matched by OpenAlex author ID, by ORCID, or by
 * normalized full name (catches split OpenAlex profiles). This is per cited
 * paper, so a co-author citing the paper they co-wrote is removed too.
 *
 * All aggregation happens locally on the filtered set, because OpenAlex
 * `group_by` on `cites:` cannot exclude self-citations. `group_by` is used for
 * the denominators (each country's total output per field).
 *
 * If any request fails, the script exits non-zero and writes nothing, so a
 * flaky run never overwrites the last good snapshot.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const DOIS_PATH = join(ROOT, "data", "influence", "dois.json");
const OUT_PATH = join(ROOT, "src", "data", "influence.json");
const SNAPSHOT_DIR = join(ROOT, "data", "influence");

const API = "https://api.openalex.org";
const DRY_RUN = process.argv.includes("--dry-run");
const EARLY_FROM_YEAR = 2025; // papers published 2025+ are shown as "early"
const TOP_N = 10;
const CITING_SELECT = [
  "id", "doi", "title", "publication_year", "cited_by_count", "type",
  "primary_topic", "authorships", "primary_location",
].join(",");

// ── HTTP ────────────────────────────────────────────────────────────
let requestCount = 0;
let costUsd = 0;

function withAuth(url) {
  const u = new URL(url);
  if (process.env.OPENALEX_API_KEY) u.searchParams.set("api_key", process.env.OPENALEX_API_KEY);
  if (process.env.OPENALEX_MAILTO) u.searchParams.set("mailto", process.env.OPENALEX_MAILTO);
  return u.toString();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, attempt = 1) {
  requestCount++;
  let res;
  try {
    res = await fetch(withAuth(url), { headers: { Accept: "application/json" } });
  } catch (err) {
    // Network-level failure (reset, DNS, timeout): retry with backoff.
    if (attempt >= 5) throw err;
    const wait = 1000 * 2 ** attempt;
    console.warn(`  network error (${err.cause?.code ?? err.message}) — retrying in ${wait} ms`);
    await sleep(wait);
    return getJson(url, attempt + 1);
  }
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 5) throw new Error(`OpenAlex ${res.status} after ${attempt} attempts: ${url}`);
    const wait = 1000 * 2 ** attempt;
    console.warn(`  ${res.status} — retrying in ${wait} ms`);
    await sleep(wait);
    return getJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`OpenAlex ${res.status} ${res.statusText}: ${url}`);
  const json = await res.json();
  if (typeof json?.meta?.cost_usd === "number") costUsd += json.meta.cost_usd;
  await sleep(120); // stay well under OpenAlex's per-second limit
  return json;
}

async function getAllCiting(workId) {
  const out = [];
  let cursor = "*";
  while (cursor) {
    const url = `${API}/works?filter=cites:${workId}&per_page=200&cursor=${encodeURIComponent(cursor)}&select=${CITING_SELECT}`;
    const page = await getJson(url);
    out.push(...page.results);
    cursor = page.meta.next_cursor;
    if (page.results.length === 0) break;
  }
  return out;
}

// ── Helpers ─────────────────────────────────────────────────────────
const shortId = (id) => (id ? id.replace("https://openalex.org/", "") : null);
const stripDoi = (doi) => (doi ? doi.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase() : null);

/** Order-insensitive, accent-insensitive full-name key: "Kangning Huang" === "Huang Kangning". */
function nameKey(name) {
  if (!name) return null;
  const tokens = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
  // Skip initials-only names ("K Huang"): too ambiguous to key on.
  if (tokens.length < 2 || tokens.some((t) => t.length < 2)) return null;
  return tokens.sort().join(" ");
}

function authorKeys(work) {
  const ids = new Set();
  const orcids = new Set();
  const names = new Set();
  for (const a of work.authorships ?? []) {
    if (a.author?.id) ids.add(a.author.id);
    if (a.author?.orcid) orcids.add(a.author.orcid);
    for (const n of [a.author?.display_name, a.raw_author_name]) {
      const k = nameKey(n);
      if (k) names.add(k);
    }
  }
  return { ids, orcids, names };
}

/** Returns the reason the citing work is a self-citation, or null. */
function selfCiteReason(citing, citedKeys) {
  for (const a of citing.authorships ?? []) {
    if (a.author?.id && citedKeys.ids.has(a.author.id)) return "author-id";
    if (a.author?.orcid && citedKeys.orcids.has(a.author.orcid)) return "orcid";
  }
  for (const a of citing.authorships ?? []) {
    for (const n of [a.author?.display_name, a.raw_author_name]) {
      const k = nameKey(n);
      if (k && citedKeys.names.has(k)) return "name";
    }
  }
  return null;
}

function countries(work) {
  const s = new Set();
  for (const a of work.authorships ?? []) {
    for (const c of a.countries ?? []) if (c) s.add(c);
    for (const i of a.institutions ?? []) if (i.country_code) s.add(i.country_code);
  }
  return s;
}

function institutions(work) {
  const m = new Map();
  for (const a of work.authorships ?? []) {
    for (const i of a.institutions ?? []) {
      if (i.id && !m.has(i.id)) m.set(i.id, i);
    }
  }
  return [...m.values()];
}

const fieldOf = (work) => {
  const f = work.primary_topic?.field;
  return f ? { id: shortId(f.id), name: f.display_name } : { id: "unclassified", name: "Unclassified" };
};

const inc = (obj, key, by = 1) => {
  obj[key] = (obj[key] ?? 0) + by;
};

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  const doisRaw = readFileSync(DOIS_PATH, "utf-8");
  const config = JSON.parse(doisRaw);
  const asOf = new Date().toISOString().slice(0, 10);
  const asOfYear = Number(asOf.slice(0, 4));
  console.log(`Reach pipeline — OpenAlex, as of ${asOf}${DRY_RUN ? " (dry run)" : ""}`);
  console.log(`API key: ${process.env.OPENALEX_API_KEY ? "set" : "not set (public budget)"}`);

  const papers = [];
  /** citing work id -> { work, citedPapers: Set<doi>, themes: Set<theme> } (lead lens only) */
  const leadCiting = new Map();
  const selfRemoved = { "author-id": 0, orcid: 0, name: 0 };

  for (const p of config.papers) {
    console.log(`\n${p.doi} (${p.lens})`);
    const work = await getJson(
      `${API}/works/doi:${p.doi}?select=id,doi,title,publication_year,cited_by_count,authorships,primary_location,primary_topic`
    );
    const keys = authorKeys(work);
    const citing = await getAllCiting(shortId(work.id));
    const kept = [];
    let removed = 0;
    for (const c of citing) {
      const reason = selfCiteReason(c, keys);
      if (reason) {
        removed++;
        if (p.lens === "lead") selfRemoved[reason]++;
      } else kept.push(c);
    }
    console.log(`  OpenAlex cited_by_count=${work.cited_by_count} fetched=${citing.length} self-removed=${removed} kept=${kept.length}`);

    const byYear = {};
    for (const c of kept) if (c.publication_year) inc(byYear, String(c.publication_year));

    papers.push({
      doi: p.doi,
      openalexId: shortId(work.id),
      title: work.title,
      venue: work.primary_location?.source?.display_name ?? null,
      year: work.publication_year,
      short: p.short,
      theme: p.theme,
      themeSource: p.themeSource,
      lens: p.lens,
      early: work.publication_year >= EARLY_FROM_YEAR,
      ownField: fieldOf(work),
      openalexCitedByCount: work.cited_by_count,
      citingFetched: citing.length,
      selfCitationsRemoved: removed,
      citingNonSelf: kept.length,
      byYear,
    });

    if (p.lens !== "lead") continue;
    const ownFieldId = fieldOf(work).id;
    for (const c of kept) {
      let entry = leadCiting.get(c.id);
      if (!entry) {
        entry = { work: c, cited: new Set(), themes: new Set(), outsideOwnField: false };
        leadCiting.set(c.id, entry);
      }
      entry.cited.add(p.doi);
      entry.themes.add(p.theme);
      if (fieldOf(c).id !== ownFieldId) entry.outsideOwnField = true;
    }
  }

  const lead = papers.filter((p) => p.lens === "lead");
  const works = [...leadCiting.values()];
  console.log(`\nLead lens: ${works.length} unique non-self citing works`);

  // ── 1. Fields + theme→field flows ──
  const fieldTotals = {};
  const fieldNames = {};
  const subfieldsByField = {};
  const flows = {}; // `${theme}|${field}` -> count of unique (work, theme) pairs
  for (const { work, themes } of works) {
    const f = fieldOf(work);
    fieldNames[f.id] = f.name;
    inc(fieldTotals, f.id);
    const sf = work.primary_topic?.subfield?.display_name;
    if (sf) {
      subfieldsByField[f.id] ??= {};
      inc(subfieldsByField[f.id], sf);
    }
    for (const t of themes) inc(flows, `${t}|${f.id}`);
  }
  const fields = Object.entries(fieldTotals)
    .map(([id, count]) => ({
      id,
      name: fieldNames[id],
      citingWorks: count,
      topSubfields: Object.entries(subfieldsByField[id] ?? {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, n]) => ({ name, citingWorks: n })),
    }))
    .sort((a, b) => b.citingWorks - a.citingWorks);
  const flowList = Object.entries(flows).map(([k, count]) => {
    const [theme, field] = k.split("|");
    return { theme, field, citingWorks: count };
  });
  const outsideOwnField = works.filter((w) => w.outsideOwnField).length;

  // ── 2. Institution types ──
  const worksByType = {};
  const instByType = {};
  const nonAcademic = new Map();
  for (const { work } of works) {
    const types = new Set();
    for (const i of institutions(work)) {
      const t = i.type ?? "unknown";
      types.add(t);
      instByType[t] ??= new Set();
      instByType[t].add(i.id);
      if (t !== "education") {
        const e = nonAcademic.get(i.id) ?? { id: shortId(i.id), name: i.display_name, type: t, country: i.country_code ?? null, citingWorks: 0 };
        e.citingWorks++;
        nonAcademic.set(i.id, e);
      }
    }
    if (types.size === 0) types.add("no-affiliation");
    for (const t of types) inc(worksByType, t);
  }
  const institutionTypes = Object.keys({ ...worksByType, ...instByType })
    .map((type) => ({
      type,
      citingWorks: worksByType[type] ?? 0,
      institutions: instByType[type]?.size ?? 0,
    }))
    .sort((a, b) => b.citingWorks - a.citingWorks);
  const topNonAcademic = [...nonAcademic.values()]
    .sort((a, b) => b.citingWorks - a.citingWorks || a.name.localeCompare(b.name))
    .slice(0, 15);

  // ── 3. Countries, normalized by each country's output in the citing field ──
  const observed = {};
  for (const { work } of works) for (const c of countries(work)) inc(observed, c);
  const yearFrom = Math.min(...lead.map((p) => p.year));
  const shareByField = {}; // field -> { country -> share of field output }
  const fieldIds = fields.map((f) => f.id).filter((id) => id !== "unclassified");
  console.log(`\nFetching country baselines for ${fieldIds.length} fields (${yearFrom}–${asOfYear})`);
  for (const fid of fieldIds) {
    const res = await getJson(
      `${API}/works?filter=primary_topic.field.id:${fid},publication_year:${yearFrom}-${asOfYear}&group_by=authorships.institutions.country_code&per_page=200`
    );
    const total = res.meta.count;
    shareByField[fid] = {};
    for (const g of res.group_by) {
      const code = g.key.replace("https://openalex.org/countries/", "");
      if (code && code !== "unknown") shareByField[fid][code] = g.count / total;
    }
  }
  const expected = {};
  const coveredByBaseline = {};
  for (const { work } of works) {
    const fid = fieldOf(work).id;
    if (fid === "unclassified") continue;
    for (const [code, share] of Object.entries(shareByField[fid])) inc(expected, code, share);
  }
  for (const code of Object.keys(observed)) coveredByBaseline[code] = expected[code] != null;
  const countryList = Object.entries(observed)
    .map(([code, obs]) => ({
      code,
      citingWorks: obs,
      expected: expected[code] != null ? Math.round(expected[code] * 100) / 100 : null,
      ratio: expected[code] ? Math.round((obs / expected[code]) * 100) / 100 : null,
    }))
    .sort((a, b) => b.citingWorks - a.citingWorks);

  // ── 4. Top citing works ──
  const shortByDoi = Object.fromEntries(lead.map((p) => [p.doi, p.short]));
  const topCiting = works
    .map(({ work, cited }) => ({
      openalexId: shortId(work.id),
      doi: stripDoi(work.doi),
      title: work.title,
      year: work.publication_year,
      venue: work.primary_location?.source?.display_name ?? null,
      type: work.type,
      openalexCitedByCount: work.cited_by_count,
      field: fieldOf(work).name,
      builds_on: [...cited].map((d) => shortByDoi[d]),
    }))
    .sort((a, b) => b.openalexCitedByCount - a.openalexCitedByCount)
    .slice(0, TOP_N);

  // ── 5. Growth by theme (established papers only; early papers listed separately) ──
  // A citing work dated before the cited paper is an OpenAlex date error; drop it from growth.
  const growth = {}; // theme -> year -> unique citing works
  let growthDatesDropped = 0;
  for (const { work, cited } of works) {
    const y = work.publication_year;
    if (!y) continue;
    const established = lead.filter((p) => !p.early && cited.has(p.doi));
    const themes = new Set(established.filter((p) => y >= p.year).map((p) => p.theme));
    if (established.length > 0 && themes.size === 0) growthDatesDropped++;
    for (const t of themes) {
      growth[t] ??= {};
      inc(growth[t], String(y));
    }
  }

  const realCountries = countryList.length;
  const realFields = fields.filter((f) => f.id !== "unclassified").length;

  const output = {
    meta: {
      mode: "live",
      source: "OpenAlex",
      sourceUrl: "https://openalex.org",
      asOf,
      generatedAt: new Date().toISOString(),
      lens: "lead-author papers (Ken first or last author); co-authored papers reported separately",
      doisFileSha256: createHash("sha256").update(doisRaw).digest("hex").slice(0, 16),
      selfCitationRule:
        "A citing work is removed if it shares any author with the cited paper (OpenAlex author ID, ORCID, or normalized full name).",
      countryBaseline: `Expected citing works per country = sum over citing works of that country's share of all OpenAlex works in the citing work's field, ${yearFrom}–${asOfYear}.`,
      earlyFromYear: EARLY_FROM_YEAR,
      growthDatesDropped,
      requests: requestCount,
    },
    totals: {
      leadPapers: lead.length,
      openalexCitedByCountSum: lead.reduce((s, p) => s + p.openalexCitedByCount, 0),
      citingLinksFetched: lead.reduce((s, p) => s + p.citingFetched, 0),
      selfCitationsRemoved: lead.reduce((s, p) => s + p.selfCitationsRemoved, 0),
      selfCitationsRemovedBy: selfRemoved,
      citingLinksNonSelf: lead.reduce((s, p) => s + p.citingNonSelf, 0),
      uniqueCitingWorks: works.length,
      citingWorksOutsideOwnField: outsideOwnField,
      fieldsCount: realFields,
      countriesCount: realCountries,
    },
    papers,
    fields,
    flows: flowList,
    institutionTypes,
    topNonAcademicInstitutions: topNonAcademic,
    countries: countryList,
    topCitingWorks: topCiting,
    growth,
  };

  console.log(
    `\nSummary: ${works.length} unique citing works, ${realFields} fields, ${realCountries} countries; ` +
      `${output.totals.selfCitationsRemoved} self-citations removed; ${requestCount} requests, ~$${costUsd.toFixed(4)}`
  );
  if (DRY_RUN) {
    console.log("Dry run — nothing written.");
    return;
  }
  const json = JSON.stringify(output, null, 2) + "\n";
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, json);
  writeFileSync(join(SNAPSHOT_DIR, `${asOf}.json`), json);
  console.log(`Wrote ${OUT_PATH} and data/influence/${asOf}.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
