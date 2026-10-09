"use client";

import Link from "next/link";
import type { CityDetail } from "@/lib/atlas";
import { MASS_PAPER, HEAT_PAPER, COOLING_PAPER, FLOOD_PAPER, EXPANSION_PAPER, JGR_PAPER, formatPop, formatMassT } from "@/lib/atlas";
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
  const flood = city.layers.flood;
  const expansion = city.layers.expansion;
  const jgr = city.layers.jgr;
  const nLayers = [mass, heat, cooling, flood, expansion, jgr].filter(Boolean).length;
  const nMapped = 6;

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
          en={`Covered by ${nLayers} of ${nMapped} mapped studies.`}
          zh={`${nMapped} 项已上图研究中覆盖 ${nLayers} 项。`}
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

      {/* Height-aware flood panel */}
      <section className="mt-4 rounded-md border border-rule-faint bg-paper-warm/60 p-4">
        <PanelHead
          en="Flood damage with building height & protection"
          zh="考虑建筑高度与防洪标准的洪涝损失"
          venue={`${FLOOD_PAPER.venue} ${FLOOD_PAPER.year}`}
        />
        {!flood ? (
          <NotCovered
            en="Not covered by this study (it covers ~600 functional urban areas with joinable GHSL urban centres)."
            zh="该研究未覆盖此城市（研究范围为约 600 个可与 GHSL 城市中心对照的功能城市区）。"
          />
        ) : (
          <>
            {(flood.quality === "flagged" || flood.fua.name !== city.name) && (
              <p className="mt-2 rounded bg-ember-light px-2 py-1 text-xs text-ember-dark">
                <T
                  en={`Values are for the functional urban area “${flood.fua.name}”${flood.quality === "flagged" ? " (this urban centre sits in more than one overlapping area; largest one used)" : ""}.`}
                  zh={`数值对应功能城市区“${flood.fua.name}”${flood.quality === "flagged" ? "（该城市中心落在多个重叠区域，取人口最大者）" : ""}。`}
                />
              </p>
            )}
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Stat
                en="Damage · no protection"
                zh="损失 · 无防洪保护"
                value={`${flood.dmgPct.toFixed(2)}%`}
                big
              />
              <Stat
                en="Damage · with protection"
                zh="损失 · 含防洪保护"
                value={
                  flood.dmgProtPct != null ? `${flood.dmgProtPct.toFixed(2)}%` : "—"
                }
                big
              />
              {flood.protYears != null && (
                <Stat
                  en="Protection standard"
                  zh="防洪标准"
                  value={`~${flood.protYears}-year`}
                />
              )}
              {flood.heightM != null && (
                <Stat en="Mean building height" zh="平均建筑高度" value={`${flood.heightM} m`} />
              )}
            </dl>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              <T
                en={floodReadingEn(flood)}
                zh={floodReadingZh(flood)}
              />
            </p>
            <Not
              en="What this number is not: not a forecast and not a loss in money. It is the share of building footprints estimated as damaged under a flood scenario that already includes building height; the protected figure applies the modelled FLOPROS protection standard for that area."
              zh="这个数字不是什么：不是预测，也不是货币损失；它是在已计入建筑高度的洪水情景下，估计受损建筑足迹占比；含保护的数字使用该区域的 FLOPROS 防洪标准。"
            />
            <Links doi={FLOOD_PAPER.doiUrl} app={FLOOD_PAPER.appUrl} />
          </>
        )}
      </section>

      {/* ERL 2019 urban expansion */}
      <section className="mt-4 rounded-md border border-rule-faint bg-paper-warm/60 p-4">
        <PanelHead
          en="Urban land by 2050 (urban cluster)"
          zh="至 2050 年城市用地（城市集群）"
          venue={`ERL ${EXPANSION_PAPER.year}`}
        />
        {!expansion ? (
          <NotCovered
            en="Not covered by this study’s Huang_2019 urban-cluster table for this GHSL urban centre."
            zh="该 GHSL 城市中心未包含在 Huang_2019 城市集群表中。"
          />
        ) : (
          <>
            {expansion.quality === "flagged" && (
              <p className="mt-2 rounded bg-ember-light px-2 py-1 text-xs text-ember-dark">
                <T
                  en="Match flagged: centroid fell outside the preferred cluster polygon or was reassigned to a same-country neighbor. Values are for the matched Huang_2019 urban cluster."
                  zh="匹配存疑：质心落在优选集群多边形外，或改派至同国邻近集群。数值对应匹配的 Huang_2019 城市集群。"
                />
              </p>
            )}
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Stat en="Projected urban land (range)" zh="预估城市用地（范围）" value={`${expansion.loKm2.toLocaleString()}–${expansion.hiKm2.toLocaleString()} km²`} big />
              <Stat en="SSP1 / SSP3 / SSP5" zh="SSP1 / SSP3 / SSP5" value={`${expansion.ssp1Km2.toLocaleString()} / ${expansion.ssp3Km2.toLocaleString()} / ${expansion.ssp5Km2.toLocaleString()}`} />
            </dl>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              <T
                en={`Under Huang_2019 URBANMOD projections, this urban cluster’s urban land area by 2050 ranges from ${expansion.loKm2.toLocaleString()} to ${expansion.hiKm2.toLocaleString()} km² across SSP1, SSP3 and SSP5. Scenario range, not a forecast.`}
                zh={`按 Huang_2019 URBANMOD 预测，该城市集群至 2050 年的城市用地在 SSP1/SSP3/SSP5 下为 ${expansion.loKm2.toLocaleString()}–${expansion.hiKm2.toLocaleString()} km²。情景范围，不是预测。`}
              />
            </p>
            <Not
              en="What this number is not: not the city’s municipal area alone. It is urban land in the modelled urban cluster that contains this centre (clumps can span multiple GHSL centres). Heat-island intensification (0.5–0.7 °C average in the paper) is not shown as a per-city value here — see the paper / Earth Engine app."
              zh="这个数字不是什么：不是单独的市政建成区；它是包含该中心的模型城市集群内的城市用地（一个集群可覆盖多个 GHSL 中心）。论文中的热岛增强（平均 0.5–0.7 °C）此处未给出城市级数值——见论文 / Earth Engine 应用。"
            />
            <Links doi={EXPANSION_PAPER.doiUrl} app={EXPANSION_PAPER.appUrl} />
          </>
        )}
      </section>

      {/* JGR 2021 nighttime WBGT */}
      <section className="mt-4 rounded-md border border-rule-faint bg-paper-warm/60 p-4">
        <PanelHead
          en="Nighttime heat-stress change (WBGT)"
          zh="夜间热应激变化（WBGT）"
          venue={`JGR ${JGR_PAPER.year}`}
        />
        {!jgr ? (
          <NotCovered
            en="Not covered by this study (WRF domains: China, India and Nigeria urban grids only)."
            zh="该研究未覆盖此城市（WRF 范围仅为中国、印度、尼日利亚城市网格）。"
          />
        ) : (
          <>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Stat en="Night ΔWBGT · expansion" zh="夜间 ΔWBGT · 扩张" value={`${jgr.dNightC > 0 ? "+" : ""}${jgr.dNightC.toFixed(2)} °C`} big />
              {jgr.dNightCoolRoofC != null && (
                <Stat en="Night ΔWBGT · + cool roofs" zh="夜间 ΔWBGT · 含冷屋顶" value={`${jgr.dNightCoolRoofC > 0 ? "+" : ""}${jgr.dNightCoolRoofC.toFixed(2)} °C`} big />
              )}
            </dl>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              <T
                en={`Urban expansion to 2050 changes nighttime wet-bulb globe temperature by ${jgr.dNightC > 0 ? "+" : ""}${jgr.dNightC.toFixed(2)} °C at this urban centre${jgr.dNightCoolRoofC != null ? ` (${jgr.dNightCoolRoofC > 0 ? "+" : ""}${jgr.dNightCoolRoofC.toFixed(2)} °C if cool roofs are installed)` : ""}. Sampled from the paper’s published geographic maps. Scenario, not a forecast.`}
                zh={`至 2050 年城市扩张使该城市中心夜间湿球黑球温度变化 ${jgr.dNightC > 0 ? "+" : ""}${jgr.dNightC.toFixed(2)} °C${jgr.dNightCoolRoofC != null ? `（安装冷屋顶后为 ${jgr.dNightCoolRoofC > 0 ? "+" : ""}${jgr.dNightCoolRoofC.toFixed(2)} °C）` : ""}。数值来自论文已发表的地理分布图采样。情景，不是预测。`}
              />
            </p>
            <Not
              en="What this number is not: not a city census table from the SI (SI Tables S1–S2 / Table 1–2 are climate-zone or MUR aggregates). It is a point sample of the published nighttime ΔWBGT raster at the GHSL urban-centre coordinate."
              zh="这个数字不是什么：不是 SI 中的城市普查表（SI 表为气候带或巨型都市区汇总）；它是在 GHSL 城市中心坐标上对已发表夜间 ΔWBGT 栅格的点采样。"
            />
            <Links doi={JGR_PAPER.doiUrl} />
          </>
        )}
      </section>

      {/* Coming layers */}
      <div className="mt-4 space-y-2">
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


