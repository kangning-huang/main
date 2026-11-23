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
              en="Papers are selected from a fixed DOI list synchronized with the Publications page. I do not search by author name because OpenAlex may split or merge author profiles. In-press papers without a resolving DOI are excluded until their DOI resolves. OpenAlex records may lag behind Crossref."
              zh="论文清单与 Publications 页面同步，以固定的 DOI 为准。不按作者姓名检索，因为 OpenAlex 可能将同一作者拆分为多个档案，或把不同作者合并。尚无可解析 DOI 的待刊论文暂不纳入。OpenAlex 的记录可能晚于 Crossref。"
            />
          </li>
          <li>
            <T
              en="The All filter includes every DOI on the fixed list. The “First / last / corresponding author” filter uses manually assigned labels (lens: lead). I do not rely on OpenAlex is_corresponding alone. Corresponding-only authorship remains subject to my review where the status is uncertain."
              zh="“全部论文”包含固定清单中的所有 DOI。“第一 / 末位 / 通讯作者”视角使用人工标注（lens: lead），不单凭 OpenAlex 的 is_corresponding 字段判断。尚未确认的仅通讯作者身份仍需人工核实。"
            />
          </li>
          <li>
            <T
              en={`Self-citations are identified separately for each cited paper. Rule: ${meta.selfCitationRule} In this view, ${totals.selfCitationsRemoved} of ${totals.citingLinksFetched} citation links were removed as self-citations.`}
              zh={`自引按每篇被引论文分别判断。如果施引文献与被引论文有任何一位共同作者，就剔除该引用。当前视角共获取 ${totals.citingLinksFetched} 条引用记录，其中 ${totals.selfCitationsRemoved} 条因自引被剔除。`}
            />
          </li>
          <li>
            <T
              en="In Field & Shelf (section 01), each square represents one citing work recorded in OpenAlex, excluding self-citations. Its color and distance from the center show its own OpenAlex citation count (cited_by_count). The ember–ink color scale uses approximate logarithmic groups: 0 · 1–9 · 10–99 · 100–999 · ≥1,000. More highly cited works are closer to the center. Direction has no meaning. Hover over a paper on the shelf to highlight its citing works and draw links to them. Hover over a square to show up to four links to the papers it cites."
              zh="在“领域与书架”（第 01 节）中，每个方块代表一篇 OpenAlex 收录的施引文献，已剔除自引。方块的颜色和到中心的距离表示该文献自身的被引次数（cited_by_count）。颜色从余烬色到墨色，近似按对数分组：0 · 1–9 · 10–99 · 100–999 · ≥1,000。被引次数越多，方块越靠近中心。方块所在方向没有含义。 鼠标悬停在书架中的论文上，可以突出显示引用它的文献，并绘制连线。悬停在方块上，最多显示 4 条连线，连接到它引用的论文。"
            />
          </li>
          <li>
            <T
              en="Field colors represent each citing work's own OpenAlex citation count (cited_by_count), and remain the same in All and Lead views. The Where map shows the ratio of observed to expected citing works by country. The topic cards and Who section use an adaptive OpenAlex taxonomy. Any percentage of citing works outside my research topics elsewhere on the page states the topic rule used."
              zh="领域图中的颜色表示施引文献自身在 OpenAlex 中的被引次数（cited_by_count）。同一篇文献在“全部论文”和“第一 / 末位 / 通讯作者”视角下颜色相同。“在哪里”地图显示各国实际施引文献数与预期值的比值。主题卡片和“谁在用”部分使用 OpenAlex 的自适应分类。页面其他位置若显示研究主题之外的文献比例，会注明所用的分类规则。"
            />
          </li>
          <li>
            <T
              en={meta.adaptiveRule ?? "Adaptive taxonomy (topic cards): split any OpenAlex field holding more than 30% of citing works into subfields and topics until no node exceeds 30%."}
              zh="主题卡片按 OpenAlex 分类自动分组。引用我研究的文献中，如果一个领域占比超过 30%，就继续细分为子领域和主题，直到每组占比都不超过 30%。"
            />
          </li>
          <li>
            <T
              en={`Country normalization: ${meta.countryBaseline}`}
              zh="各国的预期施引文献数根据 2012–2026 年的数据计算。首先，计算该国在各个 OpenAlex 领域中的文献产出比例。然后，将这个比例乘以该领域引用我研究的文献数。最后，将各领域的预期值相加，得到该国的总预期值。"
            />
          </li>
          <li>
            <T
              en="OpenAlex does not fully cover Chinese-language publications, including those indexed by CNKI. Treat the China counts as a lower bound."
              zh="OpenAlex 对中文文献的收录并不完整，包括知网（CNKI）中的部分文献。因此，中国相关的统计结果应视为下限。"
            />
          </li>
          <li>
            <T
              en={
                <>
                  Citing works come from OpenAlex citation links and from Semantic Scholar records that cite papers on the fixed list but are not yet linked in OpenAlex. These additional works are located in OpenAlex by DOI. All metadata, including topics, institutions, countries, and each work&apos;s own citation count, come from OpenAlex. The same self-citation rule applies to all works. Open-discussion replies classified as peer-review in OpenAlex are excluded. Google Scholar counts are higher and are shown only on the{" "}
                  <Link href="/publications" className="text-teal hover:text-ember">Publications</Link>{" "}
                  page. They are never combined with these counts.
                </>
              }
              zh={
                <>
                  施引文献包括 OpenAlex 的引用记录，以及 Semantic Scholar 已记录、但 OpenAlex 尚未建立引用关联的文献。后者通过 DOI 在 OpenAlex 中查找。所有文献的主题、机构、国家和自身被引次数均来自 OpenAlex。全部文献采用相同的自引剔除规则。OpenAlex 中归类为 peer-review 的公开讨论回复不纳入统计。Google Scholar 的被引统计通常更高，只在
                  <Link href="/publications" className="text-teal hover:text-ember">Publications</Link>
                  页面展示，不与本页数据合并。
                </>
              }
            />
          </li>
          <li>
            <T
              en="A GitHub Action updates the data monthly. Each update is saved as a dated snapshot."
              zh="数据通过 GitHub Action 每月更新，每次更新都会保存一份带日期的快照。"
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
                <th className="py-1 pr-3 text-right font-normal"><T en="OpenAlex cited-by" zh="OpenAlex 被引数" /></th>
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
