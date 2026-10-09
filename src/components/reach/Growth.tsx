"use client";

import T from "@/components/T";
import { influence, THEMES, THEME_COLORS } from "@/lib/influence";
import { useReachLens } from "./ReachLens";

const BAR_H = 96;

export default function Growth() {
  const { view, papers, lens } = useReachLens();
  const { growth } = view;
  const { meta } = influence;
  const pool = lens === "lead" ? papers.filter((p) => p.lens === "lead") : papers;
  const asOfYear = Number(meta.asOf.slice(0, 4));
  const establishedYears = pool.filter((p) => !p.early).map((p) => p.year);
  const firstYear = establishedYears.length ? Math.min(...establishedYears) : asOfYear - 5;
  const years = Array.from({ length: asOfYear - firstYear + 1 }, (_, i) => firstYear + i);
  const max = Math.max(1, ...Object.values(growth).flatMap((g) => Object.values(g)));
  const early = pool.filter((p) => p.early);

  return (
    <div>
      <p className="max-w-3xl text-[15px] leading-relaxed text-ink-muted">
        <T
          en={`Citing works per year, by theme, self-citations removed (OpenAlex). All panels share one scale. ${asOfYear} is a partial year (to ${meta.asOf}). Papers published from ${meta.earlyFromYear} on are listed as “early” instead of drawn as bars.`}
          zh={`按主题统计的每年施引文献数，已剔除自引（OpenAlex）。各面板使用同一纵轴。${asOfYear} 年为不完整年份（截至 ${meta.asOf}）。${meta.earlyFromYear} 年及以后发表的论文标为“早期”，不绘制柱状图。`}
        />
      </p>

      <div className="mt-6 space-y-6">
        {THEMES.map((theme) => {
          const g = growth[theme.id];
          const established = pool.filter((p) => p.theme === theme.id && !p.early);
          return (
            <div key={theme.id} className="grid gap-3 md:grid-cols-[10rem_1fr]">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-ink">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: THEME_COLORS[theme.id] }} />
                  <T en={theme.en} zh={theme.zh} />
                </div>
                <div className="mt-1 text-xs text-ink-faint">{established.map((p) => p.short).join("; ") || "—"}</div>
              </div>
              {g ? (
                <div>
                  <div className="flex items-end gap-[2px] border-b border-rule" style={{ height: BAR_H }}>
                    {years.map((y) => {
                      const v = g[String(y)] ?? 0;
                      return (
                        <div key={y} className="flex flex-1 flex-col items-center justify-end" style={{ height: BAR_H }} title={`${y}: ${v}`}>
                          <div
                            className="w-full max-w-[18px] rounded-t-sm"
                            style={{
                              height: `${(v / max) * (BAR_H - 4)}px`,
                              background: THEME_COLORS[theme.id],
                              opacity: y === asOfYear ? 0.55 : 0.9,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-1 flex gap-[2px] text-[10px] text-ink-faint">
                    {years.map((y) => (
                      <span key={y} className="flex-1 text-center tabular-nums">
                        {y % 2 === 0 || years.length < 10 ? String(y).slice(2) : ""}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink-faint"><T en="No established-paper citations yet." zh="尚无非早期论文的施引。" /></p>
              )}
            </div>
          );
        })}
      </div>

      {early.length > 0 && (
        <div className="mt-8 rounded-lg border border-rule bg-paper-warm/50 p-4 text-sm">
          <h3 className="font-medium text-ink"><T en="Early papers (not charted)" zh="早期论文（未入图）" /></h3>
          <ul className="mt-2 space-y-1 text-ink-muted">
            {early.map((p) => (
              <li key={p.doi}>
                <a href={`https://doi.org/${p.doi}`} className="hover:text-ember" target="_blank" rel="noopener noreferrer">
                  {p.short}
                </a>
                {" · "}
                <T en={`${p.citingNonSelf} non-self citing works`} zh={`${p.citingNonSelf} 篇非自引施引`} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {view.growthDatesDropped > 0 && (
        <p className="mt-3 text-xs text-ink-faint">
          <T
            en={`Growth drops ${view.growthDatesDropped} citing work(s) whose OpenAlex date is earlier than the paper it cites.`}
            zh={`增长图剔除了 ${view.growthDatesDropped} 篇日期早于被引论文的施引文献。`}
          />
        </p>
      )}
    </div>
  );
}
