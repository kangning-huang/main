/**
 * Build-time geometry for the Constellation Map (docs/reach/CONSTELLATION-MAP.md):
 * alignment of the 2D projection, the drawing frame, star nudges, region tints and the
 * three label passes (stars, then region names, then keywords). Pure functions, no
 * Math.random: the same input always gives the same output.
 *
 * Geometry is in SVG user units; y grows downwards.
 */

import { placeLabels, separate, round1 } from "./reach-alt-layout.mjs";
import { textWidth } from "./ripple-layout.mjs";

export { separate, round1 };

const mean = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

// ── Alignment ──────────────────────────────────────────────────────────────

/**
 * Orthogonal Procrustes with uniform scale: the rotation (or reflection), scale and shift
 * that best map `src` onto `dst` (same rows, same order). Returns the mapping and the
 * root-mean-square residual in `dst` units.
 */
export function procrustes(src, dst) {
  const ma = mean(src);
  const mb = mean(dst);
  const a = src.map((p) => [p[0] - ma[0], p[1] - ma[1]]);
  const b = dst.map((p) => [p[0] - mb[0], p[1] - mb[1]]);
  const norm = a.reduce((s, p) => s + p[0] ** 2 + p[1] ** 2, 0) || 1;
  let best = null;
  for (const flip of [1, -1]) {
    const af = a.map(([x, y]) => [x * flip, y]);
    let sc = 0;
    let ss = 0;
    for (let i = 0; i < af.length; i++) {
      sc += af[i][0] * b[i][0] + af[i][1] * b[i][1];
      ss += af[i][0] * b[i][1] - af[i][1] * b[i][0];
    }
    const theta = Math.atan2(ss, sc);
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const scale = (sc * c + ss * s) / norm;
    const map = ([x, y]) => {
      const u = (x - ma[0]) * flip;
      const v = y - ma[1];
      return [scale * (c * u - s * v) + mb[0], scale * (s * u + c * v) + mb[1]];
    };
    const rms = Math.sqrt(src.reduce((acc, p, i) => {
      const q = map(p);
      return acc + (q[0] - dst[i][0]) ** 2 + (q[1] - dst[i][1]) ** 2;
    }, 0) / src.length);
    if (!best || rms < best.rms - 1e-12) best = { map, rms, flip, theta, scale };
  }
  return best;
}

/**
 * Orientation when there is no earlier layout to align to: principal axis horizontal,
 * then mirrored so the `left` points' centroid sits left and the `top` points' centroid
 * sits on top. Axes carry no meaning; this only makes a first run reproducible.
 */
export function canonical(points, { left = [], top = [] } = {}) {
  const m = mean(points);
  const c = points.map((p) => [p[0] - m[0], p[1] - m[1]]);
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const [x, y] of c) {
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
  }
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const cs = Math.cos(-theta);
  const sn = Math.sin(-theta);
  let out = c.map(([x, y]) => [cs * x - sn * y, sn * x + cs * y]);
  const centroid = (idx) => (idx.length ? mean(idx.map((i) => out[i])) : [0, 0]);
  if (centroid(left)[0] > 0) out = out.map(([x, y]) => [-x, y]);
  if (centroid(top)[1] > 0) out = out.map(([x, y]) => [x, -y]);
  return out;
}

/**
 * Close the empty gutters between regions: UMAP's distances between clusters carry no
 * meaning, so a region sitting far from every other is slid, rigidly (its own shape and
 * every distance inside it kept), toward its nearest neighbour until the gap between their
 * closest keywords is at most `gap`. Smallest regions move first. Returns the new points
 * and how far each region moved.
 */
