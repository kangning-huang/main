"use client";

import Link from "next/link";
import T from "@/components/T";
import { influence, THEMES, THEME_COLORS } from "@/lib/influence";
import { useReachLens } from "./ReachLens";

export default function ReachMethod() {
  const { view, papers, lens } = useReachLens();
  const { meta } = influence;
  const { totals } = view;
  const themeName = (id: string) => THEMES.find((t) => t.id === id) ?? { en: id, zh: id };
  const tablePapers = lens === "lead" ? papers.filter((p) => p.lens === "lead") : papers;

  return (
    <section id="method" aria-labelledby="method-heading" className="scroll-mt-20 border-t border-rule-faint bg-paper-warm/50 py-14">
      <div className="mx-auto max-w-6xl px-6 text-sm leading-relaxed text-ink-muted lg:px-8">
        <h2 id="method-heading" className="font-display text-2xl text-ink">
          <T en="Method" zh="方法" />
        </h2>
        <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5">
          <li>
            <T
              en="Papers: a pinned DOI list synced from the Publications pages. No author-name search (OpenAlex disambiguation splits and merges profiles). In-press papers without a resolving DOI, and Nature Cities Nested economies (embargo DOI), are omitted."
              zh="论文：与“学术论文”页同步的固定 DOI 列表。不使用作者姓名检索。尚无可用 DOI 的待刊论文，以及《Nature Cities》嵌套规模经济论文（DOI 仍在禁运），暂未纳入。"
            />
          </li>
          <li>
            <T
              en="Filter: All includes every pinned DOI. “First / last / corresponding author” is hand-pinned (lens: lead) — OpenAlex is_corresponding is never trusted alone. Corresponding-only flags still need Ken's review where unknown."
              zh="筛选：“全部”含所有固定 DOI；“第一/通讯作者”为人工标注（lens: lead），从不单独采信 OpenAlex 的通讯作者字段。仅通讯、非一作的标注仍待核实。"
            />
          </li>
          <li>
            <T
              en={`Self-citations (strict, per cited paper): ${meta.selfCitationRule} Removed in this view: ${totals.selfCitationsRemoved} of ${totals.citingLinksFetched} citation links.`}
              zh={`自引（严格、按被引论文）：只要施引文献与被引论文有任何共同作者即剔除。本视角剔除 ${totals.citingLinksFetched} 条中的 ${totals.selfCitationsRemoved} 条。`}
            />
          </li>
          <li>
            <T
              en={meta.adaptiveRule ?? "Adaptive taxonomy: split any OpenAlex field holding more than 30% of citing works into subfields and topics until no node exceeds 30%."}
              zh="自适应分类：任一 OpenAlex 领域若超过施引文献的 30%，则拆分为子领域与主题，直到没有节点超过 30%。"
            />
          </li>
          <li>
            <T
              en={meta.outsideOwnTopicsRule ?? "Outside-own-topics % uses OpenAlex topics on Ken's papers vs citing works."}
              zh="“主题外施引占比”比较黄康宁本人论文的 OpenAlex 主题与施引文献主题。"
            />
          </li>
          <li>
            <T
              en={`Country normalization: ${meta.countryBaseline}`}
              zh="国家归一化：预期施引 ≈ 各施引领域中该国产出占比 × 该领域施引文献数之和。"
            />
          </li>
          <li>
            <T
              en="OpenAlex under-counts Chinese-language venues (e.g. CNKI). Treat China coverage as a lower bound."
              zh="OpenAlex 对中文期刊（如知网）覆盖不足；将中国相关数字视为下限。"
            />
          </li>
          <li>
            <T
              en={
                <>
                  Every number on this page is from OpenAlex. Google Scholar counts are higher and are shown only on the{" "}
                  <Link href="/publications" className="text-teal hover:text-ember">
                    Publications
                  </Link>{" "}
                  page; the two are never combined.
                </>
              }
              zh={
                <>
                  本页所有数字均来自 OpenAlex。谷歌学术统计通常更高，仅在
                  <Link href="/publications" className="text-teal hover:text-ember">
                    学术论文
                  </Link>
                  页面展示，两者从不混用。
                </>
              }
            />
          </li>
          <li>
            <T
              en="Refreshed monthly by a GitHub Action; each run is kept as a dated snapshot."
              zh="由 GitHub Action 每月更新；每次运行保存为带日期的快照。"
            />
          </li>
        </ul>

        <details className="mt-6">
          <summary className="cursor-pointer text-ink-muted hover:text-ink">
            <T en="Per-paper counts (table)" zh="逐篇统计（表格）" />
          </summary>
          <table className="mt-3 w-full text-left">
            <thead className="text-xs text-ink-faint">
              <tr>
                <th className="py-1 pr-3 font-normal"><T en="Paper" zh="论文" /></th>
                <th className="py-1 pr-3 font-normal"><T en="Lens" zh="视角" /></th>
                <th className="py-1 pr-3 font-normal"><T en="Theme" zh="主题" /></th>
                <th className="py-1 pr-3 text-right font-normal"><T en="OpenAlex cited-by" zh="OpenAlex 被引" /></th>
                <th className="py-1 pr-3 text-right font-normal"><T en="Self removed" zh="剔除自引" /></th>
                <th className="py-1 text-right font-normal"><T en="Non-self" zh="非自引" /></th>
              </tr>
            </thead>
            <tbody>
              {tablePapers.map((p) => {
                const t = themeName(p.theme);
                return (
                  <tr key={p.doi} className="border-t border-rule">
                    <td className="py-1.5 pr-3">
                      <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-ember">
                        {p.short}
                      </a>
                      {p.early && (
                        <span className="ml-2 rounded bg-paper-deep px-1.5 text-[10px] uppercase tracking-wide text-ink-muted">
                          <T en="early" zh="早期" />
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 pr-3 text-xs text-ink-muted">{p.lens}</td>
                    <td className="py-1.5 pr-3">
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: THEME_COLORS[p.theme] }} />
                      <T en={t.en} zh={t.zh} />
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{p.openalexCitedByCount}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{p.selfCitationsRemoved}</td>
                    <td className="py-1.5 text-right tabular-nums text-ink">{p.citingNonSelf}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </details>
      </div>
    </section>
  );
}
