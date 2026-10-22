"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { DIM_ALPHA, FIELD_AREA, HIT_COLOR, IMPACT_COLORS, impactBin, type FieldShelfView } from "@/lib/field-shelf";

/** One-shot fill in citation-year order, then still. */
const ENTRANCE_MS = 2000;
/** All ↔ Lead: shared squares glide, the rest fade. */
const LENS_MS = 700;

export interface FieldFrame {
  /** Scale (1 = squares drawn at their CSS size). */
  s: number;
  /** Where the field box's (0, 0) lands in the canvas, CSS px. */
  ox: number;
  oy: number;
}

/**
 * Where a view's field sits in a canvas of the given CSS width. Both views share FIELD_AREA, centred,
 * so Lead sits smaller in the same frame. At full scale the origin is whole pixels, so every square
 * is pixel-snapped; narrower canvases scale the field down.
 */
export function fieldFrame(view: FieldShelfView, width: number): FieldFrame {
  const s = Math.min(1, width / FIELD_AREA.width);
  const ox = width / 2 - view.field.cx * s;
  const oy = (FIELD_AREA.height * s) / 2 - view.field.cy * s;
  return s === 1 ? { s, ox: Math.round(ox), oy: Math.round(oy) } : { s, ox, oy };
}

/** Centre of square i, canvas CSS px. */
export function squareCentre(view: FieldShelfView, i: number, frame: FieldFrame) {
  const q = view.squares[i];
  const half = view.field.cell / 2;
  return { x: frame.ox + (q.x + half) * frame.s, y: frame.oy + (q.y + half) * frame.s };
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

interface Prepared {
  /** Indexes grouped by impact bin (0–4). */
  byBand: number[][];
  /** Position of each square in citation-year order (year, then OpenAlex id). */
  rank: Int32Array;
  /** Grid buckets for hit-testing: key → square indexes. */
  buckets: Map<number, number[]>;
}

const bucketKey = (bx: number, by: number) => (bx + 2048) * 4096 + (by + 2048);

function prepare(view: FieldShelfView): Prepared {
  const byBand: number[][] = [[], [], [], [], []];
  view.squares.forEach((q, i) => byBand[impactBin(q.citedBy)].push(i));
  const order = view.squares.map((_, i) => i);
  const idKey = (i: number) => {
    const id = view.squares[i].id;
    if (id.startsWith("W") && /^\d+$/.test(id.slice(1))) return Number(id.slice(1));
    let h = 0;
    for (let c = 0; c < id.length; c++) h = (Math.imul(31, h) + id.charCodeAt(c)) | 0;
    return h >>> 0;
  };
  // Entrance: most-cited first (centre fills first), then year, then id.
  order.sort((a, b) => view.squares[b].citedBy - view.squares[a].citedBy || (view.squares[a].year ?? 9999) - (view.squares[b].year ?? 9999) || idKey(a) - idKey(b));
  const rank = new Int32Array(order.length);
  order.forEach((i, r) => (rank[i] = r));
  const buckets = new Map<number, number[]>();
  const p = view.field.pitch;
  view.squares.forEach((q, i) => {
    const k = bucketKey(Math.floor(q.x / p), Math.floor(q.y / p));
    const list = buckets.get(k);
    if (list) list.push(i);
    else buckets.set(k, [i]);
  });
  return { byBand, rank, buckets };
}

/** Nearest square to (px, py) within `radius` CSS px, or null. */
function hitTest(view: FieldShelfView, prep: Prepared, frame: FieldFrame, px: number, py: number, radius: number): number | null {
  const fx = (px - frame.ox) / frame.s;
  const fy = (py - frame.oy) / frame.s;
  const r = radius / frame.s;
  const p = view.field.pitch;
  const half = view.field.cell / 2;
  const bx = Math.floor(fx / p);
  const by = Math.floor(fy / p);
  const k = Math.ceil(r / p) + 1;
  let best: number | null = null;
  let bestD = r * r;
  for (let dy = -k; dy <= k; dy++) {
    for (let dx = -k; dx <= k; dx++) {
      for (const i of prep.buckets.get(bucketKey(bx + dx, by + dy)) ?? []) {
        const q = view.squares[i];
        const d = (q.x + half - fx) ** 2 + (q.y + half - fy) ** 2;
        if (d <= bestD) {
          bestD = d;
          best = i;
        }
      }
    }
  }
  return best;
}

interface Live {
  view: FieldShelfView;
  prep: Prepared;
  lit: Uint8Array | null;
  hits: Uint8Array | null;
  width: number;
}

interface Engine {
  raf: number;
  revealed: boolean;
  entranceT0: number;
  lens: null | { from: FieldShelfView; t0: number };
  shownView: FieldShelfView | null;
  reduced: boolean;
}

/** Draw one frame; true while an animation still needs frames. */
function paintFrame(canvas: HTMLCanvasElement, E: Engine, L: Live, now: number): boolean {
  const { view: v, prep: pr, lit: lt, hits: ht, width: w } = L;
  if (w <= 0) return false;
  const dpr = window.devicePixelRatio || 1;
  const frame = fieldFrame(v, w);
  const h = FIELD_AREA.height * frame.s;
  const W = Math.round(w * dpr);
  const H = Math.round(h * dpr);
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const size = Math.max(1, Math.round(v.field.cell * frame.s * dpr));
  const at = (x: number, y: number) => ctx.fillRect(Math.round(x * dpr), Math.round(y * dpr), size, size);
  let again = false;

  if (E.lens) {
    // All ↔ Lead: squares in both views glide; the others fade out or in where they stand.
    const t = Math.min(1, (now - E.lens.t0) / LENS_MS);
    const e = easeInOut(t);
    const from = E.lens.from;
    const ff = fieldFrame(from, w);
    for (let b = 0; b < IMPACT_COLORS.length; b++) {
      ctx.fillStyle = IMPACT_COLORS[b];
      ctx.globalAlpha = 1;
      for (const i of pr.byBand[b]) {
        const q = v.squares[i];
        const j = from.index.get(q.id);
        if (j === undefined) continue;
        const o = from.squares[j];
        at(ff.ox + o.x * ff.s + (frame.ox + q.x * frame.s - ff.ox - o.x * ff.s) * e, ff.oy + o.y * ff.s + (frame.oy + q.y * frame.s - ff.oy - o.y * ff.s) * e);
      }
      ctx.globalAlpha = e;
      for (const i of pr.byBand[b]) {
        const q = v.squares[i];
        if (!from.index.has(q.id)) at(frame.ox + q.x * frame.s, frame.oy + q.y * frame.s);
      }
      ctx.globalAlpha = 1 - e;
      for (const o of from.squares) {
        if (impactBin(o.citedBy) === b && !v.index.has(o.id)) at(ff.ox + o.x * ff.s, ff.oy + o.y * ff.s);
      }
    }
    ctx.globalAlpha = 1;
    if (t < 1) again = true;
    else E.lens = null;
  } else {
    let reveal = v.squares.length;
    if (!E.revealed) {
      if (!E.entranceT0) reveal = 0;
      else {
        const t = Math.min(1, (now - E.entranceT0) / ENTRANCE_MS);
        reveal = Math.ceil(smooth(t) * v.squares.length);
        if (t < 1) again = true;
        else E.revealed = true;
      }
    }
    const shown = (i: number) => pr.rank[i] < reveal;
    const pass = (b: number, color: string, alpha: number, keep: (i: number) => boolean) => {
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      for (const i of pr.byBand[b]) if (keep(i) && shown(i)) at(frame.ox + v.squares[i].x * frame.s, frame.oy + v.squares[i].y * frame.s);
    };
    if (ht) {
      for (let b = 0; b < IMPACT_COLORS.length; b++) pass(b, IMPACT_COLORS[b], DIM_ALPHA, (i) => !ht[i]);
      // Search hits one pixel larger on every side: a handful of 3-px squares is easy to miss.
      const big = size + 2 * Math.max(1, Math.round(frame.s * dpr));
      const off = (big - size) / 2;
      ctx.fillStyle = HIT_COLOR;
      ctx.globalAlpha = 1;
      for (let i = 0; i < v.squares.length; i++) {
        if (ht[i] !== 1 || !shown(i)) continue;
        ctx.fillRect(Math.round((frame.ox + v.squares[i].x * frame.s) * dpr) - off, Math.round((frame.oy + v.squares[i].y * frame.s) * dpr) - off, big, big);
      }
    } else if (lt) {
      for (let b = 0; b < IMPACT_COLORS.length; b++) pass(b, IMPACT_COLORS[b], DIM_ALPHA, (i) => !lt[i]);
      for (let b = 0; b < IMPACT_COLORS.length; b++) pass(b, IMPACT_COLORS[b], 1, (i) => lt[i] === 1);
    } else {
      for (let b = 0; b < IMPACT_COLORS.length; b++) pass(b, IMPACT_COLORS[b], 1, () => true);
    }
    ctx.globalAlpha = 1;
  }
  return again;
}

interface Props {
  view: FieldShelfView;
  /** 1 = full strength, 0 = dimmed (≈15%); null = all full strength. */
  lit: Uint8Array | null;
  /** Search hits: drawn teal over a dimmed field. */
  hits: Uint8Array | null;
  /** Fill the field most-cited-first the first time it scrolls into view (skipped with reduced motion). */
  entrance?: boolean;
  onHover?: (i: number | null) => void;
  /** Click or tap: the nearest square, or null on empty space. */
  onPick?: (i: number | null) => void;
  /** Mouse hit radius, CSS px; touch and pen get three times this. */
  hitRadius?: number;
  label: string;
  className?: string;
}

/**
 * The field: one square per citing work, drawn on a 2D canvas. Pixel-snapped at every device pixel
 * ratio; nearest-square hit-testing (a mouse needs only be closest, not on the 3-px square). The canvas
 * is an image to assistive technology: the shelf, search and table carry the same information.
 */
export default function FieldShelfCanvas({ view, lit, hits, entrance = false, onHover, onPick, hitRadius = 5, label, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const prep = useMemo(() => prepare(view), [view]);

  // Latest inputs for the imperative painter, refreshed after every render.
  const live = useRef<Live>({ view, prep, lit, hits, width });
  const engine = useRef<Engine>({ raf: 0, revealed: !entrance, entranceT0: 0, lens: null, shownView: null, reduced: false });

  const requestPaint = useCallback(() => {
    const E = engine.current;
    if (E.raf) return;
    function tick(now: number) {
      E.raf = 0;
      const canvas = ref.current;
      if (canvas && paintFrame(canvas, E, live.current, now)) E.raf = requestAnimationFrame(tick);
    }
    E.raf = requestAnimationFrame(tick);
  }, []);

  // Refresh the painter's inputs; a new view after the entrance starts the All ↔ Lead glide.
  useLayoutEffect(() => {
    live.current = { view, prep, lit, hits, width };
    const E = engine.current;
    if (E.shownView && E.shownView !== view && E.revealed && !E.reduced) {
      E.lens = { from: E.shownView, t0: performance.now() };
    }
    E.shownView = view;
    requestPaint();
  }, [view, prep, lit, hits, width, requestPaint]);

  // Size: the canvas fills its box; the backing store follows the CSS size × device pixel ratio.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.getBoundingClientRect().width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Entrance: once (most-cited first), when at least a quarter of the field is on screen; reduced motion shows the final state.
  useEffect(() => {
    const el = ref.current;
    const E = engine.current;
    E.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (E.revealed || !el) return;
    if (E.reduced) {
      E.revealed = true;
      requestPaint();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((en) => en.isIntersecting)) return;
        io.disconnect();
        E.entranceT0 = performance.now();
        requestPaint();
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [requestPaint]);

  // Cancel a pending frame on unmount, and forget it: StrictMode remounts reuse this ref, and a stale
  // id would make requestPaint think a frame is still on its way.
  useEffect(() => {
    const E = engine.current;
    return () => {
      cancelAnimationFrame(E.raf);
      E.raf = 0;
    };
  }, []);

  const hoverRef = useRef<number | null>(null);
  const locate = (e: PointerEvent<HTMLCanvasElement>, radius: number): number | null => {
    const E = engine.current;
    if (!E.revealed || E.lens || width <= 0) return null;
    const r = e.currentTarget.getBoundingClientRect();
    return hitTest(view, prep, fieldFrame(view, width), e.clientX - r.left, e.clientY - r.top, radius);
  };

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      className={className}
      style={{ touchAction: "manipulation" }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !onHover) return;
        const i = locate(e, hitRadius);
        e.currentTarget.style.cursor = i === null ? "default" : "pointer";
        if (i !== hoverRef.current) {
          hoverRef.current = i;
          onHover(i);
        }
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse" || !onHover) return;
        hoverRef.current = null;
        onHover(null);
      }}
      onPointerUp={(e) => {
        if (!onPick || (e.pointerType === "mouse" && e.button !== 0)) return;
        onPick(locate(e, e.pointerType === "mouse" ? hitRadius : hitRadius * 3));
      }}
    />
  );
}
