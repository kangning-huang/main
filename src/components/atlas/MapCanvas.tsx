"use client";

import { useEffect, useRef } from "react";
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

/** Carto Positron (light) / Dark Matter (vector). No API key required for vector styles today. */
export const CARTO_STYLE_LIGHT =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
export const CARTO_STYLE_DARK =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors © <a href="https://carto.com/attribution/" target="_blank" rel="noopener noreferrer">CARTO</a>';

/** Angular half-width (°) of the regional frame around a selected city — closer than the prior 18°. */
const CITY_RADIUS_DEG = 9;
const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-168, -56],
  [188, 75],
];
const ZOOM_MS = 480;
const SOURCE_ID = "atlas-cities";
const LAYER_ID = "atlas-cities-circles";
const LAYER_SEL_ID = "atlas-cities-selected";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function prefersDarkBasemap(): boolean {
  if (typeof window === "undefined") return false;
  // Site has no dark-mode toggle yet; follow the browser / OS preference.
  // If a site theme (html.dark / data-theme="dark") is added later, prefer that.
  const root = document.documentElement;
  if (root.classList.contains("dark") || root.dataset.theme === "dark") return true;
  if (root.classList.contains("light") || root.dataset.theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function pointsToGeoJSON(
  points: AtlasPoint[],
  filter: LayerKey | null,
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = points.map((p) => {
    const n = paperCount(p);
    const passes = !filter || hasLayer(p, filter);
    return {
      type: "Feature",
      id: p.id,
      properties: {
        id: p.id,
        name: p.name,
        papers: n,
        color: passes ? colorForCount(n) : GREY,
        opacity: passes && n > 0 ? 0.9 : 0.45,
        sort: n,
      },
      geometry: {
        type: "Point",
        coordinates: [p.lon, p.lat],
      },
    };
  });
  // Higher paper counts on top.
  features.sort(
    (a, b) =>
      ((a.properties?.sort as number) ?? 0) - ((b.properties?.sort as number) ?? 0),
  );
  return { type: "FeatureCollection", features };
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

function addCityLayers(map: maplibregl.Map) {
  if (map.getLayer(LAYER_ID)) return;

  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      promoteId: "id",
    });
  }

  map.addLayer({
    id: LAYER_ID,
    type: "circle",
    source: SOURCE_ID,
    paint: {
      "circle-radius": 2.6,
      "circle-color": ["get", "color"],
      "circle-opacity": ["get", "opacity"],
      "circle-stroke-width": 0,
    },
  });

  map.addLayer({
    id: LAYER_SEL_ID,
    type: "circle",
    source: SOURCE_ID,
    filter: ["==", ["get", "id"], -1],
    paint: {
      "circle-radius": 4.2,
      "circle-color": ["get", "color"],
      "circle-opacity": 1,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#281c14",
    },
  });
}

export default function MapCanvas({
  points,
  selectedId,
  onSelect,
  filter = null,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const pointsRef = useRef(points);
  const selectedIdRef = useRef(selectedId);
  const filterRef = useRef(filter);
  const readyRef = useRef(false);

  onSelectRef.current = onSelect;
  pointsRef.current = points;
  selectedIdRef.current = selectedId;
  filterRef.current = filter;

  // Create map once.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || mapRef.current) return;

    const dark = prefersDarkBasemap();
    const map = new maplibregl.Map({
      container: el,
      style: dark ? CARTO_STYLE_DARK : CARTO_STYLE_LIGHT,
      bounds: WORLD_BOUNDS,
      fitBoundsOptions: { padding: 12 },
      attributionControl: false,
      cooperativeGestures: true,
    });

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

    const onStyleReady = () => {
      addCityLayers(map);
      const src = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (src) {
        src.setData(pointsToGeoJSON(pointsRef.current, filterRef.current));
      }
      // Re-apply selection filter after style swap.
      if (map.getLayer(LAYER_SEL_ID)) {
        map.setFilter(LAYER_SEL_ID, [
          "==",
          ["get", "id"],
          selectedIdRef.current ?? -1,
        ]);
      }
      readyRef.current = true;
    };

    map.on("load", onStyleReady);
    map.on("style.load", onStyleReady);

    map.on("click", LAYER_ID, (e) => {
      const f = e.features?.[0];
      const id = f?.properties?.id;
      if (typeof id === "number") onSelectRef.current(id);
      else if (typeof id === "string" && id !== "") onSelectRef.current(Number(id));
    });

    map.on("mouseenter", LAYER_ID, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", LAYER_ID, () => {
      map.getCanvas().style.cursor = "";
    });

    // Also allow clicking the selected overlay.
    map.on("click", LAYER_SEL_ID, (e) => {
      const f = e.features?.[0];
      const id = f?.properties?.id;
      if (typeof id === "number") onSelectRef.current(id);
      else if (typeof id === "string" && id !== "") onSelectRef.current(Number(id));
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      const nextDark = prefersDarkBasemap();
      const nextStyle = nextDark ? CARTO_STYLE_DARK : CARTO_STYLE_LIGHT;
      const current = map.getStyle()?.name ?? "";
      // setStyle always; MapLibre will reload vector tiles.
      void current;
      readyRef.current = false;
      map.setStyle(nextStyle);
    };
    media.addEventListener("change", onScheme);

    mapRef.current = map;

    return () => {
      media.removeEventListener("change", onScheme);
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
  }, []);

  // Sync GeoJSON when points / filter change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      if (!map.getSource(SOURCE_ID)) addCityLayers(map);
      const src = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(pointsToGeoJSON(points, filter));
    };

    if (map.isStyleLoaded()) apply();
    else map.once("style.load", apply);
  }, [points, filter]);

  // Zoom to selected city (or back to world).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const duration = prefersReducedMotion() ? 0 : ZOOM_MS;
    const go = () => {
      if (selectedId == null) {
        map.fitBounds(WORLD_BOUNDS, { padding: 12, duration });
        if (map.getLayer(LAYER_SEL_ID)) {
          map.setFilter(LAYER_SEL_ID, ["==", ["get", "id"], -1]);
        }
        return;
      }
      const sel = pointsRef.current.find((p) => p.id === selectedId);
      if (!sel) return;
      if (map.getLayer(LAYER_SEL_ID)) {
        map.setFilter(LAYER_SEL_ID, ["==", ["get", "id"], selectedId]);
      }
      map.fitBounds(cityBounds(sel.lon, sel.lat), {
        padding: 36,
        duration,
        maxZoom: 9.5,
      });
    };

    if (map.isStyleLoaded()) go();
    else map.once("load", go);
  }, [selectedId]);

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label="World map of cities colored by how many papers cover each city"
      className="relative h-[min(62vw,520px)] min-h-[360px] w-full overflow-hidden rounded-lg border border-rule bg-paper-warm [&_.maplibregl-ctrl-attrib]:text-[10px] [&_.maplibregl-ctrl-attrib]:leading-tight"
    />
  );
}
