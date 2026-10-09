import Link from "next/link";
import type { Metadata } from "next";
import { publicationSlug } from "@/lib/constants";
import { canonicalUrl, withOpenGraphDefaults, pageTitle, webPageSchema, breadcrumbSchema } from "@/lib/seo";
import T from "@/components/T";

const DESCRIPTION =
  "Research themes of Kangning (Ken) Huang and the CLUEs Lab: urban futures, heat, flood and coasts, and the scaling and form of cities.";

/** On-site link to a publication entry (used for in-press / under-review papers without a DOI). */
const pubHref = (title: string) => `/publications#${publicationSlug(title)}`;
const doiHref = (doi: string) => `https://doi.org/${doi}`;

interface Bilingual {
  en: string;
  zh: string;
}

interface Finding extends Bilingual {
  venue: string;
  year: string;
  href: string;
}

interface PaperLink {
  title: string;
  venue: string;
  year: string;
  href: string;
  /** Short status label shown after the venue (e.g. in press) */
  status?: Bilingual;
}

interface AppLink extends Bilingual {
  href: string;
}

interface Theme {
  id: string;
  title: Bilingual;
  question: Bilingual;
  findings: Finding[];
  papers: PaperLink[];
  apps: AppLink[];
  openQuestions: Bilingual[];
  figure?: { src: string; alt: string; caption: Bilingual };
}

const IN_PRESS: Bilingual = { en: "in press", zh: "待刊" };

