"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import MapCanvas from "./MapCanvas";
import CitySearch from "./CitySearch";
import CityCard from "./CityCard";
import T from "@/components/T";
import {
  parsePoints,
  type AtlasPoint,
  type AtlasPointsFile,
  type CityDetail,
} from "@/lib/atlas";

const SUGGESTED = ["lagos", "shanghai", "new-york", "jakarta", "nairobi"];

export default function AtlasExplorer() {
  const [points, setPoints] = useState<AtlasPoint[]>([]);
  const [meta, setMeta] = useState<AtlasPointsFile | null>(null);
  const [land, setLand] = useState<Record<string, unknown> | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [city, setCity] = useState<CityDetail | null>(null);
  const [loadingCity, setLoadingCity] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const covered = meta?.counts.massMatch
    ? meta.counts.massMatch.exact + meta.counts.massMatch.flagged
    : null;

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
          <MapCanvas
            points={points}
            selectedId={selectedId}
            onSelect={select}
            land={land as never}
          />
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "rgb(13,115,119)" }} />
              <T en="Lower mass / person" zh="人均建成质量较低" />
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "rgb(199,75,22)" }} />
              <T en="Higher mass / person" zh="人均建成质量较高" />
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[rgba(120,110,100,0.45)]" />
              <T en="Not covered" zh="未覆盖" />
            </span>
            {meta && (
              <span className="ml-auto">
                <T
                  en={`${meta.counts.mapped.toLocaleString()} cities · ${covered?.toLocaleString() ?? "—"} with mass data`}
                  zh={`${meta.counts.mapped.toLocaleString()} 座城市 · ${covered?.toLocaleString() ?? "—"} 座有建成质量数据`}
                />
              </span>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          {selectedId == null && !loadingCity ? (
            <aside className="rounded-lg border border-dashed border-rule bg-paper-warm/40 p-5 text-sm text-ink-muted">
              <T
                en="Click a city on the map, or search above, to see what the built-mass paper says about it."
                zh="在地图上点击一座城市，或在上方搜索，查看建成质量论文对该城市的结果。"
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
