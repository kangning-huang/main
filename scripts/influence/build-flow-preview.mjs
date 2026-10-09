#!/usr/bin/env node
/**
 * Preview-only: fine-theme → adaptive subfield/topic flows for Sankey redesign.
 * Writes src/data/reach-flow-preview.json. Does not overwrite influence.json.
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const influence = JSON.parse(readFileSync(join(ROOT, "src/data/influence.json"), "utf8"));
const OUT = join(ROOT, "src/data/reach-flow-preview.json");

const API = "https://api.openalex.org";
const CITING_SELECT = "id,publication_year,primary_topic,topics,keywords,authorships";
const AS_OF = influence.meta.asOf;

const FINE = {
  "10.1088/1748-9326/ab4b71": "expansion",
  "10.1080/13658816.2012.730147": "expansion",
  "10.1038/s41467-020-14386-x": "expansion",
  "10.1038/s41893-020-0521-x": "expansion",
  "10.1038/s41893-019-0436-6": "expansion",
  "10.1080/13658816.2011.635594": "methods",
  "10.1029/2020JD033831": "heat-health",
  "10.1016/j.uclim.2021.100806": "heat-health",
  "10.1038/s41558-022-01481-8": "cooling",
  "10.1038/s41598-025-96045-z": "heat-health",
  "10.1038/s41558-025-02303-3": "heat-health",
  "10.1038/s44284-024-00184-9": "heat-health",
  "10.1021/acs.est.4c14275": "cooling",
  "10.1021/acs.est.4c00424": "cooling",
  "10.1038/s44432-026-00009-1": "cooling",
  "10.1021/acs.est.9b00666": "air-dust",
  "10.1016/j.atmosenv.2018.07.043": "air-dust",
  "10.3390/toxics13010045": "air-dust",
  "10.1007/s44274-024-00148-9": "flood",
  "10.3390/rs17101747": "flood",
  "10.1038/s41598-026-70981-w": "flood",
  "10.1016/j.rse.2015.06.016": "flood",
  "10.1109/tgrs.2013.2242895": "methods",
  "10.1080/01944363.2025.2523604": "methods",
};

const LABELS = {
  expansion: { en: "Urban expansion & futures", zh: "城市扩张与未来" },
  "heat-health": { en: "Heat exposure & health", zh: "高温暴露与健康" },
  cooling: { en: "Cooling & greening", zh: "降温与绿化" },
  "air-dust": { en: "Air quality / dust", zh: "空气质量 / 扬尘" },
  flood: { en: "Flood & coasts", zh: "洪水与海岸" },
  methods: { en: "Scaling, form & methods", zh: "标度、形态与方法" },
};

const COLORS = {
  expansion: "#00909a",
  "heat-health": "#c74b16",
  cooling: "#2a9d6e",
  "air-dust": "#8b5a2b",
  flood: "#5b4b9a",
  methods: "#94700f",
};

const shortId = (id) => (id ? id.replace("https://openalex.org/", "") : null);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function withAuth(url) {
  const u = new URL(url);
  u.searchParams.set("mailto", process.env.OPENALEX_MAILTO || "kh3657@nyu.edu");
  if (process.env.OPENALEX_API_KEY) u.searchParams.set("api_key", process.env.OPENALEX_API_KEY);
  return u.toString();
}

async function getJson(url, attempt = 1) {
  let res;
  try {
    res = await fetch(withAuth(url), { headers: { Accept: "application/json" } });
  } catch (err) {
    if (attempt >= 5) throw err;
    await sleep(1000 * 2 ** attempt);
    return getJson(url, attempt + 1);
  }
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 5) throw new Error(`${res.status} ${url}`);
    await sleep(1000 * 2 ** attempt);
    return getJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await sleep(100);
  return res.json();
}

async function getAllCiting(workId) {
  const out = [];
  let cursor = "*";
  while (cursor) {
    const page = await getJson(
      `${API}/works?filter=cites:${workId}&per_page=200&cursor=${encodeURIComponent(cursor)}&select=${CITING_SELECT}`
    );
    out.push(...page.results);
    cursor = page.meta.next_cursor;
    if (!page.results.length) break;
  }
  return out;
}

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

function isSelf(citing, citedKeys) {
  for (const a of citing.authorships ?? []) {
    if (a.author?.id && citedKeys.ids.has(a.author.id)) return true;
    if (a.author?.orcid && citedKeys.orcids.has(a.author.orcid)) return true;
  }
  for (const a of citing.authorships ?? []) {
    for (const n of [a.author?.display_name, a.raw_author_name]) {
      const k = nameKey(n);
      if (k && citedKeys.names.has(k)) return true;
    }
  }
  return false;
}

function yearsSince(year) {
  const asOf = new Date(AS_OF);
  return Math.max(1, asOf.getFullYear() - year + (asOf.getMonth()) / 12);
}

/** Match citing work to a precomputed adaptive node (prefer topic > subfield > field > other). */
function matchAdaptive(work, adaptive) {
  const pt = work.primary_topic;
  const topicId = shortId(pt?.id);
  const subId = shortId(pt?.subfield?.id);
  const fieldId = shortId(pt?.field?.id);
  const byId = Object.fromEntries(adaptive.filter((n) => n.id !== "__other").map((n) => [n.id, n]));
  if (topicId && byId[topicId]) return byId[topicId];
  // topics array top
  for (const t of work.topics ?? []) {
    const tid = shortId(t.id);
    if (tid && byId[tid]) return byId[tid];
  }
  if (subId && byId[subId]) return byId[subId];
  // subfield name match for nodes keyed oddly
  const subName = pt?.subfield?.display_name;
  if (subName) {
    const hit = adaptive.find((n) => n.level === "subfield" && n.name === subName);
    if (hit) return hit;
  }
  if (fieldId && byId[fieldId]) return byId[fieldId];
  const fieldName = pt?.field?.display_name;
  if (fieldName) {
    const hit = adaptive.find((n) => n.level === "field" && n.name === fieldName);
    if (hit) return hit;
  }
  return adaptive.find((n) => n.id === "__other") ?? { id: "__other", name: "Other", level: "other" };
}

