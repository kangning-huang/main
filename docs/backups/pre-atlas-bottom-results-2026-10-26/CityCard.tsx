"use client";

import Link from "next/link";
import type { CityDetail } from "@/lib/atlas";
import { MASS_PAPER, HEAT_PAPER, COOLING_PAPER, FLOOD_PAPER, EXPANSION_PAPER, JGR_PAPER, UHS_PAPER, formatPop, formatMassT } from "@/lib/atlas";
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
          <T en="Loading city…" zh="正在加载城市数据…" />
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
  const uhs = city.layers.uhs;
  const nLayers = [mass, heat, cooling, flood, expansion, jgr, uhs].filter(Boolean).length;
  const nMapped = 7;

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
            <T en="Population (2015)" zh="人口（2015 年）" />
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
          zh={`地图已收录 ${nMapped} 项研究，其中 ${nLayers} 项覆盖这座城市。`}
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
              zh="建成质量数据集未覆盖这个 GHSL 城市中心。"
            />
          </p>
        ) : (
          <>
            {mass.quality === "flagged" && (
              <p className="mt-2 rounded bg-ember-light px-2 py-1 text-xs text-ember-dark">
                <T
                  en={`Match flagged: ${mass.match.reason ?? "name or location uncertain"}. Values shown for the matched record (${mass.match.sourceName}).`}
                  zh={`这座城市的匹配结果存疑，原因是${mass.match.reason ?? "名称或位置不确定"}。下方数值来自匹配到的记录（${mass.match.sourceName}）。`}
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
                  <T en="vs. scaling line" zh="与标度线相比" />
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
                  <T en="Dataset population" zh="数据集人口数" />
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
                    ? `按全球标度关系比较，这座城市的建成质量比同等规模城市约高 ${((mass.vsScaling - 1) * 100).toFixed(0)}%（β ≈ 0.90）。`
                    : `按全球标度关系比较，这座城市的建成质量比同等规模城市约低 ${((1 - mass.vsScaling) * 100).toFixed(0)}%（β ≈ 0.90）。`
                }
              />
            </p>

            <p className="mt-2 border-l-2 border-rule pl-2 text-xs italic text-ink-faint">
              <T
                en="What this number is not: it is not a judgment that the city is over- or under-built in a planning sense — only its position relative to the empirical scaling relationship across ~3,600 cities."
                zh="把约 3,600 座城市放在一起比较，可以得到建成质量与人口之间的经验标度关系。这个数值告诉你，这座城市相对标度线处在什么位置，不能据此判断城市规划上“建多了”还是“建少了”。"
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
          <NotCovered en="Not covered by this study (it covers the ~1,000 largest functional urban areas)." zh="这项研究未覆盖这座城市。研究范围是规模最大的约 1,000 个功能城市区。" />
        ) : (
          <>
            {(heat.quality === "flagged" || heat.fua.name !== city.name) && (
              <p className="mt-2 rounded bg-ember-light px-2 py-1 text-xs text-ember-dark">
                <T
                  en={`Values are for the whole functional urban area “${heat.fua.name}”${heat.quality === "flagged" ? " (name shared by more than one area; largest one used)" : ""}.`}
                  zh={`这里的数值对应整个功能城市区“${heat.fua.name}”${heat.quality === "flagged" ? "（多个区域同名，选取人口最多者）" : ""}。`}
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
                zh={`夜间 · 面积平均`}
              />
            </p>
            <Not
              en="What this number is not: not air temperature and not a forecast. It is the historical trend of the hottest 1% of land-surface heat-island values (MODIS), °C per decade."
              zh="这里显示 MODIS 记录中，地表热岛最热的 1% 数值随时间变化的历史趋势，单位为 °C/十年。它不表示气温，也不是对未来的预测。"
            />
            <Links doi={HEAT_PAPER.doiUrl} />
          </>
        )}
      </section>

      {/* Informal-settlement cooling panel */}
      <section className="mt-4 rounded-md border border-rule-faint bg-paper-warm/60 p-4">
        <PanelHead en="Cooling after informal-settlement demolition" zh="非正规住区拆除后的降温" venue={`npj ${COOLING_PAPER.year}`} />
        {!cooling ? (
          <NotCovered en="Not covered by this study (Beijing, Shanghai and Guangzhou only)." zh="这项研究未覆盖这座城市，仅研究了北京、上海和广州。" />
        ) : (
          <>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Stat en="Surface cooling (DID)" zh="地表降温（DID）" value={`${cooling.effectK.toFixed(2)} K`} big />
              <Stat en="95% interval" zh="95% 区间" value={`${cooling.ciLo.toFixed(2)} to ${cooling.ciHi.toFixed(2)} K`} />
            </dl>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              <T
                en={`Demolished informal-settlement sites here cooled by about ${Math.abs(cooling.effectK).toFixed(1)} K in land-surface temperature relative to comparable sites that were not demolished (all three cities pooled: ${Math.abs(cooling.pooledK).toFixed(1)} K).`}
                zh={`与条件相近、但未拆除的地块相比，这座城市的城中村地块拆除后，地表温度约下降 ${Math.abs(cooling.effectK).toFixed(1)} K（三座城市合并估计为 ${Math.abs(cooling.pooledK).toFixed(1)} K）。`}
              />
            </p>
            <Not
              en="What this number is not: not a city-wide cooling and not a health benefit. It applies to the demolished sites only (about 7.7 km² across all three cities), and depends on what was built afterwards."
              zh="这里的降温数值只适用于拆除地块，三座城市合计约 7.7 km²。效果取决于拆除后的土地用途，不能据此判断全城降温多少，也不能直接等同于健康收益。"
            />
            <Links doi={COOLING_PAPER.doiUrl} app={COOLING_PAPER.appUrl} />
          </>
        )}
      </section>

      {/* Height-aware flood panel */}
      <section className="mt-4 rounded-md border border-rule-faint bg-paper-warm/60 p-4">
        <PanelHead
          en="Flood damage with building height & protection"
          zh="洪涝损失（计入建筑高度与防洪标准）"
          venue={`${FLOOD_PAPER.venue} ${FLOOD_PAPER.year}`}
        />
        {!flood ? (
          <NotCovered
            en="Not covered by this study (it covers ~600 functional urban areas with joinable GHSL urban centres)."
            zh="这项研究未覆盖这座城市。研究范围是约 600 个能与 GHSL 城市中心匹配的功能城市区。"
          />
        ) : (
          <>
            {(flood.quality === "flagged" || flood.fua.name !== city.name) && (
              <p className="mt-2 rounded bg-ember-light px-2 py-1 text-xs text-ember-dark">
                <T
                  en={`Values are for the functional urban area “${flood.fua.name}”${flood.quality === "flagged" ? " (this urban centre sits in more than one overlapping area; largest one used)" : ""}.`}
                  zh={`这里的数值对应功能城市区“${flood.fua.name}”${flood.quality === "flagged" ? "（该城市中心位于多个重叠区域，选取人口最多者）" : ""}。`}
                />
              </p>
            )}
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Stat
                en="Damage · no protection"
                zh="洪涝损失 · 无防洪保护"
                value={`${flood.dmgPct.toFixed(2)}%`}
                big
              />
              <Stat
                en="Damage · with protection"
                zh="洪涝损失 · 有防洪保护"
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
              zh="这里用面积比例表示洪涝损失，也就是估计受损建筑的占地面积占全部建筑占地面积的比例。估算采用计入建筑高度的洪水情景，不表示货币损失，也不是对未来的预测。“有防洪保护”的结果采用该区域在 FLOPROS 中记录的防洪标准。"
            />
            <Links doi={FLOOD_PAPER.doiUrl} app={FLOOD_PAPER.appUrl} />
          </>
        )}
      </section>

      {/* ERL 2019 urban expansion */}
      <section className="mt-4 rounded-md border border-rule-faint bg-paper-warm/60 p-4">
        <PanelHead
          en="Urban land by 2050 (urban cluster)"
          zh="2050 年城市用地（城市集群）"
          venue={`ERL ${EXPANSION_PAPER.year}`}
        />
        {!expansion ? (
          <NotCovered
            en="Not covered by this study’s Huang_2019 urban-cluster table for this GHSL urban centre."
            zh="这项研究的 Huang_2019 城市集群表未覆盖这个 GHSL 城市中心。"
          />
        ) : (
          <>
            {expansion.quality === "flagged" && (
              <p className="mt-2 rounded bg-ember-light px-2 py-1 text-xs text-ember-dark">
                <T
                  en="Match flagged: centroid fell outside the preferred cluster polygon or was reassigned to a same-country neighbor. Values are for the matched Huang_2019 urban cluster."
                  zh="这座城市的匹配结果存疑。城市中心的质心落在优先匹配的集群边界外，或被重新分配到了同一国家的邻近集群。这里显示的是匹配到的 Huang_2019 城市集群数值。"
                />
              </p>
            )}
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Stat en="Projected urban land (range)" zh="城市用地估算范围" value={`${expansion.loKm2.toLocaleString()}–${expansion.hiKm2.toLocaleString()} km²`} big />
              <Stat en="SSP1 / SSP3 / SSP5" zh="SSP1 / SSP3 / SSP5" value={`${expansion.ssp1Km2.toLocaleString()} / ${expansion.ssp3Km2.toLocaleString()} / ${expansion.ssp5Km2.toLocaleString()}`} />
            </dl>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              <T
                en={`Under Huang_2019 URBANMOD projections, this urban cluster’s urban land area by 2050 ranges from ${expansion.loKm2.toLocaleString()} to ${expansion.hiKm2.toLocaleString()} km² across SSP1, SSP3 and SSP5. Scenario range, not a forecast.`}
                zh={`按 Huang_2019 URBANMOD 模型估算，到 2050 年，这个城市集群在 SSP1/SSP3/SSP5 情景下的城市用地为 ${expansion.loKm2.toLocaleString()}–${expansion.hiKm2.toLocaleString()} km²。这个范围来自不同情景，不能当作对未来的预测。`}
              />
            </p>
            <Not
              en="What this number is not: not the city’s municipal area alone. It is urban land in the modelled urban cluster that contains this centre (clumps can span multiple GHSL centres). Heat-island intensification (0.5–0.7 °C average in the paper) is not shown as a per-city value here — see the paper / Earth Engine app."
              zh="这个数字表示模型中包含该城市中心的整个城市集群有多少城市用地，范围不限于这座城市的行政区，一个集群也可能包含多个 GHSL 城市中心。论文估计热岛平均增强 0.5–0.7 °C；这里没有列出各城市的具体数值，你可以查看论文或 Earth Engine 应用。"
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
            zh="这项研究未覆盖这座城市。WRF 模拟只覆盖中国、印度和尼日利亚的城市网格。"
          />
        ) : (
          <>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Stat en="Night ΔWBGT · expansion" zh="夜间 ΔWBGT · 扩张" value={`${jgr.dNightC > 0 ? "+" : ""}${jgr.dNightC.toFixed(2)} °C`} big />
              {jgr.dNightCoolRoofC != null && (
                <Stat en="Night ΔWBGT · + cool roofs" zh="夜间 ΔWBGT · 扩张 + 冷屋顶" value={`${jgr.dNightCoolRoofC > 0 ? "+" : ""}${jgr.dNightCoolRoofC.toFixed(2)} °C`} big />
              )}
            </dl>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              <T
                en={`Urban expansion to 2050 changes nighttime wet-bulb globe temperature by ${jgr.dNightC > 0 ? "+" : ""}${jgr.dNightC.toFixed(2)} °C at this urban centre${jgr.dNightCoolRoofC != null ? ` (${jgr.dNightCoolRoofC > 0 ? "+" : ""}${jgr.dNightCoolRoofC.toFixed(2)} °C if cool roofs are installed)` : ""}. Sampled from the paper’s published geographic maps. Scenario, not a forecast.`}
                zh={`情景模拟估计，到 2050 年，城市扩张使这个城市中心的夜间湿球黑球温度变化 ${jgr.dNightC > 0 ? "+" : ""}${jgr.dNightC.toFixed(2)} °C${jgr.dNightCoolRoofC != null ? `（安装冷屋顶后为 ${jgr.dNightCoolRoofC > 0 ? "+" : ""}${jgr.dNightCoolRoofC.toFixed(2)} °C）` : ""}。数值从论文已发表的地理分布图中取样，不能当作对未来的预测。`}
              />
            </p>
            <Not
              en="What this number is not: not a city census table from the SI (SI Tables S1–S2 / Table 1–2 are climate-zone or MUR aggregates). It is a point sample of the published nighttime ΔWBGT raster at the GHSL urban-centre coordinate."
              zh="这个数值从已发表的夜间 ΔWBGT 栅格中，按 GHSL 城市中心坐标取样得到。它是单点取样结果，不能当作全城普查数据。SI 表 S1–S2 / 表 1–2 按气候带或巨型都市区（MUR）汇总，并没有逐城统计。"
            />
            <Links doi={JGR_PAPER.doiUrl} />
          </>
        )}
      </section>

      {/* PNAS Cooler Cities / UHS — per-city 500 m stats when in the 101 */}
      <section className="mt-4 rounded-md border border-rule-faint bg-paper-warm/60 p-4">
        <PanelHead
          en="Homogeneous block scale & cooling"
          zh="同质功能区尺度与降温"
          venue={`${UHS_PAPER.venue} ${UHS_PAPER.year}`}
        />
        {!uhs ? (
          <>
            <NotCovered
              en="Not one of the 101 study cities in Zhang et al. (PNAS 2026). Paper and open UHS dataset linked below."
              zh="不在 Zhang 等（PNAS 2026）的 101 座研究城市样本中。下方仍提供论文与公开 UHS 数据集链接。"
            />
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              <T
                en="Zhang et al. show that larger homogeneous functional clusters (Urban Homogeneous Scale, UHS — block scale) are linked to cooler surface temperatures across 101 cities."
                zh="Zhang 等人基于全球 101 座城市发现：更大的均质功能集群（城市均质尺度 UHS，即同质功能区尺度）与更低的地表温度相关。"
              />
            </p>
            <Links doi={UHS_PAPER.doiUrl} data={UHS_PAPER.dataUrl} />
          </>
        ) : (
          <>
            {(uhs.quality === "flagged" || uhs.quality === "review") && (
              <p className="mt-2 rounded bg-ember-light px-2 py-1 text-xs text-ember-dark">
                <T
                  en={`Match flagged (${uhs.match?.method ?? "join"}): raster “${uhs.tifName ?? uhs.match?.sourceName ?? "UHS"}” ↔ ${city.name}.`}
                  zh={`匹配存疑（${uhs.match?.method ?? "join"}）：栅格 “${uhs.tifName ?? uhs.match?.sourceName ?? "UHS"}” ↔ ${city.name}。`}
                />
              </p>
            )}
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Stat
                en="Median block scale (UHS)"
                zh="中位同质功能区尺度（UHS）"
                value={`${Math.round(uhs.p50)} m`}
                big
              />
              <Stat
                en="Within-city IQR (P25–P75)"
                zh="城内四分位距（P25–P75）"
                value={`${Math.round(uhs.p25)}–${Math.round(uhs.p75)} m`}
                big
              />
            </dl>
            <UhsRangeBar p10={uhs.p10} p25={uhs.p25} p50={uhs.p50} p75={uhs.p75} p90={uhs.p90} />
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              <T
                en={uhsHeatSentenceEn(city.name, uhs)}
                zh={uhsHeatSentenceZh(city.name, uhs)}
              />
            </p>
            <Not
              en="Illustration from the paper’s pooled estimate across 101 cities — not a city-specific causal effect. Surface temperature (LST UHI), not air temperature."
              zh="这是论文在 101 座城市上的合并估计所作的示意，不是这座城市自己的因果效应；对应地表温度（LST 热岛），不是气温。"
            />
            {uhs.coverage != null && (
              <p className="mt-2 text-xs text-ink-faint">
                <T
                  en={`UHS covers about ${(uhs.coverage * 100).toFixed(0)}% of this urban extent (GHSL UCDB 2015). Stats use 500 m means of the 10 m UHS surface, matching the paper’s analysis grid.`}
                  zh={`UHS 有效像元约占该城市范围（GHSL UCDB 2015）的 ${(uhs.coverage * 100).toFixed(0)}%。统计基于 10 m UHS 在 500 m 网格上的均值，与论文分析单元一致。`}
                />
              </p>
            )}
            <Links doi={UHS_PAPER.doiUrl} data={UHS_PAPER.dataUrl} />
            <p className="mt-2 text-[11px] text-ink-faint">
              <T en="Credit: Zhang et al." zh="数据与论文：Zhang 等。" />
            </p>
          </>
        )}
      </section>

      {/* Coming layers */}
      <div className="mt-4 space-y-2">
        <ComingRow
          en="SSA infrastructure"
          zh="撒哈拉以南非洲基础设施"
          noteEn="Coming — Nature Communications paper in revision."
          noteZh="即将上线 — Nature Communications 论文修订中。"
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


const UHS_SLOPE_DAY = 0.156; // °C cooler daytime surface per +100 m UHS (paper pooled)
const UHS_SLOPE_NIGHT = 0.085;

function uhsHeatSentenceEn(name: string, uhs: NonNullable<CityDetail["layers"]["uhs"]>): string {
  const iqr = Math.max(0, uhs.p75 - uhs.p25);
  const day = (iqr / 100) * UHS_SLOPE_DAY;
  const night = (iqr / 100) * UHS_SLOPE_NIGHT;
  return `Across 101 cities, +100 m UHS ≈ ${UHS_SLOPE_DAY.toFixed(3)} °C cooler daytime surface (≈${UHS_SLOPE_NIGHT.toFixed(3)} °C at night). In ${name}, the gap between its smaller- and larger-block quarters (P25→P75, Δ ≈ ${Math.round(iqr)} m) corresponds to about ${day.toFixed(2)} °C by day (≈${night.toFixed(2)} °C at night), using that average estimate.`;
}

function uhsHeatSentenceZh(name: string, uhs: NonNullable<CityDetail["layers"]["uhs"]>): string {
  const iqr = Math.max(0, uhs.p75 - uhs.p25);
  const day = (iqr / 100) * UHS_SLOPE_DAY;
  const night = (iqr / 100) * UHS_SLOPE_NIGHT;
  return `在 101 座城市的合并估计中，UHS 每增加 100 m，白天地表约凉 ${UHS_SLOPE_DAY.toFixed(3)} °C（夜间约 ${UHS_SLOPE_NIGHT.toFixed(3)} °C）。在${name}，较小与较大同质街区四分位之间的差距（P25→P75，Δ ≈ ${Math.round(iqr)} m）按该平均估计约对应白天 ${day.toFixed(2)} °C（夜间约 ${night.toFixed(2)} °C）。`;
}

function UhsRangeBar({
  p10,
  p25,
  p50,
  p75,
  p90,
}: {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}) {
  const lo = 0;
  const hi = Math.max(p90 * 1.05, p50 * 1.5, 50);
  const pct = (v: number) => `${(Math.min(Math.max(v, lo), hi) / hi) * 100}%`;
  return (
    <div className="mt-3" aria-hidden>
      <div className="relative h-3 w-full rounded-full bg-paper">
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-teal/30"
          style={{ left: pct(p10), width: `calc(${pct(p90)} - ${pct(p10)})` }}
        />
        <div
          className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-teal/70"
          style={{ left: pct(p25), width: `calc(${pct(p75)} - ${pct(p25)})` }}
        />
        <div
          className="absolute top-0 h-3 w-0.5 bg-ink"
          style={{ left: pct(p50) }}
          title={`median ${Math.round(p50)} m`}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
        <span>0</span>
        <span>
          <T en="P10–P90 thin · P25–P75 thick · median tick" zh="细线 P10–P90 · 粗条 P25–P75 · 竖线中位数" />
        </span>
        <span>{Math.round(hi)} m</span>
      </div>
    </div>
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
          <T en="coming" zh="即将上线" />
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

function Links({ doi, app, data }: { doi: string; app?: string; data?: string }) {
  return (
    <div className="mt-3 flex flex-wrap gap-3 text-sm">
      <a href={doi} target="_blank" rel="noopener noreferrer" className="text-ember hover:underline">
        <T en="Paper →" zh="查看论文 →" />
      </a>
      {data && (
        <a href={data} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
          <T en="Dataset →" zh="数据集 →" />
        </a>
      )}
      {app && (
        <a href={app} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
          <T en="Full app →" zh="完整应用 →" />
        </a>
      )}
    </div>
  );
}
