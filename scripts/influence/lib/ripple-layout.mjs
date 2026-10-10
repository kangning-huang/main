/**
 * Build-time layout for the Ripple map (docs/reach/RIPPLE-MAP.md, "Layout at build time").
 * Pure functions, no randomness: the same input always gives the same output.
 *
 * Geometry is in SVG user units. Angles are degrees clockwise from 12 o'clock.
 */

export const CIRCLE = {
  size: 800,
  c: 400,
  disc: 50, // centre disc radius
  arcIn: 58, // theme volume bands start here …
  arcMax: 18, // … and are at most this thick
  rho0: 138, // d = 0 (home topics)
  rho1: 316, // d = maxD
  rim: 336, // sector rim; theme names sit just outside it
  corridor: 12, // degrees kept clear at 12 o'clock for the ring labels
  sectorGap: 3, // degrees between sectors
  emergingUnits: 2.2, // sector width of a theme with no bubbles, in keyword units
  rMax: 26,
  rMin: 4.5,
  gap: 3, // min clear space between bubbles
  labelSize: 13,
  ringLabelSize: 10.5,
};

export const STRIP = {
  width: 340,
  x0: 18,
  x1: 322,
  rMax: 14,
  rMin: 4,
  gap: 2,
  labelSize: 11.5,
  pad: 6,
};

const rad = (deg) => ((deg - 90) * Math.PI) / 180; // 0° = 12 o'clock, clockwise
const round1 = (v) => Math.round(v * 10) / 10;

/** Radius / x position for a mean reach distance: square-root scale, so the crowded home side gets room. */
export function reachFraction(d, maxD) {
  return Math.sqrt(Math.max(0, Math.min(maxD, d)) / maxD);
}

// ── Text measurement (DM Sans, conservative) ──────────────────────────────

const NARROW = new Set([..." .,:;'!|il"]);
const SEMI = new Set([..."fjrt()-/[]’"]);
const WIDE = new Set([..."mwMW"]);
/** Estimated advance width of `str` at font size `size` (DM Sans; CJK at 1em). Errs wide. */
export function textWidth(str, size) {
  let em = 0;
  for (const ch of str) {
    if (/[⺀-鿿豈-﫿＀-￯]/.test(ch)) em += 1.0;
    else if (NARROW.has(ch)) em += 0.27;
    else if (SEMI.has(ch)) em += 0.36;
    else if (WIDE.has(ch)) em += 0.82;
    else if (/[A-Z]/.test(ch)) em += 0.66;
    else if (/[0-9]/.test(ch)) em += 0.58;
    else em += 0.54;
  }
  return em * size * 1.05;
}

// ── Collision primitives ───────────────────────────────────────────────────

const boxHitsBox = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
function boxHitsCircle(b, cx, cy, r) {
  const nx = Math.max(b.x0, Math.min(cx, b.x1));
  const ny = Math.max(b.y0, Math.min(cy, b.y1));
  return (nx - cx) ** 2 + (ny - cy) ** 2 < r * r;
}

/** Label box for an anchor point. `y` is the vertical centre of the text. */
function labelBox(x, y, w, h, anchor, pad = 2) {
  const x0 = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
  return { x0: x0 - pad, x1: x0 + w + pad, y0: y - h / 2 - pad, y1: y + h / 2 + pad };
}

/** Label text as one line, or split at the space that best balances two lines. */
function textVariants(text, size) {
  const variants = [[text]];
  const spaces = [...text.matchAll(/ /g)].map((m) => m.index);
  if (text.length > 12 && spaces.length > 0) {
    let best = null;
    for (const i of spaces) {
      const lines = [text.slice(0, i), text.slice(i + 1)];
      const w = Math.max(...lines.map((l) => textWidth(l, size)));
      if (!best || w < best.w) best = { lines, w };
    }
    variants.push(best.lines);
  }
  return variants;
}

