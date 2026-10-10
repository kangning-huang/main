/**
 * Build-time layout for the two alternative Reach views (docs/reach/VIZ-ALT-REPORT.md):
 * A, a beeswarm per theme (x = reach distance), and C, a VOSviewer-style keyword map
 * (distance = co-occurrence in citing works). Pure functions, no Math.random: the same
 * input always gives the same output.
 *
 * Geometry is in SVG user units; y grows downwards.
 */

import { reachFraction, textWidth } from "./ripple-layout.mjs";

const round1 = (v) => Math.round(v * 10) / 10;
const LINE = 1.15; // line height (em) for two-line labels

// ── Geometry ───────────────────────────────────────────────────────────────

const boxHitsBox = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

function boxHitsCircle(b, cx, cy, r) {
  const nx = Math.max(b.x0, Math.min(cx, b.x1));
  const ny = Math.max(b.y0, Math.min(cy, b.y1));
  return (nx - cx) ** 2 + (ny - cy) ** 2 < r * r;
}

/** Distance from (px, py) to the segment [x1, y1]–[x2, y2]. */
function segDist(px, py, [x1, y1, x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

const orient = (ax, ay, bx, by, cx, cy) => Math.sign((bx - ax) * (cy - ay) - (by - ay) * (cx - ax));

/** Proper crossing of two segments (touching end points do not count). */
function segsCross([a, b, c, d], [e, f, g, h]) {
  return orient(a, b, c, d, e, f) * orient(a, b, c, d, g, h) < 0 && orient(e, f, g, h, a, b) * orient(e, f, g, h, c, d) < 0;
}

function segHitsBox(seg, box) {
  const [x1, y1, x2, y2] = seg;
  const inside = (x, y) => x > box.x0 && x < box.x1 && y > box.y0 && y < box.y1;
  if (inside(x1, y1) || inside(x2, y2)) return true;
  const edges = [
    [box.x0, box.y0, box.x1, box.y0],
    [box.x1, box.y0, box.x1, box.y1],
    [box.x1, box.y1, box.x0, box.y1],
    [box.x0, box.y1, box.x0, box.y0],
  ];
  return edges.some((e) => segsCross(seg, e));
}

/** Label box; `y` is the vertical centre of the text block. */
function labelBox(x, y, w, h, anchor, pad = 1.5) {
  const x0 = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
  return { x0: x0 - pad, x1: x0 + w + pad, y0: y - h / 2 - pad, y1: y + h / 2 + pad };
}

/** Clear space between a box and a bubble's edge (0 when they touch or overlap). */
function clearance(box, o) {
  const dx = Math.max(box.x0 - o.x, 0, o.x - box.x1);
  const dy = Math.max(box.y0 - o.y, 0, o.y - box.y1);
  return Math.max(0, Math.hypot(dx, dy) - o.R);
}

// ── Labels ─────────────────────────────────────────────────────────────────

/** One line, plus the balanced two-line split for longer Latin labels. */
function textVariants(text, size) {
  const variants = [{ lines: [text], extra: 0 }];
  const spaces = [...text.matchAll(/ /g)].map((m) => m.index);
  if (text.length >= 14 && spaces.length > 0) {
    let best = null;
    for (const i of spaces) {
      const lines = [text.slice(0, i), text.slice(i + 1)];
      const w = Math.max(...lines.map((l) => textWidth(l, size)));
      if (!best || w < best.w) best = { lines, w };
    }
    variants.push({ lines: best.lines, extra: 2.5 });
  }
  return variants.map((v) => measured(v.lines, size, v.extra));
}

const measured = (lines, size, extra = 0) => ({
  lines,
  extra,
  w: Math.max(...lines.map((l) => textWidth(l, size))),
  h: lines.length === 1 ? size * 1.2 : lines.length * size * LINE + size * 0.05,
});

/** Width an inline callout badge adds in front of a label: the disc plus a small gap. */
const badgeWidth = (r) => 2 * r + 3;

/**
 * Candidate spots around a bubble, each with a cost: touching it first (right, left, the
 * diagonals, above, below), then pushed out with a leader line. `level` keeps leaders
 * within 45° of horizontal.
 */
function ringCandidates(b, v, { leaders, level = false }) {
  const out = [];
  const R = b.R;
  const gap = 3;
  const k = Math.SQRT1_2;
  out.push({ x: b.x + R + gap, y: b.y, anchor: "start", cost: 0 });
  out.push({ x: b.x - R - gap, y: b.y, anchor: "end", cost: 1.2 });
  out.push({ x: b.x + R * k + 1, y: b.y - R * k - v.h / 2 + 2, anchor: "start", cost: 2 });
  out.push({ x: b.x + R * k + 1, y: b.y + R * k + v.h / 2 - 2, anchor: "start", cost: 2.3 });
  out.push({ x: b.x - R * k - 1, y: b.y - R * k - v.h / 2 + 2, anchor: "end", cost: 2.6 });
  out.push({ x: b.x - R * k - 1, y: b.y + R * k + v.h / 2 - 2, anchor: "end", cost: 2.9 });
  out.push({ x: b.x, y: b.y - R - gap - v.h / 2, anchor: "middle", cost: 3.2 });
  out.push({ x: b.x, y: b.y + R + gap - 1 + v.h / 2, anchor: "middle", cost: 3.5 });
  for (const extra of leaders) {
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      const ux = Math.cos(a);
      const uy = Math.sin(a);
      if (level && Math.abs(uy) > 0.75) continue;
      const ex = b.x + ux * (R + extra);
      const ey = b.y + uy * (R + extra);
      const anchor = ux > 0.35 ? "start" : ux < -0.35 ? "end" : "middle";
      const x = anchor === "start" ? ex + 2 : anchor === "end" ? ex - 2 : ex;
      const y = anchor === "middle" ? ey + (uy < 0 ? -v.h / 2 - 1 : v.h / 2 + 1) : ey;
      // Prefer level leaders: a label reads best beside its bubble.
      out.push({ x, y, anchor, cost: 6 + extra * 0.12 + Math.abs(uy) * 2, leader: [b.x + ux * (R + 1), b.y + uy * (R + 1), ex, ey] });
    }
  }
  return out;
}

/**
 * Label placement, highest priority first; each label takes its cheapest free spot. A
 * repair pass then gives an unlabelled bubble a spot when the one or two labels in its
 * way can each move somewhere else that is free.
 * nodes: [{id, x, y, R, text: {en, zh}, priority, badge?: radius}]; a node with `badge`
 * gets its numbered disc in front of the text, between the text and the bubble.
 * opts.bounds {x0, y0, x1, y1} · opts.obstacles [box] · opts.extra(b, v) → more candidates
 * Returns {labels: Map id → {en, zh}, taken: [{box, leader}]}. A label is
 * {x, y, anchor, lines?, leader?, badge?: [x, y]} (x, anchor place the text) or null
 * (shown on focus only).
 */
export function placeLabels(nodes, { size, bounds, obstacles = [], leaders = [10, 18, 28, 40, 54], leaderClear = 6, level, extra }) {
  const labels = new Map(nodes.map((n) => [n.id, { en: null, zh: null }]));
  const taken = [];
  const order = [...nodes].sort((a, b) => b.priority - a.priority || (a.id < b.id ? -1 : 1));
  // Without a leader, a label must be unmistakably its own bubble's: no other bubble may sit
  // as close beside or under the text, or as close to the label's point nearest its bubble.
  const ambiguous = (b, box) => {
    const own = clearance(box, b);
    const ax = Math.max(box.x0, Math.min(b.x, box.x1));
    const ay = Math.max(box.y0, Math.min(b.y, box.y1));
    return nodes.some((o) => {
      if (o.id === b.id) return false;
      const along = (o.x >= box.x0 && o.x <= box.x1) || (o.y >= box.y0 && o.y <= box.y1);
      if (along && clearance(box, o) < own + 3) return true;
      return Math.hypot(ax - o.x, ay - o.y) - o.R < own + 3;
    });
  };
  // Fixed obstacles: the bounds, other boxes, every bubble; checked once per candidate.
  const fixedHit = (b, c, box) => {
    if (box.x0 < bounds.x0 || box.x1 > bounds.x1 || box.y0 < bounds.y0 || box.y1 > bounds.y1) return true;
    if (obstacles.some((q) => boxHitsBox(box, q))) return true;
    if (nodes.some((o) => o.id !== b.id && boxHitsCircle(box, o.x, o.y, o.R + 1.5))) return true;
    if (boxHitsCircle(box, b.x, b.y, b.R + 0.5)) return true;
    if (c.leader) {
      if (nodes.some((o) => o.id !== b.id && segDist(o.x, o.y, c.leader) < o.R + 1.5)) return true;
      if (obstacles.some((q) => segHitsBox(c.leader, q))) return true;
      // A label at the end of a leader must not nestle against some other bubble.
      if (nodes.some((o) => o.id !== b.id && clearance(box, o) < leaderClear)) return true;
    } else if (ambiguous(b, box)) {
      return true;
    }
    return false;
  };
  // Two placed labels clash if their boxes overlap or a leader crosses the other label or leader.
  const clash = (c, p) =>
    boxHitsBox(c.box, p.box) ||
    (p.leader && segHitsBox(p.leader, c.box)) ||
    (c.leader && (segHitsBox(c.leader, p.box) || (p.leader && segsCross(c.leader, p.leader))));
  for (const lang of ["en", "zh"]) {
    const cands = new Map();
    for (const b of nodes) {
      const list = [];
      const bw = b.badge ? badgeWidth(b.badge) : 0;
      for (const t of textVariants(b.text[lang], size)) {
        const v = { ...t, w: t.w + bw };
        const raw = [...ringCandidates(b, v, { leaders, level }), ...(extra ? extra(b, v) : [])];
        for (const c of raw) {
          const box = labelBox(c.x, c.y, v.w, v.h, c.anchor);
          if (!fixedHit(b, c, box)) list.push({ ...c, v, box, cost: c.cost + v.extra });
        }
      }
      cands.set(b.id, list.sort((p, q) => p.cost - q.cost));
    }
    const placed = new Map();
    const blockers = (c, skip) => [...placed].filter(([id, p]) => id !== skip && clash(c, p)).map(([id]) => id);
    for (const b of order) {
      const c = cands.get(b.id).find((x) => blockers(x).length === 0);
      if (c) placed.set(b.id, c);
    }
    // Repair: try each spot that one or two placed labels block; keep it if they can all move.
    for (const b of order) {
      if (placed.has(b.id)) continue;
      for (const c of cands.get(b.id)) {
        const bl = blockers(c);
        if (bl.length === 0 || bl.length > 2) continue;
        const saved = bl.map((id) => [id, placed.get(id)]);
        for (const id of bl) placed.delete(id);
        placed.set(b.id, c);
        let ok = true;
        for (const [id, old] of saved) {
          const alt = cands.get(id).find((a) => a !== old && blockers(a, id).length === 0);
          if (!alt) {
            ok = false;
            break;
          }
          placed.set(id, alt);
        }
        if (ok) break;
        placed.delete(b.id);
        for (const [id, old] of saved) placed.set(id, old);
      }
    }
    for (const [id, c] of placed) {
      taken.push({ box: c.box, leader: c.leader });
      const node = nodes.find((n) => n.id === id);
      let { x, anchor } = c;
      let badge;
      if (node.badge) {
        const r = node.badge;
        const bw = badgeWidth(r);
        if (anchor === "start") {
          badge = [x + r, c.y];
          x += bw;
        } else if (anchor === "end") {
          badge = [x - r, c.y];
          x -= bw;
        } else {
          const left = x - c.v.w / 2;
          badge = [left + r, c.y];
          x = left + bw;
          anchor = "start";
        }
      }
      labels.get(id)[lang] = {
        x: round1(x),
        y: round1(c.y),
        anchor,
        ...(c.v.lines.length > 1 ? { lines: c.v.lines } : {}),
        ...(c.leader ? { leader: c.leader.map(round1) } : {}),
        ...(badge ? { badge: badge.map(round1) } : {}),
      };
    }
  }
  return { labels, taken };
}

/**
 * Fallback for a callout keyword left without a label in some language: its badge goes in
 * the first free spot touching the bubble (upper right first), clear of every bubble,
 * label and leader.
 */
export function placeBadges(nodes, { labels, taken }, { calloutRank, r, bounds }) {
  const badges = new Map();
  for (const b of nodes) {
    if (!calloutRank.has(b.id)) continue;
    if (labels.get(b.id).en?.badge && labels.get(b.id).zh?.badge) continue;
    let spot = null;
    search: for (const dist of [b.R + r - 2, b.R + r + 2]) {
      for (const deg of [-45, -135, 45, 135, -90, 90, 0, 180, -22.5, -67.5, 22.5, 67.5]) {
        const a = (deg * Math.PI) / 180;
        const x = b.x + Math.cos(a) * dist;
        const y = b.y + Math.sin(a) * dist;
        if (x - r < bounds.x0 || x + r > bounds.x1 || y - r < bounds.y0 || y + r > bounds.y1) continue;
        if (nodes.some((o) => o.id !== b.id && Math.hypot(o.x - x, o.y - y) < o.R + r + 1)) continue;
        if (taken.some((t) => boxHitsCircle(t.box, x, y, r + 1) || (t.leader && segDist(x, y, t.leader) < r + 1))) continue;
        spot = { x, y };
        break search;
      }
    }
    badges.set(b.id, spot ?? { x: b.x + Math.SQRT1_2 * (b.R + r - 2), y: b.y - Math.SQRT1_2 * (b.R + r - 2) });
  }
  return badges;
}

// ── A: beeswarm rows ───────────────────────────────────────────────────────

/**
 * One beeswarm row per theme. x = mean reach distance, on the Ripple's square-root scale,
 * and exact for every bubble; only y moves, to keep bubbles apart. Labels sit beside a
 * bubble when there is room, else in lanes above or below the row with a short leader.
 * keywords: [{id, theme, dMean, works, r, rY, text: {en, zh}}] (r, rY at this layout's scale)
 */
export function layoutBeeswarm({ themes, keywords, maxD, spec, calloutRank }) {
  const S = spec;
  const xOf = (d) => S.x0 + (S.x1 - S.x0) * reachFraction(d, maxD);
  const guideXs = Array.from({ length: maxD + 1 }, (_, d) => xOf(d));
  const rows = [];
  const positions = new Map();
  let maxShift = 0;
  for (const t of themes) {
    const mine = keywords.filter((k) => k.theme === t.id).sort((a, b) => b.works - a.works || (a.id < b.id ? -1 : 1));
    if (mine.length === 0) {
      rows.push({ theme: t.id, height: 0 });
      continue;
    }
    const placed = [];
    for (const k of mine) {
      const x = xOf(k.dMean);
      const R = Math.max(k.r, k.rY);
      let y = 0;
      for (let step = 0; step < 2000; step++) {
        const off = Math.ceil(step / 2) * 0.5 * (step % 2 === 1 ? 1 : -1);
        if (placed.every((p) => Math.hypot(p.x - x, p.y - off) >= p.R + R + S.gap)) {
          y = off;
          break;
        }
      }
      maxShift = Math.max(maxShift, Math.abs(x - xOf(k.dMean)));
      // Callout keywords are named in "Worth a look": they pick label spots first, badge in front.
      const callout = calloutRank.has(k.id);
      placed.push({ id: k.id, x, y, R, text: k.text, priority: callout ? 1e6 + k.works : k.works, ...(callout ? { badge: S.badge } : {}) });
    }
    const top = Math.min(...placed.map((p) => p.y - p.R));
    const bot = Math.max(...placed.map((p) => p.y + p.R));
    const h = S.labelSize * 1.2;
    const bounds = { x0: 1, x1: S.width - 1, y0: top - 3 * (h + S.laneGap) - 6, y1: bot + 3 * (h + S.laneGap) + 6 };
    // Lanes above and below the swarm. The label starts or ends at a vertical leader from
    // the bubble, or sits centred a short slide away.
    const lanes = (b, v) => {
      const out = [];
      for (let i = 0; i < 3; i++) {
        for (const dir of [-1, 1]) {
          const y = dir < 0 ? top - S.laneGap - v.h / 2 - i * (v.h + S.laneGap) : bot + S.laneGap + v.h / 2 + i * (v.h + S.laneGap);
          const edge = y - dir * (v.h / 2 + 1);
          const fromY = b.y + dir * (b.R + 1);
          if (dir * (edge - fromY) <= 2) continue;
          const base = 8 + i * 3 + (dir > 0 ? 0.5 : 0) + Math.abs(edge - fromY) * 0.08;
          // A vertical leader on a guide line would vanish into it.
          const onGuide = guideXs.some((gx) => Math.abs(gx - b.x) < 3);
          if (!onGuide) {
            out.push({ x: b.x - 5, y, anchor: "start", cost: base, leader: [b.x, fromY, b.x, edge] });
            out.push({ x: b.x + 5, y, anchor: "end", cost: base + 0.3, leader: [b.x, fromY, b.x, edge] });
          }
          for (const shift of onGuide ? [12, 24, 36] : [0, 12, -12, 24, -24, 36, -36]) {
            const len = Math.hypot(shift, edge - fromY);
            out.push({ x: b.x + shift, y, anchor: "middle", cost: 8.4 + i * 3 + (dir > 0 ? 0.5 : 0) + len * 0.08 + Math.abs(shift) * 0.05, leader: [b.x, fromY, b.x + shift, edge] });
          }
        }
      }
      return out;
    };
    const placedLabels = placeLabels(placed, { size: S.labelSize, bounds, leaders: [8, 16, 26], level: true, extra: lanes });
    const { labels } = placedLabels;
    const badges = placeBadges(placed, placedLabels, { calloutRank, r: S.badge, bounds: { ...bounds, x0: 0, x1: S.width } });
    let y0 = top;
    let y1 = bot;
    for (const p of placed) {
      for (const lang of ["en", "zh"]) {
        const l = labels.get(p.id)[lang];
        if (!l) continue;
        const n = l.lines?.length ?? 1;
        const lh = n === 1 ? h : n * S.labelSize * LINE;
        y0 = Math.min(y0, l.y - lh / 2 - 1);
        y1 = Math.max(y1, l.y + lh / 2 + 1);
      }
    }
    for (const b of badges.values()) {
      y0 = Math.min(y0, b.y - S.badge - 1);
      y1 = Math.max(y1, b.y + S.badge + 1);
    }
    const shift = S.pad - y0;
    const mv = (l) =>
      l
        ? {
            ...l,
            y: round1(l.y + shift),
            ...(l.leader ? { leader: l.leader.map((v, i) => round1(i % 2 ? v + shift : v)) } : {}),
            ...(l.badge ? { badge: [l.badge[0], round1(l.badge[1] + shift)] } : {}),
          }
        : null;
    for (const p of placed) {
      const lab = labels.get(p.id);
      const badge = badges.get(p.id);
      positions.set(p.id, {
        x: round1(p.x),
        y: round1(p.y + shift),
        label: { en: mv(lab.en), zh: mv(lab.zh) },
        ...(badge ? { badge: [round1(badge.x), round1(badge.y + shift)] } : {}),
      });
    }
    rows.push({ theme: t.id, height: round1(y1 - y0 + 2 * S.pad) });
  }
  const guides = [];
  for (let d = 0; d <= maxD; d++) guides.push({ d, x: round1(xOf(d)) });
  return { rows, positions, guides, stats: { maxXShift: round1(maxShift) } };
}

// ── C: co-occurrence map ───────────────────────────────────────────────────

/** Small deterministic PRNG (mulberry32). */
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Energy of a layout in the VOS family of models (van Eck & Waltman; Noack's (a, r)-energy):
 * Σ s_ij d_ij^a / a − Σ ρ(d_ij) over all pairs, with ρ(d) = ln d when r = 0, else d^r / r.
 * Attraction 2 / repulsion 1 is VOSviewer's default VOS mapping. Repulsion 0 (logarithmic)
 * keeps the order of distances but stops keywords with one weak tie being pushed to the edge.
 */
function energy(S, X, a, r) {
  let v = 0;
  for (let i = 0; i < X.length; i++)
    for (let j = i + 1; j < X.length; j++) {
      const d = Math.hypot(X[i][0] - X[j][0], X[i][1] - X[j][1]) || 1e-9;
      v += (S[i][j] * d ** a) / a - (r === 0 ? Math.log(d) : d ** r / r);
    }
  return v;
}

function gradient(S, X, a, r) {
  const G = X.map(() => [0, 0]);
  for (let i = 0; i < X.length; i++)
    for (let j = i + 1; j < X.length; j++) {
      const ux = X[i][0] - X[j][0];
      const uy = X[i][1] - X[j][1];
      const d = Math.hypot(ux, uy) || 1e-9;
      const f = S[i][j] * d ** (a - 2) - d ** (r - 2);
      G[i][0] += f * ux;
      G[i][1] += f * uy;
      G[j][0] -= f * ux;
      G[j][1] -= f * uy;
    }
  return G;
}

/**
 * Map a connected similarity matrix S (association strength) by minimising the energy above:
 * gradient descent with a backtracking step from seeded random starts; the lowest energy wins.
 */
export function vosLayout(S, { attraction = 2, repulsion = 0, starts = 30, iterations = 5000, seed = 20261010 } = {}) {
  const n = S.length;
  if (n === 1) return { X: [[0, 0]], energy: 0 };
  const rand = prng(seed);
  let best = null;
  for (let s = 0; s < starts; s++) {
    let X = Array.from({ length: n }, () => [rand() * 2 - 1, rand() * 2 - 1]);
    let E = energy(S, X, attraction, repulsion);
    let step = 0.05;
    for (let it = 0; it < iterations && step > 1e-10; it++) {
      const G = gradient(S, X, attraction, repulsion);
      for (;;) {
        const Y = X.map((p, i) => [p[0] - step * G[i][0], p[1] - step * G[i][1]]);
        const E2 = energy(S, Y, attraction, repulsion);
        if (E2 < E) {
          const gain = E - E2;
          X = Y;
          E = E2;
          step *= 1.25;
          if (gain <= 1e-12 * Math.abs(E)) it = iterations;
          break;
        }
        step *= 0.5;
        if (step <= 1e-10) break;
      }
    }
    if (!best || E < best.energy - 1e-9) best = { X, energy: E };
  }
  return best;
}

/**
 * Push overlapping bubbles apart while a weak spring holds each near its mapped spot,
 * inside the box. Returns the largest displacement from a mapped spot and any overlaps left.
 */
export function separate(nodes, { gap, bounds, iterations = 600, spring = 0.02 }) {
  for (let it = 0; it < iterations; it++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const p = nodes[i];
        const q = nodes[j];
        let dx = q.x - p.x;
        let dy = q.y - p.y;
        let d = Math.hypot(dx, dy);
        const min = p.R + q.R + gap;
        if (d >= min) continue;
        if (d < 1e-6) {
          dx = Math.cos(i * 7 + j);
          dy = Math.sin(i * 7 + j);
          d = 1;
        }
        const push = (min - d) / 2 + 0.01;
        p.x -= (dx / d) * push;
        p.y -= (dy / d) * push;
        q.x += (dx / d) * push;
        q.y += (dy / d) * push;
        moved = true;
      }
    }
    for (const b of nodes) {
      b.x += (b.tx - b.x) * spring;
      b.y += (b.ty - b.y) * spring;
      b.x = Math.max(bounds.x0 + b.R, Math.min(bounds.x1 - b.R, b.x));
      b.y = Math.max(bounds.y0 + b.R, Math.min(bounds.y1 - b.R, b.y));
    }
    if (!moved && it > 20) break;
  }
  let maxShift = 0;
  let overlaps = 0;
  for (const b of nodes) maxShift = Math.max(maxShift, Math.hypot(b.x - b.tx, b.y - b.ty));
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++)
      if (Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) < nodes[i].R + nodes[j].R + 0.5) overlaps++;
  return { maxShift, overlaps };
}

