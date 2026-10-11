"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  paperCount,
  hasLayer,
  type AtlasPoint,
  type LayerKey,
} from "@/lib/atlas";

type Props = {
  points: AtlasPoint[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  /** When set, only cities covered by this study are drawn in color; others stay faint grey. */
  filter?: LayerKey | null;
};

const GREY = "rgba(120, 110, 100, 0.45)";
const DOT_R = 3.2;
const DOT_R_SEL = 8;
const HIT_PX = 16;

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

/** Carto Positron (light) / Dark Matter (vector). No API key required for vector styles today. */
export const CARTO_STYLE_LIGHT =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
export const CARTO_STYLE_DARK =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors © <a href="https://carto.com/attribution/" target="_blank" rel="noopener noreferrer">CARTO</a>';

/** Angular half-width (°) of the frame around a selected city — city-scale, closer than the prior ~9°. */
const CITY_RADIUS_DEG = 2;
const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-168, -56],
  [188, 75],
];
const ZOOM_MS = 480;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function prefersDarkBasemap(): boolean {
  if (typeof window === "undefined") return false;
  const root = document.documentElement;
  if (root.classList.contains("dark") || root.dataset.theme === "dark") return true;
  if (root.classList.contains("light") || root.dataset.theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function cityBounds(lon: number, lat: number): [[number, number], [number, number]] {
  const cos = Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  const dLon = CITY_RADIUS_DEG / cos;
  const dLat = CITY_RADIUS_DEG;
  return [
    [lon - dLon, lat - dLat],
    [lon + dLon, lat + dLat],
  ];
}

/**
 * Paper-count dots are drawn on a 2D canvas overlay (not MapLibre circle layers).
 *
 * Root cause of missing dots on some clients: MapLibre GL circle layers with
 * data-driven `["get","color"]` / `["get","opacity"]` can fail to paint when
 * WebGL init is flaky, the style reloads, or the custom layer is dropped under
 * the remote Carto style. Basemap stays; dots vanish. Canvas overlay keeps dots
 * visible on both Positron and Dark Matter regardless of circle-layer state.
 */
export default function MapCanvas({
  points,
  selectedId,
  onSelect,
  filter = null,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapElRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const pointsRef = useRef(points);
  const selectedIdRef = useRef(selectedId);
  const filterRef = useRef(filter);
  const darkRef = useRef(false);
  const mapReadyRef = useRef(false);
  const [mapFailed, setMapFailed] = useState(false);
  const hitRef = useRef<{ p: AtlasPoint; x: number; y: number }[]>([]);
  const rafRef = useRef<number | null>(null);

  onSelectRef.current = onSelect;
  pointsRef.current = points;
  selectedIdRef.current = selectedId;
  filterRef.current = filter;

  const paintDots = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const map = mapRef.current;
    if (!canvas || !wrap) return;

    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w <= 0 || h <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const pts = pointsRef.current;
    const selId = selectedIdRef.current;
    const layerFilter = filterRef.current;
    const dark = darkRef.current;
    const stroke = dark ? "rgba(255,252,247,0.55)" : "rgba(40,28,20,0.35)";
    const selStroke = dark ? "#fff8f0" : "#281c14";

    const project = (lon: number, lat: number): [number, number] | null => {
      if (map && mapReadyRef.current) {
        try {
          const pt = map.project([lon, lat]);
          return [pt.x, pt.y];
        } catch {
          /* fall through */
        }
      }
      // Fallback equirectangular if MapLibre is not ready / WebGL failed.
      const [[west, south], [east, north]] = WORLD_BOUNDS;
      const x = ((lon - west) / (east - west)) * w;
      const y = ((north - lat) / (north - south)) * h;
      return [x, y];
    };

    const sorted = [...pts].sort(
      (a, b) => paperCount(a) - paperCount(b) || a.pop15 - b.pop15,
    );
    hitRef.current = [];

    const drawOne = (p: AtlasPoint, emphasize: boolean) => {
      const xy = project(p.lon, p.lat);
      if (!xy) return;
      const [x, y] = xy;
      if (x < -10 || y < -10 || x > w + 10 || y > h + 10) return;

      const n = paperCount(p);
      const passes = !layerFilter || hasLayer(p, layerFilter);
      const r = emphasize ? DOT_R_SEL : DOT_R;

      const fill = passes ? colorForCount(n) : GREY;
      if (emphasize) {
        // Outer cream halo so the pick reads clearly at city zoom.
        ctx.beginPath();
        ctx.arc(x, y, r + 7, 0, Math.PI * 2);
        ctx.fillStyle = dark ? "rgba(255,252,247,0.94)" : "rgba(255,252,247,0.97)";
        ctx.fill();
        ctx.lineWidth = 1.75;
        ctx.strokeStyle = selStroke;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.globalAlpha = emphasize ? 1 : passes && n > 0 ? 0.92 : 0.4;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = emphasize ? 2.75 : 0.85;
      ctx.strokeStyle = emphasize ? selStroke : stroke;
      ctx.stroke();

      hitRef.current.push({ p, x, y });
    };

    for (const p of sorted) {
      if (selId != null && p.id === selId) continue;
      drawOne(p, false);
    }
    if (selId != null) {
      const sel = pts.find((p) => p.id === selId);
      if (sel) drawOne(sel, true);
    }
  }, []);

  const schedulePaint = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      paintDots();
    });
  }, [paintDots]);

  // Create MapLibre basemap once; dots are canvas-overlay (see paintDots).
  useEffect(() => {
    const el = mapElRef.current;
    if (!el || mapRef.current) return;

    darkRef.current = prefersDarkBasemap();
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: el,
        style: darkRef.current ? CARTO_STYLE_DARK : CARTO_STYLE_LIGHT,
        bounds: WORLD_BOUNDS,
        fitBoundsOptions: { padding: 12 },
        attributionControl: false,
        cooperativeGestures: true,
        // Soften WebGL requirements so more machines get a basemap.
        canvasContextAttributes: { failIfMajorPerformanceCaveat: false },
      });
    } catch (err) {
      console.warn("Atlas MapLibre init failed; dots still draw on canvas.", err);
      mapReadyRef.current = false;
      setMapFailed(true);
      schedulePaint();
      return;
    }

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: ATTRIBUTION,
      }),
      "bottom-right",
    );
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    const onReady = () => {
      mapReadyRef.current = true;
      schedulePaint();
    };
    map.on("load", onReady);
    map.on("style.load", onReady);
    map.on("move", schedulePaint);
    map.on("zoom", schedulePaint);
    map.on("resize", schedulePaint);
    map.on("error", (e) => {
      console.warn("Atlas MapLibre error", e.error ?? e);
    });

    // Canvas overlay uses pointer-events:none so pan/zoom stay on the map.
    // Hit-test dots on map click using the last painted screen positions.
    map.on("click", (e) => {
      const { x, y } = e.point;
      let best: AtlasPoint | null = null;
      let bestD = HIT_PX;
      for (const { p, x: px, y: py } of hitRef.current) {
        const d = Math.hypot(px - x, py - y);
        if (d > HIT_PX) continue;
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
      if (best) onSelectRef.current(best.id);
    });

    map.on("mousemove", (e) => {
      const { x, y } = e.point;
      let near = false;
      for (const { x: px, y: py } of hitRef.current) {
        if (Math.hypot(px - x, py - y) <= HIT_PX) {
          near = true;
          break;
        }
      }
      map.getCanvas().style.cursor = near ? "pointer" : "";
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      darkRef.current = prefersDarkBasemap();
      mapReadyRef.current = false;
      map.setStyle(darkRef.current ? CARTO_STYLE_DARK : CARTO_STYLE_LIGHT);
      // style.load will flip mapReady and repaint
    };
    media.addEventListener("change", onScheme);

    mapRef.current = map;

    const syncSize = () => {
      const wrap = wrapRef.current;
      const mapEl = mapElRef.current;
      if (wrap && mapEl) {
        mapEl.style.width = `${wrap.clientWidth}px`;
        mapEl.style.height = `${wrap.clientHeight}px`;
      }
      map.resize();
      schedulePaint();
    };
    map.on("load", syncSize);
    // MapLibre often measures before absolute layout settles — sync twice.
    requestAnimationFrame(() => requestAnimationFrame(syncSize));

    return () => {
      media.removeEventListener("change", onScheme);
      map.remove();
      mapRef.current = null;
      mapReadyRef.current = false;
    };
  }, [schedulePaint]);

  // Repaint when data / filter / selection change.
  useEffect(() => {
    schedulePaint();
  }, [points, filter, selectedId, schedulePaint]);

  // Zoom to selected city (or back to world).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      schedulePaint();
      return;
    }

    const duration = prefersReducedMotion() ? 0 : ZOOM_MS;
    const go = () => {
      if (selectedId == null) {
        map.fitBounds(WORLD_BOUNDS, { padding: 12, duration });
        return;
      }
      const sel = pointsRef.current.find((p) => p.id === selectedId);
      if (!sel) return;
      map.fitBounds(cityBounds(sel.lon, sel.lat), {
        padding: 48,
        duration,
        maxZoom: 11,
      });
    };

    if (map.isStyleLoaded()) go();
    else map.once("load", go);
  }, [selectedId, schedulePaint]);

  // ResizeObserver keeps canvas + map in sync with layout.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      const mapEl = mapElRef.current;
      if (mapEl && wrap) {
        mapEl.style.width = `${wrap.clientWidth}px`;
        mapEl.style.height = `${wrap.clientHeight}px`;
      }
      mapRef.current?.resize();
      schedulePaint();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [schedulePaint]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label="World map of cities colored by how many papers cover each city"
      className="relative h-[min(62vw,520px)] min-h-[360px] w-full overflow-hidden rounded-lg border border-rule bg-paper-warm [&_.maplibregl-ctrl-attrib]:text-[10px] [&_.maplibregl-ctrl-attrib]:leading-tight"
    >
      <div ref={mapElRef} className="absolute inset-0 h-full w-full" />
      {/* pointer-events-none when MapLibre is up so pan/zoom work; clickable if basemap failed */}
      <canvas
        ref={canvasRef}
        className={
          mapFailed
            ? "absolute inset-0 z-[1] cursor-crosshair"
            : "pointer-events-none absolute inset-0 z-[1]"
        }
        onClick={
          mapFailed
            ? (e) => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                let best: AtlasPoint | null = null;
                let bestD = HIT_PX;
                for (const { p, x: px, y: py } of hitRef.current) {
                  const d = Math.hypot(px - x, py - y);
                  if (d > HIT_PX) continue;
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
                if (best) onSelectRef.current(best.id);
              }
            : undefined
        }
      />
    </div>
  );
}