export function closeGutters(points, groups, { gap, iterations = 6 }) {
  const out = points.map((p) => [...p]);
  const ids = [...new Set(groups)];
  const members = new Map(ids.map((g) => [g, out.map((_, i) => i).filter((i) => groups[i] === g)]));
  const moved = new Map(ids.map((g) => [g, 0]));
  const order = [...ids].sort((a, b) => members.get(a).length - members.get(b).length || (a < b ? -1 : 1));
  for (let it = 0; it < iterations; it++) {
    let any = false;
    for (const g of order) {
      const mine = members.get(g);
      let best = null;
      for (const i of mine) {
        for (let j = 0; j < out.length; j++) {
          if (groups[j] === g) continue;
          const d = Math.hypot(out[i][0] - out[j][0], out[i][1] - out[j][1]);
          if (!best || d < best.d) best = { d, i, j };
        }
      }
      if (!best || best.d <= gap + 1e-9) continue;
      const ux = (out[best.j][0] - out[best.i][0]) / best.d;
      const uy = (out[best.j][1] - out[best.i][1]) / best.d;
      const step = best.d - gap;
      for (const i of mine) {
        out[i][0] += ux * step;
        out[i][1] += uy * step;
      }
      moved.set(g, moved.get(g) + step);
      any = true;
    }
    if (!any) break;
  }
  return { points: out, moved };
}

/**
 * The rotation that lets the points fill a width × (≤ maxHeight) frame at the largest
 * scale (3° steps). Axes mean nothing, so a first layout may as well use the space.
 */
export function bestTurn(points, { width, margin, minHeight, maxHeight }) {
  const m = mean(points);
  const iw = width - margin.left - margin.right;
  let best = null;
  for (let deg = 0; deg < 180; deg += 3) {
    const t = (deg * Math.PI) / 180;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const r = points.map(([x, y]) => [c * (x - m[0]) - s * (y - m[1]), s * (x - m[0]) + c * (y - m[1])]);
    const dx = Math.max(...r.map((p) => p[0])) - Math.min(...r.map((p) => p[0])) || 1;
    const dy = Math.max(...r.map((p) => p[1])) - Math.min(...r.map((p) => p[1])) || 1;
    const h = Math.min(maxHeight, Math.max(minHeight, iw * (dy / dx) + margin.top + margin.bottom));
    const scale = Math.min(iw / dx, (h - margin.top - margin.bottom) / dy);
    if (!best || scale > best.scale + 1e-9) best = { deg, scale };
  }
  return best.deg;
}

/** Rotate points by `deg` about their mean. */
export function turn(points, deg) {
  const m = mean(points);
  const t = (deg * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  return points.map(([x, y]) => [c * (x - m[0]) - s * (y - m[1]) + m[0], s * (x - m[0]) + c * (y - m[1]) + m[1]]);
}

/** Mirrors that put the `left` group's centroid left of centre and the `top` group's above it. */
export function mirrorFor(points, { left = [], top = [] }) {
  const m = mean(points);
  const centroid = (idx) => (idx.length ? mean(idx.map((i) => points[i])) : m);
  return { fx: centroid(left)[0] > m[0] ? -1 : 1, fy: centroid(top)[1] > m[1] ? -1 : 1 };
}

export function mirror(points, { fx, fy }) {
  const m = mean(points);
  return points.map(([x, y]) => [m[0] + fx * (x - m[0]), m[1] + fy * (y - m[1])]);
}

/** Frame height for a W-wide drawing that keeps the projection's aspect ratio. */
export function frameHeight(points, { width, margin, minHeight, maxHeight }) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const dx = Math.max(...xs) - Math.min(...xs) || 1;
  const dy = Math.max(...ys) - Math.min(...ys) || 1;
  const inner = width - margin.left - margin.right;
  return Math.round(Math.min(maxHeight, Math.max(minHeight, inner * (dy / dx) + margin.top + margin.bottom)));
}

/** Uniform scale + shift into the frame's inner box, centred. */
export function fitToFrame(points, { width, height, margin }) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const dx = Math.max(...xs) - x0 || 1;
  const dy = Math.max(...ys) - y0 || 1;
  const iw = width - margin.left - margin.right;
  const ih = height - margin.top - margin.bottom;
  const scale = Math.min(iw / dx, ih / dy);
  const ox = margin.left + (iw - dx * scale) / 2;
  const oy = margin.top + (ih - dy * scale) / 2;
  return { scale, map: ([x, y]) => [ox + (x - x0) * scale, oy + (y - y0) * scale] };
}

