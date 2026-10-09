#!/usr/bin/env node
/**
 * Reach pipeline v2 (C2 + F5 + H2): dual views + adaptive taxonomy.
 *
 * Input:   data/influence/dois.json
 * Output:  src/data/influence.json + data/influence/YYYY-MM-DD.json
 *
 * Usage:
 *   node scripts/influence/fetch-influence.mjs
 *   node scripts/influence/fetch-influence.mjs --dry-run
 *
 * Env: OPENALEX_API_KEY (optional), OPENALEX_MAILTO (optional)
 *
 * Self-citation (strict, per cited paper): drop citing work if it shares ANY
 * author with the cited paper (OpenAlex ID / ORCID / normalized full name).
 * Unique citing works for headlines. Never author-search for Ken.
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
const EARLY_FROM_YEAR = 2025;
const TOP_N = 10;
const ADAPTIVE_MAX_SHARE = 0.3;
const OTHER_MIN_SHARE = 0.02;
const TOPIC_SCORE_MIN = 0.5;
const AUTO_FLIP_COAUTHOR_SHARE = 0.5; // reported only; default is always All
const CITING_SELECT = [
  "id", "doi", "title", "publication_year", "cited_by_count", "type",
  "primary_topic", "topics", "keywords", "authorships", "primary_location",
].join(",");

let requestCount = 0;
let costUsd = 0;

function withAuth(url) {
  const u = new URL(url);
  if (process.env.OPENALEX_API_KEY) u.searchParams.set("api_key", process.env.OPENALEX_API_KEY);
  if (process.env.OPENALEX_MAILTO) u.searchParams.set("mailto", process.env.OPENALEX_MAILTO);
  else u.searchParams.set("mailto", "kh3657@nyu.edu");
  return u.toString();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, attempt = 1) {
  requestCount++;
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
  if (typeof json?.meta?.cost_usd === "number") costUsd += json.meta.cost_usd;
  await sleep(120);
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

const shortId = (id) => (id ? id.replace("https://openalex.org/", "") : null);
const stripDoi = (doi) => (doi ? doi.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase() : null);

function nameKey(name) {
  if (!name) return null;
  const tokens = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
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

const subfieldOf = (work) => {
  const sf = work.primary_topic?.subfield;
  return sf ? { id: shortId(sf.id), name: sf.display_name } : null;
};

/** Best topic for a citing work: top scored topic ≥ TOPIC_SCORE_MIN, else primary_topic. */
function topicOf(work) {
  const scored = (work.topics ?? [])
    .filter((t) => typeof t.score === "number" && t.score >= TOPIC_SCORE_MIN)
    .sort((a, b) => b.score - a.score);
  const t = scored[0] ?? work.primary_topic;
  if (!t?.id && !t?.display_name) return null;
  return {
    id: shortId(t.id) ?? `topic:${t.display_name}`,
    name: t.display_name,
    field: t.field ? { id: shortId(t.field.id), name: t.field.display_name } : fieldOf(work),
    subfield: t.subfield
      ? { id: shortId(t.subfield.id), name: t.subfield.display_name }
      : subfieldOf(work),
  };
}

function keywordsOf(work) {
  const kws = work.keywords ?? [];
  return kws
    .map((k) => (typeof k === "string" ? k : k.display_name))
    .filter(Boolean)
    .slice(0, 8);
}

const inc = (obj, key, by = 1) => {
  obj[key] = (obj[key] ?? 0) + by;
};

/**
 * Adaptive 30% taxonomy: start at field; split any node >30% into children
 * (field → subfield → topic) until no node >30%. Never show a parent next to its children.
 */
