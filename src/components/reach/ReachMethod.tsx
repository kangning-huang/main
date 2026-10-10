"use client";

import Link from "next/link";
import T from "@/components/T";
import { influence, THEMES, THEME_COLORS } from "@/lib/influence";
import { useReachLens } from "./ReachLens";
import { getRipple } from "@/lib/ripple";
import { getConstellation, num } from "@/lib/constellation";

export default function ReachMethod() {
  const { view, papers, lens } = useReachLens();
  const { meta } = influence;
  const { totals } = view;
  const ripple = getRipple(lens);
  const cview = getConstellation(lens);
  const cp = cview.meta.params;
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
              en={`Ripple map keywords: OpenAlex keywords on citing works (score ≥ ${ripple.meta.params.keywordScoreMin}), merged through a hand-kept alias list; any keyword on more than ${Math.round(ripple.meta.params.genericShareMax * 100)}% of citing works is dropped as generic. Each theme shows its most distinctive keywords (share in the theme ÷ share overall, at least ${ripple.meta.params.minWorksInTheme} works), and its bubble slots are split between home-side and outside keywords in proportion to the theme's own outside share. Themes with fewer than ${ripple.meta.params.emergingBelowWorks} citing works show as “emerging”.`}
              zh={`涟漪图关键词：施引文献的 OpenAlex 关键词（得分 ≥ ${ripple.meta.params.keywordScoreMin}），经人工别名表合并；出现在超过 ${Math.round(ripple.meta.params.genericShareMax * 100)}% 施引文献中的通用词被剔除。每个主题显示最具区分度的关键词（主题内占比 ÷ 总体占比，至少 ${ripple.meta.params.minWorksInTheme} 篇），并按该主题“主题外”占比分配本人主题侧与外侧的名额。施引少于 ${ripple.meta.params.emergingBelowWorks} 篇的主题标为“起步”。`}
            />
          </li>
          <li>
            <T
              en={`Reach distance: each citing work's OpenAlex topic is compared with the ${ripple.meta.homeTopics} topics on Ken's papers — 0 = a home topic, 1 = same subfield, 2 = same field, 3 = same domain (Ken's papers already carry topics in all four OpenAlex domains). A bubble sits at the mean distance of its works, on a square-root scale; keywords with fewer than ${ripple.meta.params.minTaggedForMean} topic-tagged works sit at their theme's median.`}
              zh={`距离：将每篇施引文献的 OpenAlex 主题与本人论文的 ${ripple.meta.homeTopics} 个主题比较——0 = 本人主题，1 = 同一子领域，2 = 同一领域，3 = 同一大类（本人论文的主题已覆盖 OpenAlex 全部四个大类）。圆的位置取其施引文献的平均距离（平方根刻度）；主题标注少于 ${ripple.meta.params.minTaggedForMean} 篇的关键词置于主题中位距离。`}
            />
          </li>
          <li>
            <T
              en={`Constellation map (preview): the same OpenAlex keywords on citing works, without generic and place-name keywords. Each keyword is embedded with the all-MiniLM-L6-v2 sentence model as the mean of its label and the titles of the citing works that carry it; UMAP (cosine, ${num(cp.umapNeighbors ?? cp.nNeighbors, 15)} neighbours, min_dist ${num(cp.umapMinDist ?? cp.minDist, 0.3)}, fixed seed) lays the keywords out in two dimensions, and ${cview.regions.filter((r) => r.keywords > 0).length} regions come from clustering the embeddings (4–7, chosen by silhouette). Only neighbourhoods carry meaning; the axes and directions do not. Stars are papers with at least ${num(cp.starMinWorks, 30)} non-self citing works, placed at the mean position of their citers' keywords; the dashed arrow starts at the mean position of the map keywords closest to the paper's own title and keywords. Drift is that distance in keyword-steps (the mean gap between neighbouring keywords); a bridge has at least ${Math.round(num(cp.bridgeShareMin, 0.25) * 100)}% of its citers' keyword mentions in each of two regions.`}
              zh={`星座图（预览）：同样使用施引文献的 OpenAlex 关键词，剔除通用词与地名。每个关键词以 all-MiniLM-L6-v2 句向量模型嵌入（关键词本身与带有它的施引文献标题的平均）；UMAP（余弦，${num(cp.umapNeighbors ?? cp.nNeighbors, 15)} 个近邻，min_dist ${num(cp.umapMinDist ?? cp.minDist, 0.3)}，固定随机种子）将其排布在二维平面上；${cview.regions.filter((r) => r.keywords > 0).length} 个区域由嵌入向量聚类得到（4–7 个，按轮廓系数选择）。只有“邻近”有含义，坐标轴与方向没有。星为非自引施引至少 ${num(cp.starMinWorks, 30)} 篇的论文，位于其施引文献关键词的平均位置；虚线箭头起点是与论文自身标题和关键词最接近的图中关键词的平均位置。漂移为二者距离（以相邻关键词的平均间距为单位）；“桥梁”指施引文献关键词在两个区域各占至少 ${Math.round(num(cp.bridgeShareMin, 0.25) * 100)}%。`}
            />
          </li>
          <li>
            <T
              en="Counting: the Ripple map counts unique citing works per theme — a work citing two papers in one theme counts once there, and once in each other theme it cites."
              zh="计数：涟漪图按主题统计不重复的施引文献——引用同一主题两篇论文的文献在该主题只计一次，在其引用的其他主题各计一次。"
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
              en="Set to refresh on the 1st of each month by a GitHub Action (OpenAlex fetch, then the Ripple build); each run is kept as a dated snapshot."
              zh="设定由 GitHub Action 于每月 1 日更新（先抓取 OpenAlex，再生成涟漪图）；每次运行保存为带日期的快照。"
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
