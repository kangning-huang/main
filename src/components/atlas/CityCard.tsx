"use client";

import Link from "next/link";
import type { CityDetail } from "@/lib/atlas";
import { MASS_PAPER, HEAT_PAPER, COOLING_PAPER, formatPop, formatMassT } from "@/lib/atlas";
import T from "@/components/T";

type Props = {
  city: CityDetail | null;
  loading: boolean;
  onClose: () => void;
};

export default function CityCard({ city, loading, onClose }: Props) {
  if (loading) {
    return (
      <aside className="rounded-lg border border-rule bg-paper p-5 shadow-sm">
        <p className="text-sm text-ink-muted">
          <T en="Loading city…" zh="加载城市中…" />
        </p>
      </aside>
    );
  }
  if (!city) return null;

  const mass = city.layers.mass;
  const heat = city.layers.heat;
  const cooling = city.layers.cooling;
  const nLayers = [mass, heat, cooling].filter(Boolean).length;

  return (
    <aside
      className="rounded-lg border border-rule bg-paper p-5 shadow-sm"
      aria-label={`${city.name} city card`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink">{city.name}</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            {city.country}
            {city.region ? ` · ${city.region}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded px-2 py-1 text-xs text-ink-faint hover:bg-paper-warm hover:text-ink"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-faint">
            <T en="Population (2015)" zh="人口（2015）" />
          </dt>
          <dd className="mt-0.5 font-medium text-ink">{formatPop(city.ucdb.pop15)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-faint">
            <T en="Urban extent" zh="城市范围" />
          </dt>
          <dd className="mt-0.5 font-medium text-ink">
            {city.ucdb.areaKm2.toLocaleString()} km²
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-ink-faint">
        <T
          en={`Covered by ${nLayers} of 3 mapped studies.`}
          zh={`3 项已上图研究中覆盖 ${nLayers} 项。`}
        />
      </p>

      {/* Built mass panel */}
      <section className="mt-5 rounded-md border border-rule-faint bg-paper-warm/60 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-ink">
            <T en="Built mass & scaling" zh="建成质量与标度" />
          </h3>
          <span className="rounded bg-teal-light px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teal">
            {MASS_PAPER.venue}
          </span>
        </div>

        {!mass ? (
          <p className="mt-3 text-sm text-ink-muted">
            <T
              en="Not covered in the city-mass dataset for this GHSL urban centre."
              zh="该 GHSL 城市中心未包含在建成质量数据集中。"
            />
          </p>
        ) : (
          <>
            {mass.quality === "flagged" && (
              <p className="mt-2 rounded bg-ember-light px-2 py-1 text-xs text-ember-dark">
                <T
                  en={`Match flagged: ${mass.match.reason ?? "name or location uncertain"}. Values shown for the matched record (${mass.match.sourceName}).`}
                  zh={`匹配存疑：${mass.match.reason ?? "名称或位置不确定"}。以下数值来自匹配记录（${mass.match.sourceName}）。`}
                />
              </p>
            )}

            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-ink-faint">
                  <T en="Mass per person" zh="人均建成质量" />
                </dt>
                <dd className="mt-0.5 text-lg font-medium text-ink">
                  {mass.massPerCapT.toLocaleString()} t
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-faint">
                  <T en="vs. scaling line" zh="相对标度线" />
                </dt>
                <dd className="mt-0.5 text-lg font-medium text-ink">
                  {mass.vsScaling >= 1 ? "+" : ""}
                  {((mass.vsScaling - 1) * 100).toFixed(0)}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-faint">
                  <T en="Total built mass" zh="建成质量总量" />
                </dt>
                <dd className="mt-0.5 font-medium text-ink">{formatMassT(mass.massT)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-faint">
                  <T en="Dataset population" zh="数据集人口" />
                </dt>
                <dd className="mt-0.5 font-medium text-ink">{formatPop(mass.pop)}</dd>
              </div>
            </dl>

            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              <T
                en={
                  mass.vsScaling >= 1
                    ? `About ${((mass.vsScaling - 1) * 100).toFixed(0)}% more built mass than cities of similar size on the global scaling line (β ≈ 0.90).`
                    : `About ${((1 - mass.vsScaling) * 100).toFixed(0)}% less built mass than cities of similar size on the global scaling line (β ≈ 0.90).`
                }
                zh={
                  mass.vsScaling >= 1
                    ? `比全球标度线上同等规模城市的建成质量约高 ${((mass.vsScaling - 1) * 100).toFixed(0)}%（β ≈ 0.90）。`
                    : `比全球标度线上同等规模城市的建成质量约低 ${((1 - mass.vsScaling) * 100).toFixed(0)}%（β ≈ 0.90）。`
                }
              />
            </p>

            <p className="mt-2 border-l-2 border-rule pl-2 text-xs italic text-ink-faint">
              <T
                en="What this number is not: it is not a judgment that the city is over- or under-built in a planning sense — only its position relative to the empirical scaling relationship across ~3,600 cities."
                zh="这个数字不是什么：它不是对该城市“建多了/建少了”的规划评价，而只是它在约 3,600 座城市经验标度关系中的相对位置。"
              />
            </p>

            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link
                href={MASS_PAPER.publicationsHref}
                className="text-ember hover:underline"
              >
                <T en="Paper (in press) →" zh="论文（即将发表）→" />
              </Link>
              <a
                href={MASS_PAPER.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal hover:underline"
              >
                <T en="Full app →" zh="完整应用 →" />
              </a>
            </div>
          </>
        )}
      </section>

      {/* Heat-island trend panel */}
      <section className="mt-4 rounded-md border border-rule-faint bg-paper-warm/60 p-4">
        <PanelHead en="Surface heat-island trend, 2003–2020" zh="地表热岛趋势（2003–2020）" venue={`${HEAT_PAPER.venue} ${HEAT_PAPER.year}`} />
        {!heat ? (
          <NotCovered en="Not covered by this study (it covers the ~1,000 largest functional urban areas)." zh="该研究未覆盖此城市（研究范围为约 1,000 个最大的功能城市区）。" />
        ) : (
          <>
            {(heat.quality === "flagged" || heat.fua.name !== city.name) && (
              <p className="mt-2 rounded bg-ember-light px-2 py-1 text-xs text-ember-dark">
                <T
                  en={`Values are for the whole functional urban area “${heat.fua.name}”${heat.quality === "flagged" ? " (name shared by more than one area; largest one used)" : ""}.`}
                  zh={`数值对应整个功能城市区“${heat.fua.name}”${heat.quality === "flagged" ? "（多个区域同名，取人口最大者）" : ""}。`}
                />
              </p>
            )}
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Stat en="Day · where people live" zh="白天 · 人口加权" value={fmtTrend(heat.dayP)} big />
              <Stat en="Day · area average" zh="白天 · 面积平均" value={fmtTrend(heat.dayA)} big />
              <Stat en="Night · where people live" zh="夜间 · 人口加权" value={fmtTrend(heat.nightP)} />
              <Stat en="Night · area average" zh="夜间 · 面积平均" value={fmtTrend(heat.nightA)} />
            </dl>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              <T
                en={`From 2003 to 2020, the daytime heat-island extreme where residents live ${trendWord(heat.dayP, "en")} (area average: ${fmtTrend(heat.dayA)}).`}
                zh={`2003–2020 年，居民所在处的日间热岛极值${trendWord(heat.dayP, "zh")}（面积平均：${fmtTrend(heat.dayA)}）。`}
              />
            </p>
            <Not
              en="What this number is not: not air temperature and not a forecast. It is the historical trend of the hottest 1% of land-surface heat-island values (MODIS), °C per decade."
              zh="这个数字不是什么：不是气温，也不是预测；它是地表热岛最热 1% 值（MODIS）的历史趋势，单位 °C/十年。"
            />
            <Links doi={HEAT_PAPER.doiUrl} />
          </>
        )}
      </section>

      {/* Informal-settlement cooling panel */}
      <section className="mt-4 rounded-md border border-rule-faint bg-paper-warm/60 p-4">
        <PanelHead en="Cooling after informal-settlement demolition" zh="城中村拆除后的降温" venue={`npj ${COOLING_PAPER.year}`} />
        {!cooling ? (
          <NotCovered en="Not covered by this study (Beijing, Shanghai and Guangzhou only)." zh="该研究未覆盖此城市（仅北京、上海、广州）。" />
        ) : (
          <>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Stat en="Surface cooling (DID)" zh="地表降温（双重差分）" value={`${cooling.effectK.toFixed(2)} K`} big />
              <Stat en="95% interval" zh="95% 区间" value={`${cooling.ciLo.toFixed(2)} to ${cooling.ciHi.toFixed(2)} K`} />
            </dl>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              <T
                en={`Demolished informal-settlement sites here cooled by about ${Math.abs(cooling.effectK).toFixed(1)} K in land-surface temperature relative to comparable sites that were not demolished (all three cities pooled: ${Math.abs(cooling.pooledK).toFixed(1)} K).`}
                zh={`与未拆除的可比地块相比，这里被拆除的城中村地块地表温度约下降 ${Math.abs(cooling.effectK).toFixed(1)} K（三城合并：${Math.abs(cooling.pooledK).toFixed(1)} K）。`}
              />
            </p>
            <Not
              en="What this number is not: not a city-wide cooling and not a health benefit. It applies to the demolished sites only (about 7.7 km² across all three cities), and depends on what was built afterwards."
              zh="这个数字不是什么：不是全城降温，也不等于健康收益；它只针对被拆除的地块（三城合计约 7.7 km²），并取决于拆除后的用地。"
            />
            <Links doi={COOLING_PAPER.doiUrl} app={COOLING_PAPER.appUrl} />
          </>
        )}
      </section>

      {/* Coming layers */}
      <div className="mt-4 space-y-2">
        <ComingRow
          en="Flood risk with building height & protection"
          zh="考虑建筑高度与防洪标准的洪涝风险"
          noteEn="Coming — Scientific Reports 2026; city table being checked against the published paper."
          noteZh="即将加入 — Scientific Reports 2026；城市表正在与已发表论文核对。"
        />
        <ComingRow
          en="Urban expansion to 2050"
          zh="至 2050 年城市扩张"
          noteEn="Coming — city-level crosswalk for the ERL 2019 projections is not in this build."
          noteZh="即将加入 — 本版尚未接入 ERL 2019 预测的城市级对照。"
        />
        <ComingRow
          en="Functional clusters & cooling (101 cities)"
          zh="功能簇与降温（101 座城市）"
          noteEn="Coming — PNAS paper in press."
          noteZh="即将加入 — PNAS 论文即将发表。"
        />
        <ComingRow
          en="SSA infrastructure"
          zh="撒哈拉以南非洲基础设施"
          noteEn="Coming — Nature Communications paper in revision."
          noteZh="即将加入 — Nature Communications 论文修订中。"
        />
      </div>
    </aside>
  );
}

function ComingRow({
  en,
  zh,
  noteEn,
  noteZh,
}: {
  en: string;
  zh: string;
  noteEn: string;
  noteZh: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-rule px-3 py-2 opacity-60">
      <p className="text-sm text-ink-muted">
        <T en={en} zh={zh} />{" "}
        <span className="text-[10px] uppercase tracking-wide">
          <T en="coming" zh="即将推出" />
        </span>
      </p>
      <p className="mt-0.5 text-xs text-ink-faint">
        <T en={noteEn} zh={noteZh} />
      </p>
    </div>
  );
}

function fmtTrend(v: number): string {
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)} °C/decade`;
}

function trendWord(v: number, lang: "en" | "zh"): string {
  const a = Math.abs(v).toFixed(2);
  if (lang === "en") return v > 0 ? `strengthened by ${a} °C per decade` : v < 0 ? `weakened by ${a} °C per decade` : "did not change";
  return v > 0 ? `每十年增强 ${a} °C` : v < 0 ? `每十年减弱 ${a} °C` : "没有变化";
}

function PanelHead({ en, zh, venue }: { en: string; zh: string; venue: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-sm font-medium text-ink">
        <T en={en} zh={zh} />
      </h3>
      <span className="shrink-0 rounded bg-teal-light px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teal">
        {venue}
      </span>
    </div>
  );
}

function NotCovered({ en, zh }: { en: string; zh: string }) {
  return (
    <p className="mt-3 text-sm text-ink-muted">
      <T en={en} zh={zh} />
    </p>
  );
}

function Stat({ en, zh, value, big }: { en: string; zh: string; value: string; big?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-ink-faint">
        <T en={en} zh={zh} />
      </dt>
      <dd className={`mt-0.5 font-medium text-ink ${big ? "text-lg" : ""}`}>{value}</dd>
    </div>
  );
}

function Not({ en, zh }: { en: string; zh: string }) {
  return (
    <p className="mt-2 border-l-2 border-rule pl-2 text-xs italic text-ink-faint">
      <T en={en} zh={zh} />
    </p>
  );
}

function Links({ doi, app }: { doi: string; app?: string }) {
  return (
    <div className="mt-3 flex flex-wrap gap-3 text-sm">
      <a href={doi} target="_blank" rel="noopener noreferrer" className="text-ember hover:underline">
        <T en="Paper →" zh="论文 →" />
      </a>
      {app && (
        <a href={app} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
          <T en="Full app →" zh="完整应用 →" />
        </a>
      )}
    </div>
  );
}
