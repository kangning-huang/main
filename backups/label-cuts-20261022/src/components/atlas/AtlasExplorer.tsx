"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import CitySearch from "./CitySearch";
import CityCard from "./CityCard";
import T from "@/components/T";
import {
  fetchAtlasPoints,
  parsePoints,
  paperCount,
  type AtlasPoint,
  type AtlasPointsFile,
  type CityDetail,
  type LayerKey,
} from "@/lib/atlas";
import { PAPER_COUNT_COLORS } from "@/lib/atlas-colors";

/** MapLibre stays in its own chunk; explorer + points.json are not blocked on it. */
const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[min(62vw,520px)] min-h-[360px] w-full items-center justify-center rounded-lg border border-rule bg-paper-warm text-xs text-ink-muted">
      <T en="Loading map…" zh="正在加载地图…" />
    </div>
  ),
});

const FILTERS: { key: LayerKey | null; en: string; zh: string }[] = [
  { key: null, en: "All studies", zh: "全部研究" },
  { key: "mass", en: "Built mass", zh: "建成质量" },
  { key: "heat", en: "Heat-island trend", zh: "热岛趋势" },
  { key: "cooling", en: "Demolition cooling", zh: "拆除降温" },
  { key: "flood", en: "Flood damage", zh: "洪涝损失" },
  { key: "expansion", en: "Expansion 2050", zh: "2050 年扩张" },
  { key: "jgr", en: "Night heat stress", zh: "夜间热应激" },
];

const SUGGESTED = ["lagos", "shanghai", "new-york", "jakarta", "nairobi"];

export default function AtlasExplorer() {
  const [points, setPoints] = useState<AtlasPoint[]>([]);
  const [meta, setMeta] = useState<AtlasPointsFile | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [city, setCity] = useState<CityDetail | null>(null);
  const [loadingCity, setLoadingCity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LayerKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Warm the MapLibre chunk in parallel with points.json.
    void import("maplibre-gl");
    (async () => {
      try {
        const ptsFile = await fetchAtlasPoints();
        if (cancelled) return;
        setMeta(ptsFile);
        setPoints(parsePoints(ptsFile));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Load error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const bySlug = useMemo(() => {
    const m = new Map<string, AtlasPoint>();
    for (const p of points) m.set(p.slug, p);
    return m;
  }, [points]);

  const multiCount = useMemo(
    () => points.filter((p) => paperCount(p) >= 2).length,
    [points],
  );

  const select = useCallback(async (id: number) => {
    setSelectedId(id);
    setLoadingCity(true);
    setCity(null);
    try {
      const res = await fetch(`/atlas/city/${id}.json`);
      if (!res.ok) throw new Error("City not found");
      const detail = (await res.json()) as CityDetail;
      setCity(detail);
    } catch {
      setCity(null);
    } finally {
      setLoadingCity(false);
    }
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <CitySearch points={points} onSelect={select} />
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-ink-faint">
            <T en="Try:" zh="试试" />
          </span>
          {SUGGESTED.map((slug) => {
            const p = bySlug.get(slug);
            if (!p) return null;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => select(p.id)}
                className="rounded-full border border-rule px-2.5 py-0.5 text-ink-muted hover:border-ember hover:text-ember"
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded border border-ember bg-ember-light px-3 py-2 text-sm text-ember-dark">
          {error}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div>
          <div
            role="radiogroup"
            aria-label="Filter by study"
            className="mb-3 flex flex-wrap gap-2 text-sm"
          >
            {FILTERS.map((f) => (
              <button
                key={String(f.key)}
                type="button"
                role="radio"
                aria-checked={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={
                  filter === f.key
                    ? "rounded-full border border-ember bg-ember-light px-3 py-1 text-ember-dark"
                    : "rounded-full border border-rule px-3 py-1 text-ink-muted hover:border-ember hover:text-ember"
                }
              >
                <T en={f.en} zh={f.zh} />
              </button>
            ))}
          </div>
          <MapCanvas
            filter={filter}
            points={points}
            selectedId={selectedId}
            onSelect={select}
            onClearSelection={() => {
              setSelectedId(null);
              setCity(null);
            }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
            <span className="text-ink-faint">
              <T en="Papers covering city:" zh="覆盖这座城市的论文" />
            </span>
            <Swatch color={PAPER_COUNT_COLORS[1]} en="1" zh="1" />
            <Swatch color={PAPER_COUNT_COLORS[2]} en="2" zh="2" />
            <Swatch color={PAPER_COUNT_COLORS[3]} en="3" zh="3" />
            <Swatch color={PAPER_COUNT_COLORS[4]} en="4" zh="4" />
            <Swatch color={PAPER_COUNT_COLORS[5]} en="5" zh="5" />
            <Swatch color={PAPER_COUNT_COLORS[6]} en="6" zh="6" />
            <Swatch color={PAPER_COUNT_COLORS[0]} en="None" zh="无" />
            {meta && (
              <span className="ml-auto">
                <T
                  en={`${meta.counts.mapped.toLocaleString()} cities · ${multiCount.toLocaleString()} with 2+ papers`}
                  zh={`${meta.counts.mapped.toLocaleString()} 座城市 · ${multiCount.toLocaleString()} 座有至少 2 篇论文覆盖`}
                />
              </span>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          {selectedId == null && !loadingCity ? (
            <aside className="rounded-lg border border-dashed border-rule bg-paper-warm/40 p-5 text-sm text-ink-muted">
              <T
                en="Click a city on the map, or search above, to see what each paper says about it. Dot color is how many papers cover that city."
                zh="点击地图上的城市，或在上方搜索城市名，就能查看各篇论文在这里的研究结果。圆点颜色表示有多少篇论文覆盖这座城市。"
              />
            </aside>
          ) : (
            <CityCard
              city={city}
              loading={loadingCity}
              onClose={() => {
                setSelectedId(null);
                setCity(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Swatch({ color, en, zh }: { color: string; en: string; zh: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <T en={en} zh={zh} />
    </span>
  );
}