function adaptiveNodes(works) {
  const n = works.length;
  if (n === 0) return [];

  // Build hierarchy counts
  const fieldCount = {};
  const fieldNames = {};
  const subByField = {}; // fid -> { sfid -> count }
  const subNames = {};
  const topicBySub = {}; // sfid -> { tid -> count }
  const topicNames = {};
  const topicMeta = {}; // tid -> { field, subfield }
  const workTopics = []; // parallel: topic assignment per work index

  for (const { work } of works) {
    const f = fieldOf(work);
    fieldNames[f.id] = f.name;
    inc(fieldCount, f.id);
    const sf = subfieldOf(work);
    const tp = topicOf(work);
    let sfid = sf?.id ?? `${f.id}__nosub`;
    let sfname = sf?.name ?? `${f.name} (unspecified subfield)`;
    subNames[sfid] = sfname;
    subByField[f.id] ??= {};
    inc(subByField[f.id], sfid);
    let tid = tp?.id ?? `${sfid}__notopic`;
    let tname = tp?.name ?? sfname;
    topicNames[tid] = tname;
    topicBySub[sfid] ??= {};
    inc(topicBySub[sfid], tid);
    topicMeta[tid] = { fieldId: f.id, fieldName: f.name, subfieldId: sfid, subfieldName: sfname };
    workTopics.push({ fieldId: f.id, subfieldId: sfid, topicId: tid, work });
  }

  // Start with fields as nodes
  let nodes = Object.entries(fieldCount).map(([id, count]) => ({
    level: "field",
    id,
    name: fieldNames[id],
    path: [fieldNames[id]],
    citingWorks: count,
    childrenOf: null,
  }));

  // Iteratively split oversized nodes
  let changed = true;
  while (changed) {
    changed = false;
    const next = [];
    for (const node of nodes) {
      if (node.citingWorks / n > ADAPTIVE_MAX_SHARE) {
        if (node.level === "field") {
          const kids = Object.entries(subByField[node.id] ?? {}).map(([sid, count]) => ({
            level: "subfield",
            id: sid,
            name: subNames[sid],
            path: [node.name, subNames[sid]],
            citingWorks: count,
            childrenOf: node.id,
          }));
          if (kids.length > 0) {
            next.push(...kids);
            changed = true;
            continue;
          }
        } else if (node.level === "subfield") {
          const kids = Object.entries(topicBySub[node.id] ?? {}).map(([tid, count]) => ({
            level: "topic",
            id: tid,
            name: topicNames[tid],
            path: [
              topicMeta[tid]?.fieldName ?? "",
              topicMeta[tid]?.subfieldName ?? node.name,
              topicNames[tid],
            ].filter(Boolean),
            citingWorks: count,
            childrenOf: node.id,
          }));
          if (kids.length > 1 || (kids.length === 1 && kids[0].citingWorks / n > ADAPTIVE_MAX_SHARE)) {
            // If single child still >30%, keep it as topic (can't split further)
            next.push(...kids);
            changed = true;
            continue;
          }
          if (kids.length > 0) {
            next.push(...kids);
            changed = true;
            continue;
          }
        }
      }
      next.push(node);
    }
    nodes = next;
  }

  // Fold tiny nodes (<2%) into Other, but keep at least a few named ones
  nodes.sort((a, b) => b.citingWorks - a.citingWorks);
  const kept = [];
  let otherCount = 0;
  let otherWorks = 0;
  for (const node of nodes) {
    if (node.citingWorks / n < OTHER_MIN_SHARE && kept.length >= 8) {
      otherCount++;
      otherWorks += node.citingWorks;
    } else {
      kept.push(node);
    }
  }
  if (otherWorks > 0) {
    kept.push({
      level: "other",
      id: "__other",
      name: `Other (${otherCount} areas)`,
      path: ["Other"],
      citingWorks: otherWorks,
      childrenOf: null,
    });
  }

  // Attach example papers + keyword chips per node
  const examplesByNode = {};
  const keywordsByNode = {};
  for (const wt of workTopics) {
    // Find which adaptive node this work falls into
    let nodeId = null;
    for (const node of kept) {
      if (node.id === "__other") continue;
      if (node.level === "field" && wt.fieldId === node.id) nodeId = node.id;
      else if (node.level === "subfield" && wt.subfieldId === node.id) nodeId = node.id;
      else if (node.level === "topic" && wt.topicId === node.id) nodeId = node.id;
    }
    if (!nodeId) nodeId = "__other";
    examplesByNode[nodeId] ??= [];
    examplesByNode[nodeId].push(wt.work);
    keywordsByNode[nodeId] ??= {};
    for (const kw of keywordsOf(wt.work)) inc(keywordsByNode[nodeId], kw);
  }

  return kept.map((node) => {
    const examples = (examplesByNode[node.id] ?? [])
      .sort((a, b) => (b.cited_by_count ?? 0) - (a.cited_by_count ?? 0))
      .slice(0, 3)
      .map((w) => ({
        openalexId: shortId(w.id),
        doi: stripDoi(w.doi),
        title: w.title,
        year: w.publication_year,
        venue: w.primary_location?.source?.display_name ?? null,
        openalexCitedByCount: w.cited_by_count ?? 0,
      }));
    const keywords = Object.entries(keywordsByNode[node.id] ?? {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    return {
      ...node,
      share: Math.round((node.citingWorks / n) * 1000) / 10,
      examples,
      keywords,
    };
  });
}

function pickDistantPair(adaptive, homeTopicIds, homeSubfieldNames, works) {
  // Prefer named subfields outside Ken's home subfields (largest with substance).
  const subCounts = {};
  const subField = {}; // subfield name -> parent field name
  for (const { work } of works) {
    const sf = subfieldOf(work);
    if (!sf?.name) continue;
    inc(subCounts, sf.name);
    subField[sf.name] = fieldOf(work).name;
  }
  const outsideSubs = Object.entries(subCounts)
    .filter(([name, count]) => !homeSubfieldNames.has(name) && count >= 8)
    .sort((a, b) => b[1] - a[1]);

  if (outsideSubs.length >= 2) {
    const [aName] = outsideSubs[0];
    const b =
      outsideSubs.find(
        ([name]) => name !== aName && subField[name] !== subField[aName]
      ) ?? outsideSubs[1];
    return {
      a: aName,
      b: b[0],
      aId: `subfield:${aName}`,
      bId: `subfield:${b[0]}`,
      method: "largest-outside-home-subfields",
    };
  }

  // Fall back: adaptive topic/subfield nodes not in home topics
  const scored = adaptive
    .filter((n) => n.id !== "__other" && n.level !== "other" && n.level !== "field")
    .map((n) => {
      const subName = n.level === "subfield" ? n.name : n.path[1] ?? n.name;
      const isHome = homeSubfieldNames.has(subName) || homeTopicIds.has(n.id);
      return { n, isHome, subName };
    })
    .sort((a, b) => {
      if (a.isHome !== b.isHome) return a.isHome ? 1 : -1;
      return b.n.citingWorks - a.n.citingWorks;
    });

  if (scored.length >= 2) {
    const a = scored[0];
    const b =
      scored.find(
        (x) => x.n.id !== a.n.id && (x.n.path[0] !== a.n.path[0] || x.subName !== a.subName)
      ) ?? scored[1];
    return { a: a.n.name, b: b.n.name, aId: a.n.id, bId: b.n.id, method: "adaptive-fallback" };
  }

  const named = adaptive.filter((n) => n.id !== "__other" && n.level !== "field");
  if (named.length >= 2) {
    return { a: named[0].name, b: named[1].name, aId: named[0].id, bId: named[1].id, method: "top-adaptive" };
  }
  return { a: null, b: null, aId: null, bId: null, method: "none" };
}

function buildView(label, papersInView, citingMap, selfRemoved, yearFrom, asOfYear, homeTopicIds, homeSubfieldNames) {
  const works = [...citingMap.values()];
  const n = works.length;

  // Fields + subfields (legacy table)
  const fieldTotals = {};
  const fieldNames = {};
  const subfieldsByField = {};
  const flows = {};
  for (const { work, themes, outsideOwnField } of works) {
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
        .slice(0, 5)
        .map(([name, c]) => ({ name, citingWorks: c })),
    }))
    .sort((a, b) => b.citingWorks - a.citingWorks);
  const flowList = Object.entries(flows).map(([k, count]) => {
    const [theme, field] = k.split("|");
    return { theme, field, citingWorks: count };
  });
  const outsideOwnField = works.filter((w) => w.outsideOwnField).length;

  // Outside own topics
  let outsideOwnTopics = 0;
  for (const { work } of works) {
    const tp = topicOf(work);
    if (!tp || !homeTopicIds.has(tp.id)) outsideOwnTopics++;
  }

  const adaptive = adaptiveNodes(works);
  const distant = pickDistantPair(adaptive, homeTopicIds, homeSubfieldNames, works);

  // Institutions
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
        const e = nonAcademic.get(i.id) ?? {
          id: shortId(i.id),
          name: i.display_name,
          type: t,
          country: i.country_code ?? null,
          citingWorks: 0,
        };
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

  // Countries (observed only here; baselines filled later)
  const observed = {};
  for (const { work } of works) for (const c of countries(work)) inc(observed, c);

  // Top citing
  const shortByDoi = Object.fromEntries(papersInView.map((p) => [p.doi, p.short]));
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
      subfield: subfieldOf(work)?.name ?? null,
      topic: topicOf(work)?.name ?? null,
      builds_on: [...cited].map((d) => shortByDoi[d]).filter(Boolean),
    }))
    .sort((a, b) => b.openalexCitedByCount - a.openalexCitedByCount)
    .slice(0, TOP_N);

  // Growth
  const growth = {};
  let growthDatesDropped = 0;
  const established = papersInView.filter((p) => !p.early);
  for (const { work, cited } of works) {
    const y = work.publication_year;
    if (!y) continue;
    const est = established.filter((p) => cited.has(p.doi));
    const themes = new Set(est.filter((p) => y >= p.year).map((p) => p.theme));
    if (est.length > 0 && themes.size === 0) growthDatesDropped++;
    for (const t of themes) {
      growth[t] ??= {};
      inc(growth[t], String(y));
    }
  }

  const realCountries = Object.keys(observed).length;
  const realFields = fields.filter((f) => f.id !== "unclassified").length;
  const leadShare =
    n === 0
      ? 1
      : works.filter((w) => [...w.cited].some((d) => papersInView.find((p) => p.doi === d && p.lens === "lead"))).length / n;

  return {
    label,
    totals: {
      papers: papersInView.length,
      leadPapers: papersInView.filter((p) => p.lens === "lead").length,
      coauthorPapers: papersInView.filter((p) => p.lens === "coauthor").length,
      openalexCitedByCountSum: papersInView.reduce((s, p) => s + p.openalexCitedByCount, 0),
      citingLinksFetched: papersInView.reduce((s, p) => s + p.citingFetched, 0),
      selfCitationsRemoved: papersInView.reduce((s, p) => s + p.selfCitationsRemoved, 0),
      selfCitationsRemovedBy: selfRemoved,
      citingLinksNonSelf: papersInView.reduce((s, p) => s + p.citingNonSelf, 0),
      uniqueCitingWorks: n,
      citingWorksOutsideOwnField: outsideOwnField,
      citingWorksOutsideOwnTopics: outsideOwnTopics,
      fieldsCount: realFields,
      countriesCount: realCountries,
      leadCitingShare: Math.round(leadShare * 1000) / 10,
    },
    adaptive,
    homepageDistant: distant,
    fields,
    flows: flowList,
    institutionTypes,
    topNonAcademicInstitutions: topNonAcademic,
    countriesObserved: observed,
    topCitingWorks: topCiting,
    growth,
    growthDatesDropped,
    fieldIds: fields.map((f) => f.id).filter((id) => id !== "unclassified"),
  };
}