// Every finding below is taken from the linked paper's highlights in
// publications-part-a.ts / publications-part-b.ts.
const THEMES: Theme[] = [
  {
    id: "urban-futures",
    title: { en: "Urban futures", zh: "城市未来" },
    question: {
      en: "How much will cities grow by mid-century, where, and what will that growth commit us to?",
      zh: "到本世纪中叶，城市将扩张多少、在哪里扩张，这些扩张又将带来哪些长期后果？",
    },
    findings: [
      {
        en: "Global urban land could expand by 0.6–1.3 million km² (78%–171%) between 2015 and 2050 across shared socioeconomic pathways.",
        zh: "在不同共享社会经济路径下，2015—2050年全球城市用地可能扩张60万—130万平方公里（78%—171%）。",
        venue: "Environmental Research Letters",
        year: "2019",
        href: doiHref("10.1088/1748-9326/ab4b71"),
      },
      {
        en: "Tropical regions in the Southern Hemisphere face disproportionately high extreme-heat risk from compounding urbanization and climate warming.",
        zh: "南半球热带地区在城市化与气候变暖叠加作用下，面临格外高的极端高温风险。",
        venue: "Environmental Research Letters",
        year: "2019",
        href: doiHref("10.1088/1748-9326/ab4b71"),
      },
      {
        en: "Roughly 50–63% of newly expanded urban land worldwide is projected to replace existing cropland.",
        zh: "预计全球新增城市用地中约50%—63%将占用现有耕地。",
        venue: "Nature Communications",
        year: "2020",
        href: doiHref("10.1038/s41467-020-14386-x"),
      },
    ],
    papers: [
      {
        title: "Projecting global urban land expansion and heat island intensification through 2050",
        venue: "Environmental Research Letters",
        year: "2019",
        href: doiHref("10.1088/1748-9326/ab4b71"),
      },
      {
        title: "Global projections of future urban land expansion under shared socioeconomic pathways",
        venue: "Nature Communications",
        year: "2020",
        href: doiHref("10.1038/s41467-020-14386-x"),
      },
      {
        title: "Infrastructure reach and capacity pressure in sub-Saharan Africa's future urban expansion",
        venue: "Nature Communications",
        year: "2026",
        href: pubHref("Infrastructure reach and capacity pressure in sub-Saharan Africa's future urban expansion"),
        status: { en: "in revision", zh: "修改审稿中" },
      },
    ],
    apps: [
      { en: "Urban Expansion 2050 map", zh: "2050年全球城市扩张地图", href: "/urban-expansion" },
      {
        en: "URBANMOD-ZIPF model (GitHub)",
        zh: "URBANMOD-ZIPF 模型（GitHub）",
        href: "https://github.com/kangning-huang/URBANMOD-ZIPF",
      },
    ],
    openQuestions: [
      {
        en: "Will infrastructure reach the places where the next wave of urban residents will live?",
        zh: "基础设施能否覆盖下一波城市人口将要居住的地方？",
      },
      {
        en: "Which expansion pathways keep the cities of 2050 cooler and less exposed?",
        zh: "哪些扩张路径能让2050年的城市更凉爽、暴露风险更低？",
      },
    ],
  },
  {
    id: "heat",
    title: { en: "Heat", zh: "高温" },
    question: {
      en: "How does the way we build cities change who overheats, by day and by night?",
      zh: "城市的建设方式如何改变谁在白天和夜晚遭受高温？",
    },
    findings: [
      {
        en: "About half of the added nighttime outdoor heat stress from urban expansion persists even after large-scale cool-roof deployment.",
        zh: "即使大规模推广冷屋顶，城市扩张新增的夜间室外热应力仍约有一半无法消除。",
        venue: "JGR: Atmospheres",
        year: "2021",
        href: doiHref("10.1029/2020JD033831"),
      },
      {
        en: "Demolishing informal settlements produced a causal surface cooling of about 1.5 K, shaped by what was built afterward.",
        zh: "拆除非正规住区带来约1.5 K的因果性地表降温，降温幅度取决于拆除后的土地用途。",
        venue: "npj Environmental Social Sciences",
        year: "2026",
        href: doiHref("10.1038/s44432-026-00009-1"),
      },
      {
        en: "A 100-metre increase in the scale of functionally homogeneous building clusters is associated with roughly 5% lower daytime urban heat island intensity.",
        zh: "功能同质建筑集群的尺度每增加100米，白天城市热岛强度约降低5%。",
        venue: "PNAS",
        year: "2026",
        href: pubHref("Toward Cooler Cities by Larger Homogeneous Functional Clusters"),
      },
    ],
    papers: [
      {
        title: "Projecting global urban land expansion and heat island intensification through 2050",
        venue: "Environmental Research Letters",
        year: "2019",
        href: doiHref("10.1088/1748-9326/ab4b71"),
      },
      {
        title: "Persistent increases in nighttime heat stress from urban expansion despite heat island mitigation",
        venue: "Journal of Geophysical Research: Atmospheres",
        year: "2021",
        href: doiHref("10.1029/2020JD033831"),
      },
      {
        title: "Declining urban density attenuates rising population exposure to surface heat extremes",
        venue: "Scientific Reports",
        year: "2025",
        href: doiHref("10.1038/s41598-025-96045-z"),
      },
      {
        title: "Unveiling the causal link between informal settlement demolition and urban cooling",
        venue: "npj Environmental Social Sciences",
        year: "2026",
        href: doiHref("10.1038/s44432-026-00009-1"),
      },
      {
        title: "Toward Cooler Cities by Larger Homogeneous Functional Clusters",
        venue: "PNAS",
        year: "2026",
        href: pubHref("Toward Cooler Cities by Larger Homogeneous Functional Clusters"),
        status: IN_PRESS,
      },
    ],
    apps: [
      {
        en: "Urban renewal cooling explorer",
        zh: "城市更新降温交互可视化",
        href: "https://cooling.kangning-huang.com/",
      },
    ],
    openQuestions: [
      {
        en: "Why does nighttime heat resist the fixes that work during the day?",
        zh: "为什么夜间高温难以通过白天有效的措施来缓解？",
      },
      {
        en: "When a neighborhood is rebuilt cooler, who ends up enjoying the benefit?",
        zh: "当一个街区被改造得更凉爽时，最终是谁享受到了好处？",
      },
    ],
  },
  {
    id: "flood-coasts",
    title: { en: "Flood and coasts", zh: "洪水与海岸" },
    question: {
      en: "Where does flood damage really land once we count building height and flood defenses?",
      zh: "把建筑高度和防洪设施考虑在内后，洪灾损失究竟落在哪里？",
    },
    findings: [
      {
        en: "Counting building height and protection standards shifts global flood damage toward Southeast Asia: 42% of the total versus 15% under depth-only assessments.",
        zh: "纳入建筑高度与防洪标准后，全球洪灾损失向东南亚转移：占比为42%，而仅考虑淹没深度时为15%。",
        venue: "Scientific Reports",
        year: "2026",
        href: doiHref("10.1038/s41598-026-70981-w"),
      },
      {
        en: "In Chinese cities, protection systems can reduce potential flood damage by more than 90%.",
        zh: "在中国城市，防洪体系可使潜在洪灾损失降低90%以上。",
        venue: "Scientific Reports",
        year: "2026",
        href: doiHref("10.1038/s41598-026-70981-w"),
      },
      {
        en: "Pixel-level inundation probabilities from Sentinel-1 radar on Google Earth Engine enable rapid flood mapping with quantified uncertainty.",
        zh: "基于Google Earth Engine与Sentinel-1雷达数据的像元级淹没概率，可实现带不确定性量化的快速洪水制图。",
        venue: "Remote Sensing",
        year: "2025",
        href: doiHref("10.3390/rs17101747"),
      },
    ],
    papers: [
      {
        title: "Height-Aware and Protection-Informed Flood Assessment Shifts Global Urban Risk Distribution",
        venue: "Scientific Reports",
        year: "2026",
        href: doiHref("10.1038/s41598-026-70981-w"),
      },
      {
        title: "Rapid Probabilistic Inundation Mapping Using Local Thresholds and Sentinel-1 SAR Data on Google Earth Engine",
        venue: "Remote Sensing",
        year: "2025",
        href: doiHref("10.3390/rs17101747"),
      },
      {
        title: "Beyond land exposure: multidimensional assessment of future built-environment and material-stock impacts under coastal inundation",
        venue: "Ecological Indicators",
        year: "2026",
        href: pubHref("Beyond land exposure: multidimensional assessment of future built-environment and material-stock impacts under coastal inundation"),
        status: { en: "submitted; ongoing co-authored work", zh: "已投稿，合作研究进行中" },
      },
    ],
    apps: [
      {
        en: "3D urban flood risk explorer",
        zh: "三维城市洪水风险交互应用",
        href: "https://flood.kangning-huang.com/",
      },
    ],
    openQuestions: [
      {
        en: "What is at stake in coastal cities beyond the area of land that floods?",
        zh: "在沿海城市，除了被淹没的土地面积之外，还有什么面临风险？",
      },
    ],
  },
  {
    id: "scaling-form",
    title: { en: "Scaling and form", zh: "标度与形态" },
    question: {
      en: "How much material does a city need per person, and why do larger cities need less?",
      zh: "一座城市人均需要多少建筑材料？为什么大城市所需更少？",
    },
    findings: [
      {
        en: "Double a city's population and its built mass grows only about 87%; bigger cities need less material per person.",
        zh: "城市人口翻倍，建成质量仅增长约87%；城市越大，人均所需的建筑材料越少。",
        venue: "Nature Cities",
        year: "2026",
        href: pubHref("Nested economies of scale in global city mass"),
      },
      {
        en: "Economies of scale intensify at finer resolution: neighborhood-level scaling (δ ≈ 0.75) is more sub-linear than city-level scaling (β ≈ 0.90).",
        zh: "规模经济在更精细的空间尺度上更为显著：街区层面的标度指数（δ ≈ 0.75）低于城市层面（β ≈ 0.90）。",
        venue: "Nature Cities",
        year: "2026",
        href: pubHref("Nested economies of scale in global city mass"),
      },
    ],
    papers: [
      {
        title: "Nested economies of scale in global city mass",
        venue: "Nature Cities",
        year: "2026",
        href: pubHref("Nested economies of scale in global city mass"),
        status: IN_PRESS,
      },
    ],
    apps: [
      {
        en: "City mass scaling explorer",
        zh: "城市建成质量标度交互可视化",
        href: "https://city-mass.nested-complexity.net",
      },
    ],
    openQuestions: [
      {
        en: "Which cities are over-built or under-built relative to their size, and why?",
        zh: "相对于其规模，哪些城市建得过多、哪些建得不足？原因何在？",
      },
      {
        en: "How does building upward change the material and mobility costs of a growing city?",
        zh: "向上建设如何改变一座成长中城市的材料与出行成本？",
      },
    ],
    figure: {
      src: "/videos/nested-economies-demo-poster.jpg",
      alt: "Still from the animated summary of “Nested economies of scale in global city mass”",
      caption: {
        en: "From the animated summary of the Nature Cities paper (in press).",
        zh: "摘自 Nature Cities 论文（待刊）的动画摘要。",
      },
    },
  },
];

