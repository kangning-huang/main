#!/usr/bin/env node
/**
 * Merge raw Google Scholar "Cited by" pages into one citing-works database.
 *
 * Input:  data/scholar-reach/raw/_papers.json        (Ken's Scholar profile rows)
 *         data/scholar-reach/raw/<citesId>_<year|all>_s<start>.json  (one per results page)
 * Output: data/scholar-reach/citing-works.json        (deduplicated citing works)
 *         data/scholar-reach/cited-papers.json        (Ken's papers + coverage per paper)
 *
 * Raw pages come from a browser crawl of scholar.google.com in Ken's logged-in
 * Chrome (no Scholar API exists; see docs/reach/SCHOLAR-DB.md). This script
 * only reads local files and makes no network requests.
 *
 *   node scripts/scholar-reach/build-scholar-db.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RAW = join(ROOT, "data", "scholar-reach", "raw");
const OUT = join(ROOT, "data", "scholar-reach");
const KEN_SCHOLAR_ID = "s_domssAAAAJ";

const normTitle = (t) =>
  (t || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function titleScore(a, b) {
  const aw = new Set(normTitle(a).split(" ").filter((w) => w.length > 3));
  const bw = new Set(normTitle(b).split(" ").filter((w) => w.length > 3));
  if (!aw.size || !bw.size) return 0;
  const inter = [...aw].filter((w) => bw.has(w)).length;
  return inter / Math.min(aw.size, bw.size);
}

// ── Site publication list → title/DOI pairs ──
function sitePublications() {
  const pubs = [];
  for (const f of ["publications-part-a.ts", "publications-part-b.ts"]) {
    const src = readFileSync(join(ROOT, "src", "lib", f), "utf-8");
    for (const block of src.split(/\n\s*\{\s*\n/).slice(1)) {
      const title = block.match(/title:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
      const doi = block.match(/doi:\s*"([^"]+)"/)?.[1];
      if (title) pubs.push({ title, doi: doi || null });
    }
  }
  return pubs;
}

const pinned = JSON.parse(readFileSync(join(ROOT, "data", "influence", "dois.json"), "utf-8")).papers;
const pinnedByDoi = new Map(pinned.map((p) => [p.doi.toLowerCase(), p]));
const site = sitePublications();

function matchDoi(scholarTitle) {
  let best = null;
  for (const p of site) {
    const s = titleScore(scholarTitle, p.title);
    if (s >= 0.8 && (!best || s > best.s)) best = { ...p, s };
  }
  return best?.doi || null;
}

// ── Byline: "A Author, B Author… - Venue, 2021 - publisher.com" ──
function parseByline(byline) {
  byline = byline.replace(/\u00a0/g, " ");
  const parts = byline.split(/\s+-\s+/);
  const authorsRaw = (parts[0] || "").trim();
  const mid = parts.length >= 3 ? parts.slice(1, -1).join(" - ") : parts[1] || "";
  const source = parts.length >= 3 ? parts[parts.length - 1].trim() : "";
  const year = +(mid.match(/\b(19|20)\d{2}\b/)?.[0] || 0) || null;
  const venue = mid.replace(/,?\s*\b(19|20)\d{2}\b\s*$/, "").replace(/^\s*,\s*/, "").trim() || null;
  return {
    authors: authorsRaw.replace(/…$/, "").split(/\s*,\s*/).filter(Boolean),
    authorsTruncated: /…/.test(authorsRaw),
    venue,
    venueTruncated: /…/.test(venue || ""),
    year,
    source: source || null,
  };
}

