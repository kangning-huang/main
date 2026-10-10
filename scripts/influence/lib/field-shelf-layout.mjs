/**
 * Build-time layout for the Field & Shelf preview (docs/reach/FIELD-SHELF-PLAN.md): the packed field
 * of citing-work squares and the shelf of Ken's papers above it. Pure functions, no Math.random: the
 * same input always gives the same output.
 *
 * Units are CSS pixels. The field is drawn 1:1 whenever it fits, so squares stay pixel-snapped; it is
 * only scaled down on narrow screens. Shelf x positions are in a SHELF.width-wide reference stage that
 * the client stretches to its container; heights are not scaled (they hold text).
 */

import { textWidth } from "./ripple-layout.mjs";

export const FIELD = {
  pitch: 6, // grid step: one square per cell in every view, so density is constant and Lead shrinks
  cell: 3, // square side
  jitter: 1, // integer nudge (± px) per square: texture, never an overlap (pitch − cell − 2·jitter ≥ 1)
  aspect: 2.6, // ellipse width ÷ height
  stagger: true, // odd rows shift half a pitch, so the field reads as texture rather than a lattice
  edge: 0.045, // cells are taken in order of radius × (1 ± edge): soft band edges and outline
  seed: 20261011,
};

export const SHELF = {
  width: 700, // reference stage width
  minWidth: 560, // narrowest stage the client draws (lg at 1024 px): text must fit at this scale
  margin: 4,
  itemGap: 3, // between spines of one theme
  groupGap: 16, // between themes
  maxSpine: { 1: 28, 2: 54 }, // spine width cap for one- / two-line spines
  labelSize: 10.5, // spine label (semibold)
  descSize: 10, // second spine line (two-line spines only)
  lineH: 13,
  padY: 7, // spine text inset, top and bottom
  themeSize: 10.5,
  themeLineH: 13,
};

/** Deterministic hash of a grid cell and a salt → [0, 1). */
export function cellRand(i, j, salt) {
  let h = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(j | 0, 0x165667b1) ^ Math.imul(salt | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/**
 * Pack n squares into an ellipse of constant density (area = n · pitch²). Grid cells are taken in order
 * of (noisy) elliptical radius, so the k-th square of a list sorted by distance lands k-th from the
 * centre. Returns each square's top-left corner in the field box, the box, and the ellipse.
 */
export function packField(n, opts = {}) {
  const { pitch, cell, jitter, aspect, stagger, edge, seed } = { ...FIELD, ...opts };
  if (pitch - cell - 2 * jitter < 1) throw new Error("packField: neighbouring squares could touch");
  if (n === 0) return { squares: [], width: 0, height: 0, cx: 0, cy: 0, rx: 0, ry: 0 };
  const ry = Math.sqrt((n * pitch * pitch) / (Math.PI * aspect));
  const rx = aspect * ry;
  const reach = 1 + edge + 0.25;
  const I = Math.ceil((rx * reach) / pitch);
  const J = Math.ceil((ry * reach) / pitch);
  const cells = [];
  const shift = (j) => (stagger && j % 2 !== 0 ? Math.floor(pitch / 2) : 0);
  for (let j = -J; j <= J; j++) {
    for (let i = -I; i <= I; i++) {
      const r = Math.hypot((i * pitch + shift(j)) / rx, (j * pitch) / ry);
      cells.push({ i, j, r, key: r * (1 + edge * (2 * cellRand(i, j, seed) - 1)) });
    }
  }
  cells.sort((a, b) => a.key - b.key || a.j - b.j || a.i - b.i);
  if (cells.length < n) throw new Error("packField: candidate grid too small");
  const half = Math.floor(cell / 2);
  const pts = cells.slice(0, n).map((c) => {
    const dx = Math.floor(cellRand(c.i, c.j, seed + 1) * (2 * jitter + 1)) - jitter;
    const dy = Math.floor(cellRand(c.i, c.j, seed + 2) * (2 * jitter + 1)) - jitter;
    return { x: c.i * pitch + shift(c.j) + dx - half, y: c.j * pitch + dy - half, r: c.r };
  });
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return {
    squares: pts.map((p) => ({ x: p.x - minX, y: p.y - minY, r: p.r })),
    width: maxX - minX + cell,
    height: maxY - minY + cell,
    // Ellipse centre in field-box coordinates (centre of the middle cell's square).
    cx: cell / 2 - half - minX,
    cy: cell / 2 - half - minY,
    rx: Math.round(rx * 10) / 10,
    ry: Math.round(ry * 10) / 10,
  };
}

/** Smallest gap (px) between any two squares, or Infinity; brute force over grid buckets. */
export function minSquareGap(squares, cell = FIELD.cell, pitch = FIELD.pitch) {
  const buckets = new Map();
  const key = (bx, by) => `${bx},${by}`;
  for (const s of squares) {
    const k = key(Math.floor(s.x / pitch), Math.floor(s.y / pitch));
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(s);
  }
  let best = Infinity;
  for (const s of squares) {
    const bx = Math.floor(s.x / pitch);
    const by = Math.floor(s.y / pitch);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (const t of buckets.get(key(bx + dx, by + dy)) ?? []) {
          if (t === s) continue;
          const gx = Math.max(t.x - (s.x + cell), s.x - (t.x + cell));
          const gy = Math.max(t.y - (s.y + cell), s.y - (t.y + cell));
          best = Math.min(best, Math.max(gx, gy));
        }
      }
    }
  }
  return best;
}