/** Mean distance from each point to its nearest neighbour: the map's "keyword-step". */
export function meanNearest(points) {
  if (points.length < 2) return 1;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    let best = Infinity;
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      best = Math.min(best, Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1]));
    }
    sum += best;
  }
  return sum / points.length;
}

// ── Stars ──────────────────────────────────────────────────────────────────

/**
 * Nudge stars off keyword discs and apart from one another; a spring holds each star at
 * its landing point. Discs never move. Returns the largest nudge (in units).
 */
export function nudgeStars(stars, discs, { starR, gap, bounds, iterations = 400, spring = 0.06 }) {
  for (const s of stars) {
    s.tx = s.x;
    s.ty = s.y;
  }
  for (let it = 0; it < iterations; it++) {
    let moved = false;
    for (const s of stars) {
      for (const d of discs) {
        const dx = s.x - d.x;
        const dy = s.y - d.y;
        const dist = Math.hypot(dx, dy);
        const min = d.R + starR + gap;
        if (dist >= min) continue;
        const ux = dist > 1e-6 ? dx / dist : Math.cos(s.tx + d.x);
        const uy = dist > 1e-6 ? dy / dist : Math.sin(s.ty + d.y);
        s.x += ux * (min - dist + 0.01);
        s.y += uy * (min - dist + 0.01);
        moved = true;
      }
    }
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const p = stars[i];
        const q = stars[j];
        let dx = q.x - p.x;
        let dy = q.y - p.y;
        let dist = Math.hypot(dx, dy);
        const min = 2 * starR + gap * 2;
        if (dist >= min) continue;
        if (dist < 1e-6) {
          dx = Math.cos(i * 7 + j);
          dy = Math.sin(i * 7 + j);
          dist = 1;
        }
        const push = (min - dist) / 2 + 0.01;
        p.x -= (dx / dist) * push;
        p.y -= (dy / dist) * push;
        q.x += (dx / dist) * push;
        q.y += (dy / dist) * push;
        moved = true;
      }
    }
    for (const s of stars) {
      s.x += (s.tx - s.x) * spring;
      s.y += (s.ty - s.y) * spring;
      s.x = Math.max(bounds.x0 + starR, Math.min(bounds.x1 - starR, s.x));
      s.y = Math.max(bounds.y0 + starR, Math.min(bounds.y1 - starR, s.y));
    }
    if (!moved && it > 20) break;
  }
  let maxShift = 0;
  for (const s of stars) maxShift = Math.max(maxShift, Math.hypot(s.x - s.tx, s.y - s.ty));
  return maxShift;
}