/** Distance from point (px, py) to segment [x1, y1]–[x2, y2]. */
function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
function segHitsBox(seg, b) {
  const [x1, y1, x2, y2] = seg;
  for (let i = 0; i <= 12; i++) {
    const x = x1 + ((x2 - x1) * i) / 12;
    const y = y1 + ((y2 - y1) * i) / 12;
    if (x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1) return true;
  }
  return false;
}

/**
 * Candidate label positions around a bubble, best first: touching the bubble, then
 * pushed outward with a leader line (straight out, then nudged ±15° / ±30°).
 * u = outward unit vector (away from the circle's centre).
 */
function candidates(b, w, h, u, { leaders, near = true }) {
  const out = [];
  const R = b.R + 3;
  const anchorFor = (dir) => (dir.x > 0.3 ? "start" : dir.x < -0.3 ? "end" : "middle");
  const at = (dist, dir, leader) => {
    const px = b.x + dir.x * dist;
    const py = b.y + dir.y * dist;
    const anchor = anchorFor(dir);
    const y = anchor === "middle" ? py + (dir.y < 0 ? -h / 2 : h / 2) : py + dir.y * h * 0.3;
    const cand = { x: px, y, anchor };
    if (leader) {
      cand.leader = [b.x + dir.x * (b.R + 1.5), b.y + dir.y * (b.R + 1.5), b.x + dir.x * (dist - 2), b.y + dir.y * (dist - 2)];
    }
    return cand;
  };
  if (near) out.push(at(R, u));
  if (near) out.push({ x: b.x + R, y: b.y, anchor: "start" });
  if (near) {
    out.push({ x: b.x - R, y: b.y, anchor: "end" });
    out.push(at(R, { x: -u.x, y: -u.y }));
    out.push({ x: b.x, y: b.y - R - h / 2, anchor: "middle" });
    out.push({ x: b.x, y: b.y + R + h / 2, anchor: "middle" });
    const k = 0.72;
    out.push({ x: b.x + R * k, y: b.y - R * k - h * 0.2, anchor: "start" });
    out.push({ x: b.x + R * k, y: b.y + R * k + h * 0.2, anchor: "start" });
    out.push({ x: b.x - R * k, y: b.y - R * k - h * 0.2, anchor: "end" });
    out.push({ x: b.x - R * k, y: b.y + R * k + h * 0.2, anchor: "end" });
  }
  if (leaders) {
    for (const extra of [12, 24, 38, 54, 72, 92]) {
      for (const rot of [0, 15, -15, 30, -30, 45, -45]) {
        const a = (rot * Math.PI) / 180;
        const dir = { x: u.x * Math.cos(a) - u.y * Math.sin(a), y: u.x * Math.sin(a) + u.y * Math.cos(a) };
        out.push(at(R + extra, dir, true));
      }
    }
  }
  return out;
}

/**
 * Greedy label placement, largest bubbles first. `bubbles` carry {id, x, y, R, text: {en, zh}, priority}.
 * Returns Map id → {en: pos|null, zh: pos|null}; at most `limit` labels per language.
 */
