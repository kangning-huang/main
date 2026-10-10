"use client";

import { useEffect, useRef, useCallback } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
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

const DOT_R = 2.4;
const DOT_R_SEL = 3.4;
const GREY = "rgba(120, 110, 100, 0.4)";

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

  const draw = useCallback(() => {
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

    const projection = geoNaturalEarth1().fitExtent(
      [
        [12, 12],
        [w - 12, h - 12],
      ],
      { type: "Sphere" },
    );
    projRef.current = projection;
    const path = geoPath(projection, ctx);

    ctx.beginPath();
    path({ type: "Sphere" });
    ctx.fillStyle = "#ebe4d8";
    ctx.fill();

    if (land) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const landFeat = feature(land as any, land.objects.land);
      ctx.beginPath();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      path(landFeat as any);
      ctx.fillStyle = "#fffcf7";
      ctx.fill();
      ctx.strokeStyle = "rgba(40, 36, 32, 0.18)";
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    // Sort: zero-paper first, then by paper count, so denser cities sit on top.
    const sorted = [...points].sort(
      (a, b) => paperCount(a) - paperCount(b) || a.pop15 - b.pop15,
    );
    hitRef.current = [];

    const paint = (p: AtlasPoint, emphasize = false) => {
      const xy = projection([p.lon, p.lat]);
      if (!xy) return;
      const [x, y] = xy;
      const n = paperCount(p);
      const passesFilter = !filter || hasLayer(p, filter);
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
    if (selectedId != null) {
      const sel = points.find((p) => p.id === selectedId);
      if (sel) paint(sel, true);
    }
  }, [points, selectedId, land, filter]);

  useEffect(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

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