async function attachCountryBaselines(view, yearFrom, asOfYear) {
  const shareByField = {};
  console.log(`  [${view.label}] country baselines for ${view.fieldIds.length} fields (${yearFrom}–${asOfYear})`);
  for (const fid of view.fieldIds) {
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
  // Need works again for expected — recompute from observed only with field shares averaged
  // Simpler: expected[c] = sum over fields of (fieldShare of country * field citing count)
  // Actually original used per-work. We don't have works in view anymore.
  // Approximate: for each field, expected += share * fieldTotals
  const expected = {};
  for (const f of view.fields) {
    if (f.id === "unclassified") continue;
    const shares = shareByField[f.id] ?? {};
    for (const [code, share] of Object.entries(shares)) {
      inc(expected, code, share * f.citingWorks);
    }
  }
  const observed = view.countriesObserved;
  view.countries = Object.entries(observed)
    .map(([code, obs]) => ({
      code,
      citingWorks: obs,
      expected: expected[code] != null ? Math.round(expected[code] * 100) / 100 : null,
      ratio: expected[code] ? Math.round((obs / expected[code]) * 100) / 100 : null,
    }))
    .sort((a, b) => b.citingWorks - a.citingWorks);
  delete view.countriesObserved;
  delete view.fieldIds;
}

async function main() {
  const doisRaw = readFileSync(DOIS_PATH, "utf-8");
  const config = JSON.parse(doisRaw);
  const asOf = new Date().toISOString().slice(0, 10);
  const asOfYear = Number(asOf.slice(0, 4));
  console.log(`Reach pipeline v2 — OpenAlex, as of ${asOf}${DRY_RUN ? " (dry run)" : ""}`);
  console.log(`API key: ${process.env.OPENALEX_API_KEY ? "set" : "not set (public + mailto)"}`);
  console.log(`Papers: ${config.papers.length}`);

  const papers = [];
  const allCiting = new Map();
  const leadCiting = new Map();
  const selfRemovedAll = { "author-id": 0, orcid: 0, name: 0 };
  const selfRemovedLead = { "author-id": 0, orcid: 0, name: 0 };
  const homeTopicIds = new Set();
  const homeSubfieldNames = new Set();

  for (const p of config.papers) {
    if (p.status === "pending") {
      console.log(`\n${p.doi} SKIPPED (pending)`);
      continue;
    }
    console.log(`\n${p.doi} (${p.lens})`);
    let work;
    try {
      work = await getJson(
        `${API}/works/doi:${p.doi}?select=id,doi,title,publication_year,cited_by_count,authorships,primary_location,primary_topic,topics`
      );
    } catch (err) {
      console.warn(`  SKIPPED — OpenAlex lookup failed: ${err.message}`);
      continue;
    }
    const keys = authorKeys(work);
    const citing = await getAllCiting(shortId(work.id));
    const kept = [];
    let removed = 0;
    for (const c of citing) {
      const reason = selfCiteReason(c, keys);
      if (reason) {
        removed++;
        selfRemovedAll[reason]++;
        if (p.lens === "lead") selfRemovedLead[reason]++;
      } else kept.push(c);
    }
    console.log(
      `  OpenAlex cited_by_count=${work.cited_by_count} fetched=${citing.length} self-removed=${removed} kept=${kept.length}`
    );

    const ownField = fieldOf(work);
    const ownTopic = topicOf(work);
    if (ownTopic) homeTopicIds.add(ownTopic.id);
    const ownSf = subfieldOf(work);
    if (ownSf) homeSubfieldNames.add(ownSf.name);
    // Also collect from topics array
    for (const t of work.topics ?? []) {
      if (t.id) homeTopicIds.add(shortId(t.id));
      if (t.subfield?.display_name) homeSubfieldNames.add(t.subfield.display_name);
    }

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
      ownField,
      ownTopic: ownTopic ? { id: ownTopic.id, name: ownTopic.name } : null,
      openalexCitedByCount: work.cited_by_count,
      citingFetched: citing.length,
      selfCitationsRemoved: removed,
      citingNonSelf: kept.length,
      byYear,
    });

    const addTo = (map) => {
      for (const c of kept) {
        let entry = map.get(c.id);
        if (!entry) {
          entry = { work: c, cited: new Set(), themes: new Set(), outsideOwnField: false };
          map.set(c.id, entry);
        }
        entry.cited.add(p.doi);
        entry.themes.add(p.theme);
        if (fieldOf(c).id !== ownField.id) entry.outsideOwnField = true;
      }
    };
    addTo(allCiting);
    if (p.lens === "lead") addTo(leadCiting);
  }

  const leadPapers = papers.filter((p) => p.lens === "lead");
  const yearFrom = Math.min(...papers.map((p) => p.year));

  console.log(`\nBuilding views… all=${allCiting.size} lead=${leadCiting.size}`);
  const viewAll = buildView("all", papers, allCiting, selfRemovedAll, yearFrom, asOfYear, homeTopicIds, homeSubfieldNames);
  const viewLead = buildView("lead", leadPapers, leadCiting, selfRemovedLead, yearFrom, asOfYear, homeTopicIds, homeSubfieldNames);

  await attachCountryBaselines(viewAll, yearFrom, asOfYear);
  await attachCountryBaselines(viewLead, yearFrom, asOfYear);

  // Auto-flip: if coauthor share of unique citing works in All > 50%, default to lead
  const coauthorOnly = viewAll.totals.uniqueCitingWorks - viewLead.totals.uniqueCitingWorks;
  // Better: share of citing works that cite ONLY coauthor papers (or: 1 - leadCitingShare of works that cite at least one lead)
  // Spec: "co-author share of citing works > ~50%"
  const citingOnlyViaCoauthor = [...allCiting.values()].filter((e) => {
    const lenses = [...e.cited].map((d) => papers.find((p) => p.doi === d)?.lens);
    return lenses.length > 0 && lenses.every((l) => l === "coauthor");
  }).length;
  const coauthorShare = viewAll.totals.uniqueCitingWorks
    ? citingOnlyViaCoauthor / viewAll.totals.uniqueCitingWorks
    : 0;
  // Auto-flip disabled per Ken (2026-10-09): always default to All. Share still reported.
  const autoFlipped = false;
  const defaultView = "all";

  console.log(
    `\nCoauthor-only citing share: ${(coauthorShare * 100).toFixed(1)}% → defaultView=${defaultView}${autoFlipped ? " (auto-flipped)" : ""}`
  );

  const stripView = (v) => {
    const {
      label,
      totals,
      adaptive,
      homepageDistant,
      fields,
      flows,
      institutionTypes,
      topNonAcademicInstitutions,
      countries,
      topCitingWorks,
      growth,
      growthDatesDropped,
    } = v;
    return {
      label,
      totals,
      adaptive,
      homepageDistant,
      fields,
      flows,
      institutionTypes,
      topNonAcademicInstitutions,
      countries,
      topCitingWorks,
      growth,
      growthDatesDropped,
    };
  };

  const output = {
    meta: {
      mode: "live",
      source: "OpenAlex",
      sourceUrl: "https://openalex.org",
      asOf,
      generatedAt: new Date().toISOString(),
      schema: "reach-v2-c2-f5-h2",
      defaultView,
      autoFlippedToLead: autoFlipped,
      coauthorOnlyCitingShare: Math.round(coauthorShare * 1000) / 10,
      lens:
        "views.all = all pinned DOIs; views.lead = first/last/corresponding (hand-pinned lens). Corresponding is never taken from OpenAlex alone.",
      doisFileSha256: createHash("sha256").update(doisRaw).digest("hex").slice(0, 16),
      selfCitationRule:
        "A citing work is removed if it shares any author with the cited paper (OpenAlex author ID, ORCID, or normalized full name). Applied per cited paper; unique citing works for headlines.",
      adaptiveRule: `Start at OpenAlex field; split any node holding more than ${ADAPTIVE_MAX_SHARE * 100}% of citing works into children (field → subfield → topic) until no node exceeds that share. Nodes under ${OTHER_MIN_SHARE * 100}% may fold into Other.`,
      outsideOwnTopicsRule:
        "Home topics = OpenAlex topics on Ken's own papers in the active view. A citing work is 'outside' if its assigned topic id is not in that set (or it has no topic).",
      countryBaseline: `Expected citing works per country ≈ sum over citing fields of (country's share of OpenAlex works in that field × citing works in that field), ${yearFrom}–${asOfYear}.`,
      earlyFromYear: EARLY_FROM_YEAR,
      homeTopicCount: homeTopicIds.size,
      homeSubfields: [...homeSubfieldNames].sort(),
      requests: requestCount,
      skipped: {
        natureCitiesNestedEconomies:
          "DOI 10.1038/s44284-026-00532-x intentionally omitted (embargo 404 until ~13 Nov 2026).",
        inPressOrNoDoi:
          "Cooler Cities (PNAS in press), SSA infrastructure, Nested economies, and other entries without a resolving DOI in publications-part-*.ts are omitted.",
      },
    },
    // Back-compat top-level totals = default view (for any leftover readers)
    totals: stripView(defaultView === "lead" ? viewLead : viewAll).totals,
    papers,
    views: {
      all: stripView(viewAll),
      lead: stripView(viewLead),
    },
  };

  console.log(
    `\nSummary ALL: ${viewAll.totals.uniqueCitingWorks} works, ${viewAll.totals.countriesCount} countries, ${viewAll.adaptive.length} adaptive nodes` +
      `\nSummary LEAD: ${viewLead.totals.uniqueCitingWorks} works, ${viewLead.totals.countriesCount} countries` +
      `\n${requestCount} requests, ~$${costUsd.toFixed(4)}`
  );
  console.log(
    `Homepage distant (All): from "${viewAll.homepageDistant.a}" to "${viewAll.homepageDistant.b}"`
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