function placeLabels(bubbles, { size, limit, obstacles = [], inBounds, outward, insideOk = true, leaders = false }) {
  const result = new Map(bubbles.map((b) => [b.id, { en: null, zh: null }]));
  const h = size * 1.2;
  for (const lang of ["en", "zh"]) {
    const placed = [...obstacles];
    const segs = [];
    let count = 0;
    const order = [...bubbles].sort((a, b) => b.priority - a.priority || (a.id < b.id ? -1 : 1));
    for (const b of order) {
      if (count >= limit) break;
      const text = b.text[lang];
      const w = textWidth(text, size);
      if (insideOk && w + 8 <= 2 * b.R && h + 2 <= 2 * b.R * 0.85) {
        result.get(b.id)[lang] = { x: round1(b.x), y: round1(b.y), anchor: "middle", inside: true };
        count++;
        continue;
      }
      const u = outward(b);
      const tries = [];
      const variants = textVariants(text, size);
      for (const near of [true, false]) {
        if (!near && !leaders) break;
        for (const lines of variants) {
          const lw = Math.max(...lines.map((l) => textWidth(l, size)));
          const lh = lines.length * size * 1.15 + (h - size * 1.15);
          for (const cand of candidates(b, lw, lh, u, { leaders: !near, near })) tries.push({ ...cand, lines, w: lw, h: lh });
        }
      }
      for (const cand of tries) {
        const box = labelBox(cand.x, cand.y, cand.w, cand.h, cand.anchor);
        if (!inBounds(box)) continue;
        if (placed.some((q) => boxHitsBox(box, q))) continue;
        if (segs.some((sg) => segHitsBox(sg, box))) continue;
        if (bubbles.some((o) => o.id !== b.id && boxHitsCircle(box, o.x, o.y, o.R + 1.5))) continue;
        if (boxHitsCircle(box, b.x, b.y, b.R)) continue;
        if (cand.leader) {
          const [x1, y1, x2, y2] = cand.leader;
          if (bubbles.some((o) => o.id !== b.id && segDist(o.x, o.y, x1, y1, x2, y2) < o.R + 1)) continue;
          if (placed.some((q) => segHitsBox(cand.leader, q))) continue;
          segs.push(cand.leader);
        }
        placed.push(box);
        result.get(b.id)[lang] = {
          x: round1(cand.x),
          y: round1(cand.y),
          anchor: cand.anchor,
          inside: false,
          ...(cand.leader ? { leader: cand.leader.map(round1) } : {}),
          ...(cand.lines.length > 1 ? { lines: cand.lines } : {}),
        };
        count++;
        break;
      }
    }
  }
  return result;
}

// ── Circle ─────────────────────────────────────────────────────────────────

/**
 * Sector angles, bubble positions and resting labels for one lens.
 * themes: [{id, keywords: n shown, emerging}] in sector order.
 * keywords: [{id, theme, rank, dMean, r, rY, text: {en, zh}, works}]
 * prevOrder: Map theme → [keyword id] from the previous run (keeps bubbles from jumping).
 */