const GREY = [
  [/\bipcc\b|intergovernmental panel/i, "IPCC"],
  [/\b(ph\.?\s*d|doctoral|master'?s?)\b.*\b(thesis|dissertation)\b|\bthesis\b|\bdissertation\b|proquest/i, "thesis"],
  [/\barxiv\b|\bssrn\b|preprint|research square|essoar|egusphere|biorxiv|medrxiv|osf\.io/i, "preprint"],
  [/world bank|\bunep\b|\bundp\b|un-habitat|\boecd\b|\bwmo\b|\bfao\b|\biucn\b|\bwri\b/i, "agency"],
  [/\breport\b|working paper|policy brief|white paper|discussion paper/i, "report"],
  [/学位论文|硕士|博士/, "thesis"],
];
function greyLit(w) {
  const hay = [w.title, w.venue, w.source, w.url].join(" ");
  if (/\[BOOK\]/.test(w.type)) return "book";
  for (const [re, why] of GREY) if (re.test(hay)) return why;
  return null;
}

// Author key "K Huang" → "k huang"; used for the shared-author self-citation check.
const authorKey = (a) => normTitle(a).replace(/^((?:[a-z] )*[a-z]?)\s*/, (m) => m.replace(/\s/g, "") + " ").trim();

// ── Load raw ──
const files = readdirSync(RAW).filter((f) => /^\d+_(all|\d{4})_s\d{4}\.json$/.test(f)).sort();
const profile = JSON.parse(readFileSync(join(RAW, "_papers.json"), "utf-8"));

const papers = profile.papers.map((p, i) => {
  const authors = (p.byline.split("|")[0] || "").split(/\s*,\s*/).filter(Boolean);
  const doi = matchDoi(p.title);
  const pin = doi ? pinnedByDoi.get(doi.toLowerCase()) : null;
  return {
    idx: i,
    scholarCitesId: p.citesId,
    title: p.title,
    year: p.year,
    byline: p.byline,
    authors,
    doi,
    lens: pin?.lens || null,
    theme: pin?.theme || null,
    scholarCitationCount: p.count,
    fetchedRows: 0,
    uniqueCiting: 0,
    selfCitations: 0,
  };
});
const paperByCites = new Map(papers.map((p) => [p.scholarCitesId.split(",")[0], p]));

const works = new Map();
let rows = 0;
let latest = "";
for (const f of files) {
  const page = JSON.parse(readFileSync(join(RAW, f), "utf-8"));
  const paper = paperByCites.get(f.split("_")[0]);
  if (!paper) continue;
  if (page.fetchedAt > latest) latest = page.fetchedAt;
  for (const r of page.results) {
    rows++;
    paper.fetchedRows++;
    // Scholar cluster id; [CITATION]-only rows have none, so fall back to the title.
    const key = r.clusterId || r.citesId?.split(",")[0] || `t:${normTitle(r.title)}`;
    let w = works.get(key);
    if (!w) {
      const b = parseByline(r.byline);
      w = {
        id: r.clusterId ? `GS_${r.clusterId}` : `GS_t${works.size}`,
        scholarClusterId: r.clusterId || null,
        scholarCid: r.cid || null,
        title: r.title,
        type: r.type || null,
        ...b,
        byline: r.byline,
        scholarAuthorIds: (r.authorIds || []).filter((a) => a.id),
        citedBy: r.citedBy || 0,
        scholarCitesId: r.citesId || null,
        versions: r.versions || 0,
        url: r.url || null,
        fullText: r.fullText || null,
        snippet: r.snippet || null,
        cites: [],
        selfCitationOf: [],
        sharedAuthorInitials: {},
      };
      w.greyLit = greyLit(w);
      works.set(key, w);
    }
    w.citedBy = Math.max(w.citedBy, r.citedBy || 0);
    if (!w.cites.includes(paper.idx)) w.cites.push(paper.idx);
  }
}

// ── Self-citations ──
// Strict (selfCitationOf): Ken's Scholar profile is linked in the byline, or "K Huang" is listed.
// Loose (sharedAuthorInitials): any initials+surname shared with the cited paper. Scholar only
// gives initials, so common names ("X Li") collide; this is a hint for review, not a filter.
for (const w of works.values()) {
  const keys = new Set(w.authors.map(authorKey));
  const isKen = w.scholarAuthorIds.some((a) => a.id === KEN_SCHOLAR_ID) || keys.has("k huang");
  for (const i of w.cites) {
    if (isKen) w.selfCitationOf.push(i);
    const shared = papers[i].authors.filter((a) => keys.has(authorKey(a)));
    if (shared.length) w.sharedAuthorInitials[i] = shared;
  }
}
for (const w of works.values()) {
  for (const i of w.cites) {
    papers[i].uniqueCiting++;
    if (w.selfCitationOf.includes(i)) papers[i].selfCitations++;
  }
}

const list = [...works.values()].sort((a, b) => b.citedBy - a.citedBy);
const lead = new Set(papers.filter((p) => p.lens === "lead").map((p) => p.idx));
const summary = {
  scholarProfile: KEN_SCHOLAR_ID,
  source: "Google Scholar 'Cited by' pages, crawled from a logged-in browser session",
  latestFetch: latest,
  builtAt: new Date().toISOString(),
  citedPapers: papers.length,
  profileCitationSum: papers.reduce((s, p) => s + p.scholarCitationCount, 0),
  fetchedRows: rows,
  uniqueCitingWorks: list.length,
  uniqueCitingWorksExSelf: list.filter((w) => w.selfCitationOf.length < w.cites.length).length,
  uniqueCitingLeadExSelf: list.filter((w) => w.cites.some((i) => lead.has(i) && !w.selfCitationOf.includes(i))).length,
  greyLit: list.reduce((m, w) => (w.greyLit && (m[w.greyLit] = (m[w.greyLit] || 0) + 1), m), {}),
};

writeFileSync(join(OUT, "cited-papers.json"), JSON.stringify({ summary, papers }, null, 1) + "\n");
writeFileSync(join(OUT, "citing-works.json"), JSON.stringify({ summary, works: list }, null, 1) + "\n");
console.log(JSON.stringify(summary, null, 2));
