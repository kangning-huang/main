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
              zh="论文按“学术论文”页同步的固定 DOI 清单收录。OpenAlex 识别作者时会拆分或合并档案，因此不按姓名检索。尚无可解析 DOI 的待刊论文，以及 Nature Cities 的 Nested economies（DOI 尚未解禁），暂不纳入。"
            />
          </li>
          <li>
            <T
              en="Filter: All includes every pinned DOI. “First / last / corresponding author” is hand-pinned (lens: lead) — OpenAlex is_corresponding is never trusted alone. Corresponding-only flags still need Ken's review where unknown."
              zh="“全部”包含所有固定 DOI。“第一/通讯作者”由人工标注（lens: lead），不单凭 OpenAlex 的 is_corresponding 字段判断。尚未确认的“仅通讯作者”标注，仍需我核实。"
            />
          </li>
          <li>
            <T
              en={`Self-citations (strict, per cited paper): ${meta.selfCitationRule} Removed in this view: ${totals.selfCitationsRemoved} of ${totals.citingLinksFetched} citation links.`}
              zh={`自引（严格、按被引论文）：只要施引文献与被引论文有任何共同作者即剔除。本视角从 ${totals.citingLinksFetched} 条中剔除 ${totals.selfCitationsRemoved} 条。`}
            />
          </li>
          <li>
            <T
              en="Field & Shelf (section 01): one square per non-self citing OpenAlex work. Colour and centre position encode that citing work's own OpenAlex cited_by_count on a log-ish ember–ink ramp (0 · 1–9 · 10–99 · 100–999 · ≥1,000); nearer the centre means more cited. Direction means nothing. Hover a shelf paper to light its citers and draw a thin link from each; hover a square to show up to four lines back to the papers it cites."
              zh="田野与书架（第 01 节）中，每篇 OpenAlex 施引文献对应一个方块，已剔除自引。颜色和距中心远近表示文献自身在 OpenAlex 的被引次数（cited_by_count）。颜色从余烬色到墨色，近似按对数分段（0 · 1–9 · 10–99 · 100–999 · ≥1,000）；越靠近中心，被引越多，方向没有含义。鼠标移到书架上的论文，会点亮引用它的文献，并逐一画出细线；移到方块上，最多显示 4 条连线，指向它引用的论文。"
            />
          </li>
          <li>
            <T
              en="Field colour is each citing work's own OpenAlex cited_by_count (same across All / Lead). Where is the observed÷expected country map; Topic cards / Who below use the adaptive OpenAlex taxonomy; any outside-home % elsewhere on the page is labelled with its topic rule."
              zh="田野颜色表示施引文献自身在 OpenAlex 的被引次数（cited_by_count），同一文献在“全部”和“第一/通讯作者”视角下颜色相同。“在哪里”地图显示各国实际施引数÷预期施引数；下方主题卡片和“谁在使用”按 OpenAlex 分类自适应分组。页面其他位置若显示“主题外”占比，会注明所用主题规则。"
            />
          </li>
          <li>
            <T
              en={meta.adaptiveRule ?? "Adaptive taxonomy (topic cards): split any OpenAlex field holding more than 30% of citing works into subfields and topics until no node exceeds 30%."}
              zh="自适应分类（主题卡片）：任一 OpenAlex 领域若超过施引文献的 30%，则拆分为子领域与主题，直到没有节点超过 30%。"
            />
          </li>
          <li>
            <T
              en={`Country normalization: ${meta.countryBaseline}`}
              zh="国家归一化按 2012–2026 年数据计算。每国预期施引文献数 ≈ 各施引领域（该国在该领域 OpenAlex 文献中的占比 × 该领域施引文献数）之和。"
            />
          </li>
          <li>
            <T
              en="OpenAlex under-counts Chinese-language venues (e.g. CNKI). Treat China coverage as a lower bound."
              zh="OpenAlex 对中文文献来源（如知网）覆盖不足，中国相关统计应视为下限。"
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
              zh="通过 GitHub Action 每月更新，每次保留一份带日期的数据快照。"
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
