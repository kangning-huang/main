#!/usr/bin/env node
/**
 * Preview view C for /reach (docs/reach/VIZ-ALT-REPORT.md): the Ripple keywords as a
 * VOSviewer-style map. Two keywords sit close when they often appear on the same citing
 * works: co-occurrence counted over the lens's non-self citing works, normalised by
 * association strength, laid out by a VOS-family energy model (attraction 2, logarithmic
 * repulsion; see lib/reach-alt-layout.mjs).
 *
 * When a lens has too few keyword pairs sharing works to map relatedness honestly, the
 * keywords are packed by theme instead, and no links are drawn.
 *
 * Bubble sizes, themes and every count shown in the panel stay the Ripple's
 * (src/data/ripple.json); this script adds pair counts and positions only.
 *
 * Input:   src/data/ripple.json, data/influence/dois.json, data/influence/keyword-aliases.json
 *          OpenAlex citing works via lib/openalex.mjs (.cache/openalex, same cache as build-ripple.mjs)
 * Output:  src/data/reach-clusters.json
 * Usage:   node scripts/influence/build-reach-clusters.mjs [--offline | --refresh] [--dry-run]
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { ROOT, getWork, getCiting, shortId, authorKeys, selfCiteReason, cacheSummary } from "./lib/openalex.mjs";
import { packGroup, placeBadges, placeLabels, round1, separate, vosLayout } from "./lib/reach-alt-layout.mjs";
import { textWidth } from "./lib/ripple-layout.mjs";

const DRY_RUN = process.argv.includes("--dry-run");
const OUT_PATH = join(ROOT, "src", "data", "reach-clusters.json");
const readJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));

const PARAMS = {
  minSharedWorks: 2, // mapped only if this many of a keyword's citing works carry another shown keyword
  robustPairWorks: 3, // a pair "robustly" co-occurs when at least this many citing works carry both
  robustShareMin: 2 / 3, // map by co-occurrence only if at least this share of keywords has a robust partner
  restLinkMin: 8, // links drawn at rest: pairs sharing at least this many citing works
  detachedRatio: 4, // a theme "sits apart" when its nearest outside keyword is this many typical neighbour spacings away
};

/** wide: ≥ 720 px (the 800-unit map shows at ~0.9×); narrow: phones, portrait. */
const SPECS = {
  wide: { width: 800, minHeight: 440, maxHeight: 620, margin: 26, rMax: 22, rMin: 4.5, gap: 4, labelSize: 13, badge: 8, leaders: [10, 18, 28, 40, 56], leaderClear: 6, noteSize: 12, noteWidth: 200 },
  narrow: { width: 340, minHeight: 420, maxHeight: 640, margin: 14, rMax: 12, rMin: 3.5, gap: 3, labelSize: 10.5, badge: 6.5, leaders: [10, 18, 28, 40, 56, 76], leaderClear: 4, noteSize: 11, noteWidth: 230 },
};

const CAPTION_SIZE = 12; // theme captions over packed groups (ReachClusters.tsx draws them at this size)
const round = (v, dp = 2) => Math.round(v * 10 ** dp) / 10 ** dp;
const fmt = (n) => n.toLocaleString("en-US");
const radius = (v, max, rMax, rMin) => Math.max(rMin, rMax * Math.sqrt(v / max));
const slugOf = (k) => (k.id ? k.id.split("/").pop() : k.display_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));

// ── Corpus: the same non-self citing works and keyword rule as build-ripple.mjs ──

const ripple = readJson("src/data/ripple.json");
const dois = readJson("data/influence/dois.json");
const aliasCfg = readJson("data/influence/keyword-aliases.json");
const aliasOf = new Map();
for (const [canon, variants] of Object.entries(aliasCfg.merge ?? {})) for (const v of variants) aliasOf.set(v, canon);
const canonical = (slug) => {
  let s = slug;
  for (let i = 0; i < 10 && aliasOf.has(s); i++) s = aliasOf.get(s);
  return s;
};
const scoreMin = ripple.all.meta.params.keywordScoreMin;
const keywordSet = (work) => new Set((work.keywords ?? []).filter((k) => k.score >= scoreMin).map((k) => canonical(slugOf(k))));

