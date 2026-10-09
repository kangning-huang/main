"use client";

import T from "@/components/T";
import curated from "../../../data/influence/curated-uses.json";
import { influence } from "@/lib/influence";
import { useReachLens } from "./ReachLens";

export default function StandingOnIt() {
  const { view, lens } = useReachLens();
  const { topCitingWorks } = view;
  const { meta } = influence;
  return (
    <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <p className="mb-4 text-sm text-ink-muted">
          <T
            en={`The ten most-cited works (by their own OpenAlex citation count) that cite at least one paper in the ${lens === "lead" ? "first / last / corresponding" : "All"} view, self-citations removed.`}
            zh="引用了当前视角论文、且自身 OpenAlex 被引次数最高的十篇文献（已剔除自引）。"
          />
        </p>
        <ol className="space-y-4">
          {topCitingWorks.map((w, i) => {
            const href = w.doi ? `https://doi.org/${w.doi}` : `https://openalex.org/${w.openalexId}`;
            return (
              <li key={w.openalexId} className="grid grid-cols-[1.75rem_1fr] gap-2">
                <span className="pt-0.5 text-right font-display text-lg leading-none text-ink-faint tabular-nums">{i + 1}</span>
                <div>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-[15px] leading-snug text-ink hover:text-ember">
                    {w.title}
                  </a>
                  <div className="mt-1 text-xs text-ink-muted">
                    {w.venue ? <em>{w.venue}</em> : <T en="(no venue in OpenAlex)" zh="（OpenAlex 无期刊信息）" />} · {w.year} ·{" "}
                    <T en={`cited ${w.openalexCitedByCount.toLocaleString()}× (OpenAlex)`} zh={`被引 ${w.openalexCitedByCount.toLocaleString()} 次（OpenAlex）`} />
                  </div>
                  <div className="mt-0.5 text-xs text-ink-faint">
                    <T en="builds on: " zh="引用了：" />
                    {w.builds_on.join("; ")}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 text-xs text-ink-faint">
          <T en={`OpenAlex, as of ${meta.asOf}.`} zh={`OpenAlex，截至 ${meta.asOf}。`} />
        </p>
      </div>

      <aside>
        <h3 className="mb-3 text-sm text-ink-muted">
          <T en="Beyond journals" zh="期刊之外" />
        </h3>
        <ul className="space-y-4">
          {curated.uses.map((u) => (
            <li key={u.id} className="rounded-lg border border-rule bg-paper-warm/60 p-4">
              <p className="text-sm leading-relaxed text-ink">
                <T en={u.en} zh={u.zh} />
              </p>
              <a href={u.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-teal hover:text-ember">
                <T en="View on Resource Watch →" zh="在 Resource Watch 查看 →" />
              </a>
              <p className="mt-2 text-[11px] text-ink-faint">
                <T en={`Hand-curated; verified ${u.verified.on}. Not counted in any OpenAlex figure.`} zh={`人工整理；核实于 ${u.verified.on}。不计入任何 OpenAlex 统计。`} />
              </p>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
