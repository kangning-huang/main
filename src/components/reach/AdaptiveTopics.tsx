"use client";

import T from "@/components/T";
import { fieldZh } from "@/lib/influence";
import { useLanguage } from "@/lib/language-context";
import { useReachLens } from "./ReachLens";

export default function AdaptiveTopics() {
  const { language } = useLanguage();
  const zh = language === "zh";
  const { view } = useReachLens();
  const { adaptive, totals } = view;
  const outside = totals.citingWorksOutsideOwnTopics;
  const pctOutside = totals.uniqueCitingWorks
    ? Math.round((outside / totals.uniqueCitingWorks) * 100)
    : 0;
  const named = adaptive.filter((n) => n.id !== "__other" && n.level !== "other");
  const other = adaptive.find((n) => n.id === "__other" || n.level === "other");

  return (
    <div>
      <p className="max-w-3xl text-sm text-ink-muted">
        <T
          en={<>{pctOutside}% of citing works ({outside.toLocaleString()} / {totals.uniqueCitingWorks.toLocaleString()}) fall outside my OpenAlex research topics. The cards below provide details of the flow chart above.</>}
          zh={<>有 {pctOutside}% 的施引文献（{outside.toLocaleString()} / {totals.uniqueCitingWorks.toLocaleString()}）属于我在 OpenAlex 研究主题之外的领域。下方卡片进一步展示上方流向图的结果。</>}
        />
      </p>

      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {named.map((node) => {
          const path = node.path.filter(Boolean);
          const hrefExample = (ex: (typeof node.examples)[0]) =>
            ex.doi ? `https://doi.org/${ex.doi}` : `https://openalex.org/${ex.openalexId}`;
          return (
            <li key={node.id} className="rounded-xl border border-rule bg-paper p-4 shadow-sm">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-lg leading-snug text-ink">
                  <T en={node.name} zh={fieldZh(node.name)} />
                </h3>
                <span className="shrink-0 tabular-nums text-sm text-ink">
                  {node.citingWorks}
                  <span className="ml-1 text-ink-faint">({node.share}%)</span>
                </span>
              </div>
              {path.length > 1 && (
                <p className="mt-1 text-xs text-ink-faint">
                  {path.map((p, i) => (
                    <span key={i}>
                      {i > 0 && <span className="mx-1">›</span>}
                      <T en={p} zh={fieldZh(p)} />
                    </span>
                  ))}
                </p>
              )}
              {node.keywords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {node.keywords.map((k) => (
                    <span
                      key={k.name}
                      className="rounded-full bg-paper-warm px-2 py-0.5 text-[11px] text-ink-muted"
                      title={zh ? `${k.count} 篇引用文献提到这个关键词（OpenAlex）` : `${k.count} citing works mention this keyword (OpenAlex)`}
                    >
                      {k.name}
                    </span>
                  ))}
                </div>
              )}
              {node.examples.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-rule-faint pt-3">
                  {node.examples.map((ex) => (
                    <li key={ex.openalexId} className="text-xs leading-snug text-ink-muted">
                      <a
                        href={hrefExample(ex)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink hover:text-ember"
                      >
                        {ex.title}
                      </a>
                      {ex.year ? <span className="text-ink-faint"> · {ex.year}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {other && (
        <p className="mt-4 text-sm text-ink-faint">
          <T
            en={`Other smaller research areas account for ${other.citingWorks} citing works (${other.share}%). Their names are shown in the flow chart above.`}
            zh={`其他规模较小的研究领域共有 ${other.citingWorks} 篇施引文献，占 ${other.share}%。具体领域见上方流向图。`}
          />
        </p>
      )}

      <p className="mt-4 text-xs text-ink-faint">
        <T
          en="Keywords come from citing works in OpenAlex, not from my own papers. Topic labels are assigned automatically and may contain errors. Treat cards with fewer than 10 citing works as indicative."
          zh="关键词来自 OpenAlex 收录的施引文献，而不是我自己的论文。主题标签由系统自动生成，可能存在误差。施引文献少于 10 篇的卡片仅供参考。"
        />
      </p>
    </div>
  );
}
