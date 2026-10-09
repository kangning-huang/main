"use client";

import { useEffect, useRef, useCallback } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { AtlasPoint } from "@/lib/atlas";

// Topology from world-atlas land-110m.json (Natural Earth)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LandTopology = { type: string; objects: { land: any }; arcs: unknown; bbox?: number[]; transform?: unknown };

type Props = {
  points: AtlasPoint[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  land: LandTopology | null;
};

/** Sequential ink→ember for mass per capita; grey for not covered. */
function massColor(massPerCapT: number | null, coverage: number): string {
  if (coverage === 0 || massPerCapT == null) return "rgba(120, 110, 100, 0.45)";
  // Typical range ~50–500 t/person; clamp.
  const t = Math.max(0, Math.min(1, (massPerCapT - 50) / 350));
  // teal (low) → ember (high)
  const r = Math.round(13 + t * (199 - 13));
  const g = Math.round(115 + t * (75 - 115));
  const b = Math.round(119 + t * (22 - 119));
  return `rgb(${r},${g},${b})`;
}

function radiusForPop(pop: number, k: number): number {
  // sqrt scale; min 1.2, max ~8 at k=1
  return Math.max(1.2, Math.min(8, Math.sqrt(pop) / 900)) * k;
}

export default function MapCanvas({ points, selectedId, onSelect, land }: Props) {
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

    // Paper background
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

    // Ocean tint
    ctx.beginPath();
    path({ type: "Sphere" });
    ctx.fillStyle = "#ebe4d8";
    ctx.fill();

    // Land
    if (land) {
      // world-atlas land-110m is a Topology; cast for topojson-client typings
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

    // Draw uncovered first, then covered, so covered sit on top
    const uncovered = points.filter((p) => p.coverage === 0);
    const covered = points.filter((p) => p.coverage !== 0);
    hitRef.current = [];

    const paint = (p: AtlasPoint, emphasize = false) => {
      const xy = projection([p.lon, p.lat]);
      if (!xy) return;
      const [x, y] = xy;
      const r = radiusForPop(p.pop15, emphasize ? 1.35 : 1);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = massColor(p.massPerCapT, p.coverage);
      ctx.globalAlpha = emphasize ? 1 : p.coverage === 0 ? 0.55 : 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (emphasize) {
        ctx.strokeStyle = "#281c14";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      hitRef.current.push(p);
    };

    for (const p of uncovered) paint(p, false);
    for (const p of covered) paint(p, p.id === selectedId);
    // Redraw selected on top
    if (selectedId != null) {
      const sel = points.find((p) => p.id === selectedId);
      if (sel) paint(sel, true);
    }
  }, [points, selectedId, land]);

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

    // Closest city within ~12px; prefer larger population on near-ties
    let best: AtlasPoint | null = null;
    let bestD = 12;
    for (const p of hitRef.current) {
      const xy = projection([p.lon, p.lat]);
      if (!xy) continue;
      const d = Math.hypot(xy[0] - x, xy[1] - y);
      const hitR = Math.max(12, radiusForPop(p.pop15, 1) + 4);
      if (d > hitR) continue;
      if (
        !best ||
        d < bestD - 0.75 ||
        (Math.abs(d - bestD) <= 0.75 && p.pop15 > best.pop15)
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
        aria-label="World map of cities colored by built mass per person"
        className="block w-full cursor-crosshair"
        onClick={(e) => handlePointer(e.clientX, e.clientY)}
      />
    </div>
  );
}