const nonSelf = [];
for (const p of dois.papers) {
  if (p.status === "pending") continue;
  let work;
  try {
    work = await getWork(p.doi);
  } catch (err) {
    console.warn(`  SKIPPED ${p.doi}: ${err.message}`);
    continue;
  }
  const keys = authorKeys(work);
  const citing = await getCiting(shortId(work.id));
  nonSelf.push({ lens: p.lens, works: citing.filter((c) => !selfCiteReason(c, keys)) });
}

function corpusFor(lens) {
  const corpus = new Map();
  for (const p of nonSelf) {
    if (lens === "lead" && p.lens !== "lead") continue;
    for (const c of p.works) if (!corpus.has(c.id)) corpus.set(c.id, keywordSet(c));
  }
  return corpus;
}

// ── Layout helpers ─────────────────────────────────────────────────────────

/** Connected components of the co-occurrence graph (pairs sharing ≥ 1 work), largest first. */
function components(n, C) {
  const seen = new Array(n).fill(false);
  const out = [];
  for (let i = 0; i < n; i++) {
    if (seen[i]) continue;
    const comp = [];
    const stack = [i];
    seen[i] = true;
    while (stack.length) {
      const v = stack.pop();
      comp.push(v);
      for (let j = 0; j < n; j++) {
        if (!seen[j] && C[v][j] > 0) {
          seen[j] = true;
          stack.push(j);
        }
      }
    }
    out.push(comp.sort((a, b) => a - b));
  }
  return out.sort((a, b) => b.length - a.length || a[0] - b[0]);
}

/** Spearman rank correlation. */
function spearman(xs, ys) {
  const rank = (v) => {
    const idx = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]);
    const r = new Array(v.length);
    for (let i = 0; i < idx.length; ) {
      let j = i;
      while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
      for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2;
      i = j + 1;
    }
    return r;
  };
  const rx = rank(xs);
  const ry = rank(ys);
  const m = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const mx = m(rx);
  const my = m(ry);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < rx.length; i++) {
    num += (rx[i] - mx) * (ry[i] - my);
    dx += (rx[i] - mx) ** 2;
    dy += (ry[i] - my) ** 2;
  }
  return num / Math.sqrt(dx * dy);
}

/** Labels (with inline callout badges) and fallback badges for a finished set of bubbles. */
function labelNodes(nodes, spec, height, calloutRank, obstacles = []) {
  const bounds = { x0: 2, y0: 2, x1: spec.width - 2, y1: height - 2 };
  const placed = placeLabels(nodes, { size: spec.labelSize, bounds, obstacles, leaders: spec.leaders, leaderClear: spec.leaderClear, level: false });
  const badges = placeBadges(nodes, placed, { calloutRank, r: spec.badge, bounds });
  return { labels: placed.labels, badges };
}

