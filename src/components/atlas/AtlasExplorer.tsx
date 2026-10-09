"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import MapCanvas, { PAPER_COUNT_COLORS } from "./MapCanvas";
import CitySearch from "./CitySearch";
import CityCard from "./CityCard";
import T from "@/components/T";
import {
  parsePoints,
  paperCount,
  type AtlasPoint,
  type AtlasPointsFile,
  type CityDetail,
  type LayerKey,
} from "@/lib/atlas";

const FILTERS: { key: LayerKey | null; en: string; zh: string }[] = [
  { key: null, en: "All studies", zh: "全部研究" },
  { key: "mass", en: "Built mass", zh: "建成质量" },
  { key: "heat", en: "Heat-island trend", zh: "热岛趋势" },
  { key: "cooling", en: "Demolition cooling", zh: "拆除降温" },
  { key: "flood", en: "Flood damage", zh: "洪涝损失" },
];

const SUGGESTED = ["lagos", "shanghai", "new-york", "jakarta", "nairobi"];

export default function AtlasExplorer() {
  const [points, setPoints] = useState<AtlasPoint[]>([]);
  const [meta, setMeta] = useState<AtlasPointsFile | null>(null);
  const [land, setLand] = useState<Record<string, unknown> | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [city, setCity] = useState<CityDetail | null>(null);
  const [loadingCity, setLoadingCity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LayerKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ptsRes, landRes] = await Promise.all([
          fetch("/atlas/points.json"),
          fetch("/atlas/land-110m.json"),
        ]);
        if (!ptsRes.ok || !landRes.ok) throw new Error("Failed to load atlas data");
        const ptsFile = (await ptsRes.json()) as AtlasPointsFile;
        const landTopo = (await landRes.json()) as Record<string, unknown>;
        if (cancelled) return;
        setMeta(ptsFile);
        setPoints(parsePoints(ptsFile));
        setLand(landTopo);
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
            <T en="Try:" zh="试试：" />
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
            land={land as never}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
            <span className="text-ink-faint">
              <T en="Papers covering city:" zh="覆盖该城市的论文数：" />
            </span>
            <Swatch color={PAPER_COUNT_COLORS[1]} en="1" zh="1" />
            <Swatch color={PAPER_COUNT_COLORS[2]} en="2" zh="2" />
            <Swatch color={PAPER_COUNT_COLORS[3]} en="3" zh="3" />
            <Swatch color={PAPER_COUNT_COLORS[4]} en="4+" zh="4+" />
            <Swatch color={PAPER_COUNT_COLORS[0]} en="None" zh="无" />
            {meta && (
              <span className="ml-auto">
                <T
                  en={`${meta.counts.mapped.toLocaleString()} cities · ${multiCount.toLocaleString()} with 2+ papers`}
                  zh={`${meta.counts.mapped.toLocaleString()} 座城市 · ${multiCount.toLocaleString()} 座有 2 篇及以上`}
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
                zh="在地图上点击一座城市，或在上方搜索，查看各篇论文对该城市的结果。圆点颜色表示覆盖该城市的论文数量。"
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