export function layoutCircle({ themes, keywords, maxD, prevOrder, labelsAtRest }) {
  const L = CIRCLE;
  const units = themes.map((t) => (t.keywords > 0 ? t.keywords : L.emergingUnits));
  const free = 360 - L.corridor - L.sectorGap * Math.max(0, themes.length - 1);
  const per = free / units.reduce((s, u) => s + u, 0);
  const angles = new Map();
  let a = L.corridor / 2;
  themes.forEach((t, i) => {
    angles.set(t.id, [a, a + units[i] * per]);
    a += units[i] * per + L.sectorGap;
  });

  const rhoOf = (d) => L.rho0 + (L.rho1 - L.rho0) * reachFraction(d, maxD);
  const rings = [];
  for (let d = 0; d <= maxD; d++) rings.push({ d, r: round1(rhoOf(d)) });

  // Order within each sector: keep last run's order; new keywords go centre-out by rank.
  const order = new Map();
  for (const t of themes) {
    const mine = keywords.filter((k) => k.theme === t.id).sort((x, y) => x.rank - y.rank);
    const n = mine.length;
    const centreOut = (rank) => {
      const mid = (n - 1) / 2;
      const step = Math.ceil(rank / 2) * (rank % 2 === 1 ? -1 : 1);
      return Math.min(n - 1, Math.max(0, Math.round(mid + step)));
    };
    const prev = (prevOrder?.get(t.id) ?? []).filter((id) => mine.some((k) => k.id === id));
    const seq = [...prev];
    const fresh = mine.filter((k) => !prev.includes(k.id));
    if (seq.length === 0) {
      const slots = new Array(n).fill(null);
      for (const k of fresh) {
        let s = centreOut(k.rank);
        while (slots[s] !== null) s = (s + 1) % n;
        slots[s] = k.id;
      }
      seq.push(...slots);
    } else {
      for (const k of fresh) {
        const target = Math.round(((centreOut(k.rank) + 0.5) / n) * (seq.length + 1) - 0.5);
        seq.splice(Math.max(0, Math.min(seq.length, target)), 0, k.id);
      }
    }
    order.set(t.id, seq);
  }

  // Polar targets.
  const bubbles = [];
  for (const t of themes) {
    const [a0, a1] = angles.get(t.id);
    const seq = order.get(t.id);
    seq.forEach((id, i) => {
      const k = keywords.find((x) => x.id === id);
      const theta = a0 + ((i + 0.5) / seq.length) * (a1 - a0);
      const rho = rhoOf(k.dMean);
      const R = Math.max(k.r, k.rY);
      bubbles.push({ id, theme: t.id, a0, a1, thetaT: theta, rhoT: rho, R, x: 0, y: 0 });
    });
  }
  const toXY = (b, theta, rho) => {
    b.x = L.c + rho * Math.cos(rad(theta));
    b.y = L.c + rho * Math.sin(rad(theta));
  };
  const polar = (b) => {
    const dx = b.x - L.c;
    const dy = b.y - L.c;
    let theta = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (theta < 0) theta += 360;
    return { theta, rho: Math.hypot(dx, dy) };
  };
  for (const b of bubbles) toXY(b, b.thetaT, b.rhoT);

  // Ring labels live in the 12 o'clock corridor; bubbles keep clear of them.
  const ringLabelBoxes = rings.map((ring) => {
    const w = 78;
    const h = L.ringLabelSize * 1.25;
    const y = L.c - ring.r - h / 2 - 1;
    return { x0: L.c - w / 2, x1: L.c + w / 2, y0: y - h / 2, y1: y + h / 2 };
  });

  const innerLimit = L.arcIn + L.arcMax + 10;
  const outerLimit = L.rim - 6;
  const clampSector = (b, theta, rho) => {
    const pad = (Math.asin(Math.min(1, (b.R + 2) / Math.max(rho, 1))) * 180) / Math.PI;
    const lo = b.a0 + pad;
    const hi = b.a1 - pad;
    return lo > hi ? (b.a0 + b.a1) / 2 : Math.max(lo, Math.min(hi, theta));
  };

  const relax = (iterations, radialFreedom, radialPull) => {
    for (let it = 0; it < iterations; it++) {
      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
          const p = bubbles[i];
          const q = bubbles[j];
          let dx = q.x - p.x;
          let dy = q.y - p.y;
          let dist = Math.hypot(dx, dy);
          const min = p.R + q.R + L.gap;
          if (dist >= min) continue;
          if (dist < 1e-6) {
            dx = Math.cos(i + j);
            dy = Math.sin(i + j);
            dist = 1;
          }
          const push = (min - dist) / 2;
          for (const [b, sign] of [[p, -1], [q, 1]]) {
            const mx = (sign * push * dx) / dist;
            const my = (sign * push * dy) / dist;
            const { rho } = polar(b);
            const ux = (b.x - L.c) / rho;
            const uy = (b.y - L.c) / rho;
            const radial = mx * ux + my * uy;
            b.x += mx - radial * ux * (1 - radialFreedom);
            b.y += my - radial * uy * (1 - radialFreedom);
          }
        }
      }
      for (const b of bubbles) {
        for (const box of ringLabelBoxes) {
          if (!boxHitsCircle(box, b.x, b.y, b.R + 2)) continue;
          const mid = (box.x0 + box.x1) / 2;
          b.x += b.x >= mid ? 2 : -2;
        }
        let { theta, rho } = polar(b);
        rho += (b.rhoT - rho) * radialPull;
        theta += (b.thetaT - theta) * 0.01;
        theta = clampSector(b, theta, rho);
        rho = Math.max(innerLimit + b.R, Math.min(outerLimit - b.R, rho));
        toXY(b, theta, rho);
      }
    }
  };
  relax(300, 0.25, 0.3);
  const overlaps = () => {
    let n = 0;
    for (let i = 0; i < bubbles.length; i++)
      for (let j = i + 1; j < bubbles.length; j++)
        if (Math.hypot(bubbles[i].x - bubbles[j].x, bubbles[i].y - bubbles[j].y) < bubbles[i].R + bubbles[j].R + 0.5) n++;
    return n;
  };
  // Crowded sectors: let bubbles step off their exact radius as a last resort (reported).
  if (overlaps() > 0) relax(300, 0.9, 0.05);

  const byId = new Map(bubbles.map((b) => [b.id, b]));
  const kwById = new Map(keywords.map((k) => [k.id, k]));
  const labelBubbles = bubbles.map((b) => ({
    id: b.id,
    x: b.x,
    y: b.y,
    R: b.R,
    text: kwById.get(b.id).text,
    priority: kwById.get(b.id).works,
  }));
  const labels = placeLabels(labelBubbles, {
    size: L.labelSize,
    limit: labelsAtRest,
    leaders: true,
    obstacles: ringLabelBoxes,
    inBounds: (box) =>
      [[box.x0, box.y0], [box.x1, box.y0], [box.x0, box.y1], [box.x1, box.y1]].every(
        ([x, y]) => Math.hypot(x - L.c, y - L.c) <= L.rim - 4 && Math.hypot(x - L.c, y - L.c) >= innerLimit - 6
      ),
    outward: (b) => {
      const dx = b.x - L.c;
      const dy = b.y - L.c;
      const r = Math.hypot(dx, dy) || 1;
      return { x: dx / r, y: dy / r };
    },
  });

  let maxRadialShift = 0;
  const positions = new Map();
  for (const b of bubbles) {
    const { rho } = polar(b);
    maxRadialShift = Math.max(maxRadialShift, Math.abs(rho - b.rhoT));
    positions.set(b.id, { x: round1(b.x), y: round1(b.y), label: labels.get(b.id) });
  }

  return {
    angles: new Map([...angles].map(([id, [s, e]]) => [id, [round1(s), round1(e)]])),
    order,
    positions,
    rings,
    stats: { overlaps: overlaps(), maxRadialShift: round1(maxRadialShift), unitsPerD: round1((L.rho1 - L.rho0) / maxD) },
    byId,
  };
}

