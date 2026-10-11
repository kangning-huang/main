"use client";

import { useEffect, useRef, useCallback } from "react";
import { geoNaturalEarth1, geoPath, geoCircle } from "d3-geo";
import { feature } from "topojson-client";
import {
  paperCount,
  hasLayer,
  type AtlasPoint,
  type LayerKey,
} from "@/lib/atlas";

// Topology from world-atlas land-110m.json (Natural Earth)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LandTopology = { type: string; objects: { land: any }; arcs: unknown; bbox?: number[]; transform?: unknown };

type Props = {
  points: AtlasPoint[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  land: LandTopology | null;
  /** When set, only cities covered by this study are drawn in color; others stay faint grey. */
  filter?: LayerKey | null;
};

type View = {
  scale: number;
  translate: [number, number];
};

const DOT_R = 2.4;
const DOT_R_SEL = 3.4;
const GREY = "rgba(120, 110, 100, 0.4)";
/** Angular radius (° ) of the regional frame around a selected city — enough for neighbours, not a single pin. */
const CITY_RADIUS_DEG = 18;
const ZOOM_MS = 480;

/** Sequential paper-count palette: 1–6 distinct steps (pale teal → deep teal → ember → deep rust). Grey = 0. */
export const PAPER_COUNT_COLORS: Record<number, string> = {
  0: GREY,
  1: "rgb(140, 190, 188)", // #8CBEBC
  2: "rgb(58, 155, 152)", // #3A9B98
  3: "rgb(13, 115, 119)", // #0D7377
  4: "rgb(8, 70, 78)", // #08464E
  5: "rgb(199, 75, 22)", // #C74B16
  6: "rgb(139, 34, 8)", // #8B2208
};

export function colorForCount(n: number): string {
  if (n <= 0) return PAPER_COUNT_COLORS[0];
  if (n >= 6) return PAPER_COUNT_COLORS[6];
  return PAPER_COUNT_COLORS[n];
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function worldView(w: number, h: number): View {
  const projection = geoNaturalEarth1().fitExtent(
    [
      [12, 12],
      [w - 12, h - 12],
    ],
    { type: "Sphere" },
  );
  return {
    scale: projection.scale(),
    translate: projection.translate() as [number, number],
  };
}

function cityView(w: number, h: number, lon: number, lat: number): View {
  const circle = geoCircle().center([lon, lat]).radius(CITY_RADIUS_DEG)();
  const projection = geoNaturalEarth1().fitExtent(
    [
      [28, 28],
      [w - 28, h - 28],
    ],
    circle,
  );
  return {
    scale: projection.scale(),
    translate: projection.translate() as [number, number],
  };
}

function lerpView(a: View, b: View, t: number): View {
  return {
    scale: a.scale + (b.scale - a.scale) * t,
    translate: [
      a.translate[0] + (b.translate[0] - a.translate[0]) * t,
      a.translate[1] + (b.translate[1] - a.translate[1]) * t,
    ],
  };
}

function makeProjection(view: View) {
  return geoNaturalEarth1().scale(view.scale).translate(view.translate);
}

export default function MapCanvas({
  points,
  selectedId,
  onSelect,
  land,
  filter = null,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const projRef = useRef<ReturnType<typeof geoNaturalEarth1> | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const hitRef = useRef<AtlasPoint[]>([]);
  const viewRef = useRef<View | null>(null);
  const animRef = useRef<number | null>(null);
  const pointsRef = useRef(points);
  const selectedIdRef = useRef(selectedId);
  const landRef = useRef(land);
  const filterRef = useRef(filter);

  pointsRef.current = points;
  selectedIdRef.current = selectedId;
  landRef.current = land;
  filterRef.current = filter;

  const paintFrame = useCallback((view: View) => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const w = wrap.clientWidth;
    const h = Math.max(360, Math.round(w * 0.52));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    sizeRef.current = { w, h, dpr };

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#f5f0e8";
    ctx.fillRect(0, 0, w, h);

    const projection = makeProjection(view);
    projRef.current = projection;
    viewRef.current = view;
    const path = geoPath(projection, ctx);

    ctx.beginPath();
    path({ type: "Sphere" });
    ctx.fillStyle = "#ebe4d8";
    ctx.fill();

    const landTopo = landRef.current;
    if (landTopo) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const landFeat = feature(landTopo as any, landTopo.objects.land);
      ctx.beginPath();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      path(landFeat as any);
      ctx.fillStyle = "#fffcf7";
      ctx.fill();
      ctx.strokeStyle = "rgba(40, 36, 32, 0.18)";
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    const pts = pointsRef.current;
    const selId = selectedIdRef.current;
    const layerFilter = filterRef.current;

    // Sort: zero-paper first, then by paper count, so denser cities sit on top.
    const sorted = [...pts].sort(
      (a, b) => paperCount(a) - paperCount(b) || a.pop15 - b.pop15,
    );
    hitRef.current = [];

    const paint = (p: AtlasPoint, emphasize = false) => {
      const xy = projection([p.lon, p.lat]);
      if (!xy) return;
      const [x, y] = xy;
      if (x < -8 || y < -8 || x > w + 8 || y > h + 8) {
        // Still register for hit-testing only when near the canvas.
        return;
      }
      const n = paperCount(p);
      const passesFilter = !layerFilter || hasLayer(p, layerFilter);
      const r = emphasize ? DOT_R_SEL : DOT_R;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = passesFilter ? colorForCount(n) : GREY;
      ctx.globalAlpha = emphasize ? 1 : passesFilter && n > 0 ? 0.9 : 0.45;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (emphasize) {
        ctx.strokeStyle = "#281c14";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      hitRef.current.push(p);
    };

    for (const p of sorted) paint(p, false);
    if (selId != null) {
      const sel = pts.find((p) => p.id === selId);
      if (sel) paint(sel, true);
    }
  }, []);

  const targetViewFor = useCallback((w: number, h: number, id: number | null): View => {
    if (id == null) return worldView(w, h);
    const sel = pointsRef.current.find((p) => p.id === id);
    if (!sel) return worldView(w, h);
    return cityView(w, h, sel.lon, sel.lat);
  }, []);

  const animateTo = useCallback(
    (target: View) => {
      if (animRef.current != null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      const wrap = wrapRef.current;
      if (!wrap) return;
      const w = wrap.clientWidth;
      const h = Math.max(360, Math.round(w * 0.52));
      const from = viewRef.current ?? worldView(w, h);

      if (prefersReducedMotion()) {
        paintFrame(target);
        return;
      }

      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / ZOOM_MS);
        const eased = easeOutCubic(t);
        paintFrame(lerpView(from, target, eased));
        if (t < 1) {
          animRef.current = requestAnimationFrame(step);
        } else {
          animRef.current = null;
        }
      };
      animRef.current = requestAnimationFrame(step);
    },
    [paintFrame],
  );

  // Redraw + animate when selection / data / filter / land change.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const w = wrap.clientWidth;
    if (w <= 0) return;
    const h = Math.max(360, Math.round(w * 0.52));
    const target = targetViewFor(w, h, selectedId);
    // First paint: jump. Later selection changes: animate.
    if (viewRef.current == null) {
      paintFrame(target);
    } else {
      animateTo(target);
    }
  }, [selectedId, points, land, filter, paintFrame, animateTo, targetViewFor]);

  // Resize: snap to the correct target for current selection (no mid-animation fight).
  useEffect(() => {
    const onResize = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      if (animRef.current != null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      const w = wrap.clientWidth;
      const h = Math.max(360, Math.round(w * 0.52));
      paintFrame(targetViewFor(w, h, selectedIdRef.current));
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
    };
  }, [paintFrame, targetViewFor]);

  const handlePointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const projection = projRef.current;
    if (!canvas || !projection) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    let best: AtlasPoint | null = null;
    let bestD = 14;
    for (const p of hitRef.current) {
      const xy = projection([p.lon, p.lat]);
      if (!xy) continue;
      const d = Math.hypot(xy[0] - x, xy[1] - y);
      if (d > 14) continue;
      if (
        !best ||
        d < bestD - 0.5 ||
        (Math.abs(d - bestD) <= 0.5 && paperCount(p) > paperCount(best)) ||
        (Math.abs(d - bestD) <= 0.5 &&
          paperCount(p) === paperCount(best) &&
          p.pop15 > best.pop15)
      ) {
        best = p;
        bestD = d;
      }
    }
    if (best) onSelect(best.id);
  };

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden rounded-lg border border-rule bg-paper-warm">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="World map of cities colored by how many papers cover each city"
        className="block w-full cursor-crosshair"
        onClick={(e) => handlePointer(e.clientX, e.clientY)}
      />
    </div>
  );
}
