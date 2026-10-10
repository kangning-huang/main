"use client";

import { useLanguage } from "@/lib/language-context";
import { ringFor, type RippleView } from "@/lib/ripple";

const fmt = (n: number) => n.toLocaleString("en-US");

/** The Ripple map as a table: same data, no hover needed (works without JavaScript inside <details>). */
export default function RippleTable({ view }: { view: RippleView }) {
  const { language } = useLanguage();
  const zh = language === "zh";
  const order = new Map(view.themes.map((t, i) => [t.id, i]));
  const rows = [...view.keywords].sort((a, b) => (order.get(a.theme) ?? 0) - (order.get(b.theme) ?? 0) || b.works - a.works);
  const themeName = (id: string) => {
    const t = view.themes.find((x) => x.id === id);
    return t ? (zh ? t.zh : t.en) : id;
  };
  return (
    <div className="overflow-x-auto">
      <table className="mt-3 w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">
          {zh ? "关键词表：主题、施引文献、距离、新词或回声" : "Keyword table: theme, citing works, reach distance, new or echo"}
        </caption>
        <thead className="text-xs text-ink-faint">
          <tr>
            <th className="py-1 pr-3 font-normal">{zh ? "关键词" : "Keyword"}</th>
            <th className="py-1 pr-3 font-normal">{zh ? "主题" : "Theme"}</th>
            <th className="py-1 pr-3 text-right font-normal">{zh ? "施引文献" : "Citing works"}</th>
            <th className="py-1 pr-3 text-right font-normal">{zh ? "年化引用" : "Cites / yr"}</th>
            <th className="py-1 pr-3 text-right font-normal">{zh ? "主题之外" : "Outside home"}</th>
            <th className="py-1 pr-3 font-normal">{zh ? "平均距离" : "Reach distance"}</th>
            <th className="py-1 pr-3 font-normal">{zh ? "新词 / 回声" : "New / echo"}</th>
            <th className="py-1 font-normal">{zh ? "也见于" : "Also in"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((k) => {
            const t = view.themes.find((x) => x.id === k.theme);
            return (
              <tr key={k.id} className="border-t border-rule-faint">
                <td className="py-1.5 pr-3 text-ink">{zh ? (k.zh ?? k.en) : k.en}</td>
                <td className="py-1.5 pr-3 text-ink-muted">
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: t?.color }} aria-hidden="true" />
                  {themeName(k.theme)}
                </td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{fmt(k.works)}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{k.perYear.toFixed(1)}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{Math.round((100 * k.outside) / k.works)}%</td>
                <td className="py-1.5 pr-3 tabular-nums text-ink-muted">
                  {k.dMean.toFixed(2)} · {zh ? ringFor(k.dMean).zh : ringFor(k.dMean).en}
                  {k.dFallback ? (zh ? "（中位）" : " (median)") : ""}
                </td>
                <td className="py-1.5 pr-3 text-ink-muted">{k.echo ? (zh ? "回声" : "echo") : zh ? "新词" : "new"}</td>
                <td className="py-1.5 text-ink-muted">{k.also.map(themeName).join(", ")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {view.themes.some((t) => t.emerging) && (
        <p className="mt-2 text-xs text-ink-faint">
          {zh ? "起步主题（施引少于 20 篇，不显示关键词）：" : "Emerging themes (fewer than 20 citing works, no keywords shown): "}
          {view.themes
            .filter((t) => t.emerging)
            .map((t) => `${zh ? t.zh : t.en} (${t.works})`)
            .join(", ")}
        </p>
      )}
    </div>
  );
}
