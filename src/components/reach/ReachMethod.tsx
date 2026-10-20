"use client";

import Link from "next/link";
import T from "@/components/T";
import { influence, THEMES, THEME_COLORS } from "@/lib/influence";
import { isScholarFieldShelf } from "@/lib/field-shelf";
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
              zh="这里收录的论文，以“学术论文”页同步的固定 DOI 清单为准。OpenAlex 的作者档案有时会被拆分或合并，因此用 DOI 确认论文，不按姓名检索。尚无可解析 DOI 的待刊论文，以及 DOI 尚未开放的 Nature Cities 论文 Nested economies，暂不纳入。"
            />
          </li>
          <li>
            <T
              en="Filter: All includes every pinned DOI. “First / last / corresponding author” is hand-pinned (lens: lead) — OpenAlex is_corresponding is never trusted alone. Corresponding-only flags still need Ken's review where unknown."
              zh="“全部论文”包含清单上的所有 DOI。“第一/末位/通讯作者”视角按人工标注筛选（lens: lead），不单凭 OpenAlex 的 is_corresponding 字段判断。尚未确认的“仅通讯作者”标注，仍需我核实。"
            />
          </li>
          <li>
            <T
              en={`Self-citations (strict, per cited paper): ${meta.selfCitationRule} Removed in this view: ${totals.selfCitationsRemoved} of ${totals.citingLinksFetched} citation links.`}
              zh={`自引按每篇被引用的论文分别判断。只要一篇论文和引用它的文献有任何一位共同作者，就剔除这条引用。当前视角共获取 ${totals.citingLinksFetched} 条引用记录，其中 ${totals.selfCitationsRemoved} 条作为自引剔除。`}
            />
          </li>
          <li>
            <T
              en={
                isScholarFieldShelf()
                  ? "Field & Shelf (section 01, Google Scholar prototype): one square per citing work from Scholar (SerpAPI), including grey literature (IPCC, theses, SSRN, …). Colour and centre encode that work's own Scholar citation count on a log-ish ember–ink ramp (0 · 1–9 · 10–99 · 100–999 · ≥1,000). IPCC AR6 WGII Ch.6 cluster duplicates are merged to the highest Scholar citedBy. Sample covers 3 pinned papers — not the full corpus yet."
                  : "Field & Shelf (section 01): one square per non-self citing OpenAlex work. Colour and centre position encode that citing work's own OpenAlex cited_by_count on a log-ish ember–ink ramp (0 · 1–9 · 10–99 · 100–999 · ≥1,000); nearer the centre means more cited. Direction means nothing. Hover a shelf paper to light its citers and draw a thin link from each; hover a square to show up to four lines back to the papers it cites."
              }
              zh={
                isScholarFieldShelf()
                  ? "在“领域与书架”（第 01 节，谷歌学术原型）中，一个方块代表一篇谷歌学术施引文献（经 SerpAPI），含灰色文献（IPCC、学位论文、SSRN 等）。颜色与离中心距离表示该文献自身的谷歌学术被引次数（0 · 1–9 · 10–99 · 100–999 · ≥1,000）。IPCC AR6 WGII 第 6 章的重复 cluster 合并为最高被引。当前样本覆盖 3 篇固定论文，尚未覆盖全部论文。"
                  : "在“领域与书架”（第 01 节）中，一个方块代表一篇 OpenAlex 收录的、引用我研究的文献，已剔除自引。方块的颜色和离中心的距离，表示这篇文献自身在 OpenAlex 中的被引次数（cited_by_count）。颜色从余烬色到墨色，近似按对数分档（0 · 1–9 · 10–99 · 100–999 · ≥1,000）；越靠近中心，被引次数越多，所在方向没有含义。把鼠标移到书架上的论文，引用它的文献就会亮起，并与它逐一连线；移到方块上，则最多显示 4 条连线，指向它引用的论文。"
              }
            />
          </li>
          <li>
            <T
              en={
                isScholarFieldShelf()
                  ? "Field colour is each citing work's own Google Scholar citation count (same across All / Lead). Where (geography) and Topic cards / Who still use OpenAlex and are labelled as such."
                  : "Field colour is each citing work's own OpenAlex cited_by_count (same across All / Lead). Where is the observed÷expected country map; Topic cards / Who below use the adaptive OpenAlex taxonomy; any outside-home % elsewhere on the page is labelled with its topic rule."
              }
              zh={
                isScholarFieldShelf()
                  ? "领域颜色表示施引文献自身的谷歌学术被引次数（全部 / 第一末位通讯视角下颜色相同）。“在哪里”地图与主题卡片 / “谁在用”仍用 OpenAlex，并会标明来源。"
                  : "领域中的颜色表示引用我研究的文献自身在 OpenAlex 中的被引次数（cited_by_count）。所以，同一篇文献在“全部论文”和“第一/末位/通讯作者”视角下，颜色相同。“在哪里”地图显示各国实际引用文献数与预期文献数的比值。下方的主题卡片和“谁在用”按 OpenAlex 分类自动调整分组；页面其他位置若显示“主题外”占比，会注明所用的主题规则。"
              }
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
              zh="各国的预期文献数，按 2012–2026 年的数据估算。先算出该国文献占 OpenAlex 某个领域文献总数的比例，再乘以该领域引用我研究的文献数。把各领域的结果相加，就得到该国的预期值。"
            />
          </li>
          <li>
            <T
              en="OpenAlex under-counts Chinese-language venues (e.g. CNKI). Treat China coverage as a lower bound."
              zh="OpenAlex 对知网等中文文献来源的收录还不完整，因此这里的中国相关统计应看作下限。"
            />
          </li>
          <li>
            <T
              en={
                <>
                  {isScholarFieldShelf() ? (
                    <>
                      Field &amp; Shelf citation counts on this preview are from <strong>Google Scholar</strong> (via SerpAPI). Where / topics stay on OpenAlex. Profile totals on the{" "}
                    </>
                  ) : (
                    <>
                      Every number on this page is from OpenAlex. Google Scholar counts are higher and are shown only on the{" "}
                    </>
                  )}
                  <Link href="/publications" className="text-teal hover:text-ember">
                    Publications
                  </Link>{" "}
                  page; the two are never combined.
                </>
              }
              zh={
                isScholarFieldShelf() ? (
                  <>
                    本预览中“领域与书架”的被引次数来自<strong>谷歌学术</strong>（SerpAPI）；“在哪里”与主题仍用 OpenAlex。个人主页总量见
                    <Link href="/publications" className="text-teal hover:text-ember">
                      学术论文
                    </Link>
                    ，两者从不混用。
                  </>
                ) : (
                  <>
                    本页所有数字均来自 OpenAlex。谷歌学术统计通常更高，仅在
                    <Link href="/publications" className="text-teal hover:text-ember">
                      学术论文
                    </Link>
                    页面展示，两者从不混用。
                  </>
                )
              }
            />
          </li>
          <li>
            <T
              en="Refreshed monthly by a GitHub Action; each run is kept as a dated snapshot."
              zh="数据通过 GitHub Action 每月更新，每次都会保存一份注明日期的数据快照。"
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