/** Five-point star polygon (outer radius r, inner 0.45 r), first point straight up. */
export function starPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${round1(cx + rad * Math.cos(a))},${round1(cy + rad * Math.sin(a))}`);
  }
  return pts.join(" ");
}

// ── Regions ────────────────────────────────────────────────────────────────

/**
 * The region's core: discs within `spread` × the median distance from the region's median
 * point. A keyword the projection put among another region's keywords stays outside its
 * own tint (in its own colour) instead of stretching the tint across the map.
 */
export function regionCore(discs, { spread = 2.5, floor = 40 } = {}) {
  if (discs.length <= 2) return discs;
  const med = (xs) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const mx = med(discs.map((d) => d.x));
  const my = med(discs.map((d) => d.y));
  const dist = discs.map((d) => Math.hypot(d.x - mx, d.y - my));
  const cut = Math.max(spread * med(dist), floor);
  return discs.filter((_, i) => dist[i] <= cut);
}

/** Smallest ellipse holding every point (Khachiyan's algorithm, 2D). */
function mvee(points, tol = 1e-4, maxIter = 2000) {
  const n = points.length;
  let u = new Array(n).fill(1 / n);
  const inv3 = (m) => {
    const [a, b, c, d, e, f, g, h, i] = m;
    const A = e * i - f * h;
    const B = -(d * i - f * g);
    const C = d * h - e * g;
    const det = a * A + b * B + c * C;
    return [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map((v) => v / det);
  };
  for (let it = 0; it < maxIter; it++) {
    const X = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let k = 0; k < n; k++) {
      const q = [points[k][0], points[k][1], 1];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) X[r * 3 + c] += u[k] * q[r] * q[c];
    }
    const Xi = inv3(X);
    let j = 0;
    let Mj = -Infinity;
    for (let k = 0; k < n; k++) {
      const q = [points[k][0], points[k][1], 1];
      let m = 0;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) m += q[r] * Xi[r * 3 + c] * q[c];
      if (m > Mj) {
        Mj = m;
        j = k;
      }
    }
    const step = (Mj - 3) / (3 * (Mj - 1));
    const next = u.map((v) => (1 - step) * v);
    next[j] += step;
    const change = Math.hypot(...next.map((v, k) => v - u[k]));
    u = next;
    if (change < tol) break;
  }
  const cx = u.reduce((s, v, k) => s + v * points[k][0], 0);
  const cy = u.reduce((s, v, k) => s + v * points[k][1], 0);
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let k = 0; k < n; k++) {
    sxx += u[k] * (points[k][0] - cx) ** 2;
    syy += u[k] * (points[k][1] - cy) ** 2;
    sxy += u[k] * (points[k][0] - cx) * (points[k][1] - cy);
  }
  // Shape matrix S = 2 · cov (2D): the ellipse is (p − c)ᵀ S⁻¹ (p − c) ≤ 1.
  const tr = 2 * (sxx + syy);
  const det = 4 * (sxx * syy - sxy * sxy);
  const l1 = tr / 2 + Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l2 = Math.max(1e-9, tr - l1);
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  return { cx, cy, rx: Math.sqrt(l1), ry: Math.sqrt(l2), theta };
}

/**
 * A soft tint around a region's core discs: the smallest ellipse holding every disc plus
 * padding, widened to at least `minRatio` of its length so it reads as a patch, not a band.
 */
export function regionEllipse(discs, { pad, minRx, minRy, minRatio = 0.5 }) {
  const pts = [];
  for (const d of discs) for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    pts.push([d.x + Math.cos(a) * (d.R + pad), d.y + Math.sin(a) * (d.R + pad)]);
  }
  const e = mvee(pts);
  const ry = Math.max(e.ry, minRatio * e.rx, minRy);
  return { cx: round1(e.cx), cy: round1(e.cy), rx: round1(Math.max(e.rx, minRx)), ry: round1(ry), angle: round1((e.theta * 180) / Math.PI) };
}

/** Is (x, y) inside ellipse e? */
export function insideEllipse(e, x, y, grow = 0) {
  const t = (-e.angle * Math.PI) / 180;
  const dx = x - e.cx;
  const dy = y - e.cy;
  const u = dx * Math.cos(t) - dy * Math.sin(t);
  const v = dx * Math.sin(t) + dy * Math.cos(t);
  return (u / (e.rx + grow)) ** 2 + (v / (e.ry + grow)) ** 2 <= 1;
}

/** Axis-aligned extent of a rotated ellipse: half-width and half-height. */
export function ellipseExtent(e) {
  const t = (e.angle * Math.PI) / 180;
  return {
    hx: Math.sqrt((e.rx * Math.cos(t)) ** 2 + (e.ry * Math.sin(t)) ** 2),
    hy: Math.sqrt((e.rx * Math.sin(t)) ** 2 + (e.ry * Math.cos(t)) ** 2),
  };
}

// ── Collision primitives ───────────────────────────────────────────────────

const boxHitsBox = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
function boxHitsCircle(b, cx, cy, r) {
  const nx = Math.max(b.x0, Math.min(cx, b.x1));
  const ny = Math.max(b.y0, Math.min(cy, b.y1));
  return (nx - cx) ** 2 + (ny - cy) ** 2 < r * r;
}
/** Text box for a label whose (x, y) is the anchor point and vertical centre. */
export function textBox(x, y, w, h, anchor, pad = 2) {
  const x0 = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
  return { x0: x0 - pad, x1: x0 + w + pad, y0: y - h / 2 - pad, y1: y + h / 2 + pad };
}
export const circleBox = (x, y, r) => ({ x0: x - r, x1: x + r, y0: y - r, y1: y + r });

// ── Labels ─────────────────────────────────────────────────────────────────

/** Distance from (px, py) to the segment [x1, y1, x2, y2]. */
function segDist(px, py, [x1, y1, x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
const orient = (ax, ay, bx, by, cx, cy) => Math.sign((bx - ax) * (cy - ay) - (by - ay) * (cx - ax));
function segsCross([a, b, c, d], [e, f, g, h]) {
  return orient(a, b, c, d, e, f) * orient(a, b, c, d, g, h) < 0 && orient(e, f, g, h, a, b) * orient(e, f, g, h, c, d) < 0;
}
function segHitsBox(seg, box) {
  const [x1, y1, x2, y2] = seg;
  const inside = (x, y) => x > box.x0 && x < box.x1 && y > box.y0 && y < box.y1;
  if (inside(x1, y1) || inside(x2, y2)) return true;
  return [
    [box.x0, box.y0, box.x1, box.y0],
    [box.x1, box.y0, box.x1, box.y1],
    [box.x1, box.y1, box.x0, box.y1],
    [box.x0, box.y1, box.x0, box.y0],
  ].some((e) => segsCross(seg, e));
}
/** Small boxes along a segment, so box-only placers can steer clear of a line. */
export function segmentBoxes([x1, y1, x2, y2], half = 2, step = 6) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const out = [];
  for (let t = 0; t <= len; t += step) out.push(circleBox(x1 + ((x2 - x1) * t) / len, y1 + ((y2 - y1) * t) / len, half));
  return out;
}

/**
 * Star labels first, one spot per star for both languages (sized for the wider text): under
 * the star (the schematic's spot), beside or over it, else at the end of a leader. Other
 * labels, leaders and star glyphs are never covered; covering a disc or a soft box costs,
 * so a leader wins over a cramped spot. Every star gets a label.
 * stars: [{id, x, y, text: {en, zh}, priority}] → {labels: Map id → {x, y, anchor, leader?}, boxes, leaders}
 */
export function placeStarLabels(stars, { discs, softBoxes = [], hardBoxes = [], bounds, size, starR }) {
  const h = size * 1.2;
  const glyphs = stars.map((s) => ({ id: s.id, box: circleBox(s.x, s.y, starR + 1.5) }));
  const placed = [];
  const out = new Map();
  const order = [...stars].sort((a, b) => b.priority - a.priority || (a.id < b.id ? -1 : 1));
  for (const s of order) {
    const w = Math.max(textWidth(s.text.en, size), textWidth(s.text.zh, size));
    const cands = [
      { x: s.x, y: s.y + starR + 3 + h / 2, anchor: "middle", cost: 0 },
      { x: s.x + starR + 4, y: s.y, anchor: "start", cost: 0.6 },
      { x: s.x - starR - 4, y: s.y, anchor: "end", cost: 0.9 },
      { x: s.x, y: s.y - starR - 3 - h / 2, anchor: "middle", cost: 1.2 },
    ];
    for (const len of [12, 22, 34, 48, 64, 82]) {
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8;
        const ux = Math.cos(a);
        const uy = Math.sin(a);
        const ex = s.x + ux * (starR + len);
        const ey = s.y + uy * (starR + len);
        const anchor = ux > 0.35 ? "start" : ux < -0.35 ? "end" : "middle";
        const x = anchor === "start" ? ex + 2 : anchor === "end" ? ex - 2 : ex;
        const y = anchor === "middle" ? ey + (uy < 0 ? -h / 2 - 1 : h / 2 + 1) : ey;
        cands.push({ x, y, anchor, cost: 3 + len * 0.09 + Math.abs(uy) * 0.6, leader: [s.x + ux * (starR + 1), s.y + uy * (starR + 1), ex, ey] });
      }
    }
    let best = null;
    for (const c of cands) {
      const box = textBox(c.x, c.y, w, h, c.anchor, 2);
      if (box.x0 < bounds.x0 || box.x1 > bounds.x1 || box.y0 < bounds.y0 || box.y1 > bounds.y1) continue;
      if (glyphs.some((g) => boxHitsBox(box, g.box))) continue;
      if (hardBoxes.some((b) => boxHitsBox(box, b) || (c.leader && segHitsBox(c.leader, b)))) continue;
      if (placed.some((p) => boxHitsBox(box, p.box) || (p.leader && segHitsBox(p.leader, box)) || (c.leader && (segHitsBox(c.leader, p.box) || (p.leader && segsCross(c.leader, p.leader)))))) continue;
      if (c.leader && glyphs.some((g) => g.id !== s.id && segHitsBox(c.leader, g.box))) continue;
      let cost = c.cost;
      for (const d of discs) {
        if (boxHitsCircle(box, d.x, d.y, d.R + 1)) cost += 12;
        if (c.leader && segDist(d.x, d.y, c.leader) < d.R + 0.5) cost += 3;
      }
      for (const b of softBoxes) if (boxHitsBox(box, b)) cost += 12;
      if (!best || cost < best.cost) best = { ...c, box, cost };
    }
    if (!best) {
      const c = cands[0];
      best = { ...c, box: textBox(c.x, c.y, w, h, c.anchor, 2), cost: Infinity };
    }
    placed.push({ id: s.id, box: best.box, leader: best.leader });
    out.set(s.id, { x: round1(best.x), y: round1(best.y), anchor: best.anchor, ...(best.leader ? { leader: best.leader.map(round1) } : {}), clear: best.cost < 12 });
  }
  return { labels: out, boxes: placed.map((p) => p.box), leaders: placed.filter((p) => p.leader).map((p) => p.leader) };
}

/**
 * Region names, one spot per region (sized for the wider of its two names): over the
 * region's discs, else inside its own tint, else under its discs. Star labels and other
 * names are never covered; discs, stars and drift arrows cost; so does sitting in another
 * region's tint rather than its own. regions: [{id, works, ellipse, core: [disc], text}].
 */
export function placeRegionLabels(regions, { discs, stars, boxes, bounds, size, starR, softBoxes = [], anchorBoxes = [] }) {
  const placed = [];
  const out = new Map();
  const h = size * 1.2;
  const order = [...regions].sort((a, b) => b.works - a.works || (a.id < b.id ? -1 : 1));
  for (const r of order) {
    const w = Math.max(textWidth(r.text.en, size), textWidth(r.text.zh, size)) * 1.05; // semibold
    const core = r.core.length ? r.core : discs.filter((d) => insideEllipse(r.ellipse, d.x, d.y));
    const top = Math.min(...core.map((d) => d.y - d.R));
    const bot = Math.max(...core.map((d) => d.y + d.R));
    const left = Math.min(...core.map((d) => d.x - d.R));
    const right = Math.max(...core.map((d) => d.x + d.R));
    const mid = (left + right) / 2;
    const cands = [];
    for (const [dx, extra] of [[0, 0], [-0.25, 0.4], [0.25, 0.4]]) {
      for (let row = 0; row < 4; row++) {
        cands.push({ x: mid + dx * (right - left), y: top - h / 2 - 4 - row * 12, cost: extra + row * 1.5 });
        cands.push({ x: mid + dx * (right - left), y: bot + h / 2 + 4 + row * 12, cost: 3 + extra + row * 1.5 });
      }
    }
    // Beside the region, level with its middle.
    const vmid = (top + bot) / 2;
    for (const dy of [0, -12, 12]) {
      cands.push({ x: right + w / 2 + 8, y: vmid + dy, cost: 4 + Math.abs(dy) * 0.05 });
      cands.push({ x: left - w / 2 - 8, y: vmid + dy, cost: 4.5 + Math.abs(dy) * 0.05 });
    }
    const e = r.ellipse;
    const { hx, hy } = ellipseExtent(e);
    for (let gy = e.cy - hy + h; gy <= e.cy + hy - h / 2; gy += 9) {
      for (let gx = e.cx - hx * 0.6; gx <= e.cx + hx * 0.6; gx += 12) {
        if (!insideEllipse(e, gx, gy)) continue;
        cands.push({ x: gx, y: gy, cost: 2 + ((gy - (e.cy - hy)) / (2 * hy)) * 2 + Math.abs(gx - e.cx) / (hx || 1) });
      }
    }
    let best = null;
    for (const c of cands) {
      let x = c.x;
      const x0 = Math.max(bounds.x0 + w / 2 + 3, Math.min(bounds.x1 - w / 2 - 3, x));
      x = x0;
      const box = textBox(x, c.y, w, h, "middle", 3);
      if (box.y0 < bounds.y0 || box.y1 > bounds.y1) continue;
      let cost = c.cost + Math.abs(x - c.x) * 0.02;
      for (const b of boxes) if (boxHitsBox(box, b)) cost += 1000;
      for (const p of placed) if (boxHitsBox(box, p)) cost += 1000;
      for (const d of discs) if (boxHitsCircle(box, d.x, d.y, d.R + 2)) cost += 40;
      for (const s of stars) if (boxHitsCircle(box, s.x, s.y, starR + 3)) cost += 60;
      for (const b of softBoxes) if (boxHitsBox(box, b)) cost += 30;
      // Each region's two largest keywords keep their labels unless nothing else is free.
      for (const b of anchorBoxes) if (boxHitsBox(box, b)) cost += 60;
      // Stay with your own keywords: far costs, and nearer another region's keywords costs more.
      const gapTo = (list) => Math.min(Infinity, ...list.map((d) => Math.hypot(Math.max(box.x0 - d.x, 0, d.x - box.x1), Math.max(box.y0 - d.y, 0, d.y - box.y1)) - d.R));
      const dOwn = gapTo(core);
      const dOther = gapTo(discs.filter((d) => d.region && d.region !== r.id));
      cost += 0.05 * Math.max(0, dOwn - 18);
      if (dOther < dOwn - 2) cost += 20;
      const own = insideEllipse(e, x, c.y, 10);
      const foreign = regions.some((o) => o.id !== r.id && insideEllipse(o.ellipse, x, c.y, -4));
      if (foreign && !own) cost += 25;
      else if (foreign) cost += 8;
      if (!best || cost < best.cost) best = { x, y: c.y, box, cost };
    }
    if (!best) best = { x: mid, y: Math.max(bounds.y0 + h, top - h / 2 - 4), box: textBox(mid, Math.max(bounds.y0 + h, top - h / 2 - 4), w, h, "middle", 3), cost: Infinity };
    placed.push(best.box);
    out.set(r.id, { x: round1(best.x), y: round1(best.y), clear: best.cost < 40 });
  }
  return { labels: out, boxes: placed };
}

/**
 * Keyword labels last, largest first, around the stars' and regions' labels. A label that
 * cannot be placed cleanly is left for hover / focus.
 */
export function placeKeywordLabels(discs, { obstacles, bounds, size }) {
  const nodes = discs.map((d) => ({ id: d.id, x: d.x, y: d.y, R: d.R, text: d.text, priority: d.priority }));
  return placeLabels(nodes, { size, bounds, obstacles, leaders: [8, 16, 26, 38, 52, 68], leaderClear: 4 }).labels;
}

/** The box (and leader) a placed keyword label covers, for later passes to avoid. */
export function keywordLabelBoxes(label, text, size) {
  if (!label) return [];
  const lines = label.lines ?? [text];
  const w = Math.max(...lines.map((l) => textWidth(l, size)));
  const h = lines.length === 1 ? size * 1.2 : lines.length * size * 1.15 + size * 0.05;
  const out = [textBox(label.x, label.y, w, h, label.anchor, 1.5)];
  if (label.leader) out.push(...segmentBoxes(label.leader, 1.5));
  return out;
}
