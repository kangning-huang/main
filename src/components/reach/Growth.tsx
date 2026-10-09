import T from "@/components/T";
import { influence, THEMES, THEME_COLORS } from "@/lib/influence";

const BAR_H = 96;

export default function Growth() {
  const { growth, papers, meta } = influence;
  const lead = papers.filter((p) => p.lens === "lead");
  const asOfYear = Number(meta.asOf.slice(0, 4));
  const firstYear = Math.min(...lead.filter((p) => !p.early).map((p) => p.year));
  const years = Array.from({ length: asOfYear - firstYear + 1 }, (_, i) => firstYear + i);
  const max = Math.max(1, ...Object.values(growth).flatMap((g) => Object.values(g)));
  const early = lead.filter((p) => p.early);

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
          const established = lead.filter((p) => p.theme === theme.id && !p.early);
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
                      const partial = y === asOfYear;
                      return (
                        <div key={y} className="group relative flex h-full flex-1 items-end" title={`${theme.en}, ${y}${partial ? " (partial)" : ""}: ${v} citing works (OpenAlex)`}>
                          <div
                            className="w-full rounded-t-[3px] group-hover:opacity-80"
                            style={{
                              height: `${(v / max) * 100}%`,
                              minHeight: v > 0 ? 2 : 0,
                              background: partial
                                ? `repeating-linear-gradient(135deg, ${THEME_COLORS[theme.id]} 0 3px, transparent 3px 5px)`
                                : THEME_COLORS[theme.id],
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-1 flex gap-[2px] text-[10px] text-ink-faint tabular-nums">
                    {years.map((y) => (
                      <span key={y} className="flex-1 text-center">
                        {y % 2 === asOfYear % 2 ? `’${String(y).slice(2)}` : ""}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 text-xs text-ink-muted">
                    <T
                      en={`Peak: ${Math.max(...Object.values(g))} in a year · total ${Object.values(g).reduce((a, b) => a + b, 0)} citing works`}
                      zh={`年度峰值 ${Math.max(...Object.values(g))} 篇 · 合计 ${Object.values(g).reduce((a, b) => a + b, 0)} 篇施引文献`}
                    />
                  </div>
                </div>
              ) : (
                <p className="self-center text-sm text-ink-faint">
                  {established.length > 0 ? (
                    <T en="No OpenAlex citations yet for the established paper(s) in this theme." zh="该主题已发表论文在 OpenAlex 中暂无引用。" />
                  ) : (
                    <T en="Only early papers so far — see below." zh="目前仅有早期论文——见下方。" />
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="text-sm text-ink-muted">
          <T en={`Early — published ${meta.earlyFromYear} or later`} zh={`早期——${meta.earlyFromYear} 年及以后发表`} />
        </h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {early.map((p) => (
            <li key={p.doi} className="rounded-full border border-rule bg-paper-warm/60 px-3 py-1 text-xs text-ink">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: THEME_COLORS[p.theme] }} />
              {p.short}
              <span className="ml-2 text-ink-faint">
                <T en={`early · ${p.citingNonSelf} so far (OpenAlex)`} zh={`早期 · 目前 ${p.citingNonSelf} 次（OpenAlex）`} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
