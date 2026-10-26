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
  hasLayer,
  type AtlasPoint,
  type AtlasPointsFile,
  type CityDetail,
  type LayerKey,
} from "@/lib/atlas";
import {
  PAPER_COUNT_COLORS,
  SEQ_TEAL,
  SEQ_COOLING,
  DIV_HEAT,
  ATLAS_DOT_GREY,
} from "@/lib/atlas-colors";

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
  { key: "uhs", en: "Cooler Cities · 101", zh: "更凉爽城市 · 101" },
];

type LegendSpec = {
  titleEn: string;
  titleZh: string;
  swatches: { color: string; en: string; zh: string }[];
  notEn: string;
  notZh: string;
};

const LAYER_LEGENDS: Record<LayerKey, LegendSpec> = {
  mass: {
    titleEn: "Mass per person",
    titleZh: "人均建成质量",
    swatches: [
      { color: SEQ_TEAL[0], en: "lower", zh: "较低" },
      { color: SEQ_TEAL[2], en: "mid", zh: "中等" },
      { color: SEQ_TEAL[4], en: "higher", zh: "较高" },
    ],
    notEn: "Not in study",
    notZh: "不在研究中",
  },
  heat: {
    titleEn: "Daytime heat-island trend (°C/decade)",
    titleZh: "白天热岛趋势（°C/十年）",
    swatches: [
      { color: DIV_HEAT[0], en: "cooling", zh: "降温" },
      { color: DIV_HEAT[2], en: "near 0", zh: "接近 0" },
      { color: DIV_HEAT[4], en: "warming", zh: "升温" },
    ],
    notEn: "Not in study",
    notZh: "不在研究中",
  },
  cooling: {
    titleEn: "Site cooling (DID)",
    titleZh: "地块降温（DID）",
    swatches: [
      { color: SEQ_COOLING[0], en: "stronger", zh: "更强" },
      { color: SEQ_COOLING[2], en: "mid", zh: "中等" },
      { color: SEQ_COOLING[4], en: "weaker", zh: "较弱" },
    ],
    notEn: "Not in study",
    notZh: "不在研究中",
  },
  flood: {
    titleEn: "Flood damage share",
    titleZh: "洪涝损失占比",
    swatches: [
      { color: SEQ_TEAL[0], en: "lower", zh: "较低" },
      { color: SEQ_TEAL[2], en: "mid", zh: "中等" },
      { color: SEQ_TEAL[4], en: "higher", zh: "较高" },
    ],
    notEn: "Not in study",
    notZh: "不在研究中",
  },
  expansion: {
    titleEn: "Urban land 2050 (SSP5)",
    titleZh: "2050 城市用地（SSP5）",
    swatches: [
      { color: SEQ_TEAL[0], en: "smaller", zh: "较小" },
      { color: SEQ_TEAL[2], en: "mid", zh: "中等" },
      { color: SEQ_TEAL[4], en: "larger", zh: "较大" },
    ],
    notEn: "Not in study",
    notZh: "不在研究中",
  },
  jgr: {
    titleEn: "Night ΔWBGT",
    titleZh: "夜间 ΔWBGT",
    swatches: [
      { color: DIV_HEAT[0], en: "cooler", zh: "变凉" },
      { color: DIV_HEAT[2], en: "near 0", zh: "接近 0" },
      { color: DIV_HEAT[4], en: "warmer", zh: "变热" },
    ],
    notEn: "Not in study",
    notZh: "不在研究中",
  },
  uhs: {
    titleEn: "Median block scale (UHS)",
    titleZh: "中位同质功能区尺度（UHS）",
    swatches: [
      { color: SEQ_TEAL[0], en: "smaller", zh: "较小" },
      { color: SEQ_TEAL[2], en: "mid", zh: "中等" },
      { color: SEQ_TEAL[4], en: "larger", zh: "较大" },
    ],
    notEn: "Not in 101",
    notZh: "不在 101 城样本",
  },
};

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

  const filterCount = useMemo(() => {
    if (!filter) return 0;
    return points.filter((p) => hasLayer(p, filter)).length;
  }, [points, filter]);

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

  const legend = filter ? LAYER_LEGENDS[filter] : null;

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
            {legend ? (
              <>
                <span className="text-ink-faint">
                  <T en={`${legend.titleEn}:`} zh={`${legend.titleZh}：`} />
                </span>
                {legend.swatches.map((s) => (
                  <Swatch key={s.en} color={s.color} en={s.en} zh={s.zh} />
                ))}
                <Swatch color={ATLAS_DOT_GREY} en={legend.notEn} zh={legend.notZh} />
              </>
            ) : (
              <>
                <span className="text-ink-faint">
                  <T en="Papers covering city:" zh="覆盖这座城市的论文" />
                </span>
                <Swatch color={PAPER_COUNT_COLORS[1]} en="1" zh="1" />
                <Swatch color={PAPER_COUNT_COLORS[2]} en="2" zh="2" />
                <Swatch color={PAPER_COUNT_COLORS[3]} en="3" zh="3" />
                <Swatch color={PAPER_COUNT_COLORS[4]} en="4" zh="4" />
                <Swatch color={PAPER_COUNT_COLORS[5]} en="5" zh="5" />
                <Swatch color={PAPER_COUNT_COLORS[6]} en="6+" zh="6+" />
                <Swatch color={PAPER_COUNT_COLORS[0]} en="None" zh="无" />
              </>
            )}
            {meta && (
              <span className="ml-auto">
                {filter ? (
                  <T
                    en={`${filterCount.toLocaleString()} cities in this study`}
                    zh={`本项研究覆盖 ${filterCount.toLocaleString()} 座城市`}
                  />
                ) : (
                  <T
                    en={`${meta.counts.mapped.toLocaleString()} cities · ${multiCount.toLocaleString()} with 2+ papers`}
                    zh={`${meta.counts.mapped.toLocaleString()} 座城市 · ${multiCount.toLocaleString()} 座有至少 2 篇论文覆盖`}
                  />
                )}
              </span>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          {selectedId != null || loadingCity ? (
            <CityCard
              city={city}
              loading={loadingCity}
              onClose={() => {
                setSelectedId(null);
                setCity(null);
              }}
            />
          ) : null}
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
