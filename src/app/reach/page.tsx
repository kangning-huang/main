import Link from "next/link";
import type { Metadata } from "next";
import { canonicalUrl, withOpenGraphDefaults, pageTitle, webPageSchema, breadcrumbSchema } from "@/lib/seo";
import T from "@/components/T";
import { influence, isSample, THEMES, THEME_COLORS } from "@/lib/influence";
import FieldsFlow from "@/components/reach/FieldsFlow";
import WhoUses from "@/components/reach/WhoUses";
import WhereMap from "@/components/reach/WhereMap";
import StandingOnIt from "@/components/reach/StandingOnIt";
import Growth from "@/components/reach/Growth";

const DESCRIPTION =
  "Who builds on Kangning (Ken) Huang's research: the fields, institutions, and countries citing his lead-author papers, from OpenAlex with self-citations removed.";

export const metadata: Metadata = {
  title: "Reach",
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl("/reach") },
  openGraph: withOpenGraphDefaults({
    type: "website",
    title: pageTitle("Reach"),
    description: DESCRIPTION,
    url: canonicalUrl("/reach"),
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Kangning (Ken) Huang — NYU Shanghai" }],
  }),
};

const SECTIONS = [
  { id: "fields", en: "Reach across fields", zh: "跨领域影响", Component: FieldsFlow },
  { id: "who", en: "Who uses it", zh: "谁在使用", Component: WhoUses },
  { id: "where", en: "Where", zh: "在哪里", Component: WhereMap },
  { id: "standing-on-it", en: "Standing on it", zh: "在此基础上", Component: StandingOnIt },
  { id: "growth", en: "Growth", zh: "增长", Component: Growth },
];