function floodReadingEn(flood: NonNullable<CityDetail["layers"]["flood"]>): string {
  if (flood.dmgProtPct == null) {
    return `About ${flood.dmgPct.toFixed(2)}% of building footprints in this functional urban area are estimated as damaged under the height-aware flood scenario (protection not reported for this area).`;
  }
  const cut = flood.dmgPct > 0 ? (1 - flood.dmgProtPct / flood.dmgPct) * 100 : 0;
  return `About ${flood.dmgPct.toFixed(2)}% of building footprints are estimated as damaged without protection; with the modelled ~${flood.protYears ?? "—"}-year protection standard that falls to ${flood.dmgProtPct.toFixed(2)}% (about ${cut.toFixed(0)}% less). Scenario range, not a forecast.`;
}

function floodReadingZh(flood: NonNullable<CityDetail["layers"]["flood"]>): string {
  if (flood.dmgProtPct == null) {
    return `在计入建筑高度的洪水情景下，该功能城市区约 ${flood.dmgPct.toFixed(2)}% 的建筑足迹估计受损（该区域未报告防洪保护）。`;
  }
  const cut = flood.dmgPct > 0 ? (1 - flood.dmgProtPct / flood.dmgPct) * 100 : 0;
  return `无保护时约 ${flood.dmgPct.toFixed(2)}% 的建筑足迹估计受损；按模型约 ${flood.protYears ?? "—"} 年一遇防洪标准后降至 ${flood.dmgProtPct.toFixed(2)}%（约减少 ${cut.toFixed(0)}%）。情景范围，不是预测。`;
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