/**
 * Pack one theme's bubbles around its largest (fallback layout when co-occurrence is too
 * thin): each next bubble takes the free spot touching an earlier one that is closest
 * to the group's centre. Positions carry no meaning beyond "same theme".
 */
export function packGroup(items, gap) {
  const placed = [];
  for (const it of items) {
    if (placed.length === 0) {
      placed.push({ ...it, x: 0, y: 0 });
      continue;
    }
    const cx = placed.reduce((s, p) => s + p.x, 0) / placed.length;
    const cy = placed.reduce((s, p) => s + p.y, 0) / placed.length;
    let best = null;
    for (const p of placed) {
      for (let a = 0; a < 72; a++) {
        const ang = (a * Math.PI) / 36;
        const x = p.x + Math.cos(ang) * (p.R + it.R + gap);
        const y = p.y + Math.sin(ang) * (p.R + it.R + gap);
        if (placed.some((q) => Math.hypot(q.x - x, q.y - y) < q.R + it.R + gap - 0.01)) continue;
        const score = Math.hypot(x - cx, (y - cy) * 1.3); // a little wider than tall
        if (!best || score < best.score - 1e-9) best = { x, y, score };
      }
    }
    placed.push({ ...it, x: best.x, y: best.y });
  }
  return placed;
}

export { round1 };
