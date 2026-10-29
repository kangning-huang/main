#!/usr/bin/env node
/**
 * Semantic Scholar citing-works pull for the pinned Reach DOIs.
 *
 * Input:   data/influence/dois.json
 * Output:  data/s2-reach/latest.json + data/s2-reach/YYYY-MM-DD.json
 *
 * Usage:
 *   node scripts/semantic-scholar/fetch-s2-citations.mjs
 *   node scripts/semantic-scholar/fetch-s2-citations.mjs --dry-run
 *
 * Env: S2_API_KEY (optional; raises the rate limit from the shared anonymous pool)
 *      S2_CACHE_MAX_AGE_HOURS (default 144: per-paper citation lists older than this are refetched)
 *
 * Self-citation (same strict rule as the OpenAlex pipeline): per cited paper, a
 * citing work is flagged if it shares ANY author with it — same S2 author ID or
 * the same normalized full name. Initials-only names are not name-matched.
 *
 * S2 adds what OpenAlex lacks: isInfluential (S2's "highly influential citation"
 * flag), citation intents (background / methodology / result) and the citing
 * sentences (contexts), when the publisher allows S2 to show them.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const DOIS_PATH = join(ROOT, "data", "influence", "dois.json");
const OUT_DIR = join(ROOT, "data", "s2-reach");
const CACHE_DIR = join(OUT_DIR, "cache");
const OPENALEX_PATH = join(ROOT, "src", "data", "influence.json");

const API = "https://api.semanticscholar.org/graph/v1";
const DRY_RUN = process.argv.includes("--dry-run");
const KEY = process.env.S2_API_KEY || "";
const SLEEP_MS = KEY ? 1100 : 3000;
const PAGE = 1000;
const MAX_AGE_HOURS = Number(process.env.S2_CACHE_MAX_AGE_HOURS ?? 144);
const PAPER_FIELDS = "title,year,venue,citationCount,influentialCitationCount,externalIds,authors";
const CITING_FIELDS = [
  "isInfluential", "intents", "contexts",
  "title", "year", "venue", "publicationVenue", "citationCount", "influentialCitationCount",
  "externalIds", "publicationTypes", "s2FieldsOfStudy", "authors", "url", "openAccessPdf",
].join(",");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path, body) {
  const url = API + path;
  const init = { headers: { ...(KEY ? { "x-api-key": KEY } : {}), ...(body ? { "Content-Type": "application/json" } : {}) } };
  if (body) Object.assign(init, { method: "POST", body: JSON.stringify(body) });
  for (let attempt = 0; attempt < 14; attempt++) {
    const res = await fetch(url, init).catch((e) => ({ ok: false, status: String(e) }));
    if (res.ok) {
      await sleep(SLEEP_MS);
      return res.json();
    }
    if (res.status === 404) return null;
    const wait = Math.min(90000, 5000 * 2 ** attempt) + Math.random() * 3000;
    console.warn(`  ${res.status} on ${path.slice(0, 80)} — retry in ${wait / 1000}s`);
    await sleep(wait);
  }
  throw new Error(`Semantic Scholar failed after retries: ${path}`);
}

const normName = (n) =>
  (n || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z\s-]/g, " ").split(/[\s-]+/).filter(Boolean);
// Order-insensitive full-name key; null for initials-only names ("K. Huang").
function nameKey(n) {
  const parts = normName(n);
  if (parts.length < 2 || parts.filter((p) => p.length > 1).length < 2) return null;
  return parts.sort().join(" ");
}

const pinned = JSON.parse(readFileSync(DOIS_PATH, "utf-8")).papers;
let openalexByDoi = new Map();
try {
  const oa = JSON.parse(readFileSync(OPENALEX_PATH, "utf-8"));
  openalexByDoi = new Map(oa.papers.map((p) => [p.doi.toLowerCase(), p]));
} catch {}

const papers = [];
const works = new Map();

// One batch call for all cited papers; the anonymous pool rate-limits hard.
const metas = await get(`/paper/batch?fields=${PAPER_FIELDS}`, { ids: pinned.map((p) => `DOI:${p.doi}`) });

// Per-paper citation lists are cached so a rate-limited run can resume.
async function citationsOf(paperId) {
  const cacheFile = join(CACHE_DIR, `${paperId}.json`);
  if (existsSync(cacheFile) && (Date.now() - statSync(cacheFile).mtimeMs) / 3.6e6 <= MAX_AGE_HOURS) {
    return JSON.parse(readFileSync(cacheFile, "utf-8"));
  }
  const rows = [];
  for (let offset = 0; offset < 10000; offset += PAGE) {
    const page = await get(`/paper/${paperId}/citations?fields=${CITING_FIELDS}&limit=${PAGE}&offset=${offset}`);
    rows.push(...(page?.data || []));
    if (!page?.next) break;
  }
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cacheFile, JSON.stringify(rows));
  return rows;
}

for (const [idx, pin] of pinned.entries()) {
  const meta = metas[idx];
  const oa = openalexByDoi.get(pin.doi.toLowerCase());
  const paper = {
    idx, doi: pin.doi, short: pin.short, lens: pin.lens, theme: pin.theme, year: pin.year,
    s2PaperId: meta?.paperId || null,
    title: meta?.title || null,
    s2CitationCount: meta?.citationCount ?? null,
    s2InfluentialCitationCount: meta?.influentialCitationCount ?? null,
    citingFetched: 0, selfCitations: 0, citingNonSelf: 0, influentialNonSelf: 0,
    openalexCitedByCount: oa?.openalexCitedByCount ?? null,
    openalexCitingNonSelf: oa?.citingNonSelf ?? null,
  };
  papers.push(paper);
  if (!meta) {
    console.log(`✗ ${pin.short} — not in Semantic Scholar`);
    continue;
  }
  const ownIds = new Set(meta.authors.map((a) => a.authorId).filter(Boolean));
  const ownNames = new Set(meta.authors.map((a) => nameKey(a.name)).filter(Boolean));

  {
    for (const c of await citationsOf(meta.paperId)) {
      const w = c.citingPaper;
      if (!w?.paperId) continue;
      paper.citingFetched++;
      const self = w.authors.some((a) => (a.authorId && ownIds.has(a.authorId)) || ownNames.has(nameKey(a.name)));
      let rec = works.get(w.paperId);
      if (!rec) {
        rec = {
          s2PaperId: w.paperId,
          doi: w.externalIds?.DOI?.toLowerCase() || null,
          title: w.title,
          year: w.year,
          venue: w.publicationVenue?.name || w.venue || null,
          publicationTypes: w.publicationTypes || [],
          fields: [...new Set((w.s2FieldsOfStudy || []).map((f) => f.category))],
          citationCount: w.citationCount ?? 0,
          influentialCitationCount: w.influentialCitationCount ?? 0,
          authors: w.authors.map((a) => ({ id: a.authorId, name: a.name })),
          url: w.url,
          openAccessPdf: w.openAccessPdf?.url || null,
          cites: [],
        };
        works.set(w.paperId, rec);
      }
      rec.cites.push({
        paper: idx, self, isInfluential: !!c.isInfluential,
        intents: c.intents || [], contexts: (c.contexts || []).slice(0, 3),
      });
      if (self) paper.selfCitations++;
      else {
        paper.citingNonSelf++;
        if (c.isInfluential) paper.influentialNonSelf++;
      }
    }
  }
  console.log(`✓ ${pin.short.padEnd(48)} S2 ${String(paper.citingNonSelf).padStart(4)} non-self (${paper.influentialNonSelf} influential) · OpenAlex ${paper.openalexCitingNonSelf ?? "—"}`);
}

const list = [...works.values()].sort((a, b) => b.citationCount - a.citationCount);
const nonSelf = list.filter((w) => w.cites.some((c) => !c.self));
const leadIdx = new Set(papers.filter((p) => p.lens === "lead").map((p) => p.idx));
const intentCounts = {};
for (const w of nonSelf) for (const c of w.cites) if (!c.self) for (const i of c.intents) intentCounts[i] = (intentCounts[i] || 0) + 1;

const totals = {
  papers: papers.length,
  papersFoundInS2: papers.filter((p) => p.s2PaperId).length,
  citingLinksFetched: papers.reduce((s, p) => s + p.citingFetched, 0),
  selfCitationsFlagged: papers.reduce((s, p) => s + p.selfCitations, 0),
  uniqueCitingWorks: list.length,
  uniqueCitingWorksNonSelf: nonSelf.length,
  uniqueCitingLeadNonSelf: nonSelf.filter((w) => w.cites.some((c) => !c.self && leadIdx.has(c.paper))).length,
  influentialLinksNonSelf: papers.reduce((s, p) => s + p.influentialNonSelf, 0),
  withContexts: nonSelf.filter((w) => w.cites.some((c) => c.contexts.length)).length,
  withDoi: nonSelf.filter((w) => w.doi).length,
  intentCounts,
  openalexUniqueCitingWorks: (() => {
    try { return JSON.parse(readFileSync(OPENALEX_PATH, "utf-8")).totals.uniqueCitingWorks; } catch { return null; }
  })(),
};

const out = {
  meta: { source: "Semantic Scholar Graph API", fetchedAt: new Date().toISOString(), authenticated: !!KEY },
  totals,
  papers,
  works: list,
};
console.log(JSON.stringify(totals, null, 2));
if (!DRY_RUN) {
  mkdirSync(OUT_DIR, { recursive: true });
  const json = JSON.stringify(out, null, 1) + "\n";
  writeFileSync(join(OUT_DIR, "latest.json"), json);
  writeFileSync(join(OUT_DIR, `${out.meta.fetchedAt.slice(0, 10)}.json`), json);
  console.log(`wrote data/s2-reach/latest.json (${(json.length / 1e6).toFixed(1)} MB)`);
}