// ── Strip (phones) ─────────────────────────────────────────────────────────

/**
 * Strip labels: beside the bubble when there is room, else in a lane above or below
 * the beeswarm with a leader line, so every keyword can be read without tapping.
 */
function stripLabels(placed) {
  const S = STRIP;
  const h = S.labelSize * 1.2;
  const result = new Map(placed.map((p) => [p.id, { en: null, zh: null }]));
  const swarmTop = Math.min(...placed.map((p) => p.y - p.R));
  const swarmBot = Math.max(...placed.map((p) => p.y + p.R));
  for (const lang of ["en", "zh"]) {
    const boxes = [];
    const segs = [];
    const free = (box) =>
      box.x0 >= 0 &&
      box.x1 <= S.width &&
      !boxes.some((q) => boxHitsBox(box, q)) &&
      !segs.some((sg) => segHitsBox(sg, box)) &&
      !placed.some((o) => boxHitsCircle(box, o.x, o.y, o.R + 1));
    const order = [...placed].sort((a, b) => b.priority - a.priority || (a.id < b.id ? -1 : 1));
    for (const b of order) {
      const w = textWidth(b.text[lang], S.labelSize);
      let done = null;
      for (const cand of [
        { x: b.x + b.R + 3, y: b.y, anchor: "start" },
        { x: b.x - b.R - 3, y: b.y, anchor: "end" },
      ]) {
        const box = labelBox(cand.x, cand.y, w, h, cand.anchor);
        if (free(box)) {
          done = { cand, box };
          break;
        }
      }
      if (!done) {
        const lanes = [];
        for (let i = 0; i < 3; i++) {
          const above = { y: swarmTop - 7 - h / 2 - i * (h + 3), side: -1 };
          const below = { y: swarmBot + 7 + h / 2 + i * (h + 3), side: 1 };
          lanes.push(...(b.y <= 0 ? [above, below] : [below, above]));
        }
        search: for (const lane of lanes) {
          for (const shift of [0, 8, -8, 16, -16, 26, -26, 38, -38, 52, -52, 70, -70, 92, -92]) {
            const cx = Math.max(w / 2 + 2, Math.min(S.width - w / 2 - 2, b.x + shift));
            const box = labelBox(cx, lane.y, w, h, "middle");
            if (!free(box)) continue;
            const leader = [b.x, b.y + lane.side * (b.R + 1), cx, lane.y - lane.side * (h / 2 + 0.5)];
            if (placed.some((o) => o.id !== b.id && segDist(o.x, o.y, ...leader) < o.R + 0.5)) continue;
            if (boxes.some((q) => segHitsBox(leader, q))) continue;
            done = { cand: { x: cx, y: lane.y, anchor: "middle", leader }, box };
            break search;
          }
        }
      }
      if (!done) continue;
      boxes.push(done.box);
      if (done.cand.leader) segs.push(done.cand.leader);
      result.get(b.id)[lang] = {
        x: round1(done.cand.x),
        y: round1(done.cand.y),
        anchor: done.cand.anchor,
        inside: false,
        ...(done.cand.leader ? { leader: done.cand.leader.map(round1) } : {}),
      };
    }
  }
  return result;
}

