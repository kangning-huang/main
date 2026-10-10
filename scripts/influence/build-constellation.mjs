#!/usr/bin/env node
/**
 * Constellation Map builder (docs/reach/CONSTELLATION-MAP.md): the vocabulary of the works
 * citing Ken's papers as a light "sky". Keywords sit near keywords used in similar research,
 * named regions are clusters of that vocabulary, and every paper with at least 30 non-self
 * citing works is a star at the mean position of its citers' keywords (landing), with a drift
 * arrow from the mean position of its own keywords (aim).
 *
 * Pipeline (every count is OpenAlex; nothing is estimated):
 *  1. Corpus: the Ripple's non-self citing works and keyword rule (score ≥ 0.5, alias merges,
 *     generic keywords dropped), minus place names (data/influence/constellation-config.json).
 *  2. Pool: the 200 keywords on the most All-lens citing works (≥ 3), plus each star's three
 *     most distinctive citer keywords (n · ln lift, as the Ripple ranks theme keywords).
 *  3. Meaning: all-MiniLM-L6-v2 embeds every citing-work title and every keyword label; a
 *     keyword's vector is its label plus the titles of the citing works that carry it.
 *  4. Regions: k-means on those unit vectors, k = 4–7 by cosine silhouette; names and colours
 *     from data/influence/region-names.json, matched by each region's top five keywords.
 *  5. Shown keywords: 40–60, 3–15 per region (slots ∝ √ region works); each region takes its
 *     stars' seeds, then keywords by citing works × (silhouette + 0.25).
 *  6. Positions: UMAP (cosine, 15 neighbours, min_dist 0.3, fixed seed) of the shown keywords,
 *     sorted by slug; Procrustes onto data/influence/constellation-layout-prev.json when present.
 *  7. Papers: landing L = Σ w x / Σ w over the citers' keywords, aim A = Σ σ x / Σ σ over the
 *     paper's own title and OpenAlex keywords, drift δ = |L − A| / mean nearest-keyword distance.
 *
 * Input:   data/influence/dois.json, keyword-aliases.json, keyword-zh.json (shared with the Ripple)
 *          data/influence/constellation-config.json   place names, star labels
 *          data/influence/region-names.json           region names + colours (hand-kept)
 *          data/influence/constellation-layout-prev.json  last run's positions, optional
 *          OpenAlex via lib/openalex.mjs (cache in .cache/openalex)
 *          scripts/influence/constellation_embed.py   MiniLM + k-means + UMAP (Python)
 * Output:  src/data/constellation.json, data/influence/constellation-layout-prev.json,
 *          docs/reach/constellation-keyword-report.md
 *
 * Usage:   node scripts/influence/build-constellation.mjs [--offline | --refresh] [--dry-run]
 *                 [--engine=minilm|tfidf] [--no-prior]
 * Env:     CONSTELLATION_PYTHON     python with scripts/influence/requirements-constellation.txt
 *                                  (default .venv-constellation/bin/python, else python3)
 *          CONSTELLATION_CACHE_DIR  embedding cache (default .cache/constellation)
 *          HF_HOME                  where sentence-transformers keeps the model
 */

import { spawnSync } from "child_process";
import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { ROOT, getWork, getCiting, shortId, stripDoi, authorKeys, selfCiteReason, dataAsOf, cacheSummary } from "./lib/openalex.mjs";
import {
  bestTurn,
  circleBox,
  closeGutters,
  regionCore,
  segmentBoxes,
  keywordLabelBoxes,
  fitToFrame,
  frameHeight,
  meanNearest,
  mirror,
  mirrorFor,
  nudgeStars,
  placeKeywordLabels,
  placeRegionLabels,
  placeStarLabels,
  procrustes,
  regionEllipse,
  round1,
  separate,
  textBox,
  turn,
} from "./lib/constellation-layout.mjs";
import { classicalMds, kmeansRuns, tfidfVectors } from "./lib/constellation-fallback.mjs";
import { textWidth } from "./lib/ripple-layout.mjs";

const DRY_RUN = process.argv.includes("--dry-run");
const NO_PRIOR = process.argv.includes("--no-prior");
const ENGINE = (process.argv.find((a) => a.startsWith("--engine="))?.split("=")[1] ?? "minilm").toLowerCase();
const OUT_PATH = join(ROOT, "src", "data", "constellation.json");
const PRIOR_PATH = join(ROOT, "data", "influence", "constellation-layout-prev.json");
const REPORT_PATH = join(ROOT, "docs", "reach", "constellation-keyword-report.md");
const CACHE_DIR = process.env.CONSTELLATION_CACHE_DIR || join(ROOT, ".cache", "constellation");
const PY_HELPER = join(ROOT, "scripts", "influence", "constellation_embed.py");
const MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const readJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));

// Never pinned while embargoed: Nature Cities "Nested economies of scale" (DOI 404s until publication).
const EMBARGOED_DOIS = ["10.1038/s44284-026-00532-x"];

/** Design starting parameters (CONSTELLATION-MAP.md) plus the few this build adds, each noted. */
const PARAMS = {
  keywordScoreMin: 0.5, // as the Ripple
  genericShareMax: 0.15, // as the Ripple: dropped if on more than 15% of All-lens citing works
  minWorks: 3, // design: keyword pool needs ≥ 3 citing works (also the floor for a disc in a lens)
  poolSize: 200, // added: keywords embedded and clustered (most citing works first) …
  seedsPerStar: 3, // added: … plus each star's 3 most distinctive citer keywords (n · ln lift)
  seedMinWorks: 8, // added: a seed must be on ≥ 8 citing works, so no star is drawn to a speck
  labelPrior: 1, // added: keyword vector = label + Σ titles of works carrying it; the label counts as 1 title
  kMin: 4, // design: 4–7 regions by silhouette
  kMax: 7,
  kmeansSeed: 7,
  shownTarget: 52, // design: 40–60 keywords shown …
  regionMin: 3, // … 3–15 per region
  regionMax: 15,
  silhouetteOffset: 0.25, // added: within a region rank by works × (silhouette + 0.25)
  redundancyJaccard: 0.6, // as the Ripple: skip a keyword whose works overlap this much with one shown
  umapNeighbors: 15, // design: UMAP cosine, 15 neighbours, min_dist 0.3, fixed seed
  umapMinDist: 0.3,
  umapSeed: 20261010,
  starMinWorks: 30, // design: a star needs ≥ 30 non-self citing works
  aimTopK: 2, // added: an own term not on the map votes for its 2 nearest map keywords …
  aimMinCos: 0.55, // … that reach this cosine similarity (below it, it has no counterpart)
  gutterSteps: 2, // added: a region far from all others slides (rigidly) to within 2 keyword-steps
  driftRestMin: 3, // design: drift arrows at rest are the 4 largest with δ ≥ 3 keyword-steps
  driftRestMax: 4,
  bridgeShareMin: 0.25, // design: ≥ 25% of citer keyword weight in each of two regions
  linesAtRest: 3, // faint lines from each star to its top keywords (each on ≥ 2 of its citers' works)
};

/** Drawing frame for the ≥ 720 px map (the schematic's 760-wide sky). */
const MAP = {
  width: 760,
  minHeight: 480,
  maxHeight: 640,
  margin: { left: 40, right: 40, top: 58, bottom: 34 },
  rMax: 18,
  rMin: 3.5,
  discGap: 6,
  labelSize: 11.5,
  regionSize: 13,
  paperSize: 12,
  starR: 9,
  regionPad: 14,
};