export const metadata: Metadata = {
  title: "Research",
  description: DESCRIPTION,
  alternates: {
    canonical: canonicalUrl("/research"),
  },
  openGraph: withOpenGraphDefaults({
    type: "website",
    title: pageTitle("Research"),
    description: DESCRIPTION,
    url: canonicalUrl("/research"),
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Kangning (Ken) Huang — NYU Shanghai",
      },
    ],
  }),
};

const isExternal = (href: string) => href.startsWith("http");
const externalProps = (href: string) =>
  isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};

export default function ResearchPage() {
  const pageSchema = webPageSchema({
    path: "/research",
    title: "Research",
    description: DESCRIPTION,
  });

  const breadcrumbs = breadcrumbSchema([{ name: "Research", path: "/research" }]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <h1 className="section-heading animate-fade-up">
            <T en="Research" zh="研究" />
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-muted animate-fade-up delay-1">
            <T
              en="How the size and shape of cities decide their climate future. The CLUEs (CLimate and Urban Environments) Lab works on four connected themes."
              zh="城市的规模与形态如何决定其气候未来。CLUEs（CLimate and Urban Environments）实验室围绕四个相互关联的主题展开研究。"
            />
          </p>

          <nav aria-label="Research themes" className="mt-6 flex flex-wrap gap-2 animate-fade-up delay-2">
            {THEMES.map((theme) => (
              <a
                key={theme.id}
                href={`#${theme.id}`}
                className="rounded-full border border-rule px-4 py-1.5 text-sm text-ink-muted transition-colors hover:border-ember hover:text-ember"
              >
                <T en={theme.title.en} zh={theme.title.zh} />
              </a>
            ))}
          </nav>

          <div className="mt-14 space-y-16">
            {THEMES.map((theme, i) => (
              <article
                key={theme.id}
                id={theme.id}
                className="scroll-mt-24 border-t border-rule-faint pt-10"
                aria-labelledby={`${theme.id}-heading`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-faint">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 id={`${theme.id}-heading`} className="mt-1 font-display text-3xl text-ink">
                  <T en={theme.title.en} zh={theme.title.zh} />
                </h2>
                <p className="mt-3 max-w-3xl font-display text-xl italic leading-snug text-ink-muted">
                  <T en={theme.question.en} zh={theme.question.zh} />
                </p>

                <div className="mt-8 grid gap-10 lg:grid-cols-[3fr_2fr]">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-faint">
                      <T en="Findings" zh="研究发现" />
                    </h3>
                    <ul className="mt-4 space-y-3">
                      {theme.findings.map((f) => (
                        <li key={f.en}>
                          <a
                            href={f.href}
                            {...externalProps(f.href)}
                            className="card-hover group block rounded-lg border border-rule bg-paper p-4"
                          >
                            <p className="text-sm leading-relaxed text-ink transition-colors group-hover:text-ember">
                              <T en={f.en} zh={f.zh} />
                            </p>
                            <p className="mt-2 text-xs text-ink-faint">
                              <span className="italic">{f.venue}</span>, {f.year}
                              {isExternal(f.href) && (
                                <span className="ml-1 text-[10px] opacity-60">&#8599;</span>
                              )}
                            </p>
                          </a>
                        </li>
                      ))}
                    </ul>

                    {theme.figure && (
                      <figure className="mt-6">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={theme.figure.src}
                          alt={theme.figure.alt}
                          loading="lazy"
                          className="w-full rounded-lg border border-rule"
                        />
                        <figcaption className="mt-2 text-xs text-ink-faint">
                          <T en={theme.figure.caption.en} zh={theme.figure.caption.zh} />
                        </figcaption>
                      </figure>
                    )}
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-faint">
                        <T en="Papers" zh="相关论文" />
                      </h3>
                      <ul className="mt-4 space-y-3">
                        {theme.papers.map((p) => (
                          <li key={p.title} className="text-sm leading-snug">
                            <a
                              href={p.href}
                              {...externalProps(p.href)}
                              className="text-ink transition-colors hover:text-ember"
                            >
                              {p.title}
                            </a>
                            <span className="block text-xs text-ink-faint">
                              <span className="italic">{p.venue}</span>, {p.year}
                              {p.status && (
                                <>
                                  {" · "}
                                  <T en={p.status.en} zh={p.status.zh} />
                                </>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {theme.apps.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-faint">
                          <T en="Explore" zh="交互工具" />
                        </h3>
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {theme.apps.map((app) =>
                            isExternal(app.href) ? (
                              <li key={app.href}>
                                <a
                                  href={app.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block rounded-full border border-teal/30 bg-teal-light px-3 py-1 text-xs font-medium text-teal transition-colors hover:border-teal"
                                >
                                  <T en={app.en} zh={app.zh} />
                                  <span className="ml-1 text-[10px] opacity-60">&#8599;</span>
                                </a>
                              </li>
                            ) : (
                              <li key={app.href}>
                                <Link
                                  href={app.href}
                                  className="inline-block rounded-full border border-teal/30 bg-teal-light px-3 py-1 text-xs font-medium text-teal transition-colors hover:border-teal"
                                >
                                  <T en={app.en} zh={app.zh} />
                                </Link>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-faint">
                        <T en="Open questions" zh="待解问题" />
                      </h3>
                      <ul className="mt-4 space-y-2">
                        {theme.openQuestions.map((q) => (
                          <li key={q.en} className="flex items-start gap-2 text-sm text-ink-muted">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                            <T en={q.en} zh={q.zh} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-16 rounded-xl border border-rule bg-paper-warm p-6">
            <p className="text-[15px] leading-relaxed text-ink-muted">
              <T
                en={
                  <>
                    Want to work on these questions?{" "}
                    <Link href="/lab#join" className="link-underline font-medium text-ember">
                      Join the lab
                    </Link>
                    , or browse{" "}
                    <Link href="/publications" className="link-underline font-medium text-ember">
                      all publications
                    </Link>
                    .
                  </>
                }
                zh={
                  <>
                    想参与这些问题的研究？欢迎
                    <Link href="/lab#join" className="link-underline font-medium text-ember">
                      加入实验室
                    </Link>
                    ，或浏览
                    <Link href="/publications" className="link-underline font-medium text-ember">
                      全部论文
                    </Link>
                    。
                  </>
                }
              />
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