export default function ReachPage() {
  const { meta, totals, papers } = influence;
  const lead = papers.filter((p) => p.lens === "lead");
  const coauthor = papers.filter((p) => p.lens === "coauthor");
  const themeName = (id: string) => THEMES.find((t) => t.id === id) ?? { en: id, zh: id };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema({ path: "/reach", title: "Reach", description: DESCRIPTION })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ name: "Reach", path: "/reach" }])) }} />

      {isSample && (
        <div role="alert" className="border-b border-ember bg-ember-light px-6 py-3 text-center text-sm font-medium text-ember-dark">
          <T en="SAMPLE DATA — these figures are a placeholder fixture, not real OpenAlex results." zh="示例数据——以下数字为占位样例，并非真实的 OpenAlex 结果。" />
        </div>
      )}

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <h1 className="section-heading animate-fade-up">
            <T en="Who builds on this work" zh="谁在此基础上继续研究" />
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-muted animate-fade-up delay-1">
            <T
              en={`Where the ideas travel after publication: the fields, institutions and countries of the ${totals.uniqueCitingWorks} distinct works that cite Ken's ${totals.leadPapers} lead-author papers with a DOI — with every self-citation removed.`}
              zh={`论文发表之后，思想流向何处：引用黄康宁 ${totals.leadPapers} 篇第一/通讯作者论文（有 DOI）的 ${totals.uniqueCitingWorks} 篇不同文献，来自哪些领域、机构与国家——已剔除全部自引。`}
            />
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-rule bg-paper-warm/60 px-4 py-3 text-xs text-ink-muted animate-fade-up delay-2">
            <span className="rounded bg-teal-light px-2 py-0.5 font-medium text-teal">
              {isSample ? <T en="Source: SAMPLE" zh="来源：示例" /> : <T en="Source: OpenAlex" zh="来源：OpenAlex" />}
            </span>
            <span><T en={`As of ${meta.asOf}`} zh={`截至 ${meta.asOf}`} /></span>
            <span><T en="Lead-author papers only" zh="仅第一/通讯作者论文" /></span>
            <span><T en={`${totals.selfCitationsRemoved} self-citations removed`} zh={`已剔除 ${totals.selfCitationsRemoved} 次自引`} /></span>
            <a href="#method" className="text-teal hover:text-ember"><T en="Method →" zh="方法 →" /></a>
          </div>

          <nav aria-label="Reach views" className="mt-6 flex flex-wrap gap-2 animate-fade-up delay-3">
            {SECTIONS.map((s, i) => (
              <a key={s.id} href={`#${s.id}`} className="rounded-full border border-rule px-3 py-1 text-sm text-ink-muted hover:border-ember hover:text-ember">
                {i + 1}. <T en={s.en} zh={s.zh} />
              </a>
            ))}
          </nav>
        </div>
      </section>

      {SECTIONS.map(({ id, en, zh, Component }, i) => (
        <section key={id} id={id} aria-labelledby={`${id}-heading`} className={`scroll-mt-20 border-t border-rule-faint py-14 ${i % 2 === 1 ? "bg-paper-warm/50" : ""}`}>
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">{String(i + 1).padStart(2, "0")}</p>
            <h2 id={`${id}-heading`} className="mt-1 mb-6 font-display text-3xl text-ink">
              <T en={en} zh={zh} />
            </h2>
            <Component />
          </div>
        </section>
      ))}

      <section aria-labelledby="coauthor-heading" className="border-t border-rule-faint py-14">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <h2 id="coauthor-heading" className="font-display text-2xl text-ink">
            <T en="Outside the default lens: two 2020 co-authored papers" zh="默认视角之外：两篇 2020 年合作论文" />
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted">
            <T
              en="Ken is a co-author, not first or last author, on these two widely cited papers. They are reported here separately and are not included in any figure above."
              zh="黄康宁是以下两篇高被引论文的合作者（非第一或通讯作者）。它们在此单独列出，不计入上方任何图表。"
            />
          </p>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {coauthor.map((p) => (
              <li key={p.doi} className="rounded-lg border border-rule p-4">
                <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" className="text-[15px] text-ink hover:text-ember">{p.title}</a>
                <div className="mt-1 text-xs text-ink-muted"><em>{p.venue}</em> · {p.year}</div>
                <div className="mt-2 text-sm text-ink">
                  <T
                    en={`${p.citingNonSelf.toLocaleString()} citing works excluding self-citations (${p.openalexCitedByCount.toLocaleString()} total) — OpenAlex, ${meta.asOf}`}
                    zh={`剔除自引后 ${p.citingNonSelf.toLocaleString()} 篇施引文献（总计 ${p.openalexCitedByCount.toLocaleString()}）——OpenAlex，${meta.asOf}`}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="method" aria-labelledby="method-heading" className="scroll-mt-20 border-t border-rule-faint bg-paper-warm/50 py-14">
        <div className="mx-auto max-w-6xl px-6 text-sm leading-relaxed text-ink-muted lg:px-8">
          <h2 id="method-heading" className="font-display text-2xl text-ink"><T en="Method" zh="方法" /></h2>
          <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5">
            <li>
              <T
                en="Papers: a pinned list of DOIs for papers Ken led (first or last author). No author-name search is used, because OpenAlex name disambiguation splits and merges profiles. In-press and under-review papers without a DOI are not included yet."
                zh="论文：固定的 DOI 列表，仅含黄康宁为第一或通讯作者的论文。不使用作者姓名检索，因为 OpenAlex 的作者消歧会拆分或合并档案。尚无 DOI 的待刊与在审论文暂未纳入。"
              />
            </li>
            <li>
              <T
                en={`Self-citations (strict): ${meta.selfCitationRule} Removed: ${totals.selfCitationsRemoved} of ${totals.citingLinksFetched} citation links.`}
                zh={`自引（严格）：只要施引文献与被引论文有任何共同作者（OpenAlex 作者 ID、ORCID 或规范化全名匹配）即剔除。共剔除 ${totals.citingLinksFetched} 条引用中的 ${totals.selfCitationsRemoved} 条。`}
              />
            </li>
            <li>
              <T
                en={`Country normalization: ${meta.countryBaseline}`}
                zh="国家归一化：预期施引文献数 = 对每篇施引文献，累加该国在其所属领域全部 OpenAlex 文献中的占比。"
              />
            </li>
            <li>
              <T
                en={`Growth drops ${meta.growthDatesDropped} citing work(s) whose OpenAlex date is earlier than the paper it cites (a metadata error).`}
                zh={`增长图剔除了 ${meta.growthDatesDropped} 篇 OpenAlex 日期早于被引论文的施引文献（元数据错误）。`}
              />
            </li>
            <li>
              <T
                en={
                  <>
                    Every number on this page is from OpenAlex. Google Scholar counts are higher and are shown only on the{" "}
                    <Link href="/publications" className="text-teal hover:text-ember">Publications</Link> page; the two are never combined.
                  </>
                }
                zh={
                  <>
                    本页所有数字均来自 OpenAlex。谷歌学术的统计数字通常更高，仅在
                    <Link href="/publications" className="text-teal hover:text-ember">学术论文</Link>页面展示，两者从不混用。
                  </>
                }
              />
            </li>
            <li>
              <T
                en="Refreshed monthly by a GitHub Action; each run is kept as a dated snapshot so growth can be tracked over time."
                zh="由 GitHub Action 每月更新；每次运行都保存为带日期的快照，便于追踪长期增长。"
              />
            </li>
          </ul>

          <details className="mt-6">
            <summary className="cursor-pointer text-ink-muted hover:text-ink"><T en="Per-paper counts (table)" zh="逐篇统计（表格）" /></summary>
            <table className="mt-3 w-full text-left">
              <thead className="text-xs text-ink-faint">
                <tr>
                  <th className="py-1 pr-3 font-normal"><T en="Paper" zh="论文" /></th>
                  <th className="py-1 pr-3 font-normal"><T en="Theme" zh="主题" /></th>
                  <th className="py-1 pr-3 text-right font-normal"><T en="OpenAlex cited-by" zh="OpenAlex 被引" /></th>
                  <th className="py-1 pr-3 text-right font-normal"><T en="Self removed" zh="剔除自引" /></th>
                  <th className="py-1 text-right font-normal"><T en="Non-self" zh="非自引" /></th>
                </tr>
              </thead>
              <tbody>
                {lead.map((p) => {
                  const t = themeName(p.theme);
                  return (
                    <tr key={p.doi} className="border-t border-rule">
                      <td className="py-1.5 pr-3">
                        <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-ember">{p.short}</a>
                        {p.early && <span className="ml-2 rounded bg-paper-deep px-1.5 text-[10px] uppercase tracking-wide text-ink-muted"><T en="early" zh="早期" /></span>}
                      </td>
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
            <p className="mt-2 text-xs text-ink-faint">
              <T
                en="Cited-by can differ by one or two from the fetched list (OpenAlex index lag). Themes follow the Research page; papers not listed there were assigned by hand."
                zh="被引数与实际获取的施引列表可能相差一两篇（OpenAlex 索引延迟）。主题与“研究”页面一致；未列于该页的论文为人工归类。"
              />
            </p>
          </details>
        </div>
      </section>
    </>
  );
}
