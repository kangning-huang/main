/**
 * Shared OpenAlex access for the /reach builders. No npm dependencies.
 *
 * - getJson: polite-pool fetch with retry/backoff and request/cost counters.
 * - getWork / getCiting: on-disk cache (.cache/openalex/, gitignored), so
 *   fetch-influence.mjs and build-ripple.mjs share one set of requests per run.
 * - The strict self-citation rule and the topic helpers both builders use.
 *
 * Cache mode (flag or env OPENALEX_CACHE):
 *   default / auto  use a cache entry younger than OPENALEX_CACHE_MAX_AGE_HOURS (72), else fetch
 *   --refresh       always fetch and overwrite the cache
 *   --offline       never fetch works or citing lists; fail if an entry is missing
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { createHash } from "crypto";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..", "..", "..");
export const API = "https://api.openalex.org";
export const CACHE_DIR = process.env.OPENALEX_CACHE_DIR || join(ROOT, ".cache", "openalex");

// One superset select per record type, so every builder reads the same cache entry.
export const CITING_SELECT = [
  "id", "doi", "title", "publication_year", "cited_by_count", "type",
  "primary_topic", "topics", "keywords", "authorships", "primary_location",
].join(",");
export const PAPER_SELECT = [
  "id", "doi", "title", "publication_year", "cited_by_count", "authorships",
  "primary_location", "primary_topic", "topics", "keywords",
].join(",");

function cacheModeFromArgs() {
  if (process.argv.includes("--offline")) return "offline";
  if (process.argv.includes("--refresh")) return "refresh";
  const env = (process.env.OPENALEX_CACHE || "auto").toLowerCase();
  return ["offline", "refresh", "auto"].includes(env) ? env : "auto";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const stats = {
  requests: 0,
  costUsd: 0,
  cacheHits: 0,
  cacheMode: cacheModeFromArgs(),
  maxAgeHours: Number(process.env.OPENALEX_CACHE_MAX_AGE_HOURS ?? 72),
  /** ISO timestamps of every work / citing list used in this process (cached or fetched). */
  fetchedAt: [],
};

function withAuth(url) {
  const u = new URL(url);
  if (process.env.OPENALEX_API_KEY) u.searchParams.set("api_key", process.env.OPENALEX_API_KEY);
  u.searchParams.set("mailto", process.env.OPENALEX_MAILTO || "kh3657@nyu.edu");
  return u.toString();
}

export async function getJson(url, attempt = 1) {
  stats.requests++;
  let res;
  try {
    res = await fetch(withAuth(url), { headers: { Accept: "application/json" } });
  } catch (err) {
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
  if (typeof json?.meta?.cost_usd === "number") stats.costUsd += json.meta.cost_usd;
  await sleep(120);
  return json;
}

// ── On-disk cache ──────────────────────────────────────────────────────────

function readCache(path, select) {
  if (stats.cacheMode === "refresh" || !existsSync(path)) return null;
  let entry;
  try {
    entry = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
  if (entry.select !== select) return null;
  const ageHours = (Date.now() - Date.parse(entry.fetchedAt)) / 3.6e6;
  if (stats.cacheMode !== "offline" && !(ageHours <= stats.maxAgeHours)) return null;
  stats.cacheHits++;
  stats.fetchedAt.push(entry.fetchedAt);
  return entry;
}

function writeCache(path, entry) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(entry));
  renameSync(tmp, path);
  stats.fetchedAt.push(entry.fetchedAt);
}

const safeName = (s) => s.toLowerCase().replace(/[^a-z0-9._-]+/g, "_");

/** A pinned paper's OpenAlex record, by DOI (cached). */
export async function getWork(doi) {
  const path = join(CACHE_DIR, "works", `${safeName(doi)}.json`);
  const hit = readCache(path, PAPER_SELECT);
  if (hit) return hit.work;
  if (stats.cacheMode === "offline") throw new Error(`offline: no cached work for ${doi} (${path})`);
  const work = await getJson(`${API}/works/doi:${doi}?select=${PAPER_SELECT}`);
  writeCache(path, { doi, select: PAPER_SELECT, fetchedAt: new Date().toISOString(), work });
  return work;
}

