"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import {
  paperCount,
  hasLayer,
  type AtlasPoint,
  type LayerKey,
} from "@/lib/atlas";
import {
  PAPER_COUNT_COLORS,
  ATLAS_DOT_GREY,
  colorForCount,
  colorForUhs,
} from "@/lib/atlas-colors";
import T from "@/components/T";

// Re-export palette for any legacy imports; preferred path is @/lib/atlas-colors.
export { PAPER_COUNT_COLORS, colorForCount };

type Props = {
  points: AtlasPoint[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  /** Clear the city card and return to the default world camera. */
  onClearSelection?: () => void;
  /** When set, only cities covered by this study are drawn in color; others stay faint grey. */
  filter?: LayerKey | null;
};

const GREY = ATLAS_DOT_GREY;
const DOT_R = 3.2;
const DOT_R_SEL = 8;
const HIT_PX = 16;

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
 * Hardening (2026-10-11):
 * 1. WebGL canvases can composite above sibling 2D canvases on some GPUs/browsers
 *    even when DOM z-index says otherwise — force a stacking context + translateZ
 *    so the overlay stays visible above the Carto basemap.
 * 2. MapLibre often measures the absolute pane before layout settles (#91). After
 *    resize we re-fitBounds (world or selected city) so map.project stays aligned
 *    with the overlay; otherwise every dot can project off-screen and the field
 *    looks "empty" while points.json loaded fine.
 * 3. If projection yields zero in-bounds dots while we have hundreds of points,
 *    fall back to equirectangular for that frame and request a refit.
 * 4. MapLibre is loaded asynchronously so /atlas/points.json + first equirect
 *    paint are not blocked on the ~1MB maplibre-gl chunk (mobile first paint).
 */
export default function MapCanvas({
  points,
  selectedId,
  onSelect,
  onClearSelection,
  filter = null,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapElRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const pointsRef = useRef(points);
  const selectedIdRef = useRef(selectedId);
  const filterRef = useRef(filter);
  const darkRef = useRef(false);
  const mapReadyRef = useRef(false);
  const forceEquirectRef = useRef(false);
  const refitNeededRef = useRef(false);
  const lastSizeRef = useRef({ w: 0, h: 0 });
  const [mapFailed, setMapFailed] = useState(false);
  const hitRef = useRef<{ p: AtlasPoint; x: number; y: number }[]>([]);
  const rafRef = useRef<number | null>(null);
  /** Pre-sorted for paint (paperCount asc, then pop) — avoid sorting 4k rows every frame. */
  const sortedRef = useRef<AtlasPoint[]>([]);

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
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    // Prefer explicit pixel size over inset-0 stretch so bitmap ↔ CSS stay 1:1.
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

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

    const useMap =
      !!map &&
      mapReadyRef.current &&
      !forceEquirectRef.current &&
      !mapFailed;

    const project = (lon: number, lat: number): [number, number] | null => {
      if (useMap && map) {
        try {
          const pt = map.project([lon, lat]);
          if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return null;
          return [pt.x, pt.y];
        } catch {
          /* fall through */
        }
      }
      // Fallback equirectangular if MapLibre is not ready / WebGL failed / projection empty.
      const [[west, south], [east, north]] = WORLD_BOUNDS;
      const x = ((lon - west) / (east - west)) * w;
      const y = ((north - lat) / (north - south)) * h;
      return [x, y];
    };

    const sorted = sortedRef.current.length === pts.length ? sortedRef.current : pts;
    hitRef.current = [];
    let drawn = 0;

    // Quantile breaks for Cooler Cities median UHS (5 classes across the 101).
    let uhsBreaks: number[] = [];
    if (layerFilter === "uhs") {
      const vals = pts
        .map((p) => p.uhs)
        .filter((v): v is number => v != null && Number.isFinite(v))
        .sort((a, b) => a - b);
      if (vals.length >= 5) {
        uhsBreaks = [0.2, 0.4, 0.6, 0.8].map(
          (q) => vals[Math.min(vals.length - 1, Math.floor(q * vals.length))],
        );
      } else if (vals.length > 0) {
        uhsBreaks = [vals[0]];
      }
    }

    const drawOne = (p: AtlasPoint, emphasize: boolean) => {
      const xy = project(p.lon, p.lat);
      if (!xy) return;
      const [x, y] = xy;
      if (x < -10 || y < -10 || x > w + 10 || y > h + 10) return;

      const n = paperCount(p);
      const passes = !layerFilter || hasLayer(p, layerFilter);
      const r = emphasize ? DOT_R_SEL : (layerFilter === "uhs" && passes ? DOT_R + 1.4 : DOT_R);

      const fill = !passes
        ? GREY
        : layerFilter === "uhs"
          ? colorForUhs(p.uhs, uhsBreaks)
          : colorForCount(n);
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
      ctx.globalAlpha = emphasize ? 1 : passes ? (layerFilter === "uhs" ? 0.95 : n > 0 ? 0.92 : 0.4) : 0.28;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (layerFilter === "uhs" && passes && !emphasize) {
        // Ring so the 101 study cities read at world zoom.
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = dark ? "rgba(255,252,247,0.75)" : "rgba(40,28,20,0.55)";
      } else {
        ctx.lineWidth = emphasize ? 2.75 : 0.85;
        ctx.strokeStyle = emphasize ? selStroke : stroke;
      }
      ctx.stroke();

      hitRef.current.push({ p, x, y });
      drawn += 1;
    };

    for (const p of sorted) {
      if (selId != null && p.id === selId) continue;
      drawOne(p, false);
    }
    if (selId != null) {
      const sel = pts.find((p) => p.id === selId);
      if (sel) drawOne(sel, true);
    }

    // Projection went off-screen (typical after zero-size MapLibre init). Fall back
    // once and ask the resize/refit path to realign the camera.
    if (useMap && pts.length >= 50 && drawn === 0) {
      forceEquirectRef.current = true;
      refitNeededRef.current = true;
      // Re-enter with equirectangular so the user sees dots immediately.
      requestAnimationFrame(() => {
        paintDots();
      });
    }
  }, [mapFailed]);

  const schedulePaint = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      paintDots();
    });
  }, [paintDots]);

  const fitCamera = useCallback(
    (map: MapLibreMap, duration: number) => {
      const selId = selectedIdRef.current;
      if (selId == null) {
        map.fitBounds(WORLD_BOUNDS, { padding: 12, duration });
        return;
      }
      const sel = pointsRef.current.find((p) => p.id === selId);
      if (!sel) {
        map.fitBounds(WORLD_BOUNDS, { padding: 12, duration });
        return;
      }
      map.fitBounds(cityBounds(sel.lon, sel.lat), {
        padding: 48,
        duration,
        maxZoom: 11,
      });
    },
    [],
  );

  const syncSizeAndRefit = useCallback(
    (map: MapLibreMap, opts?: { forceRefit?: boolean }) => {
      const wrap = wrapRef.current;
      const mapEl = mapElRef.current;
      if (!wrap || !mapEl) return;

      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w <= 0 || h <= 0) return;

      mapEl.style.width = `${w}px`;
      mapEl.style.height = `${h}px`;
      map.resize();

      const prev = lastSizeRef.current;
      const sizeChanged =
        Math.abs(prev.w - w) > 1 || Math.abs(prev.h - h) > 1 || prev.w === 0;
      lastSizeRef.current = { w, h };

      if (opts?.forceRefit || sizeChanged || refitNeededRef.current) {
        refitNeededRef.current = false;
        forceEquirectRef.current = false;
        // duration 0 so paintDots on the next move/idle sees a settled transform
        fitCamera(map, 0);
      }

      mapReadyRef.current = true;
      schedulePaint();
    },
    [fitCamera, schedulePaint],
  );

  // Keep draw order cache in sync with points (not every pan/zoom frame).
  useEffect(() => {
    sortedRef.current = [...points].sort(
      (a, b) => paperCount(a) - paperCount(b) || a.pop15 - b.pop15,
    );
  }, [points]);

  // Create MapLibre basemap once (async chunk); dots paint on canvas immediately via equirect.
  useEffect(() => {
    const el = mapElRef.current;
    if (!el || mapRef.current) return;

    let cancelled = false;
    let map: MapLibreMap | null = null;
    let media: MediaQueryList | null = null;
    let onScheme: (() => void) | null = null;

    darkRef.current = prefersDarkBasemap();
    // First paint can use equirect while maplibre-gl downloads (~1MB).
    schedulePaint();

    (async () => {
      // Runtime CJS interop: module.default holds Map / controls.
      type MapLibreNS = {
        Map: new (options: ConstructorParameters<typeof MapLibreMap>[0]) => MapLibreMap;
        AttributionControl: new (options?: object) => object;
        NavigationControl: new (options?: object) => object;
      };
      let maplibregl: MapLibreNS;
      try {
        const mod = await import("maplibre-gl");
        // CSS side-effect; Next resolves it without a TS module decl.
        await import(
          /* webpackChunkName: "maplibre-gl-css" */
          "maplibre-gl/dist/maplibre-gl.css"
        );
        maplibregl = (mod as { default: MapLibreNS }).default;
      } catch (err) {
        if (cancelled) return;
        console.warn("Atlas MapLibre load failed; dots still draw on canvas.", err);
        mapReadyRef.current = false;
        setMapFailed(true);
        schedulePaint();
        return;
      }
      if (cancelled || !mapElRef.current) return;

      let live: MapLibreMap;
      try {
        live = new maplibregl.Map({
          container: mapElRef.current,
          style: darkRef.current ? CARTO_STYLE_DARK : CARTO_STYLE_LIGHT,
          bounds: WORLD_BOUNDS,
          fitBoundsOptions: { padding: 12 },
          attributionControl: false,
          cooperativeGestures: true,
          // Soften WebGL requirements so more machines get a basemap.
          canvasContextAttributes: { failIfMajorPerformanceCaveat: false },
        });
      } catch (err) {
        if (cancelled) return;
        console.warn("Atlas MapLibre init failed; dots still draw on canvas.", err);
        mapReadyRef.current = false;
        setMapFailed(true);
        schedulePaint();
        return;
      }
      map = live;

      live.addControl(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: ATTRIBUTION,
        }) as any,
        "bottom-right",
      );
      live.addControl(
        new maplibregl.NavigationControl({ showCompass: false }) as any,
        "top-right",
      );

      const pinStacking = () => {
        // Keep the WebGL basemap under the 2D overlay on GPUs that promote WebGL.
        try {
          const gl = live.getCanvas();
          const box = live.getCanvasContainer();
          gl.style.zIndex = "0";
          box.style.zIndex = "0";
          box.style.position = box.style.position || "absolute";
        } catch {
          /* ignore */
        }
      };

      const onReady = () => {
        if (cancelled) return;
        pinStacking();
        syncSizeAndRefit(live, { forceRefit: true });
      };
      live.on("load", onReady);
      live.on("style.load", onReady);
      live.on("move", schedulePaint);
      live.on("zoom", schedulePaint);
      live.on("resize", schedulePaint);
      live.on("idle", () => {
        if (refitNeededRef.current) syncSizeAndRefit(live, { forceRefit: true });
        else schedulePaint();
      });
      live.on("error", (e) => {
        console.warn("Atlas MapLibre error", e.error ?? e);
      });

      // Canvas overlay uses pointer-events:none so pan/zoom stay on the map.
      // Hit-test dots on map click using the last painted screen positions.
      live.on("click", (e) => {
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

      live.on("mousemove", (e) => {
        const { x, y } = e.point;
        let near = false;
        for (const { x: px, y: py } of hitRef.current) {
          if (Math.hypot(px - x, py - y) <= HIT_PX) {
            near = true;
            break;
          }
        }
        live.getCanvas().style.cursor = near ? "pointer" : "";
      });

      media = window.matchMedia("(prefers-color-scheme: dark)");
      onScheme = () => {
        darkRef.current = prefersDarkBasemap();
        mapReadyRef.current = false;
        forceEquirectRef.current = true; // keep dots visible during style reload
        schedulePaint();
        live.setStyle(darkRef.current ? CARTO_STYLE_DARK : CARTO_STYLE_LIGHT);
        // style.load will flip mapReady and refit
      };
      media.addEventListener("change", onScheme);

      if (cancelled) {
        live.remove();
        return;
      }
      mapRef.current = live;

      // MapLibre often measures before absolute layout settles — sync twice.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!cancelled && mapRef.current === live) {
            syncSizeAndRefit(live, { forceRefit: true });
          }
        }),
      );
    })();

    return () => {
      cancelled = true;
      if (media && onScheme) media.removeEventListener("change", onScheme);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      mapReadyRef.current = false;
    };
  }, [schedulePaint, syncSizeAndRefit]);

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
      forceEquirectRef.current = false;
      fitCamera(map, duration);
    };

    if (map.isStyleLoaded()) go();
    else map.once("load", go);
  }, [selectedId, fitCamera, schedulePaint]);

  // ResizeObserver keeps canvas + map in sync with layout.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      const map = mapRef.current;
      if (map) syncSizeAndRefit(map);
      else schedulePaint();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [schedulePaint, syncSizeAndRefit]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const goWorldView = useCallback(() => {
    onClearSelection?.();
    const map = mapRef.current;
    if (!map) {
      schedulePaint();
      return;
    }
    const duration = prefersReducedMotion() ? 0 : ZOOM_MS;
    forceEquirectRef.current = false;
    // Always fit the default world extent (do not wait on selectedId clearing).
    map.fitBounds(WORLD_BOUNDS, { padding: 12, duration });
  }, [onClearSelection, schedulePaint]);

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label="World map of cities colored by how many papers cover each city"
      className="relative isolate z-0 h-[min(62vw,520px)] min-h-[360px] w-full overflow-hidden rounded-lg border border-rule bg-paper-warm [&_.maplibregl-ctrl-attrib]:text-[10px] [&_.maplibregl-ctrl-attrib]:leading-tight"
    >
      {/* z-0 + isolate: contain WebGL compositing so the overlay can sit above */}
      <div
        ref={mapElRef}
        className="absolute inset-0 z-0 h-full w-full"
        style={{ zIndex: 0 }}
      />
      {points.length === 0 && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-paper-warm/50"
          aria-live="polite"
        >
          <span className="rounded-md border border-rule bg-paper/95 px-3 py-1.5 text-xs text-ink-muted shadow-sm">
            <T en="Loading cities…" zh="正在加载城市…" />
          </span>
        </div>
      )}
      {/* Explicit world reset — MapLibre nav is top-right; keep this top-left. */}
      <button
        type="button"
        onClick={goWorldView}
        className={
          selectedId != null
            ? "absolute left-3 top-3 z-[3] rounded-md border border-ember bg-paper px-2.5 py-1.5 text-xs font-medium text-ember-dark shadow-sm hover:bg-ember-light focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
            : "absolute left-3 top-3 z-[3] rounded-md border border-rule bg-paper/95 px-2.5 py-1.5 text-xs font-medium text-ink-muted shadow-sm hover:border-ember hover:text-ember focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
        }
        aria-label="Zoom out to world view"
        title="Zoom out to world view"
      >
        <T en="World view" zh="全球视图" />
      </button>
      {/* translateZ(0) promotes a compositor layer above WebGL on flaky GPUs */}
      <canvas
        ref={canvasRef}
        className={
          mapFailed
            ? "absolute left-0 top-0 z-[2] cursor-crosshair"
            : "pointer-events-none absolute left-0 top-0 z-[2]"
        }
        style={{
          zIndex: 2,
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
        }}
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