const round = (v, dp = 2) => Math.round(v * 10 ** dp) / 10 ** dp;
const sum = (xs) => xs.reduce((s, x) => s + x, 0);
const byId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const stripTags = (s) => (s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const slugOf = (k) => (k.id ? k.id.split("/").pop() : k.display_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
const dot = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};
const normalize = (v) => {
  const n = Math.sqrt(dot(v, v)) || 1;
  return v.map((x) => x / n);
};

// ── Python helper ──────────────────────────────────────────────────────────

function pythonPath() {
  if (process.env.CONSTELLATION_PYTHON) return process.env.CONSTELLATION_PYTHON;
  const venv = join(ROOT, ".venv-constellation", "bin", "python");
  return existsSync(venv) ? venv : "python3";
}

function py(req) {
  const res = spawnSync(pythonPath(), ["-I", PY_HELPER], { input: JSON.stringify(req), maxBuffer: 1 << 30, encoding: "utf8" });
  if (res.status !== 0) throw new Error(`constellation_embed.py ${req.op} failed (${res.status ?? res.error?.code}): ${(res.stderr || "").trim().split("\n").slice(-3).join(" | ")}`);
  return JSON.parse(res.stdout);
}

/**
 * MiniLM vectors for `texts`, from a content-addressed cache (one entry per distinct text),
 * so a text keeps exactly the same vector whatever else is embedded in a run.
 */
function embedTexts(texts) {
  const dir = join(CACHE_DIR, "minilm");
  const indexPath = join(dir, "index.json");
  const binPath = join(dir, "vectors.f32");
  const hashOf = (t) => createHash("sha1").update(t).digest("hex");
  let index = { model: MODEL, dim: 0, keys: [] };
  let store = new Float32Array(0);
  if (existsSync(indexPath) && existsSync(binPath)) {
    index = JSON.parse(readFileSync(indexPath, "utf8"));
    const buf = readFileSync(binPath);
    store = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    if (index.model !== MODEL || store.length !== index.keys.length * index.dim) {
      index = { model: MODEL, dim: 0, keys: [] };
      store = new Float32Array(0);
    }
  }
  const row = new Map(index.keys.map((k, i) => [k, i]));
  const missing = [...new Set(texts)].filter((t) => !row.has(hashOf(t)));
  if (missing.length) {
    const out = py({ op: "embed", model: MODEL, texts: missing });
    const next = new Float32Array(store.length + missing.length * out.dim);
    next.set(store);
    out.vectors.forEach((v, i) => next.set(v, store.length + i * out.dim));
    missing.forEach((t, i) => row.set(hashOf(t), index.keys.length + i));
    index = { model: MODEL, dim: out.dim, keys: [...index.keys, ...missing.map(hashOf)] };
    store = next;
    mkdirSync(dir, { recursive: true });
    writeFileSync(binPath, Buffer.from(store.buffer));
    writeFileSync(indexPath, JSON.stringify(index));
  }
  const dim = index.dim;
  return {
    vectors: texts.map((t) => {
      const i = row.get(hashOf(t));
      return Array.from(store.subarray(i * dim, (i + 1) * dim));
    }),
    cached: missing.length === 0,
    embedded: missing.length,
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const dois = readJson("data/influence/dois.json");
  const aliasCfg = readJson("data/influence/keyword-aliases.json");
  const zhCfg = readJson("data/influence/keyword-zh.json");
  const cfg = readJson("data/influence/constellation-config.json");
  const namesCfg = existsSync(join(ROOT, "data/influence/region-names.json")) ? readJson("data/influence/region-names.json") : { regions: [] };
  const warnings = [];

  for (const p of dois.papers) {
    if (EMBARGOED_DOIS.includes(p.doi.toLowerCase())) throw new Error(`${p.doi} is embargoed and must not be pinned`);
  }

  // Keyword rule shared with the Ripple: score ≥ 0.5, alias merges, display name by vote.
  const aliasOf = new Map();
  for (const [canon, variants] of Object.entries(aliasCfg.merge ?? {})) for (const v of variants) aliasOf.set(v, canon);
  const canonicalSlug = (slug) => {
    let s = slug;
    for (let i = 0; i < 10 && aliasOf.has(s); i++) s = aliasOf.get(s);
    return s;
  };
  const nameVotes = new Map();
  const vote = (canon, slug, display) => {
    const m = nameVotes.get(canon) ?? new Map();
    const v = m.get(display) ?? [0, 0];
    v[slug === canon ? 0 : 1]++;
    m.set(display, v);
    nameVotes.set(canon, m);
  };
  const keywordSet = (work) => {
    const out = new Set();
    for (const k of work.keywords ?? []) {
      if (!(k.score >= PARAMS.keywordScoreMin)) continue;
      const slug = slugOf(k);
      const canon = canonicalSlug(slug);
      out.add(canon);
      vote(canon, slug, k.display_name);
    }
    return out;
  };
  const displayName = (k) => {
    if (aliasCfg.labels?.[k]) return aliasCfg.labels[k];
    const m = nameVotes.get(k);
    if (!m) return k.replace(/-/g, " ");
    return [...m.entries()].sort((a, b) => b[1][0] - a[1][0] || b[1][1] - a[1][1] || byId(a[0], b[0]))[0][0];
  };
  const zhLabel = (k) => zhCfg.labels?.[k] ?? null;
  const places = new Set(cfg.places ?? []);

  console.log(`Constellation builder — engine ${ENGINE}, cache ${process.argv.includes("--offline") ? "offline" : "auto/refresh"}${DRY_RUN ? " (dry run)" : ""}`);

  // 1. Papers and their non-self citing works.
  const papers = [];
  const works = new Map(); // openalex id → facts
  for (const p of dois.papers) {
    if (p.status === "pending") continue;
    const doi = p.doi.toLowerCase();
    let work;
    try {
      work = await getWork(p.doi);
    } catch (err) {
      console.warn(`  SKIPPED ${p.doi}: ${err.message}`);
      continue;
    }
    const keys = authorKeys(work);
    const citing = await getCiting(shortId(work.id));
    const kept = citing.filter((c) => !selfCiteReason(c, keys));
    const own = (work.keywords ?? [])
      .map((k) => ({ id: canonicalSlug(slugOf(k)), label: k.display_name, score: k.score ?? 0 }))
      .filter((k) => !places.has(k.id));
    papers.push({
      doi,
      full: p.short,
      short: cfg.paperLabels?.[doi] ?? p.short.split(" · ")[0],
      shortZh: cfg.paperLabelsZh?.[doi] ?? cfg.paperLabels?.[doi] ?? p.short.split(" · ")[0],
      year: work.publication_year ?? p.year,
      lens: p.lens,
      title: stripTags(work.title),
      keywords: keywordSet(work),
      own,
      works: kept.length,
      citers: kept.map((c) => c.id),
    });
    for (const c of kept) {
      let e = works.get(c.id);
      if (!e) {
        e = {
          id: c.id,
          openalex: shortId(c.id),
          doi: stripDoi(c.doi),
          title: stripTags(c.title),
          year: c.publication_year,
          citedBy: c.cited_by_count ?? 0,
          kw: keywordSet(c),
          cites: new Set(),
        };
        works.set(c.id, e);
      }
      e.cites.add(doi);
    }
    console.log(`  ${p.short.padEnd(52)} ${p.lens.padEnd(8)} non-self ${kept.length}`);
  }
  const paperByDoi = new Map(papers.map((p) => [p.doi, p]));
  const asOf = dataAsOf();
  const asOfDate = new Date(`${asOf}T00:00:00Z`);
  const yearsSince = (year) => Math.max(1, asOfDate.getUTCFullYear() - year + asOfDate.getUTCMonth() / 12);

  const lensDefs = [
    { id: "all", papers },
    { id: "lead", papers: papers.filter((p) => p.lens === "lead") },
  ];
  const corpusOf = (lensPapers) => {
    const set = new Set(lensPapers.map((p) => p.doi));
    return [...works.values()].filter((e) => [...e.cites].some((d) => set.has(d))).sort((a, b) => byId(a.id, b.id));
  };
  const corpora = Object.fromEntries(lensDefs.map((l) => [l.id, corpusOf(l.papers)]));
  const allWorks = corpora.all;
  const N = allWorks.length;

  // Generic (as the Ripple) and excluded keywords.
  const nAll = new Map();
  for (const e of allWorks) for (const k of e.kw) nAll.set(k, (nAll.get(k) ?? 0) + 1);
  const excluded = new Map();
  for (const k of aliasCfg.stoplist ?? []) excluded.set(k, "Ripple stoplist");
  for (const [k, n] of nAll) if (n / N > PARAMS.genericShareMax) excluded.set(k, `generic (${(100 * n / N).toFixed(1)}% of citing works)`);
  for (const k of places) excluded.set(k, "place name");
  const eligible = (k) => !excluded.has(k) && (nAll.get(k) ?? 0) >= PARAMS.minWorks;

  // 2. Pool: most citing works, plus each star's most distinctive citer keywords.
  const stars = papers.filter((p) => p.works >= PARAMS.starMinWorks);
  const pool = new Map();
  for (const [k] of [...nAll].filter(([k]) => eligible(k)).sort((a, b) => b[1] - a[1] || byId(a[0], b[0])).slice(0, PARAMS.poolSize)) pool.set(k, { seedOf: [] });
  const npk = new Map(); // doi → Map(keyword → citing works of that paper carrying it)
  for (const p of papers) {
    const m = new Map();
    for (const id of p.citers) for (const k of works.get(id).kw) m.set(k, (m.get(k) ?? 0) + 1);
    npk.set(p.doi, m);
  }
  const seedRows = [];
  for (const p of stars) {
    const ranked = [...npk.get(p.doi)]
      .filter(([k, n]) => eligible(k) && n >= PARAMS.minWorks && nAll.get(k) >= PARAMS.seedMinWorks)
      .map(([k, n]) => ({ k, n, lift: n / p.works / (nAll.get(k) / N) }))
      .filter((x) => x.lift > 1)
      .map((x) => ({ ...x, s: x.n * Math.log(x.lift) }))
      .sort((a, b) => b.s - a.s || b.n - a.n || byId(a.k, b.k))
      .slice(0, PARAMS.seedsPerStar);
    for (const x of ranked) {
      if (!pool.has(x.k)) pool.set(x.k, { seedOf: [] });
      pool.get(x.k).seedOf.push(p.doi);
    }
    seedRows.push({ p, ranked });
  }
  const poolIds = [...pool.keys()].sort(byId);
  console.log(`\nPool: ${poolIds.length} keywords (${PARAMS.poolSize} by citing works + seeds of ${stars.length} stars) from ${N} All-lens citing works`);

  // 3. Meaning: keyword vectors from labels and the titles of the works that carry them.
  const titled = allWorks.filter((e) => e.title);
  const ownItems = stars.map((p) => [
    { text: p.title, weight: 1, kind: "title" },
    ...p.own.map((o) => ({ text: o.label, weight: o.score, kind: "keyword", id: o.id })),
  ]);
  let engine = ENGINE;
  let kwVec;
  let itemVec;
  let embedInfo;
  if (engine === "minilm") {
    try {
      const texts = [...titled.map((e) => e.title), ...poolIds.map(displayName), ...ownItems.flat().map((i) => i.text)];
      const { vectors, cached } = embedTexts(texts);
      const tv = vectors.slice(0, titled.length);
      const lv = vectors.slice(titled.length, titled.length + poolIds.length);
      const iv = vectors.slice(titled.length + poolIds.length);
      const idx = new Map(poolIds.map((k, i) => [k, i]));
      const acc = lv.map((v) => v.map((x) => x * PARAMS.labelPrior));
      titled.forEach((e, j) => {
        for (const k of e.kw) {
          const i = idx.get(k);
          if (i === undefined) continue;
          const a = acc[i];
          const t = tv[j];
          for (let d = 0; d < a.length; d++) a[d] += t[d];
        }
      });
      kwVec = new Map(poolIds.map((k, i) => [k, normalize(acc[i])]));
      let o = 0;
      itemVec = ownItems.map((items) => items.map(() => iv[o++]));
      embedInfo = { model: MODEL, dim: lv[0].length, texts: texts.length, cached };
    } catch (err) {
      warnings.push(`MiniLM unavailable (${err.message}); fell back to TF-IDF + classical MDS.`);
      console.warn(`  ${warnings.at(-1)}`);
      engine = "tfidf";
    }
  }
  if (engine === "tfidf") {
    const docs = poolIds.map((k) => ({ label: displayName(k), titles: titled.filter((e) => e.kw.has(k)).map((e) => e.title) }));
    const { vectors, embedQuery } = tfidfVectors(docs, { labelWeight: 3 });
    kwVec = new Map(poolIds.map((k, i) => [k, vectors[i]]));
    itemVec = ownItems.map((items) => items.map((it) => embedQuery(it.text)));
    embedInfo = { model: "tf-idf (label ×3 + citing-work titles) · classical MDS", dim: vectors[0].length, texts: docs.length, cached: false };
  }
  console.log(`Embeddings: ${embedInfo.model} (${embedInfo.dim}-d, ${embedInfo.texts} texts${embedInfo.cached ? ", cached" : ""})`);

  // 4. Regions: k-means on the unit vectors, k by cosine silhouette (every region ≥ regionMin keywords).
  const poolVecs = poolIds.map((k) => kwVec.get(k));
  const runs =
    engine === "minilm"
      ? py({ op: "cluster", vectors: poolVecs.map((v) => v.map((x) => round(x, 6))), k: [PARAMS.kMin, PARAMS.kMax], seed: PARAMS.kmeansSeed }).runs
      : kmeansRuns(poolVecs, { kMin: PARAMS.kMin, kMax: PARAMS.kMax, seed: PARAMS.kmeansSeed });
  const valid = runs.filter((r) => Math.min(...Array.from({ length: r.k }, (_, c) => r.labels.filter((l) => l === c).length)) >= PARAMS.regionMin);
  const chosen = [...(valid.length ? valid : runs)].sort((a, b) => b.silhouette - a.silhouette || a.k - b.k)[0];
  const K = chosen.k;
  const clusterOf = new Map(poolIds.map((k, i) => [k, chosen.labels[i]]));
  // Per-keyword silhouette (cosine distance), for ranking within a region.
  const silOf = new Map();
  for (let i = 0; i < poolIds.length; i++) {
    const dists = Array.from({ length: K }, () => [0, 0]);
    for (let j = 0; j < poolIds.length; j++) {
      if (i === j) continue;
      const d = 1 - dot(poolVecs[i], poolVecs[j]);
      const c = chosen.labels[j];
      dists[c][0] += d;
      dists[c][1]++;
    }
    const own = chosen.labels[i];
    const a = dists[own][1] ? dists[own][0] / dists[own][1] : 0;
    const b = Math.min(...dists.map((x, c) => (c === own || !x[1] ? Infinity : x[0] / x[1])));
    silOf.set(poolIds[i], dists[own][1] ? (b - a) / Math.max(a, b) : 0);
  }
  console.log(`Regions: k = ${K} (cosine silhouette ${runs.map((r) => `k${r.k} ${r.silhouette.toFixed(3)}`).join(", ")})`);

  // 5. Shown keywords: slots ∝ √ region works; seeds first, then works × (silhouette + offset).
  const worksOf = new Map(poolIds.map((k) => [k, new Set()]));
  for (const e of allWorks) for (const k of e.kw) worksOf.get(k)?.add(e.id);
  const clusterWorks = Array.from({ length: K }, () => new Set());
  for (const e of allWorks) for (const k of e.kw) if (clusterOf.has(k)) clusterWorks[clusterOf.get(k)].add(e.id);
  const sq = clusterWorks.map((s) => Math.sqrt(s.size));
  const quota = sq.map((v) => Math.min(PARAMS.regionMax, Math.max(PARAMS.regionMin, Math.round((PARAMS.shownTarget * v) / sum(sq)))));
  const jaccard = (a, b) => {
    const A = worksOf.get(a);
    const B = worksOf.get(b);
    let inter = 0;
    for (const id of A) if (B.has(id)) inter++;
    return inter / (A.size + B.size - inter);
  };
  const shown = [];
  const selection = [];
  const clusterOrder = Array.from({ length: K }, (_, c) => c).sort((a, b) => clusterWorks[b].size - clusterWorks[a].size || a - b);
  for (const c of clusterOrder) {
    const members = poolIds.filter((k) => clusterOf.get(k) === c);
    const seeds = members.filter((k) => pool.get(k).seedOf.length).sort((a, b) => nAll.get(b) - nAll.get(a) || byId(a, b));
    const score = (k) => nAll.get(k) * Math.max(0, silOf.get(k) + PARAMS.silhouetteOffset);
    const rest = members.filter((k) => !seeds.includes(k)).sort((a, b) => score(b) - score(a) || nAll.get(b) - nAll.get(a) || byId(a, b));
    const mine = [];
    const skipped = [];
    for (const k of [...seeds, ...rest]) {
      const cap = Math.min(PARAMS.regionMax, Math.max(quota[c], seeds.length));
      if (mine.length >= cap) break;
      const twin = shown.find((x) => jaccard(x, k) >= PARAMS.redundancyJaccard);
      if (twin) {
        skipped.push({ k, twin });
        continue;
      }
      mine.push(k);
      shown.push(k);
    }
    if (mine.length < PARAMS.regionMin) warnings.push(`Region cluster ${c} shows only ${mine.length} keywords (needs ${PARAMS.regionMin}).`);
    selection.push({ c, quota: quota[c], works: clusterWorks[c].size, members: members.length, seeds, mine, skipped, score });
  }
  shown.sort(byId);
  console.log(`Shown: ${shown.length} keywords (${selection.map((s) => s.mine.length).join(" + ")})`);

  // Region names: match each cluster's top five shown keywords to region-names.json (never rename silently).
  const top5 = new Map(selection.map((s) => [s.c, [...s.mine].sort((a, b) => nAll.get(b) - nAll.get(a) || byId(a, b)).slice(0, 5)]));
  const pairs = [];
  for (const s of selection) for (const entry of namesCfg.regions ?? []) {
    const hit = top5.get(s.c).filter((k) => entry.signature?.includes(k)).length;
    if (hit > 0) pairs.push({ c: s.c, entry, hit });
  }
  pairs.sort((a, b) => b.hit - a.hit || clusterWorks[b.c].size - clusterWorks[a.c].size || byId(a.entry.id, b.entry.id));
  const regionOf = new Map();
  const usedEntries = new Set();
  for (const p of pairs) {
    if (regionOf.has(p.c) || usedEntries.has(p.entry.id) || p.hit < 2) continue;
    regionOf.set(p.c, { id: p.entry.id, en: p.entry.en, zh: p.entry.zh, color: p.entry.color, matched: p.hit });
    usedEntries.add(p.entry.id);
    if (p.hit < 3) warnings.push(`Region “${p.entry.en}” kept its name on ${p.hit} of 5 shared keywords; top five now ${top5.get(p.c).join(", ")} — review region-names.json.`);
  }
  const fallbackColors = (namesCfg.fallbackColors ?? ["#2a78d6", "#4a3aa7", "#8e44ad"]).filter((c) => !(namesCfg.regions ?? []).some((r) => r.color === c && usedEntries.has(r.id)));
  for (const s of selection) {
    if (regionOf.has(s.c)) continue;
    const t = top5.get(s.c);
    const proposal = { id: t[0], en: `${displayName(t[0])} / ${displayName(t[1] ?? t[0])}`, zh: `${zhLabel(t[0]) ?? displayName(t[0])} / ${zhLabel(t[1] ?? t[0]) ?? displayName(t[1] ?? t[0])}`, color: fallbackColors.shift() ?? "#898781", matched: 0 };
    regionOf.set(s.c, proposal);
    warnings.push(`Region with top keywords [${t.join(", ")}] matches no entry in region-names.json — proposed “${proposal.en}”. Add it there to name it.`);
  }
  for (const entry of namesCfg.regions ?? []) if (!usedEntries.has(entry.id)) warnings.push(`region-names.json entry “${entry.en}” matched no region this run.`);
  const regionIdOf = (k) => regionOf.get(clusterOf.get(k)).id;
  const regionList = clusterOrder.map((c) => ({ c, ...regionOf.get(c) }));

  // 6. Positions: UMAP (or classical MDS) of the shown keywords, sorted by slug.
  const shownVecs = shown.map((k) => kwVec.get(k));
  const prior = !NO_PRIOR && existsSync(PRIOR_PATH) ? JSON.parse(readFileSync(PRIOR_PATH, "utf8")) : null;
  const umapReq = { op: "umap", vectors: shownVecs.map((v) => v.map((x) => round(x, 6))), n_neighbors: PARAMS.umapNeighbors, min_dist: PARAMS.umapMinDist, metric: "cosine", seed: PARAMS.umapSeed };
  const umapInput = createHash("sha256").update(JSON.stringify({ ids: shown, ...umapReq })).digest("hex").slice(0, 24);
  let raw;
  let projection;
  if (engine !== "minilm") {
    raw = { coords: classicalMds(shownVecs), umap: null };
    projection = "classical MDS";
  } else if (prior?.umapInput === umapInput && shown.every((k) => prior.raw?.[k])) {
    // Same projection input as the stored layout: reuse its UMAP output (re-runs are byte-identical).
    raw = { coords: shown.map((k) => prior.raw[k]), umap: prior.umap };
    projection = "UMAP output reused (input unchanged since the stored layout)";
  } else {
    // Start UMAP from the stored layout when there is one: keywords seen before start where they were;
    // a new one starts at the mean of its three most similar keywords that were.
    let init = null;
    if (prior?.raw) {
      const known = shown.filter((k) => prior.raw[k]);
      if (known.length >= 3) {
        init = shown.map((k) => {
          if (prior.raw[k]) return prior.raw[k];
          const near = known.map((o) => [o, dot(kwVec.get(k), kwVec.get(o))]).sort((a, b) => b[1] - a[1] || byId(a[0], b[0])).slice(0, 3);
          const ws = sum(near.map(([, c]) => Math.max(c, 1e-6)));
          return [0, 1].map((d) => sum(near.map(([o, c]) => Math.max(c, 1e-6) * prior.raw[o][d])) / ws);
        });
      }
    }
    raw = py({ ...umapReq, init });
    projection = init ? `UMAP from the stored layout (${shown.filter((k) => prior.raw[k]).length} of ${shown.length} keywords placed before)` : "UMAP (spectral start)";
  }
  let pts = raw.coords;
  let alignment;
  const shared = prior ? shown.filter((k) => prior.coords?.[k]) : [];
  const aligned = prior && shared.length >= 3;
  let alignFit = null;
  if (aligned) {
    alignFit = procrustes(shared.map((k) => pts[shown.indexOf(k)]), shared.map((k) => prior.coords[k]));
    pts = pts.map(alignFit.map);
    alignment = `Procrustes onto the ${prior.asOf ?? "previous"} layout (${shared.length} shared keywords, rms ${alignFit.rms.toFixed(3)})`;
  }
  // Gutters: distances between regions mean nothing, so a region far from all others slides closer.
  const rawStep = meanNearest(pts);
  let gutters = closeGutters(pts, shown.map((k) => clusterOf.get(k)), { gap: PARAMS.gutterSteps * rawStep });
  if (!aligned) {
    // First layout: the rotation that fills the frame best, mirrored so the largest region sits left, the next on top.
    const byRegion = regionList.map((r) => shown.map((k, i) => (clusterOf.get(k) === r.c ? i : -1)).filter((i) => i >= 0));
    const deg = bestTurn(gutters.points, { width: MAP.width, margin: MAP.margin, minHeight: MAP.minHeight, maxHeight: MAP.maxHeight });
    const flips = mirrorFor(turn(gutters.points, deg), { left: byRegion[0] ?? [], top: byRegion[1] ?? [] });
    pts = mirror(turn(pts, deg), flips);
    gutters = { points: mirror(turn(gutters.points, deg), flips), moved: gutters.moved };
    alignment = `first layout (no earlier one): turned ${deg}° to fill the frame${flips.fx < 0 || flips.fy < 0 ? ", mirrored" : ""}`;
  }
  // An exact fit (same projection as last time) keeps the stored values, so the file only changes when the layout does.
  const keep = aligned && alignFit.rms < 1e-4;
  const layoutPrev = {
    $comment:
      "The last Constellation layout, written by build-constellation.mjs. raw: UMAP's output (the next build starts UMAP here, and reuses it outright while umapInput is unchanged). coords: the same positions aligned and oriented, before gutters (the next build Procrustes-aligns onto these).",
    asOf: keep ? (prior.asOf ?? asOf) : asOf,
    model: embedInfo.model,
    umap: raw.umap ?? null,
    umapInput,
    raw: Object.fromEntries(shown.map((k, i) => [k, raw.coords[i]])),
    coords: Object.fromEntries(shown.map((k, i) => [k, keep && prior.coords[k] ? prior.coords[k] : pts[i].map((v) => round(v, 5))])),
  };
  pts = gutters.points;
  const gutterMoves = regionList.map((r) => ({ region: r.id, steps: round((gutters.moved.get(r.c) ?? 0) / rawStep, 2) })).filter((g) => g.steps > 0);

  // Frame, then disc sizes per lens and weight; discs keep clear of each other in every view.
  const height = frameHeight(pts, { width: MAP.width, margin: MAP.margin, minHeight: MAP.minHeight, maxHeight: MAP.maxHeight });
  const frame = fitToFrame(pts, { width: MAP.width, height, margin: MAP.margin });
  const bounds = { x0: 6, y0: 6, x1: MAP.width - 6, y1: height - 6 };
  const lensFacts = {};
  for (const lens of lensDefs) {
    const corpus = corpora[lens.id];
    const lensDois = new Set(lens.papers.map((p) => p.doi));
    const weightOf = (e) => 1 / yearsSince(Math.max(...[...e.cites].filter((d) => lensDois.has(d)).map((d) => paperByDoi.get(d).year)));
    const facts = new Map();
    for (const k of shown) {
      const list = corpus.filter((e) => e.kw.has(k));
      facts.set(k, { list, works: list.length, perYear: sum(list.map(weightOf)) });
    }
    const visible = shown.filter((k) => facts.get(k).works >= PARAMS.minWorks);
    const maxWorks = Math.max(1, ...visible.map((k) => facts.get(k).works));
    const maxPerYear = Math.max(0.01, ...visible.map((k) => facts.get(k).perYear));
    const radius = (v, max) => Math.max(MAP.rMin, MAP.rMax * Math.sqrt(v / max));
    for (const k of shown) {
      const f = facts.get(k);
      const on = f.works >= PARAMS.minWorks;
      f.r = on ? round(radius(f.works, maxWorks), 1) : 0;
      f.rY = on ? round(radius(f.perYear, maxPerYear), 1) : 0;
      f.on = on;
    }
    lensFacts[lens.id] = { corpus, lensDois, weightOf, facts, maxWorks, maxPerYear: round(maxPerYear), visible };
  }
  const R = new Map(shown.map((k) => [k, Math.max(...lensDefs.flatMap((l) => [lensFacts[l.id].facts.get(k).r, lensFacts[l.id].facts.get(k).rY]))]));
  const discs = shown.map((k, i) => {
    const [x, y] = frame.map(pts[i]);
    return { id: k, x, y, tx: x, ty: y, R: R.get(k) };
  });
  const sep = separate(discs, { gap: MAP.discGap, bounds: { x0: MAP.margin.left - 20, y0: MAP.margin.top - 16, x1: MAP.width - MAP.margin.right + 20, y1: height - MAP.margin.bottom + 12 }, iterations: 1200, spring: 0.02 });
  const at = new Map(discs.map((d) => [d.id, [d.x, d.y]]));
  const dNN = meanNearest(discs.map((d) => [d.x, d.y]));

  // 7. Papers: landing, aim, drift, shares, bridge (positions are the same in every lens).
  const shownSet = new Set(shown);
  const paperFacts = new Map();
  stars.forEach((p, si) => {
    const w = new Map();
    let mapped = 0;
    for (const id of p.citers) {
      let any = false;
      for (const k of works.get(id).kw) {
        if (!shownSet.has(k)) continue;
        w.set(k, (w.get(k) ?? 0) + 1);
        any = true;
      }
      if (any) mapped++;
    }
    const W = sum([...w.values()]);
    const L = W ? [sum([...w].map(([k, n]) => n * at.get(k)[0])) / W, sum([...w].map(([k, n]) => n * at.get(k)[1])) / W] : null;
    // Aim: the paper's own title and OpenAlex keywords, each matched to map keywords by meaning.
    const sigma = new Map();
    const aimTerms = [];
    ownItems[si].forEach((item, j) => {
      if (item.kind === "keyword" && shownSet.has(item.id)) {
        sigma.set(item.id, (sigma.get(item.id) ?? 0) + item.weight);
        aimTerms.push({ text: item.text, weight: item.weight, to: [[item.id, 1]] });
        return;
      }
      const v = itemVec[si][j];
      const near = shown
        .map((k) => [k, dot(v, kwVec.get(k))])
        .filter(([, c]) => c >= PARAMS.aimMinCos)
        .sort((a, b) => b[1] - a[1] || byId(a[0], b[0]))
        .slice(0, PARAMS.aimTopK);
      for (const [k, c] of near) sigma.set(k, (sigma.get(k) ?? 0) + item.weight * c);
      aimTerms.push({ text: item.text, weight: item.weight, to: near });
    });
    const S = sum([...sigma.values()]);
    const A = S ? [sum([...sigma].map(([k, s]) => s * at.get(k)[0])) / S, sum([...sigma].map(([k, s]) => s * at.get(k)[1])) / S] : null;
    const share = (m, tot) => {
      const out = {};
      for (const r of regionList) out[r.id] = 0;
      for (const [k, n] of m) out[regionIdOf(k)] += n / tot;
      return out;
    };
    const shares = W ? share(w, W) : {};
    const aimShares = S ? share(sigma, S) : {};
    const ranked = Object.entries(shares).sort((a, b) => b[1] - a[1] || byId(a[0], b[0]));
    const bridge = ranked.length >= 2 && ranked[1][1] >= PARAMS.bridgeShareMin ? [ranked[0][0], ranked[1][0]] : null;
    const argmax = (o) => Object.entries(o).sort((a, b) => b[1] - a[1] || byId(a[0], b[0]))[0]?.[0] ?? null;
    paperFacts.set(p.doi, {
      w,
      L,
      A,
      drift: L && A ? Math.hypot(L[0] - A[0], L[1] - A[1]) / dNN : null,
      shares,
      aimShares,
      bridge,
      landRegion: W ? argmax(shares) : null,
      aimRegion: S ? argmax(aimShares) : null,
      mapped,
      aimTerms,
      top: p.citers
        .map((id) => works.get(id))
        .sort((a, b) => b.citedBy - a.citedBy || (b.year ?? 0) - (a.year ?? 0) || byId(a.id, b.id))
        .slice(0, 3)
        .map((e) => ({ doi: e.doi, openalex: e.openalex, title: e.title, year: e.year, citedBy: e.citedBy })),
    });
  });

  // Stars: nudged off discs and apart, once (the same spots in both lenses).
  const starNodes = stars
    .filter((p) => paperFacts.get(p.doi).L)
    .map((p) => ({ id: p.doi, x: paperFacts.get(p.doi).L[0], y: paperFacts.get(p.doi).L[1] }));
  const starShift = nudgeStars(starNodes, discs, { starR: MAP.starR, gap: 3, bounds });
  const starAt = new Map(starNodes.map((s) => [s.id, [s.x, s.y]]));

  // 8. Views.
  const views = {};
  const reportLens = {};
  for (const lens of lensDefs) {
    const F = lensFacts[lens.id];
    const lensStars = stars.filter((p) => lensDefsHas(lens, p) && starAt.has(p.doi));
    const visibleSet = new Set(F.visible);
    const rest = lensStars
      .filter((p) => paperFacts.get(p.doi).drift >= PARAMS.driftRestMin)
      .sort((a, b) => paperFacts.get(b.doi).drift - paperFacts.get(a.doi).drift || byId(a.doi, b.doi))
      .slice(0, PARAMS.driftRestMax)
      .map((p) => p.doi);

    // Obstacles: the rest-state drift arrows (segment, aim dot, "aim" text).
    const driftBoxes = [];
    for (const doi of rest) {
      const f = paperFacts.get(doi);
      const [ax, ay] = f.A;
      const [lx, ly] = starAt.get(doi);
      const len = Math.hypot(lx - ax, ly - ay);
      for (let t = 0; t <= len; t += 6) driftBoxes.push(circleBox(ax + ((lx - ax) * t) / len, ay + ((ly - ay) * t) / len, 2.5));
      driftBoxes.push(circleBox(ax, ay, 5.5));
      const right = lx >= ax;
      driftBoxes.push(textBox(right ? ax - 7 : ax + 7, ay, 24, 12, right ? "end" : "start", 1));
    }
    const lensDiscs = discs.filter((d) => visibleSet.has(d.id)).map((d) => {
      const f = F.facts.get(d.id);
      return { ...d, R: Math.max(f.r, f.rY), region: regionIdOf(d.id) };
    });
    const starsHere = lensStars.map((p) => ({ id: p.doi, x: starAt.get(p.doi)[0], y: starAt.get(p.doi)[1] }));
    // Sized as the UI draws it: bridges carry the schematic's "· bridge" suffix.
    const starLabelText = (p) => {
      const b = paperFacts.get(p.doi).bridge;
      return { en: b ? `${p.short} · bridge` : p.short, zh: b ? `${p.shortZh} · 桥梁` : p.shortZh };
    };
    // Each region's two largest keywords are labelled first; stars and names then work around them.
    const kwNodes = lensDiscs.map((d) => ({ ...d, text: { en: displayName(d.id), zh: zhLabel(d.id) ?? displayName(d.id) }, priority: F.facts.get(d.id).works }));
    const anchors = new Set(
      regionList.flatMap((r) => F.visible.filter((k) => regionIdOf(k) === r.id).sort((a, b) => F.facts.get(b).works - F.facts.get(a).works || byId(a, b)).slice(0, 2))
    );
    const starGlyphs = starsHere.map((s) => circleBox(s.x, s.y, MAP.starR + 2));
    const anchorPass = placeKeywordLabels(
      kwNodes.filter((n) => anchors.has(n.id)),
      { obstacles: [...starGlyphs, ...driftBoxes, ...lensDiscs.filter((d) => !anchors.has(d.id)).map((d) => circleBox(d.x, d.y, d.R + 1))], bounds, size: MAP.labelSize }
    );
    const anchorBoxes = [...anchors].flatMap((k) => {
      const l = anchorPass.get(k);
      const node = kwNodes.find((n) => n.id === k);
      return l ? [...keywordLabelBoxes(l.en, node.text.en, MAP.labelSize), ...keywordLabelBoxes(l.zh, node.text.zh, MAP.labelSize)] : [];
    });
    const starLabels = placeStarLabels(
      lensStars.map((p) => ({ id: p.doi, x: starAt.get(p.doi)[0], y: starAt.get(p.doi)[1], text: starLabelText(p), priority: p.works })),
      { discs: lensDiscs, softBoxes: driftBoxes, hardBoxes: anchorBoxes, bounds, size: MAP.paperSize * 1.06, starR: MAP.starR }
    );
    const leaderBoxes = starLabels.leaders.flatMap((l) => segmentBoxes(l, 1.5));
    // Regions shown in this lens: tint around their visible discs, name over it.
    // A region is drawn (tint + name) in a lens only with ≥ regionMin visible keywords there.
    const regionShapes = new Map();
    const regionCores = new Map();
    for (const r of regionList) {
      const mine = lensDiscs.filter((d) => regionIdOf(d.id) === r.id);
      const core = regionCore(mine);
      regionCores.set(r.id, core);
      regionShapes.set(r.id, mine.length >= PARAMS.regionMin ? regionEllipse(core, { pad: MAP.regionPad, minRx: 34, minRy: 26 }) : null);
    }
    const regionWorks = new Map();
    for (const r of regionList) {
      const ks = F.visible.filter((k) => regionIdOf(k) === r.id);
      const set = new Map();
      for (const k of ks) for (const e of F.facts.get(k).list) set.set(e.id, e);
      regionWorks.set(r.id, [...set.values()]);
    }
    // Region names keep clear of stars, star labels and the anchors' labels; then every keyword
    // label (anchors first, so they keep their spots) works around the names.
    const fixedObstacles = [...starGlyphs, ...starLabels.boxes, ...leaderBoxes, ...driftBoxes];
    const regionLabels = placeRegionLabels(
      regionList.filter((r) => regionShapes.get(r.id)).map((r) => ({ id: r.id, works: regionWorks.get(r.id).length, ellipse: regionShapes.get(r.id), core: regionCores.get(r.id), text: { en: r.en, zh: r.zh } })),
      { discs: lensDiscs, stars: starsHere, boxes: [...starLabels.boxes, ...leaderBoxes, ...driftBoxes, ...anchorBoxes], bounds, size: MAP.regionSize, starR: MAP.starR }
    );
    const kwLabels = placeKeywordLabels(
      kwNodes.map((n) => (anchors.has(n.id) ? { ...n, priority: n.priority + 1e6 } : n)),
      { obstacles: [...fixedObstacles, ...regionLabels.boxes], bounds, size: MAP.labelSize }
    );

    const regionOrder = new Map(regionList.map((r, i) => [r.id, i]));
    const kwOrder = [...shown].sort((a, b) => regionOrder.get(regionIdOf(a)) - regionOrder.get(regionIdOf(b)) || nAll.get(b) - nAll.get(a) || byId(a, b));
    const lensPaperSet = F.lensDois;
    const keywords = kwOrder.map((k) => {
      const f = F.facts.get(k);
      const cited = new Map();
      for (const e of f.list) for (const d of e.cites) if (lensPaperSet.has(d)) cited.set(d, (cited.get(d) ?? 0) + 1);
      const citedList = [...cited].map(([doi, n]) => ({ doi, n })).sort((a, b) => b.n - a.n || byId(a.doi, b.doi));
      const [x, y] = at.get(k);
      const label = kwLabels.get(k) ?? { en: null, zh: null };
      return {
        id: k,
        en: displayName(k),
        ...(zhLabel(k) ? { zh: zhLabel(k) } : {}),
        region: regionIdOf(k),
        x: round(x / MAP.width, 4),
        y: round(y / height, 4),
        works: f.works,
        perYear: round(f.perYear, 1),
        echo: lens.papers.some((p) => p.keywords.has(k)),
        shown: f.on,
        papers: citedList.map((c) => c.doi),
        cited: citedList,
        top: [...f.list]
          .sort((a, b) => b.citedBy - a.citedBy || (b.year ?? 0) - (a.year ?? 0) || byId(a.id, b.id))
          .slice(0, 3)
          .map((e) => ({ doi: e.doi, openalex: e.openalex, title: e.title, year: e.year, citedBy: e.citedBy })),
        r: f.r,
        rY: f.rY,
        label: f.on ? { en: label.en, zh: label.zh } : { en: null, zh: null },
      };
    });

    const paperOut = lensStars.map((p) => {
      const pf = paperFacts.get(p.doi);
      const [sx, sy] = starAt.get(p.doi);
      const lab = starLabels.labels.get(p.doi);
      const lines = [...pf.w]
        .filter(([k, n]) => visibleSet.has(k) && n >= 2)
        .sort((a, b) => b[1] - a[1] || byId(a[0], b[0]))
        .slice(0, PARAMS.linesAtRest)
        .map(([k]) => k);
      const shareOut = Object.fromEntries(Object.entries(pf.shares).map(([r, v]) => [r, round(v, 3)]));
      return {
        doi: p.doi,
        short: p.short,
        ...(p.shortZh !== p.short ? { shortZh: p.shortZh } : {}),
        lens: p.lens,
        works: p.works,
        landing: [round(sx / MAP.width, 4), round(sy / height, 4)],
        aim: [round(pf.A[0] / MAP.width, 4), round(pf.A[1] / height, 4)],
        drift: round(pf.drift, 2),
        bridge: pf.bridge,
        lines,
        title: p.title,
        year: p.year,
        full: p.full,
        shares: shareOut,
        aimRegion: pf.aimRegion,
        landRegion: pf.landRegion,
        mappedWorks: pf.mapped,
        top: pf.top,
        label: lab
          ? { x: lab.x, y: lab.y, anchor: lab.anchor, ...(lab.leader ? { leader: lab.leader } : {}) }
          : { x: round1(sx), y: round1(sy + MAP.starR + 10), anchor: "middle" },
      };
    });

    // Papers below the star threshold: listed with the region most of their citers' keywords fall in.
    const folded = lens.papers
      .filter((p) => !lensStars.includes(p))
      .map((p) => {
        const m = new Map();
        for (const id of p.citers) for (const k of works.get(id).kw) if (shownSet.has(k)) m.set(regionIdOf(k), (m.get(regionIdOf(k)) ?? 0) + 1);
        const best = [...m].sort((a, b) => b[1] - a[1] || byId(a[0], b[0]))[0];
        return { doi: p.doi, short: p.short, ...(p.shortZh !== p.short ? { shortZh: p.shortZh } : {}), full: p.full, lens: p.lens, works: p.works, region: best ? best[0] : null };
      })
      .sort((a, b) => b.works - a.works || byId(a.doi, b.doi));

    const mappedWorks = F.corpus.filter((e) => F.visible.some((k) => e.kw.has(k))).length;
    const regionsOut = regionList.map((r) => {
      const shape = regionShapes.get(r.id);
      const list = regionWorks.get(r.id);
      const lab = shape ? regionLabels.labels.get(r.id) : null;
      return {
        id: r.id,
        en: r.en,
        zh: r.zh,
        color: r.color,
        x: shape ? round(shape.cx / MAP.width, 4) : 0,
        y: shape ? round(shape.cy / height, 4) : 0,
        works: list.length,
        perYear: round(sum(list.map(F.weightOf)), 1),
        keywords: F.visible.filter((k) => regionIdOf(k) === r.id).length,
        shape: shape ? { cx: shape.cx, cy: shape.cy, rx: shape.rx, ry: shape.ry, rot: shape.angle } : { cx: 0, cy: 0, rx: 0, ry: 0, rot: 0 },
        name: lab ? { x: lab.x, y: lab.y } : { x: 0, y: 0 },
      };
    });

    views[lens.id] = {
      meta: {
        asOf,
        model: engine === "minilm" ? `${MODEL} · UMAP ${raw.umap}` : embedInfo.model,
        params: { ...PARAMS, regions: K },
        lens: lens.id,
        citingWorks: F.corpus.length,
        mappedWorks,
        layout: { width: MAP.width, height, labelSize: MAP.labelSize, regionSize: MAP.regionSize, paperSize: MAP.paperSize, starR: MAP.starR },
        scale: { maxWorks: F.maxWorks, maxPerYear: F.maxPerYear, rMax: MAP.rMax, rMin: MAP.rMin },
        folded,
        // Extras for the report and the method note (not in the design contract).
        engine,
        embedding: { labelPrior: PARAMS.labelPrior, pool: poolIds.length, silhouettes: runs.map((r) => ({ k: r.k, silhouette: round(r.silhouette, 3) })) },
        keywordStep: round(dNN, 1),
        alignment,
        projection,
        restDrift: rest,
        stats: { discShiftMax: round(sep.maxShift / dNN, 2), starShiftMax: round(starShift / dNN, 2), discOverlaps: sep.overlaps, gutterMoves },
      },
      regions: regionsOut,
      keywords,
      papers: paperOut,
    };
    reportLens[lens.id] = { lensStars, rest, kwLabels, regionLabels, starLabels };
  }

  function lensDefsHas(lens, p) {
    return lens.papers.includes(p);
  }

  // Report.
  const missingZh = shown.filter((k) => !zhLabel(k));
  const report = renderReport({ views, regionList, selection, seedRows, stars, paperFacts, runs, K, excluded, nAll, displayName, silOf, pool, shown, warnings, missingZh, embedInfo, engine, alignment, asOf, N, regionIdOf, places });
  console.log("\n" + report.console);
  console.log(`\n${cacheSummary()}`);
  if (warnings.length) console.log(`\n${warnings.length} warning(s):\n${warnings.map((w) => "  ! " + w).join("\n")}`);
  if (DRY_RUN) {
    console.log("Dry run — nothing written.");
    return;
  }
  const output = {
    $comment: "Generated by scripts/influence/build-constellation.mjs from OpenAlex (self-citations removed). Do not edit by hand; see docs/reach/CONSTELLATION-MAP.md.",
    all: views.all,
    lead: views.lead,
  };
  writeFileSync(OUT_PATH, JSON.stringify(output, null, 1) + "\n");
  mkdirSync(dirname(PRIOR_PATH), { recursive: true });
  writeFileSync(PRIOR_PATH, JSON.stringify(layoutPrev, null, 1) + "\n");
  writeFileSync(REPORT_PATH, report.markdown);
  console.log(`Wrote ${OUT_PATH}\nWrote ${PRIOR_PATH}\nWrote ${REPORT_PATH}`);
}

// ── Report ─────────────────────────────────────────────────────────────────

function renderReport({ views, regionList, selection, seedRows, stars, paperFacts, runs, K, excluded, nAll, displayName, silOf, pool, shown, warnings, missingZh, embedInfo, engine, alignment, asOf, N, regionIdOf, places }) {
  const md = [];
  const con = [];
  const regionName = (id) => regionList.find((r) => r.id === id)?.en ?? id;
  md.push("# Constellation keyword report");
  md.push("");
  md.push(`Generated by \`node scripts/influence/build-constellation.mjs\` · OpenAlex data as of ${asOf} · self-citations removed. Rewritten on each run.`);
  md.push("");
  md.push(`- Engine: **${engine}** — ${embedInfo.model}; ${embedInfo.dim}-d vectors.`);
  md.push(`- Pool: ${pool.size} keywords from ${N} All-lens citing works; ${shown.length} shown.`);
  md.push(`- Regions: k = ${K} by cosine silhouette (${runs.map((r) => `k = ${r.k}: ${r.silhouette.toFixed(3)}`).join("; ")}).`);
  md.push(`- Layout: ${views.all.meta.projection}; ${alignment}. Keyword-step (mean nearest-neighbour distance) = ${views.all.meta.keywordStep} map units.`);
  md.push(`- Gutters closed (regions slid rigidly toward their nearest neighbour, in keyword-steps): ${views.all.meta.stats.gutterMoves.map((g) => `${regionList.find((r) => r.id === g.region)?.en ?? g.region} ${g.steps}`).join(", ") || "none"}.`);
  md.push(`- Disc nudges ≤ ${views.all.meta.stats.discShiftMax} keyword-steps; star nudges ≤ ${views.all.meta.stats.starShiftMax} keyword-steps; disc overlaps ${views.all.meta.stats.discOverlaps}.`);
  md.push("");
  con.push(`Regions (k = ${K}):`);
  md.push("## Regions");
  md.push("");
  md.push("| Region | Colour | All: works · keywords | Lead: works · keywords | Shown keywords (All-lens works; silhouette; * = a star's seed) |");
  md.push("| --- | --- | --- | --- | --- |");
  for (const r of regionList) {
    const s = selection.find((x) => x.c === r.c);
    const a = views.all.regions.find((x) => x.id === r.id);
    const l = views.lead.regions.find((x) => x.id === r.id);
    const kws = s.mine.map((k) => `${displayName(k)} (${nAll.get(k)}; ${silOf.get(k).toFixed(2)}${pool.get(k).seedOf.length ? "*" : ""})`).join(", ");
    md.push(`| ${r.en} | \`${r.color}\` | ${a.works} · ${a.keywords} | ${l.works} · ${l.keywords} | ${kws} |`);
    con.push(`  ${r.en.padEnd(36)} ${r.color}  all ${String(a.works).padStart(4)} works · ${String(a.keywords).padStart(2)} kw   lead ${String(l.works).padStart(4)} · ${String(l.keywords).padStart(2)}`);
  }
  md.push("");
  md.push("Slots per region ∝ √(citing works carrying any pool keyword of the region), clamped to 3–15. Skipped as redundant (≥ 60% shared works with a shown keyword):");
  md.push("");
  for (const s of selection) {
    const r = regionList.find((x) => x.c === s.c);
    md.push(`- ${r.en}: slots ${s.quota} of ${s.members} pool keywords; ${s.skipped.length ? s.skipped.map((x) => `${displayName(x.k)} (≈ ${displayName(x.twin)})`).join(", ") : "none skipped"}.`);
  }
  md.push("");
  md.push("## Stars (papers with ≥ 30 non-self citing works)");
  md.push("");
  md.push("| Paper | Lens | Works | Mapped | Landing region | Aim region | Drift (keyword-steps) | Bridge | Lines at rest (All) |");
  md.push("| --- | --- | ---: | ---: | --- | --- | ---: | --- | --- |");
  con.push("\nStars:");
  for (const p of stars) {
    const f = paperFacts.get(p.doi);
    const v = views.all.papers.find((x) => x.doi === p.doi);
    md.push(`| ${p.short} | ${p.lens} | ${p.works} | ${f.mapped} | ${regionName(f.landRegion)} | ${regionName(f.aimRegion)} | ${f.drift?.toFixed(2) ?? "–"} | ${f.bridge ? f.bridge.map(regionName).join(" + ") : ""} | ${v ? v.lines.map(displayName).join(", ") : ""} |`);
    con.push(`  ${p.short.padEnd(34)} ${p.lens.padEnd(8)} ${String(p.works).padStart(4)}  drift ${f.drift?.toFixed(2) ?? " – "}  ${regionName(f.aimRegion)} → ${regionName(f.landRegion)}${f.bridge ? `  BRIDGE ${f.bridge.join("+")}` : ""}`);
  }
  md.push("");
  md.push(`Drift arrows at rest — All: ${views.all.meta.restDrift.map((d) => stars.find((p) => p.doi === d).short).join(", ") || "none (no star reaches δ ≥ 3)"}; Lead: ${views.lead.meta.restDrift.map((d) => stars.find((p) => p.doi === d).short).join(", ") || "none (no star reaches δ ≥ 3)"}.`);
  md.push("");
  md.push("### Aim matches (own title and OpenAlex keywords → map keywords, cosine)");
  md.push("");
  for (const p of stars) {
    const f = paperFacts.get(p.doi);
    const parts = f.aimTerms
      .filter((t) => t.to.length)
      .map((t) => `${t.text.length > 48 ? t.text.slice(0, 46) + "…" : t.text} (${t.weight.toFixed(2)}) → ${t.to.map(([k, c]) => `${displayName(k)} ${c.toFixed(2)}`).join(" / ")}`);
    const none = f.aimTerms.filter((t) => !t.to.length).map((t) => t.text);
    md.push(`- **${p.short}**: ${parts.join("; ")}${none.length ? `. No counterpart: ${none.join(", ")}` : ""}.`);
  }
  md.push("");
  md.push("### Seeds (each star's most distinctive citer keywords, n · ln lift)");
  md.push("");
  for (const { p, ranked } of seedRows) md.push(`- ${p.short}: ${ranked.map((x) => `${displayName(x.k)} (${x.n}, lift ${x.lift.toFixed(1)})`).join("; ") || "none"}`);
  md.push("");
  md.push("## Folded papers (no star)");
  md.push("");
  for (const p of views.all.meta.folded) md.push(`- ${p.full} — ${p.works} non-self citing works${p.region ? `; most citer keywords in ${regionName(p.region)}` : ""}`);
  md.push("");
  md.push("## Excluded keywords that would otherwise be in the pool");
  md.push("");
  const wouldBe = [...nAll].filter(([k, n]) => excluded.has(k) && n >= 10).sort((a, b) => b[1] - a[1]);
  for (const [k, n] of wouldBe) md.push(`- ${displayName(k)} (\`${k}\`) — ${n} citing works — ${excluded.get(k)}`);
  const unused = [...places].filter((k) => !nAll.has(k));
  if (unused.length) md.push(`- Place names listed but on no citing work this run: ${unused.join(", ")}`);
  md.push("");
  md.push("## Chinese labels missing");
  md.push("");
  md.push(missingZh.length ? missingZh.map((k) => `- \`${k}\` (${displayName(k)})`).join("\n") : "_None: every shown keyword has a Chinese label in `data/influence/keyword-zh.json`._");
  md.push("");
  md.push("## Warnings");
  md.push("");
  md.push(warnings.length ? warnings.map((w) => `- ${w}`).join("\n") : "_None._");
  md.push("");
  md.push(`Parameters: \`${JSON.stringify(views.all.meta.params)}\``);
  md.push("");
  if (missingZh.length) con.push(`\nChinese labels missing for ${missingZh.length} shown keywords: ${missingZh.join(", ")}`);
  return { markdown: md.join("\n"), console: con.join("\n") };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