/**
 * Every work citing a pinned paper, self-citations included: OpenAlex `cites:`
 * links plus the Semantic Scholar extras for `citedDoi` (see below), minus
 * OpenAlex `peer-review` records (Copernicus open-discussion replies). Every
 * record is an OpenAlex work, so the self-citation rule, topics and
 * affiliations apply unchanged.
 */
export async function getCiting(workId, citedDoi) {
  const own = (await getOpenalexCiting(workId)).filter((w) => !EXCLUDED_TYPES.has(w.type));
  if (!citedDoi) return own;
  const extras = (await getS2Extras(workId, citedDoi, own)).filter((w) => !EXCLUDED_TYPES.has(w.type));
  return extras.length ? [...own, ...extras] : own;
}

/** OpenAlex record types that are not citing works. */
export const EXCLUDED_TYPES = new Set(["peer-review"]);

/** OpenAlex `cites:` list for a work id, as returned (cached). */
async function getOpenalexCiting(workId) {
  const path = join(CACHE_DIR, "citing", `${safeName(workId)}.json`);
  const hit = readCache(path, CITING_SELECT);
  if (hit) return hit.results;
  if (stats.cacheMode === "offline") throw new Error(`offline: no cached citing list for ${workId} (${path})`);
  // Page-based paging: cursor past page 1 needs an API key (OpenAlex 2026+).
  const results = [];
  let pageNum = 1;
  for (;;) {
    const url = `${API}/works?filter=cites:${workId}&per_page=200&page=${pageNum}&select=${CITING_SELECT}`;
    const page = await getJson(url);
    results.push(...page.results);
    const total = page.meta?.count ?? results.length;
    if (page.results.length === 0 || results.length >= total || page.results.length < 200) break;
    pageNum += 1;
    if (pageNum > 50) throw new Error(`OpenAlex page cap for ${workId}`);
  }
  writeCache(path, { workId, select: CITING_SELECT, fetchedAt: new Date().toISOString(), count: results.length, results });
  return results;
}

// ── Semantic Scholar extras ────────────────────────────────────────────────
// data/s2-reach/latest.json (scripts/semantic-scholar/fetch-s2-citations.mjs)
// lists the works S2 says cite each pinned DOI. Those whose DOI is not already
// among OpenAlex's citing works are looked up in OpenAlex by DOI and added,
// tagged `via: "semantic-scholar"`. S2 works without a DOI, or with no OpenAlex
// record, are counted in stats.s2 but never added: the page needs OpenAlex
// topics and affiliations for every square.

export const S2_PATH = join(ROOT, "data", "s2-reach", "latest.json");
const S2_DISABLED = process.argv.includes("--no-s2") || process.env.REACH_S2 === "off";

stats.s2 = { enabled: !S2_DISABLED, asOf: null, citingDois: 0, extrasAdded: 0, notInOpenalex: 0, noDoi: 0 };

let s2Index = null;
function s2CitingDois(citedDoi) {
  if (!s2Index) {
    s2Index = new Map();
    if (!S2_DISABLED && existsSync(S2_PATH)) {
      const s2 = JSON.parse(readFileSync(S2_PATH, "utf8"));
      stats.s2.asOf = s2.meta.fetchedAt.slice(0, 10);
      const doiOf = new Map(s2.papers.map((p) => [p.idx, p.doi.toLowerCase()]));
      for (const w of s2.works) {
        for (const c of w.cites) {
          const d = doiOf.get(c.paper);
          if (!s2Index.has(d)) s2Index.set(d, { dois: new Set(), noDoi: 0 });
          if (w.doi) s2Index.get(d).dois.add(w.doi.toLowerCase());
          else s2Index.get(d).noDoi++;
        }
      }
    }
  }
  return s2Index.get(citedDoi.toLowerCase()) ?? { dois: new Set(), noDoi: 0 };
}