/** Greedy line wrap; CJK characters break anywhere, Latin text at spaces. */
function wrap(text, size, maxWidth) {
  const tokens = text.match(/[\u2e80-\u9fff\uff00-\uffef]|[^\s\u2e80-\u9fff\uff00-\uffef]+\s*|\s+/g) ?? [text];
  const lines = [];
  let line = "";
  for (const tok of tokens) {
    const next = line + tok;
    if (line && textWidth(next.trimEnd(), size) > maxWidth) {
      lines.push(line.trimEnd());
      line = tok.trimStart();
    } else line = next;
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

/**
 * A caption for a theme that sits apart, in the empty space between it and the rest: the
 * free spot nearest the middle of the gap, clear of every bubble. Placed before the keyword
 * labels, which then keep out of it.
 */
function placeNote(note, spec, height, nodes) {
  const out = { lines: {} };
  const boxes = {};
  for (const lang of ["en", "zh"]) {
    const lines = wrap(note.text[lang], spec.noteSize, spec.noteWidth);
    const w = Math.max(...lines.map((l) => textWidth(l, spec.noteSize)));
    out.lines[lang] = lines;
    boxes[lang] = { w, h: lines.length * spec.noteSize * 1.3 };
  }
  const w = Math.max(boxes.en.w, boxes.zh.w) + 8;
  const h = Math.max(boxes.en.h, boxes.zh.h) + 6;
  const [a, b] = note.pair.map((id) => nodes.find((n) => n.id === id));
  const free = (x, y) => {
    const box = { x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2 };
    if (box.x0 < 4 || box.x1 > spec.width - 4 || box.y0 < 4 || box.y1 > height - 4) return false;
    const hitsBubble = nodes.some((n) => {
      const nx = Math.max(box.x0, Math.min(n.x, box.x1));
      const ny = Math.max(box.y0, Math.min(n.y, box.y1));
      return Math.hypot(nx - n.x, ny - n.y) < n.R + 8;
    });
    return !hitsBubble;
  };
  for (const f of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]) {
    for (const [dx, dy] of [[0, 0], [0, -24], [0, 24], [-40, 0], [40, 0], [0, -48], [0, 48]]) {
      const x = a.x + (b.x - a.x) * f + dx;
      const y = a.y + (b.y - a.y) * f + dy;
      if (free(x, y)) return { note: { ...out, x: round1(x), y: round1(y - h / 2 + 3 + spec.noteSize * 0.65) }, box: { x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2 } };
    }
  }
  return null;
}

/**
 * Turns (whole degrees) at which the map nearly fills the layout's box: within 3% of the
 * largest scale. Turning keeps every distance; the builder keeps the turn that labels most.
 */
function candidateTurns(points, spec) {
  const pad = spec.margin + spec.rMax;
  const scales = [];
  for (let deg = 0; deg < 180; deg++) {
    const a = (deg * Math.PI) / 180;
    const xs = points.map((p) => p.x * Math.cos(a) - p.y * Math.sin(a));
    const ys = points.map((p) => p.x * Math.sin(a) + p.y * Math.cos(a));
    scales.push({ deg, scale: Math.min((spec.width - 2 * pad) / (Math.max(...xs) - Math.min(...xs)), (spec.maxHeight - 2 * pad) / (Math.max(...ys) - Math.min(...ys))) });
  }
  const best = Math.max(...scales.map((x) => x.scale));
  return scales.filter((x) => x.scale >= 0.97 * best).map((x) => x.deg);
}

/** Turn the map by `deg`, then mirror it so Urban expansion sits left and heat on top (mirroring keeps distances too). */
function orient(points, deg, themeOf) {
  const a = (deg * Math.PI) / 180;
  let out = points.map((p) => ({ id: p.id, x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a) }));
  const centroid = (theme, axis) => {
    const mine = out.filter((p) => themeOf(p.id) === theme);
    const all = out.reduce((s, p) => s + p[axis], 0) / out.length;
    return mine.length ? mine.reduce((s, p) => s + p[axis], 0) / mine.length - all : 0;
  };
  if (centroid("expansion", "x") > 0) out = out.map((p) => ({ ...p, x: -p.x }));
  if (centroid("heat-health", "y") > 0) out = out.map((p) => ({ ...p, y: -p.y }));
  return out;
}

/** Scale map coordinates uniformly (distance is the message) into the layout's box. */
function fitToBox(points, spec) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const pad = spec.margin + spec.rMax;
  const spanX = Math.max(...xs) - Math.min(...xs) || 1;
  const spanY = Math.max(...ys) - Math.min(...ys) || 1;
  let s = (spec.width - 2 * pad) / spanX;
  let height = spanY * s + 2 * pad;
  if (height > spec.maxHeight) {
    s = (spec.maxHeight - 2 * pad) / spanY;
    height = spec.maxHeight;
  }
  height = Math.max(spec.minHeight, height);
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  return { height: Math.round(height), place: (p) => ({ x: spec.width / 2 + (p.x - cx) * s, y: height / 2 + (p.y - cy) * s }) };
}

// ── Build ──────────────────────────────────────────────────────────────────

const out = {
  $comment:
    "Generated by scripts/influence/build-reach-clusters.mjs (preview view C). Pair counts come from OpenAlex citing works (self-citations removed); keyword counts, themes and sizes are the Ripple's (src/data/ripple.json). Do not edit by hand.",
};
const report = [];

