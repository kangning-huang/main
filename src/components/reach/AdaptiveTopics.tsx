"use client";

import T from "@/components/T";
import { fieldZh } from "@/lib/influence";
import { useReachLens } from "./ReachLens";

export default function AdaptiveTopics() {
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
      <p className="max-w-3xl text-[15px] leading-relaxed text-ink-muted">
        <T
          en={
            <>
              OpenAlex fields that hold more than 30% of citing works are split into subfields, then topics,
              until no single area dominates. <strong className="text-ink">{outside}</strong> of{" "}
              {totals.uniqueCitingWorks.toLocaleString()} citing works ({pctOutside}%) sit outside Ken&apos;s own
              OpenAlex topics — the clearest single measure of disciplinary reach.
            </>
          }
          zh={
            <>
              任一 OpenAlex 领域若超过施引文献的 30%，则拆分为子领域、再拆为主题，直到没有单一类别占主导。
              在 {totals.uniqueCitingWorks.toLocaleString()} 篇施引文献中，有{" "}
              <strong className="text-ink">{outside}</strong> 篇（{pctOutside}%）落在黄康宁本人论文主题之外——这是衡量跨学科影响最直观的指标。
            </>
          }
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
                      title={`${k.count} citing works mention this keyword (OpenAlex)`}
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
            en={`${other.name}: ${other.citingWorks} citing works (${other.share}%).`}
            zh={`${other.name}：${other.citingWorks} 篇（${other.share}%）。`}
          />
        </p>
      )}

      <p className="mt-4 text-xs text-ink-faint">
        <T
          en="Keyword chips come from citing works (OpenAlex), not from Ken's own papers. Topic labels are automatic and can be noisy — treat single-digit cards as indicative."
          zh="关键词取自施引文献（OpenAlex），而非黄康宁本人论文。主题标签由算法自动生成，可能有噪声；个位数卡片仅供参考。"
        />
      </p>
    </div>
  );
}
