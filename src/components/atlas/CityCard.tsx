"use client";

import Link from "next/link";
import type { CityDetail } from "@/lib/atlas";
import { MASS_PAPER, formatPop, formatMassT } from "@/lib/atlas";
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

      {/* Coming layers */}
      <div className="mt-4 space-y-2">
        <ComingRow
          en="Urban expansion to 2050"
          zh="至 2050 年城市扩张"
          noteEn="Coming — GHSL crosswalk for the ERL 2019 projections is not in this build."
          noteZh="即将加入 — 本版尚未接入 ERL 2019 预测的 GHSL 对照。"
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