for (const lens of ["all", "lead"]) {
  const view = ripple[lens];
  const corpus = corpusFor(lens);
  const N = corpus.size;
  const kws = view.keywords;
  const n = kws.length;
  const calloutRank = new Map(view.callouts.map((c, i) => [c.keyword, i + 1]));

  // Works carrying each keyword; validate against the Ripple's counts.
  const sets = kws.map((k) => new Set([...corpus].filter(([, s]) => s.has(k.id)).map(([id]) => id)));
  const drift = [];
  if (N !== view.meta.citingWorks) drift.push({ id: "(corpus)", recount: N, ripple: view.meta.citingWorks });
  kws.forEach((k, i) => {
    if (sets[i].size !== k.totalWorks) drift.push({ id: k.id, recount: sets[i].size, ripple: k.totalWorks });
  });

  // Co-occurrence and association strength.
  const C = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      let c = 0;
      for (const id of sets[i]) if (sets[j].has(id)) c++;
      C[i][j] = C[j][i] = c;
    }
  const assoc = (i, j) => (C[i][j] * N) / (sets[i].size * sets[j].size);
  const links = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) if (C[i][j] > 0) links.push({ a: kws[i].id, b: kws[j].id, n: C[i][j], s: round(assoc(i, j)) });
  links.sort((x, y) => y.n - x.n || y.s - x.s || (x.a + x.b < y.a + y.b ? -1 : 1));
  const robust = kws.filter((_, i) => C[i].some((c) => c >= PARAMS.robustPairWorks)).length;
  const robustPairs = links.filter((l) => l.n >= PARAMS.robustPairWorks).length;
  const method = robust / n >= PARAMS.robustShareMin ? "cooccurrence" : "theme";

  // Works carrying keyword i and at least one other shown keyword: under minSharedWorks there is
  // no co-occurrence signal to place it by, so it is listed under the map instead.
  const sharedWorks = sets.map((set, i) => [...set].filter((id) => sets.some((other, j) => j !== i && other.has(id))).length);
  const mappable = kws.map((_, i) => sharedWorks[i] >= PARAMS.minSharedWorks);
  const comps = components(n, C.map((row, i) => row.map((c, j) => (mappable[i] && mappable[j] ? c : 0))));
  const main = method === "cooccurrence" ? comps[0] : [];
  const unlinked = method === "cooccurrence" ? kws.map((k) => k.id).filter((_, i) => !main.includes(i)) : [];

  // Map coordinates (unitless) for the keywords that get a position from co-occurrence.
  let base = null;
  let fit = null;
  const detached = [];
  if (method === "cooccurrence") {
    const S = main.map((i) => main.map((j) => (i === j ? 0 : assoc(i, j))));
    const vos = vosLayout(S);
    const X = vos.X;
    base = new Map(main.map((i, m) => [kws[i].id, { x: X[m][0], y: X[m][1] }]));

    // How well 2D distance keeps the co-occurrence signal.
    const sim = [];
    const dist = [];
    for (let a = 0; a < main.length; a++)
      for (let b = a + 1; b < main.length; b++) {
        const i = main[a];
        const j = main[b];
        if (C[i][j] === 0) continue;
        sim.push(assoc(i, j));
        dist.push(Math.hypot(X[a][0] - X[b][0], X[a][1] - X[b][1]));
      }
    // Share of keywords whose nearest neighbour on the map is one of their three strongest partners.
    const near = main.filter((i, a) => {
      const top = main.filter((j) => j !== i && C[i][j] > 0).sort((x, y) => assoc(i, y) - assoc(i, x)).slice(0, 3);
      const nearest = main
        .map((j, b) => ({ j, d: b === a ? Infinity : Math.hypot(X[a][0] - X[b][0], X[a][1] - X[b][1]) }))
        .sort((x, y) => x.d - y.d)[0].j;
      return top.includes(nearest);
    }).length;
    fit = {
      energy: round(vos.energy, 3),
      spearmanSimilarityVsDistance: round(spearman(sim, dist)),
      linkedPairs: sim.length,
      nearestIsTopPartner: round(near / main.length),
    };

    // Themes that sit apart from the rest of the map, with the citing works that bridge them.
    const ids = main.map((i) => kws[i].id);
    const d = (p, q) => Math.hypot(base.get(p).x - base.get(q).x, base.get(p).y - base.get(q).y);
    const nn = ids.map((p) => Math.min(...ids.filter((q) => q !== p).map((q) => d(p, q)))).sort((x, y) => x - y);
    const spacing = nn[Math.floor(nn.length / 2)];
    for (const t of view.themes) {
      const mine = ids.filter((id) => kws.find((k) => k.id === id).theme === t.id);
      const rest = ids.filter((id) => !mine.includes(id));
      if (mine.length < 2 || rest.length === 0) continue;
      let pair = null;
      for (const p of mine) for (const q of rest) if (!pair || d(p, q) < pair.d) pair = { p, q, d: d(p, q) };
      if (pair.d / spacing < PARAMS.detachedRatio) continue;
      const setOf = (id) => sets[kws.findIndex((k) => k.id === id)];
      const carrying = new Set(mine.flatMap((id) => [...setOf(id)]));
      const bridged = [...carrying].filter((w) => rest.some((id) => setOf(id).has(w))).length;
      detached.push({ theme: t.id, ratio: round(pair.d / spacing, 1), works: carrying.size, bridged, pair: [pair.p, pair.q], t });
    }
  }

  out[lens] = {
    meta: {
      asOf: view.meta.asOf,
      lens,
      method,
      citingWorks: N,
      keywords: n,
      pairs: (n * (n - 1)) / 2,
      linkedPairs: links.length,
      robustPairs,
      robustKeywords: robust,
      params: PARAMS,
      unlinked: unlinked.map((id) => ({ id, sharedWorks: sharedWorks[kws.findIndex((k) => k.id === id)] })),
      apart: detached.map(({ theme, ratio, works, bridged }) => ({ theme, ratio, works, bridged })),
      drift,
      ...(fit ? { fit } : {}),
    },
    links,
  };

  const turns = {};
  for (const [name, spec] of Object.entries(SPECS)) {
    const nodes = kws.map((k) => ({
      id: k.id,
      theme: k.theme,
      r: round1(radius(k.works, view.meta.scale.maxWorks, spec.rMax, spec.rMin)),
      rY: round1(radius(k.perYear, view.meta.scale.maxPerYear, spec.rMax, spec.rMin)),
      text: { en: k.en, zh: k.zh ?? k.en },
      priority: calloutRank.has(k.id) ? 1e6 + k.works : k.works,
      ...(calloutRank.has(k.id) ? { badge: spec.badge } : {}),
    }));
    for (const b of nodes) b.R = Math.max(b.r, b.rY);
    let height;
    const groups = [];
    let shifts = null;
    const shown = nodes.filter((b) => !unlinked.includes(b.id));
    if (method === "cooccurrence") {
      const themeOf = (id) => kws.find((k) => k.id === id).theme;
      const { points: pts, turn } = orientFor(shown.map((b) => ({ id: b.id, ...base.get(b.id) })), spec, themeOf);
      turns[name] = turn;
      const box = fitToBox(pts, spec);
      height = box.height;
      for (const b of shown) {
        const p = box.place(pts.find((q) => q.id === b.id));
        Object.assign(b, { x: p.x, y: p.y, tx: p.x, ty: p.y });
      }
      const res = separate(shown, { gap: spec.gap, bounds: { x0: spec.margin / 2, y0: spec.margin / 2, x1: spec.width - spec.margin / 2, y1: height - spec.margin / 2 } });
      shifts = { max: round1(res.maxShift), overlaps: res.overlaps };
    } else {
      // Packed by theme, in Ripple sector order: side by side on wide screens, stacked on phones.
      const themes = view.themes.filter((t) => shown.some((b) => b.theme === t.id));
      const packs = themes.map((t) => {
        const items = shown.filter((b) => b.theme === t.id).sort((a, b) => b.R - a.R || (a.id < b.id ? -1 : 1));
        const pack = packGroup(items, spec.gap + 3);
        const x0 = Math.min(...pack.map((p) => p.x - p.R));
        const y0 = Math.min(...pack.map((p) => p.y - p.R));
        return { theme: t.id, pack, x0, y0, w: Math.max(...pack.map((p) => p.x + p.R)) - x0, h: Math.max(...pack.map((p) => p.y + p.R)) - y0 };
      });
      const room = name === "wide" ? 80 : 66; // around each pack: its caption and the keyword labels
      const move = (p, ox, oy) => {
        for (const q of p.pack) Object.assign(shown.find((b) => b.id === q.id), { x: q.x + ox, y: q.y + oy });
      };
      if (name === "wide") {
        const gapX = (spec.width - packs.reduce((s, p) => s + p.w, 0)) / (packs.length + 1);
        const hMax = Math.max(...packs.map((p) => p.h));
        let x = gapX;
        for (const p of packs) {
          const top = room + (hMax - p.h) / 2;
          move(p, x - p.x0, top - p.y0);
          groups.push({ theme: p.theme, x: round1(x + p.w / 2), y: round1(top - 16) });
          x += p.w + gapX;
        }
        height = Math.round(hMax + 2 * room);
      } else {
        let y = 0;
        for (const p of packs) {
          const top = y + room;
          move(p, spec.width / 2 - (p.x0 + p.w / 2), top - p.y0);
          groups.push({ theme: p.theme, x: round1(spec.width / 2), y: round1(top - 16) });
          y = top + p.h;
        }
        height = Math.round(y + room);
      }
    }
    // Theme captions (packed layout) are obstacles for keyword labels; sized for the wider language.
    const captionBoxes = groups.map((g) => {
      const t = view.themes.find((x) => x.id === g.theme);
      const w = Math.max(textWidth(t.en, CAPTION_SIZE), textWidth(t.zh, CAPTION_SIZE)) + 16;
      return { x0: g.x - w / 2, x1: g.x + w / 2, y0: g.y - CAPTION_SIZE, y1: g.y + CAPTION_SIZE * 0.6 };
    });
    const notes = [];
    const noteBoxes = [];
    for (const g of detached) {
      const text = {
        en: `${g.t.en} keywords sit apart: of the ${fmt(g.works)} citing works that carry one, ${fmt(g.bridged)} also carry a keyword from another theme.`,
        zh: `${g.t.zh}关键词自成一组：带有其中任一词的 ${fmt(g.works)} 篇施引文献中，有 ${fmt(g.bridged)} 篇同时带有其他主题的关键词。`,
      };
      const placedNote = placeNote({ text, pair: g.pair }, spec, height, shown);
      if (placedNote) {
        notes.push({ theme: g.theme, ...placedNote.note });
        noteBoxes.push(placedNote.box);
      } else report.push(`${lens.padEnd(4)} ${name.padEnd(6)} WARN no room for the "${g.theme} sits apart" caption`);
    }
    const { labels, badges } = labelNodes(shown, spec, height, calloutRank, [...captionBoxes, ...noteBoxes]);
    const placedNodes = {};
    let labelled = 0;
    for (const b of shown) {
      const lab = labels.get(b.id);
      if (lab.en) labelled++;
      const badge = badges.get(b.id);
      placedNodes[b.id] = {
        x: round1(b.x),
        y: round1(b.y),
        r: b.r,
        rY: b.rY,
        label: lab,
        ...(badge ? { badge: [round1(badge.x), round1(badge.y)] } : {}),
      };
    }
    // Unlinked keywords are listed under the map at their size; no position on it.
    for (const b of nodes.filter((x) => unlinked.includes(x.id))) placedNodes[b.id] = { r: b.r, rY: b.rY };
    out[lens][name] = {
      width: spec.width,
      height,
      rMax: spec.rMax,
      rMin: spec.rMin,
      labelSize: spec.labelSize,
      badge: spec.badge,
      noteSize: spec.noteSize,
      ...(name in turns ? { turn: turns[name] } : {}),
      groups,
      notes,
      nodes: placedNodes,
    };
    report.push(
      `${lens.padEnd(4)} ${name.padEnd(6)} ${method} · ${shown.length} on the map${unlinked.length ? `, ${unlinked.length} unlinked (${unlinked.join(", ")})` : ""} · labelled at rest EN ${labelled}/${shown.length} · ${spec.width}×${height}` +
        (shifts ? ` · collision shift max ${shifts.max} units, overlaps ${shifts.overlaps}` : "")
    );
  }

  const m = out[lens].meta;
  report.push(
    `${lens.padEnd(4)} corpus ${N} · ${links.length}/${m.pairs} pairs share ≥ 1 work, ${robustPairs} share ≥ ${PARAMS.robustPairWorks} · ${robust}/${n} keywords have a partner sharing ≥ ${PARAMS.robustPairWorks} → ${method}` +
      (fit
        ? ` · Spearman(assoc. strength, map distance) ${fit.spearmanSimilarityVsDistance} over ${fit.linkedPairs} linked pairs · nearest neighbour is a top-3 partner for ${Math.round(fit.nearestIsTopPartner * 100)}%`
        : "")
  );
  for (const d of drift) report.push(`${lens.padEnd(4)} WARN count drift vs ripple.json: ${d.id} recount ${d.recount}, ripple ${d.ripple}`);
}

console.log(report.join("\n"));
console.log(cacheSummary());
if (DRY_RUN) {
  console.log("Dry run — nothing written.");
} else {
  writeFileSync(OUT_PATH, JSON.stringify(out, null, 1) + "\n");
  console.log(`Wrote ${OUT_PATH}`);
}