const titleKey = (t) => (t || "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function getS2Extras(workId, citedDoi, openalexCiting) {
  const { dois, noDoi } = s2CitingDois(citedDoi);
  if (!dois.size) return [];
  const haveDoi = new Set(openalexCiting.map((w) => stripDoi(w.doi)).filter(Boolean));
  const haveId = new Set(openalexCiting.map((w) => w.id));
  // Same work under another DOI (e.g. preprint vs. article): skip on title + year.
  const haveTitle = new Set(openalexCiting.map((w) => `${titleKey(w.title)}|${w.publication_year}`));
  // Commas and pipes would break the OpenAlex filter syntax.
  const wanted = [...dois].filter((d) => !haveDoi.has(d) && !/[,|]/.test(d)).sort();

  const path = join(CACHE_DIR, "s2-extras", `${safeName(workId)}.json`);
  const key = `${CITING_SELECT}|${createHash("sha1").update(wanted.join("\n")).digest("hex")}`;
  let found = readCache(path, key)?.results;
  if (!found) {
    if (stats.cacheMode === "offline") throw new Error(`offline: no cached S2 extras for ${workId} (${path})`);
    found = [];
    for (let i = 0; i < wanted.length; i += 50) {
      const batch = wanted.slice(i, i + 50).map(encodeURIComponent).join("|");
      const page = await getJson(`${API}/works?filter=doi:${batch}&per_page=50&select=${CITING_SELECT}`);
      found.push(...page.results);
    }
    writeCache(path, { workId, citedDoi, select: key, fetchedAt: new Date().toISOString(), requested: wanted.length, results: found });
  }

  const extras = [];
  const seen = new Set();
  for (const w of found) {
    if (haveId.has(w.id) || seen.has(w.id) || haveTitle.has(`${titleKey(w.title)}|${w.publication_year}`)) continue;
    seen.add(w.id);
    extras.push({ ...w, via: "semantic-scholar" });
  }
  stats.s2.citingDois += dois.size;
  stats.s2.extrasAdded += extras.length;
  stats.s2.notInOpenalex += wanted.length - found.length;
  stats.s2.noDoi += noDoi;
  return extras;
}

/** Date (YYYY-MM-DD) of the oldest work or citing list used so far, or today if none. */
export function dataAsOf() {
  if (stats.fetchedAt.length === 0) return new Date().toISOString().slice(0, 10);
  return [...stats.fetchedAt].sort()[0].slice(0, 10);
}

export function cacheSummary() {
  return `${stats.requests} requests, ${stats.cacheHits} cache hits (mode ${stats.cacheMode}), ~$${stats.costUsd.toFixed(4)}`;
}

// ── Ids ────────────────────────────────────────────────────────────────────

export const shortId = (id) => (id ? id.replace("https://openalex.org/", "") : null);
export const stripDoi = (doi) => (doi ? doi.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase() : null);

// ── Self-citation rule (strict, per cited paper) ───────────────────────────
// A citing work is dropped if it shares ANY author with the cited paper:
// same OpenAlex author id, same ORCID, or same normalized full name
// (order-, accent- and case-insensitive; initials-only names never match).

export function nameKey(name) {
  if (!name) return null;
  const tokens = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
  if (tokens.length < 2 || tokens.some((t) => t.length < 2)) return null;
  return tokens.sort().join(" ");
}

export function authorKeys(work) {
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

/** "author-id" | "orcid" | "name" if `citing` shares an author with the cited paper, else null. */
export function selfCiteReason(citing, citedKeys) {
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

// ── Topics ─────────────────────────────────────────────────────────────────

export const TOPIC_SCORE_MIN = 0.5;

const ref = (x) => (x ? { id: shortId(x.id), name: x.display_name } : null);

/**
 * The topic a work is filed under: its top topic scored ≥ 0.5, else its primary
 * topic (the rule behind the page's "outside home topics" share). Carries the
 * OpenAlex hierarchy topic → subfield → field → domain.
 */
export function assignedTopic(work) {
  const scored = (work.topics ?? [])
    .filter((t) => typeof t.score === "number" && t.score >= TOPIC_SCORE_MIN)
    .sort((a, b) => b.score - a.score);
  const t = scored[0] ?? work.primary_topic;
  if (!t?.id && !t?.display_name) return null;
  const pt = work.primary_topic;
  return {
    id: shortId(t.id) ?? `topic:${t.display_name}`,
    name: t.display_name,
    subfield: ref(t.subfield) ?? ref(pt?.subfield),
    field: ref(t.field) ?? ref(pt?.field),
    domain: ref(t.domain) ?? ref(pt?.domain),
  };
}