/**
 * Text in at most two lines, balanced at a space, if one line is wider than `max`. "&" stays with the
 * word after it and "/" with the word before it ("Form" / "& methods", "Air quality /" / "dust").
 */
function fitLines(text, size, max) {
  if (textWidth(text, size) <= max) return [text];
  const all = [...text.matchAll(/ /g)].map((m) => m.index);
  const ok = all.filter((i) => !text.slice(0, i).endsWith("&") && !text.slice(i + 1).startsWith("/"));
  const spaces = ok.length ? ok : all;
  if (spaces.length === 0) {
    // Chinese has no spaces: break before 与 ("and", like "&" above), else mid-word.
    const chars = [...text];
    if (chars.length < 4) return [text];
    const and = chars.indexOf("与");
    const at = and > 0 && and < chars.length - 1 ? and : Math.ceil(chars.length / 2);
    return [chars.slice(0, at).join(""), chars.slice(at).join("")];
  }
  let best = null;
  for (const i of spaces) {
    const lines = [text.slice(0, i), text.slice(i + 1)];
    const w = Math.max(...lines.map((l) => textWidth(l, size)));
    if (!best || w < best.w) best = { lines, w };
  }
  return best.lines;
}

/**
 * The shelf: one upright spine per paper, grouped by theme (themes in Reach order, papers by year
 * inside a theme), centred in the reference stage. One-line spines carry the compact label
 * ("ERL 2019"); two-line spines add the paper's descriptor. Theme names sit above their group, in one
 * or two lines, English and Chinese fitted separately.
 *
 * items: [{ p, theme, label, desc }] in shelf order. themes: [{ id, en, zh }].
 */
export function layoutShelf(items, themes, { lines = 1, width = SHELF.width } = {}) {
  const S = SHELF;
  const groups = [];
  for (const it of items) {
    const last = groups[groups.length - 1];
    if (last && last.theme === it.theme) last.items.push(it);
    else groups.push({ theme: it.theme, items: [it] });
  }
  const n = items.length;
  const g = groups.length;
  const room = width - 2 * S.margin - (n - g) * S.itemGap - (g - 1) * S.groupGap;
  const spineW = Math.min(S.maxSpine[lines], Math.floor(room / n));
  if (spineW < lines * S.lineH + 4) throw new Error(`layoutShelf: ${n} spines leave ${spineW}px each, too narrow for ${lines} line(s)`);
  const total = n * spineW + (n - g) * S.itemGap + (g - 1) * S.groupGap;
  let x = Math.round((width - total) / 2);

  const placed = [];
  const groupBoxes = [];
  for (const [gi, grp] of groups.entries()) {
    if (gi > 0) x += S.groupGap - S.itemGap;
    const x0 = x;
    for (const it of grp.items) {
      placed.push({ p: it.p, x0: x, x: x + spineW / 2 });
      x += spineW + S.itemGap;
    }
    groupBoxes.push({ theme: grp.theme, x0, x1: x - S.itemGap });
  }

  // Spine height: the longest label (semibold reads ~5% wider), or descriptor on two-line spines.
  const textLen = Math.max(
    ...items.map((it) => Math.max(textWidth(it.label, S.labelSize) * 1.05, lines === 2 ? textWidth(it.desc ?? "", S.descSize) : 0))
  );
  const spineH = Math.ceil(textLen + 2 * S.padY);

  // Theme names: one line if it fits over the group (plus half a gap each side) on the narrowest
  // stage — x positions shrink with the stage, text does not — else two.
  const themeById = new Map(themes.map((t) => [t.id, t]));
  const overflow = [];
  const narrow = Math.min(1, S.minWidth / width);
  const out = groupBoxes.map((b, i) => {
    const t = themeById.get(b.theme);
    const left = i === 0 ? b.x0 : (groupBoxes[i - 1].x1 + b.x0) / 2;
    const right = i === groupBoxes.length - 1 ? b.x1 : (b.x1 + groupBoxes[i + 1].x0) / 2;
    const max = (right - left) * narrow - 4;
    const label = {};
    for (const lang of ["en", "zh"]) {
      const ls = fitLines(t[lang], S.themeSize, max);
      const w = Math.max(...ls.map((l) => textWidth(l, S.themeSize)));
      if (w > max) overflow.push({ theme: b.theme, lang, width: Math.round(w), room: Math.round(max) });
      label[lang] = ls;
    }
    return { theme: b.theme, x0: b.x0, x1: b.x1, en: label.en, zh: label.zh };
  });
  const themeLines = Math.max(...out.map((o) => Math.max(o.en.length, o.zh.length)));

  // No two spines overlap (sanity; the arithmetic above guarantees it).
  for (let i = 1; i < placed.length; i++) {
    if (placed[i].x0 < placed[i - 1].x0 + spineW) throw new Error("layoutShelf: spines overlap");
  }
  return {
    width,
    lines,
    spineW,
    spineH,
    themeLines,
    items: placed.map((p) => ({ p: p.p, x: Math.round(p.x * 10) / 10 })),
    groups: out,
    overflow,
    span: [placed[0].x0, placed[placed.length - 1].x0 + spineW],
  };
}
