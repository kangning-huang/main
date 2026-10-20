#!/usr/bin/env node
/**
 * Prototype: fetch Google Scholar citing works for pinned Reach papers.
 *
 * Source of truth for citation *counts of citing works*: Scholar
 * (SerpAPI `inline_links.cited_by.total`), never OpenAlex.
 *
 * Requires SERP_API_KEY env or config/SerpApi-key.txt (same as fetch-scholar.mjs).
 *
 * Usage:
 *   node scripts/scholar-reach/fetch-citing.mjs
 *   node scripts/scholar-reach/fetch-citing.mjs --prototype   # 3 lead papers, few pages
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
const PROTOTYPE_MAX_PAGES = 2; // 40 citers / paper max in prototype
const SLEEP_MS = 1100;

const PROTOTYPE_DOIS = [
  "10.1088/1748-9326/ab4b71", // ERL 2019
  "10.1038/s41893-020-0521-x", // Nat Sustain 2020 (if pinned)
  "10.1029/2020JD033831", // JGR-A 2021 heat
];

const GREY_HINTS = [
  /ipcc/i,
  /\breport\b/i,
  /\bthesis\b/i,
  /\bdissertation\b/i,
  /\bworking paper\b/i,
  /\bpreprint\b/i,
  /\barxiv\b/i,
  /\bssrn\b/i,
  /\bcnki\b/i,
  /\b政策\b/,
  /\b报告\b/,
  /\b学位论文\b/,
  /\b白皮书\b/,
  /\bunep\b/i,
  /\bworld bank\b/i,
  /\bfao\b/i,
];

function getApiKey() {
  if (process.env.SERP_API_KEY) return process.env.SERP_API_KEY.trim();
  const keyFile = join(ROOT, "config", "SerpApi-key.txt");
  if (existsSync(keyFile)) return readFileSync(keyFile, "utf-8").trim();
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function serp(params) {
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
  await sleep(SLEEP_MS);
  return json;
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
  return GREY_HINTS.some((re) => re.test(blob));
}

function scholarIdFromResult(r) {
  // Prefer result_id; else hash of title+year
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
  // venue heuristic: last segment of "Authors - Venue, Year - Publisher"
  let venue = null;
  const parts = summary.split(" - ");
  if (parts.length >= 2) venue = parts[1].replace(/,?\s*(19|20)\d{2}.*$/, "").trim() || null;
  const title = r.title || "";
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
    detectedGreyLit: detectGrey(title, venue, summary),
    serpResultId: r.result_id || null,
  };
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

async function fetchCitingPages(citesId, maxPages) {
  const out = [];
  for (let page = 0; page < maxPages; page++) {
    const start = page * PAGE_SIZE;
    const data = await serp({
      engine: "google_scholar",
      cites: citesId,
      hl: "en",
      start,
      num: PAGE_SIZE,
    });
    const organic = data.organic_results || [];
    for (const r of organic) out.push(mapOrganic(r));
    const next = data.serpapi_pagination?.next;
    if (!organic.length || !next) break;
  }
  return out;
}

function loadPinned() {
  const raw = JSON.parse(readFileSync(DOIS_PATH, "utf-8"));
  return raw.papers || [];
}

function matchPubToPinned(pubs, pinned) {
  // Match by fuzzy title from publications pages if available; else leave unmatched.
  // We only have DOI + short label in dois.json — pull titles from influence.json if present.
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

function buildSampleFieldShelf(matched) {
  // Minimal Field & Shelf–compatible sketch: papers + citing records with Scholar citedBy.
  const papers = [];
  const citingByPaper = {};
  for (const m of matched) {
    if (!m.scholarMatch?.citesId) continue;
    const citers = citingByPaper[m.scholarMatch.citesId] || [];
    papers.push({
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
    });
  }
  // Flatten unique citers for a prototype "squares" list
  const seen = new Map();
  const paperIdx = new Map(papers.map((p, i) => [p.scholarCitesId, i]));
  for (const m of matched) {
    const cid = m.scholarMatch?.citesId;
    if (!cid) continue;
    const citers = citingByPaper[cid] || [];
    const pi = paperIdx.get(cid);
    for (const c of citers) {
      if (!seen.has(c.id)) {
        seen.set(c.id, {
          id: c.id,
          title: c.title,
          year: c.year,
          venue: c.venue,
          citedBy: c.scholarCitedBy, // SCHOLAR count
          detectedGreyLit: c.detectedGreyLit,
          paperIdxs: pi == null ? [] : [pi],
          link: c.link,
        });
      } else {
        const row = seen.get(c.id);
        if (pi != null && !row.paperIdxs.includes(pi)) row.paperIdxs.push(pi);
      }
    }
  }
  // attach citers map into builder via closure — filled by caller
  return { papers, squaresBuilder: (map) => {
    Object.assign(citingByPaper, map);
    // rebuild squares after map filled — caller uses buildSquares
  }, citingByPaper };
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
  };

  if (!key) {
    writeFileSync(join(OUT, "meta.json"), JSON.stringify({
      ...meta,
      status: "blocked-no-serp-key",
      next: [
        "Add config/SerpApi-key.txt or SERP_API_KEY",
        "Or run .github/workflows/scholar-reach-prototype.yml (uses secrets.SERP_API_KEY)",
        "Or follow NEED_BROWSER.md for residential/GUI scrape",
      ],
    }, null, 2));
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
  writeFileSync(join(OUT, "author-pubs.json"), JSON.stringify({
    meta: { asOf: new Date().toISOString(), count: pubs.length },
    publications: pubs,
  }, null, 2));
  console.log(`  ${pubs.length} pubs`);

  let pinned = loadPinned();
  if (PROTOTYPE) {
    const want = new Set(PROTOTYPE_DOIS.map((d) => d.toLowerCase()));
    const filtered = pinned.filter((p) => want.has(p.doi.toLowerCase()));
    // If Nat Sustain DOI not in pin list, keep whatever matched of the three
    pinned = filtered.length ? filtered : pinned.filter((p) => p.lens === "lead").slice(0, 3);
  }

  const matched = matchPubToPinned(pubs, pinned);
  const citingByPaper = {};
  const maxPages = PROTOTYPE ? PROTOTYPE_MAX_PAGES : 50;

  for (const m of matched) {
    const citesId = m.scholarMatch?.citesId;
    if (!citesId) {
      console.warn(`  no Scholar match for ${m.doi} (${m.short})`);
      continue;
    }
    console.log(`Fetching citers for ${m.short} cites=${citesId} (max ${maxPages} pages)…`);
    const citers = await fetchCitingPages(citesId, maxPages);
    citingByPaper[citesId] = citers;
    writeFileSync(
      join(OUT, `citing-${citesId}.json`),
      JSON.stringify({
        meta: {
          doi: m.doi,
          short: m.short,
          citesId,
          fetched: citers.length,
          asOf: new Date().toISOString(),
          greyLit: citers.filter((c) => c.detectedGreyLit).length,
        },
        citing: citers,
      }, null, 2)
    );
    console.log(`  ${citers.length} citers, greyLit≈${citers.filter((c) => c.detectedGreyLit).length}`);
  }

  const papers = matched
    .filter((m) => m.scholarMatch?.citesId)
    .map((m) => {
      const citers = citingByPaper[m.scholarMatch.citesId] || [];
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
      };
    });

  const squares = buildSquares(papers, citingByPaper);
  const sample = {
    $comment:
      "Prototype Scholar-backed Field & Shelf payload. citedBy = Google Scholar citation count of the citing work. Not layout-ready (no x,y). Grey literature flagged via heuristics.",
    meta: {
      schema: "field-shelf/scholar-v0",
      asOf: new Date().toISOString().slice(0, 10),
      source: "Google Scholar (SerpAPI)",
      encoding: "citing-work-scholar-cited-by",
      prototype: PROTOTYPE,
      squareCount: squares.length,
      greyLitSquares: squares.filter((s) => s.detectedGreyLit).length,
    },
    papers,
    squares,
  };
  writeFileSync(join(OUT, "sample-field-shelf.json"), JSON.stringify(sample, null, 2));

  meta.finishedAt = new Date().toISOString();
  meta.status = "ok";
  meta.papers = papers.length;
  meta.squares = squares.length;
  meta.greyLitSquares = sample.meta.greyLitSquares;
  writeFileSync(join(OUT, "meta.json"), JSON.stringify(meta, null, 2));
  console.log("Done.", meta);
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