/** One beeswarm row per theme; x = reach distance (same square-root scale as the circle's radius). */
export function layoutStrip({ themes, keywords, maxD }) {
  const S = STRIP;
  const xOf = (d) => S.x0 + (S.x1 - S.x0) * reachFraction(d, maxD);
  const rows = [];
  const positions = new Map();
  for (const t of themes) {
    const mine = keywords.filter((k) => k.theme === t.id).sort((a, b) => b.works - a.works || (a.id < b.id ? -1 : 1));
    if (mine.length === 0) {
      rows.push({ theme: t.id, height: 0 });
      continue;
    }
    const placed = [];
    for (const k of mine) {
      const x = xOf(k.dMean);
      const R = Math.max(k.sr, k.srY);
      let y = 0;
      for (let step = 0; step < 400; step++) {
        const off = Math.ceil(step / 2) * 0.5 * (step % 2 === 1 ? 1 : -1);
        if (placed.every((p) => Math.hypot(p.x - x, p.y - off) >= p.R + R + S.gap)) {
          y = off;
          break;
        }
      }
      placed.push({ id: k.id, x, y, R, text: k.text, priority: k.works });
    }
    const labels = stripLabels(placed);
    let top = Infinity;
    let bottom = -Infinity;
    const h = S.labelSize * 1.2;
    for (const p of placed) {
      top = Math.min(top, p.y - p.R);
      bottom = Math.max(bottom, p.y + p.R);
      for (const lang of ["en", "zh"]) {
        const l = labels.get(p.id)[lang];
        if (!l) continue;
        top = Math.min(top, l.y - h / 2);
        bottom = Math.max(bottom, l.y + h / 2);
      }
    }
    const shift = S.pad - top;
    for (const p of placed) {
      const lab = labels.get(p.id);
      const move = (l) =>
        l ? { ...l, y: round1(l.y + shift), ...(l.leader ? { leader: l.leader.map((v, i) => round1(i % 2 ? v + shift : v)) } : {}) } : null;
      positions.set(p.id, { x: round1(p.x), y: round1(p.y + shift), label: { en: move(lab.en), zh: move(lab.zh) } });
    }
    rows.push({ theme: t.id, height: round1(bottom - top + 2 * S.pad) });
  }
  const guides = [];
  for (let d = 0; d <= maxD; d++) guides.push({ d, x: round1(xOf(d)) });
  return { rows, positions, guides };
}
