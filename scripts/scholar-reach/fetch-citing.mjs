#!/usr/bin/env node
/**
 * Fetch Google Scholar citing works for pinned Reach papers.
 *
 * Source of truth for citation *counts of citing works*: Scholar
 * (SerpAPI `inline_links.cited_by.total`), never OpenAlex.
 *
 * Requires SERP_API_KEY env or config/SerpApi-key.txt (same as fetch-scholar.mjs).
 *
 * Usage:
 *   node scripts/scholar-reach/fetch-citing.mjs
 *   node scripts/scholar-reach/fetch-citing.mjs --prototype   # 3 lead papers, deep grey-lit sweep
 *   node scripts/scholar-reach/fetch-citing.mjs --dry-run
 *
 * Outputs under data/scholar-reach/:
 *   author-pubs.json, citing-<cites_id>.json, sample-field-shelf.json, meta.json
 *
 * See /workspace/agent-tools/scholar-reach/DESIGN.md
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT = join(ROOT, "data", "scholar-reach");
const DOIS_PATH = join(ROOT, "data", "influence", "dois.json");
const AUTHOR_ID = "s_domssAAAAJ";

const PROTOTYPE = process.argv.includes("--prototype");
const DRY_RUN = process.argv.includes("--dry-run");
const PAGE_SIZE = 20;
// Deep sweep for grey lit (IPCC etc.): enough pages to cover high-cite papers.
// Prior run with max 2 pages found 0 grey-lit and ERL stalled at 3 citers
// because pagination stopped on a missing `next` link.
const PROTOTYPE_MAX_PAGES_HIGH = 30; // grey queries + year slices for ≥400-cite papers
const PROTOTYPE_MAX_PAGES_MID = 20; // grey + years
const PROTOTYPE_MAX_PAGES_LOW = 12; // grey-first for lower-cite papers
const FULL_MAX_PAGES = 50;
const SLEEP_MS = 1200;

const PROTOTYPE_DOIS = [
  "10.1088/1748-9326/ab4b71", // ERL 2019 (~550 Scholar cites)
  "10.1038/s41893-020-0521-x", // Nat Sustain 2020 (~967)
  "10.1029/2020JD033831", // JGR-A 2021 heat (~84)
];

/** Grey-lit / policy / report heuristics — return matching reason labels. */
const GREY_RULES = [
  { re: /\bipcc\b/i, why: "IPCC" },
  { re: /\bar6\b/i, why: "AR6" },
  { re: /\bar5\b/i, why: "AR5" },
  { re: /\bwg\s*i{1,3}\b/i, why: "IPCC WG" },
  { re: /\bwgii\b/i, why: "IPCC WGII" },
  { re: /\bwgiii\b/i, why: "IPCC WGIII" },
  { re: /\bspecial report\b/i, why: "special report" },
  { re: /\bsrex\b/i, why: "SREX" },
  { re: /\bsr\.?\s*1\.5\b/i, why: "SR1.5" },
  { re: /\bunep\b/i, why: "UNEP" },
  { re: /\bunited nations environment\b/i, why: "UNEP" },
  { re: /\bworld bank\b/i, why: "World Bank" },
  { re: /\bfao\b/i, why: "FAO" },
  { re: /\bundp\b/i, why: "UNDP" },
  { re: /\bwmo\b/i, why: "WMO" },
  { re: /\biucn\b/i, why: "IUCN" },
  { re: /\boecd\b/i, why: "OECD" },
  { re: /\biea\b/i, why: "IEA" },
  { re: /\bwho\b/i, why: "WHO" },
  { re: /\bun[- ]habitat\b/i, why: "UN-Habitat" },
  { re: /\btechnical report\b/i, why: "technical report" },
  { re: /\btech\.?\s*report\b/i, why: "technical report" },
  { re: /\bworking paper\b/i, why: "working paper" },
  { re: /\bdiscussion paper\b/i, why: "discussion paper" },
  { re: /\bwhite paper\b/i, why: "white paper" },
  { re: /\bpolicy brief\b/i, why: "policy brief" },
  { re: /\bpolicy report\b/i, why: "policy report" },
  { re: /\bgovernment report\b/i, why: "government report" },
  { re: /\bnational report\b/i, why: "national report" },
  { re: /\bassessment report\b/i, why: "assessment report" },
  { re: /\b\w+\s+report\b/i, why: "report" },
  { re: /\bthesis\b/i, why: "thesis" },
  { re: /\bdissertation\b/i, why: "dissertation" },
  { re: /\bph\.?\s*d\.?\s*thesis\b/i, why: "thesis" },
  { re: /\bmaster'?s thesis\b/i, why: "thesis" },
  { re: /\bpreprint\b/i, why: "preprint" },
  { re: /\barxiv\b/i, why: "arXiv" },
  { re: /\bssrn\b/i, why: "SSRN" },
  { re: /\bcnki\b/i, why: "CNKI" },
  { re: /\b政策\b/, why: "政策" },
  { re: /\b报告\b/, why: "报告" },
  { re: /\b学位论文\b/, why: "学位论文" },
  { re: /\b白皮书\b/, why: "白皮书" },
  { re: /\b专著\b/, why: "专著" },
];

/** Search-within-citing queries (SerpAPI cites + q) to surface grey lit. */
const GREY_QUERIES = [
  "IPCC",
  "AR6 OR AR5",
  "UNEP OR \"World Bank\" OR FAO OR UNDP OR WMO",
  "thesis OR dissertation",
  "\"working paper\" OR \"technical report\" OR \"policy brief\"",
  "报告 OR 学位论文 OR 白皮书",
  "CNKI OR SSRN",
];


function getApiKey() {
  if (process.env.SERP_API_KEY) return process.env.SERP_API_KEY.trim();
  const keyFile = join(ROOT, "config", "SerpApi-key.txt");
  if (existsSync(keyFile)) return readFileSync(keyFile, "utf-8").trim();
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isTransientSerpError(msg) {
  const s = String(msg || "");
  return (
    /hasn.?t returned any results/i.test(s) ||
    /timed?\s*out/i.test(s) ||
    /ECONNRESET|ETIMEDOUT|fetch failed|503|502|429/i.test(s)
  );
}

async function serpOnce(params) {
  const key = getApiKey();
  if (!key) {
    throw new Error(
      "No SERP_API_KEY. Set env or create config/SerpApi-key.txt. " +
        "Direct Scholar scrape from this host returns HTTP 403."
    );
  }
  const u = new URL("https://serpapi.com/search.json");
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") u.searchParams.set(k, String(v));
  }
  u.searchParams.set("api_key", key);
  const res = await fetch(u);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`SerpAPI non-JSON ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(`SerpAPI ${res.status}: ${json.error || text.slice(0, 200)}`);
  }
  if (json.error) throw new Error(`SerpAPI error: ${json.error}`);
  return json;
}

/** SerpAPI + rate limit; retries transient empty/timeout errors. */
async function serp(params, { retries = 4 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const json = await serpOnce(params);
      await sleep(SLEEP_MS);
      return json;
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || err);
      if (attempt < retries && isTransientSerpError(msg)) {
        const backoff = SLEEP_MS * Math.pow(2, attempt); // 1.2s, 2.4s, 4.8s, 9.6s
        console.warn(`  SerpAPI transient (${attempt + 1}/${retries}): ${msg.slice(0, 120)} — retry in ${backoff}ms`);
        await sleep(backoff);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function normTitle(t) {
  return (t || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titlesSimilar(a, b) {
  a = normTitle(a);
  b = normTitle(b);
  if (!a || !b) return false;
  const shorter = a.length < b.length ? a : b;
  const longer = a.length >= b.length ? a : b;
  if (longer.startsWith(shorter.slice(0, Math.min(shorter.length, 50)))) return true;
  const aw = new Set(a.split(" ").filter((w) => w.length > 3));
  const bw = new Set(b.split(" ").filter((w) => w.length > 3));
  const inter = [...aw].filter((w) => bw.has(w));
  const union = new Set([...aw, ...bw]);
  return union.size > 0 && inter.length / union.size > 0.65;
}

function detectGrey(title, venue, typeHint) {
  const blob = `${title || ""} ${venue || ""} ${typeHint || ""}`;
  const reasons = [];
  const seen = new Set();
  for (const rule of GREY_RULES) {
    if (rule.re.test(blob) && !seen.has(rule.why)) {
      seen.add(rule.why);
      reasons.push(rule.why);
    }
  }
  return { detected: reasons.length > 0, reasons };
}

function scholarIdFromResult(r) {
  if (r.result_id) return `GS_${r.result_id}`;
  const h = createHash("sha1")
    .update(`${r.title || ""}|${r.year || ""}`)
    .digest("hex")
    .slice(0, 12);
  return `GS_${h}`;
}

function mapOrganic(r) {
  const pub = r.publication_info || {};
  const cite = r.inline_links?.cited_by || {};
  const summary = pub.summary || "";
  const yearMatch = summary.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? Number(yearMatch[0]) : null;
  let venue = null;
  const parts = summary.split(" - ");
  if (parts.length >= 2) venue = parts[1].replace(/,?\s*(19|20)\d{2}.*$/, "").trim() || null;
  const title = r.title || "";
  const grey = detectGrey(title, venue, summary);
  return {
    id: scholarIdFromResult(r),
    title,
    authors: pub.authors || null,
    year,
    venue,
    summary,
    scholarCitedBy: typeof cite.total === "number" ? cite.total : 0,
    citesId: cite.cites_id ? String(cite.cites_id) : null,
    link: r.link || null,
    resources: (r.resources || []).map((x) => ({ title: x.title, link: x.link })),
    detectedGreyLit: grey.detected,
    greyLitReasons: grey.reasons,
    serpResultId: r.result_id || null,
  };
}

function pagesForPaper(citationCount, prototype) {
  if (!prototype) return FULL_MAX_PAGES;
  const n = citationCount || 0;
  if (n >= 400) return PROTOTYPE_MAX_PAGES_HIGH;
  if (n >= 100) return PROTOTYPE_MAX_PAGES_MID;
  return PROTOTYPE_MAX_PAGES_LOW;
}

async function fetchAuthorPubs() {
  const pubs = [];
  let start = 0;
  while (true) {
    const data = await serp({
      engine: "google_scholar_author",
      author_id: AUTHOR_ID,
      hl: "en",
      start,
      num: 100,
      sortby: "citeddesc",
    });
    const articles = data.articles || [];
    for (const art of articles) {
      pubs.push({
        title: art.title || "",
        year: parseInt(art.year, 10) || null,
        citationCount: art.cited_by?.value || 0,
        citesId: art.cited_by?.cites_id ? String(art.cited_by.cites_id) : null,
        citationUrl: art.cited_by?.link || null,
        authors: art.authors || null,
        publication: art.publication || null,
        authorPubId: art.author_pub_id || null,
      });
    }
    if (articles.length < 100) break;
    start += 100;
  }
  return pubs;
}

/**
 * One SerpAPI cites page → mapped rows. Returns null organic on soft empty.
 */
async function fetchCitesPage(citesId, extra = {}) {
  const data = await serp({
    engine: "google_scholar",
    cites: citesId,
    hl: "en",
    num: PAGE_SIZE,
    ...extra,
  });
  return {
    organic: data.organic_results || [],
    next: data.serpapi_pagination?.next || null,
  };
}

/**
 * Deep citing crawl for grey lit:
 * 1) cites+q grey-keyword searches (IPCC, reports, theses, …)
 * 2) year-sliced cites (as_ylo/as_yhi) — bypasses SerpAPI’s shallow unfiltered pagination
 * 3) unfiltered pages as filler if still thin
 *
 * Dedupes by Scholar result id. Respects maxPages total SerpAPI calls.
 */
async function fetchCitingPages(citesId, maxPages, { paperYear = null, deep = false } = {}) {
  const byId = new Map();
  let pagesFetched = 0;
  let stoppedReason = "max-pages";
  const sliceLog = [];

  function addOrganic(organic, label) {
    let added = 0;
    let greyAdded = 0;
    for (const r of organic) {
      const m = mapOrganic(r);
      if (!byId.has(m.id)) {
        byId.set(m.id, m);
        added++;
        if (m.detectedGreyLit) greyAdded++;
      }
    }
    sliceLog.push({
      label,
      got: organic.length,
      added,
      greyAdded,
      total: byId.size,
    });
    return { added, greyAdded };
  }

  async function onePage(extra, label) {
    if (pagesFetched >= maxPages) return { stop: true };
    try {
      const { organic, next } = await fetchCitesPage(citesId, extra);
      pagesFetched++;
      addOrganic(organic, label);
      return { organic, next, stop: false };
    } catch (err) {
      const msg = String(err?.message || err);
      if (byId.size > 0 && /hasn.?t returned any results/i.test(msg)) {
        console.warn(`  soft-skip ${label}: ${msg.slice(0, 100)}`);
        sliceLog.push({ label, error: msg.slice(0, 160), soft: true });
        return { organic: [], next: null, stop: false, softError: true };
      }
      throw err;
    }
  }

  if (deep) {
    // ── 1) Grey-lit keyword hunt within citing articles ──
    for (const q of GREY_QUERIES) {
      if (pagesFetched >= maxPages) break;
      // Up to 2 pages per grey query
      for (let page = 0; page < 2; page++) {
        if (pagesFetched >= maxPages) break;
        const res = await onePage({ q, start: page * PAGE_SIZE }, `grey:${q}:p${page}`);
        if (res.stop) break;
        if (res.softError || !res.organic?.length) break;
        if (res.organic.length < PAGE_SIZE && !res.next) break;
      }
    }

    // ── 2) Year slices (paper year → current+1) ──
    const y0 = paperYear && paperYear >= 1990 ? paperYear : 2018;
    const y1 = new Date().getFullYear() + 1;
    const pagesLeftHint = maxPages - pagesFetched;
    const yearCount = Math.max(1, y1 - y0 + 1);
    // Spread remaining budget across years (at least 1 page/year when possible)
    const perYear = Math.max(1, Math.min(3, Math.floor(pagesLeftHint / yearCount) || 1));
    for (let y = y0; y <= y1; y++) {
      if (pagesFetched >= maxPages) break;
      for (let page = 0; page < perYear; page++) {
        if (pagesFetched >= maxPages) break;
        const res = await onePage(
          { as_ylo: y, as_yhi: y, start: page * PAGE_SIZE },
          `year:${y}:p${page}`
        );
        if (res.stop) break;
        if (res.softError || !res.organic?.length) break;
        if (res.organic.length < PAGE_SIZE && !res.next) break;
      }
    }
    stoppedReason = pagesFetched >= maxPages ? "max-pages" : "deep-complete";
  } else {
    // Shallow unfiltered pagination (non-prototype / full mode filler)
    for (let page = 0; page < maxPages; page++) {
      const res = await onePage({ start: page * PAGE_SIZE }, `all:p${page}`);
      if (res.stop) {
        stoppedReason = "max-pages";
        break;
      }
      if (res.softError) {
        stoppedReason = "serp-no-results-soft-stop";
        break;
      }
      if (!res.organic?.length) {
        stoppedReason = page === 0 ? "empty-first-page" : "empty-page";
        break;
      }
      if (res.organic.length < PAGE_SIZE && !res.next) {
        stoppedReason = "short-final-page";
        break;
      }
    }
  }

  return {
    citers: [...byId.values()],
    pagesFetched,
    stoppedReason,
    sliceLog,
  };
}

function loadPinned() {
  const raw = JSON.parse(readFileSync(DOIS_PATH, "utf-8"));
  return raw.papers || [];
}

function matchPubToPinned(pubs, pinned) {
  let titlesByDoi = {};
  const inflPath = join(ROOT, "src", "data", "influence.json");
  if (existsSync(inflPath)) {
    const infl = JSON.parse(readFileSync(inflPath, "utf-8"));
    for (const p of infl.papers || []) {
      titlesByDoi[p.doi.toLowerCase()] = p.title;
    }
  }
  return pinned.map((p) => {
    const want = titlesByDoi[p.doi.toLowerCase()] || p.short;
    const hit = pubs.find((s) => titlesSimilar(s.title, want));
    return { ...p, scholarTitle: want, scholarMatch: hit || null };
  });
}

function buildSquares(papers, citingByPaper) {
  const paperIdx = new Map(papers.map((p, i) => [p.scholarCitesId, i]));
  const seen = new Map();
  for (const p of papers) {
    const citers = citingByPaper[p.scholarCitesId] || [];
    const pi = paperIdx.get(p.scholarCitesId);
    for (const c of citers) {
      if (!seen.has(c.id)) {
        seen.set(c.id, {
          id: c.id,
          title: c.title,
          year: c.year,
          venue: c.venue,
          citedBy: c.scholarCitedBy,
          detectedGreyLit: c.detectedGreyLit,
          greyLitReasons: c.greyLitReasons || [],
          paperIdxs: [pi],
          link: c.link,
        });
      } else {
        const row = seen.get(c.id);
        if (!row.paperIdxs.includes(pi)) row.paperIdxs.push(pi);
      }
    }
  }
  return [...seen.values()];
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const key = getApiKey();
  const meta = {
    startedAt: new Date().toISOString(),
    authorId: AUTHOR_ID,
    prototype: PROTOTYPE,
    dryRun: DRY_RUN,
    hasSerpKey: Boolean(key),
    source: "Google Scholar via SerpAPI",
    encoding: "citing-work-scholar-cited-by",
    mode: PROTOTYPE ? "prototype-deep-grey-lit" : "full",
    pageBudgets: PROTOTYPE
      ? {
          highCite: PROTOTYPE_MAX_PAGES_HIGH,
          midCite: PROTOTYPE_MAX_PAGES_MID,
          lowCite: PROTOTYPE_MAX_PAGES_LOW,
          pageSize: PAGE_SIZE,
        }
      : { maxPages: FULL_MAX_PAGES, pageSize: PAGE_SIZE },
  };

  if (!key) {
    writeFileSync(
      join(OUT, "meta.json"),
      JSON.stringify(
        {
          ...meta,
          status: "blocked-no-serp-key",
          next: [
            "Add config/SerpApi-key.txt or SERP_API_KEY",
            "Or run Update Google Scholar Citations workflow (uses secrets.SERP_API_KEY)",
            "Or follow NEED_BROWSER.md for residential/GUI scrape",
          ],
        },
        null,
        2
      )
    );
    console.error("No SERP_API_KEY — wrote data/scholar-reach/meta.json and exiting 2.");
    process.exit(2);
  }

  if (DRY_RUN) {
    console.log("Dry run OK — key present, no requests.");
    writeFileSync(join(OUT, "meta.json"), JSON.stringify({ ...meta, status: "dry-run-ok" }, null, 2));
    return;
  }

  console.log("Fetching author publications…");
  const pubs = await fetchAuthorPubs();
  writeFileSync(
    join(OUT, "author-pubs.json"),
    JSON.stringify(
      {
        meta: { asOf: new Date().toISOString(), count: pubs.length },
        publications: pubs,
      },
      null,
      2
    )
  );
  console.log(`  ${pubs.length} pubs`);

  let pinned = loadPinned();
  if (PROTOTYPE) {
    const want = new Set(PROTOTYPE_DOIS.map((d) => d.toLowerCase()));
    const filtered = pinned.filter((p) => want.has(p.doi.toLowerCase()));
    pinned = filtered.length ? filtered : pinned.filter((p) => p.lens === "lead").slice(0, 3);
  }

  let matched = matchPubToPinned(pubs, pinned);
  // Deep-sweep priority: highest Scholar cites first (Nat Sustain, ERL, then JGR).
  matched = matched.slice().sort((a, b) => {
    const ca = a.scholarMatch?.citationCount || 0;
    const cb = b.scholarMatch?.citationCount || 0;
    return cb - ca;
  });

  const citingByPaper = {};
  const fetchStats = [];

  for (const m of matched) {
    const citesId = m.scholarMatch?.citesId;
    if (!citesId) {
      console.warn(`  no Scholar match for ${m.doi} (${m.short})`);
      fetchStats.push({ doi: m.doi, short: m.short, error: "no-scholar-match" });
      continue;
    }
    const citeCount = m.scholarMatch.citationCount || 0;
    const maxPages = pagesForPaper(citeCount, PROTOTYPE);
    console.log(
      `Fetching citers for ${m.short} cites=${citesId} scholarCites=${citeCount} (max ${maxPages} pages)…`
    );
    try {
      const { citers, pagesFetched, stoppedReason, sliceLog } = await fetchCitingPages(
        citesId,
        maxPages,
        { paperYear: m.year || m.scholarMatch?.year || null, deep: PROTOTYPE }
      );
      citingByPaper[citesId] = citers;
      const greyN = citers.filter((c) => c.detectedGreyLit).length;
      const stat = {
        doi: m.doi,
        short: m.short,
        citesId,
        scholarCitationCount: citeCount,
        maxPages,
        pagesFetched,
        stoppedReason,
        fetched: citers.length,
        greyLit: greyN,
        sliceLog: (sliceLog || []).slice(0, 80),
      };
      fetchStats.push(stat);
      writeFileSync(
        join(OUT, `citing-${citesId}.json`),
        JSON.stringify(
          {
            meta: {
              ...stat,
              asOf: new Date().toISOString(),
            },
            citing: citers,
          },
          null,
          2
        )
      );
      console.log(
        `  pages=${pagesFetched}/${maxPages} (${stoppedReason}) → ${citers.length} citers, greyLit=${greyN}`
      );
      if (citeCount > 50 && citers.length < Math.min(20, citeCount * 0.05)) {
        console.warn(
          `  WARNING: fetched only ${citers.length} citers for a paper with ${citeCount} Scholar cites — check cites_id / SerpAPI.`
        );
      }
    } catch (err) {
      const msg = String(err?.message || err);
      console.error(`  FAILED ${m.short}: ${msg}`);
      citingByPaper[citesId] = citingByPaper[citesId] || [];
      fetchStats.push({
        doi: m.doi,
        short: m.short,
        citesId,
        scholarCitationCount: citeCount,
        maxPages,
        error: msg.slice(0, 300),
        fetched: (citingByPaper[citesId] || []).length,
        greyLit: 0,
      });
      // Continue other papers — do not abort the whole sweep.
    }
  }

  const papers = matched
    .filter((m) => m.scholarMatch?.citesId)
    .map((m) => {
      const citers = citingByPaper[m.scholarMatch.citesId] || [];
      const stat = fetchStats.find((s) => s.citesId === m.scholarMatch.citesId) || {};
      return {
        doi: m.doi,
        short: m.short,
        year: m.year,
        theme: m.theme,
        lens: m.lens,
        title: m.scholarMatch.title,
        venue: m.scholarMatch.publication || null,
        scholarCitesId: m.scholarMatch.citesId,
        scholarCitationCount: m.scholarMatch.citationCount,
        citingFetched: citers.length,
        citingGreyLit: citers.filter((c) => c.detectedGreyLit).length,
        pagesFetched: stat.pagesFetched ?? null,
        maxPages: stat.maxPages ?? null,
        stoppedReason: stat.stoppedReason ?? null,
      };
    });

  const squares = buildSquares(papers, citingByPaper);
  const greyLitSquares = squares.filter((s) => s.detectedGreyLit);
  const greyLitSample = greyLitSquares.map((s) => ({
    id: s.id,
    title: s.title,
    year: s.year,
    venue: s.venue,
    citedBy: s.citedBy,
    greyLitReasons: s.greyLitReasons || [],
    paperIdxs: s.paperIdxs,
    link: s.link,
  }));

  const sample = {
    $comment:
      "Scholar-backed Field & Shelf payload. citedBy = Google Scholar citation count of the citing work. Not layout-ready (no x,y). Grey literature flagged via heuristics; see greyLitSample.",
    meta: {
      schema: "field-shelf/scholar-v0",
      asOf: new Date().toISOString().slice(0, 10),
      source: "Google Scholar (SerpAPI)",
      encoding: "citing-work-scholar-cited-by",
      prototype: PROTOTYPE,
      mode: meta.mode,
      squareCount: squares.length,
      greyLitSquares: greyLitSquares.length,
      pagesByPaper: papers.map((p) => ({
        short: p.short,
        scholarCitationCount: p.scholarCitationCount,
        pagesFetched: p.pagesFetched,
        maxPages: p.maxPages,
        citingFetched: p.citingFetched,
        citingGreyLit: p.citingGreyLit,
        stoppedReason: p.stoppedReason,
      })),
    },
    papers,
    squares,
    greyLitSample,
  };
  writeFileSync(join(OUT, "sample-field-shelf.json"), JSON.stringify(sample, null, 2));

  meta.finishedAt = new Date().toISOString();
  const anyFetched = papers.some((p) => (p.citingFetched || 0) > 0);
  const anyError = fetchStats.some((s) => s.error);
  meta.status = !anyFetched && anyError ? "error" : anyError ? "partial" : "ok";
  meta.papers = papers.length;
  meta.squares = squares.length;
  meta.greyLitSquares = greyLitSquares.length;
  meta.fetchStats = fetchStats;
  writeFileSync(join(OUT, "meta.json"), JSON.stringify(meta, null, 2));
  console.log("Done.", {
    status: meta.status,
    papers: meta.papers,
    squares: meta.squares,
    greyLitSquares: meta.greyLitSquares,
    fetchStats,
  });
  if (meta.status === "error") process.exit(1);
}

main().catch((err) => {
  console.error(err);
  try {
    mkdirSync(OUT, { recursive: true });
    writeFileSync(
      join(OUT, "meta.json"),
      JSON.stringify({ status: "error", error: String(err), at: new Date().toISOString() }, null, 2)
    );
  } catch {}
  process.exit(1);
});
