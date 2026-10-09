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

const themeConfig = JSON.parse(
  readFileSync(join(ROOT, "data", "influence", "fine-themes.json"), "utf8")
);
const FINE = Object.fromEntries(themeConfig.papers.map((p) => [p.doi, p.theme]));
const LABELS = Object.fromEntries(
  themeConfig.themes.map((t) => [t.id, { en: t.en, zh: t.zh }])
);
const COLORS = Object.fromEntries(themeConfig.themes.map((t) => [t.id, t.color]));
const leftOrder = themeConfig.themes.map((t) => t.id);
const DEFAULT_THEME = themeConfig.defaultThemeId || themeConfig.themes[0]?.id;

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
  const sfField = {};

  console.log(`Flow preview builder — lens=${lens}, papers=${papers.length}`);

  for (const p of papers) {
    const fine = FINE[p.doi] || DEFAULT_THEME;
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
      const pt = c.primary_topic;
      const sfName = pt?.subfield?.display_name ?? null;
      const fName = pt?.field?.display_name ?? "Unclassified";
      let rightId, rightName, rightLevel;
      if (node.level === "topic" || node.level === "subfield") {
        rightId = node.id; rightName = node.name; rightLevel = node.level;
      } else if (sfName) {
        // provisional: individual subfield; bucketed after counting
        rightId = `sf:${sfName}`; rightName = sfName; rightLevel = "subfield";
        sfField[rightId] = fName;
      } else {
        rightId = "__other"; rightName = "Other"; rightLevel = "other";
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

  // leftOrder from fine-themes.json
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

  // ── Fold tail: keep top named subfields; bucket the rest by OpenAlex field → domain ──
  const MAX_NAMED_SF = Number(process.env.MAX_NAMED_SF ?? 2);
  const DOMAINS = themeConfig.rightDomains;
  const domainOf = (field) => DOMAINS.find((d) => d.fields.includes(field)) ?? null;
  const provisional = Object.keys(rightRate).filter((id) => id.startsWith("sf:"));
  provisional.sort((a, b) => rightRate[b] - rightRate[a]);
  const keepNamed = new Set(provisional.slice(0, MAX_NAMED_SF));
  const remap = {};
  const members = {};
  for (const id of provisional) {
    if (keepNamed.has(id)) continue;
    const d = domainOf(sfField[id]);
    const target = d ? `dom:${d.id}` : "__other";
    remap[id] = target;
    (members[target] ??= []).push({ name: id.slice(3), citesPerYear: Math.round(rightRate[id] * 10) / 10, absolute: rightAbs[id] });
  }
  const move = (obj) => { for (const [from, to] of Object.entries(remap)) { obj[to] = (obj[to] ?? 0) + (obj[from] ?? 0); delete obj[from]; } };
  move(rightAbs); move(rightRate);
  for (const k of Object.keys(absLinks)) {
    const [l, r] = k.split("|");
    if (!remap[r]) continue;
    const nk = `${l}|${remap[r]}`;
    absLinks[nk] = (absLinks[nk] ?? 0) + absLinks[k]; delete absLinks[k];
    rateLinks[nk] = (rateLinks[nk] ?? 0) + (rateLinks[k] ?? 0); delete rateLinks[k];
    linkKeywords[nk] ??= {};
    for (const [kw, c] of Object.entries(linkKeywords[k] ?? {})) linkKeywords[nk][kw] = (linkKeywords[nk][kw] ?? 0) + c;
    delete linkKeywords[k];
  }
  for (const d of DOMAINS) rightNodes.push({ id: `dom:${d.id}`, name: d.en, level: "domain", path: [d.en] });
  for (const id of keepNamed) rightNodes.push({ id, name: id.slice(3), level: "subfield", path: [sfField[id], id.slice(3)] });
  rightNodes.push({ id: "__other", name: "Other", level: "other", path: ["Other"] });

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
      members: (members[id] ?? []).sort((a, b) => b.citesPerYear - a.citesPerYear),
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
      fineThemesConfig: "data/influence/fine-themes.json",
      defaultWeighting: "citesPerYear",
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