function keywordsOf(work) {
  return (work.keywords ?? [])
    .map((k) => (typeof k === "string" ? k : k.display_name))
    .filter(Boolean)
    .slice(0, 5);
}

async function main() {
  const lens = process.argv.includes("--lead") ? "lead" : "all";
  const papers =
    lens === "lead" ? influence.papers.filter((p) => p.lens === "lead") : influence.papers;
  const adaptive = influence.views[lens].adaptive;

  // Right nodes: prefer subfield+topic; keep field only if present; always keep Other
  let rightNodes = adaptive.filter((n) => n.level === "subfield" || n.level === "topic");
  const fieldNodes = adaptive.filter((n) => n.level === "field");
  const other = adaptive.find((n) => n.id === "__other" || n.level === "other");
  // If we drop fields, their mass falls into Other at match time via field match —
  // keep field nodes so matchAdaptive can hit them, but UI can hide pure fields under "Other" strip.
  // For Sankey right, use subfield+topic + a single Other that absorbs fields+tail.
  rightNodes = [...rightNodes];
  if (other) rightNodes.push(other);

  const absLinks = {}; // `${fine}|${rightId}` -> count
  const rateLinks = {};
  const rightAbs = {};
  const rightRate = {};
  const leftAbs = {};
  const leftRate = {};
  const linkKeywords = {}; // key -> {kw: count}

  console.log(`Flow preview builder — lens=${lens}, papers=${papers.length}`);

  for (const p of papers) {
    const fine = FINE[p.doi] || "expansion";
    const y = yearsSince(p.year);
    console.log(`\n${p.doi} → ${fine} (${p.short})`);
    let work;
    try {
      work = await getJson(
        `${API}/works/doi:${p.doi}?select=id,authorships,publication_year`
      );
    } catch (e) {
      console.warn("  skip", e.message);
      continue;
    }
    const keys = authorKeys(work);
    const citing = await getAllCiting(shortId(work.id));
    let kept = 0;
    for (const c of citing) {
      if (isSelf(c, keys)) continue;
      kept++;
      const node = matchAdaptive(c, adaptive);
      // Map field-level hits into Other for the preview ribbon (Ken asked subfields/keywords not broad fields)
      let rightId = node.id;
      let rightName = node.name;
      let rightLevel = node.level;
      if (node.level === "field") {
        rightId = "__other";
        rightName = other?.name ?? "Other";
        rightLevel = "other";
      }
      const ak = `${fine}|${rightId}`;
      absLinks[ak] = (absLinks[ak] ?? 0) + 1;
      rateLinks[ak] = (rateLinks[ak] ?? 0) + 1 / y;
      leftAbs[fine] = (leftAbs[fine] ?? 0) + 1;
      leftRate[fine] = (leftRate[fine] ?? 0) + 1 / y;
      rightAbs[rightId] = (rightAbs[rightId] ?? 0) + 1;
      rightRate[rightId] = (rightRate[rightId] ?? 0) + 1 / y;
      linkKeywords[ak] ??= {};
      for (const kw of keywordsOf(c)) {
        linkKeywords[ak][kw] = (linkKeywords[ak][kw] ?? 0) + 1;
      }
      // stash names
      rightNodes.find((n) => n.id === rightId) ||
        rightNodes.push({ id: rightId, name: rightName, level: rightLevel });
    }
    console.log(`  kept=${kept}`);
  }

  const leftOrder = ["expansion", "heat-health", "cooling", "air-dust", "methods", "flood"];
  const buildSide = (weights, labels) =>
    leftOrder
      .filter((id) => weights[id])
      .map((id) => ({
        id,
        label: labels[id],
        color: COLORS[id],
        absolute: Math.round(leftAbs[id] ?? 0),
        citesPerYear: Math.round((leftRate[id] ?? 0) * 10) / 10,
      }));

  const rightIds = [...new Set([...Object.keys(rightAbs), ...rightNodes.map((n) => n.id)])];
  const rightMeta = Object.fromEntries(
    [...adaptive, ...rightNodes].map((n) => [n.id, n])
  );

  const links = Object.keys({ ...absLinks, ...rateLinks }).map((k) => {
    const [fine, rightId] = k.split("|");
    const kws = Object.entries(linkKeywords[k] ?? {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    return {
      left: fine,
      right: rightId,
      absolute: absLinks[k] ?? 0,
      citesPerYear: Math.round((rateLinks[k] ?? 0) * 10) / 10,
      keywords: kws,
    };
  });

  const right = rightIds
    .map((id) => ({
      id,
      name: rightMeta[id]?.name ?? id,
      level: rightMeta[id]?.level ?? "other",
      path: rightMeta[id]?.path ?? [rightMeta[id]?.name ?? id],
      absolute: rightAbs[id] ?? 0,
      citesPerYear: Math.round((rightRate[id] ?? 0) * 10) / 10,
    }))
    .filter((n) => n.absolute > 0)
    .sort((a, b) => b.absolute - a.absolute);

  const out = {
    meta: {
      mode: "preview",
      asOf: AS_OF,
      lens,
      weightingNote:
        "absolute = non-self citing works; citesPerYear = each citing work weighted by 1/yearsSince(cited paper), floor 1 year.",
      fineThemeNote:
        "Hand remap for preview: dust→air-dust; forests/tree/AC/demolition→cooling; expansion megahits stay expansion. Ken to confirm.",
      fieldNodesFoldedIntoOther: true,
      source: "OpenAlex",
    },
    left: buildSide(leftAbs, LABELS),
    right,
    links,
    stats: {
      absolute: {
        leftTotal: Object.values(leftAbs).reduce((s, v) => s + v, 0),
        shares: Object.fromEntries(
          leftOrder
            .filter((id) => leftAbs[id])
            .map((id) => [
              id,
              Math.round((1000 * leftAbs[id]) / Object.values(leftAbs).reduce((s, v) => s + v, 0)) / 10,
            ])
        ),
      },
      citesPerYear: {
        leftTotal: Math.round(Object.values(leftRate).reduce((s, v) => s + v, 0) * 10) / 10,
        shares: Object.fromEntries(
          leftOrder
            .filter((id) => leftRate[id])
            .map((id) => [
              id,
              Math.round((1000 * leftRate[id]) / Object.values(leftRate).reduce((s, v) => s + v, 0)) / 10,
            ])
        ),
      },
    },
  };

  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote ${OUT}`);
  console.log("Absolute shares", out.stats.absolute.shares);
  console.log("Cites/yr shares", out.stats.citesPerYear.shares);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
