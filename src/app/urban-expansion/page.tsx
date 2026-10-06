import type { Metadata } from "next";
import { canonicalUrl, withOpenGraphDefaults, pageTitle, webPageSchema, breadcrumbSchema } from "@/lib/seo";
import type { ReactNode } from "react";
import T from "@/components/T";

const LINK_CLASS = "text-ember hover:underline";

const EXPLAINER_SECTIONS: {
  id: string;
  headingEn: string;
  headingZh: string;
  en: ReactNode[];
  zh: ReactNode[];
}[] = [
  {
    id: "what-the-projections-show",
    headingEn: "What the projections show",
    headingZh: "预测结果",
    en: [
      <>
        Across the five Shared Socioeconomic Pathways (SSPs), global urban land
        is projected to grow by 0.6&ndash;1.3 million km&sup2; between 2015 and
        2050, an increase of 78%&ndash;171% over the 2015 urban footprint. More
        than two-thirds of this new urban land is expected in Asia
        (46%&ndash;49%) and Africa (16%&ndash;25%), and more than 70% of it
        falls in the humid temperate and tropical climate zones.
      </>,
      <>
        This expansion intensifies urban heat islands. It raises average summer
        daytime and nighttime air temperatures by 0.5&ndash;0.7&nbsp;&deg;C, and
        by up to about 3&nbsp;&deg;C in some locations. On average, this
        expansion-induced warming is about half as strong as the warming
        projected from greenhouse gas emissions under RCP&nbsp;4.5, and in some
        places up to twice as strong.
      </>,
    ],
    zh: [
      <>
        在五种共享社会经济路径（SSP）情景下，2015至2050年间全球城市用地预计将增加60万至130万平方公里，比2015年的城市范围增长78%&ndash;171%。超过三分之二的新增城市用地预计位于亚洲（46%&ndash;49%）和非洲（16%&ndash;25%），其中70%以上位于较湿润的温带和热带气候区。
      </>,
      <>
        城市扩张将加剧城市热岛效应，使夏季白天和夜间的平均气温升高0.5&ndash;0.7&nbsp;&deg;C，部分地区最高可达约3&nbsp;&deg;C。平均而言，这一由城市扩张引起的增温约为RCP&nbsp;4.5情景下温室气体排放所致增温的一半，在某些地方可达其两倍。
      </>,
    ],
  },
  {
    id: "method",
    headingEn: "How the projections were made",
    headingZh: "研究方法",
    en: [
      <>
        The land projections come from URBANMOD-ZIPF, a global urban land change
        model that preserves Zipf&rsquo;s law of urban cluster sizes. The model
        first relates urban land per capita to GDP per capita to estimate how
        much urban land each region needs under each SSP, then allocates new
        urban land at 5&nbsp;km resolution using slope, distance to roads,
        population density, and land cover.
      </>,
      <>
        Heat island intensification is estimated with sigmoid models that link
        urban cluster size to satellite (MODIS) land surface temperature. These
        models are fitted separately for arid, tropical, temperate, and cold
        climates and then translated into changes in air temperature.
      </>,
    ],
    zh: [
      <>
        城市用地预测来自URBANMOD-ZIPF模型，这是一个保持城市规模齐普夫定律的全球城市用地变化模型。模型首先建立人均城市用地与人均GDP之间的关系，估算各区域在不同SSP情景下所需的城市用地总量，然后依据坡度、到道路的距离、人口密度和土地覆盖，以5公里分辨率对新增城市用地进行空间分配。
      </>,
      <>
        城市热岛增强则通过S型（sigmoid）模型估算，该模型将城市集群规模与卫星（MODIS）地表温度联系起来，并针对干旱、热带、温带和寒冷气候区分别拟合，再转换为气温变化。
      </>,
    ],
  },
  {
    id: "why-it-matters",
    headingEn: "Why it matters",
    headingZh: "研究意义",
    en: [
      <>
        This additional warming increases extreme heat risk for about half of
        the future urban population, primarily in the tropical Global South,
        where existing forecasts already indicate stronger greenhouse
        gas&ndash;driven warming and adaptive capacity is limited. Medium-sized
        urban clusters (roughly 100&ndash;5,000&nbsp;km&sup2;) experience the
        strongest warming. Because both expansion and expansion-induced warming
        remain substantial even under the sustainability pathway (SSP1), the
        study concludes that policies to restrict or redistribute urban
        expansion, together with planning strategies that mitigate urban heat,
        are needed in the most vulnerable urban areas.
      </>,
    ],
    zh: [
      <>
        这一额外增温将使约一半的未来城市人口面临更高的极端高温风险，主要集中在热带全球南方地区；现有预测已表明这些地区的温室气体增温更强，而适应能力有限。中等规模的城市集群（约100&ndash;5,000平方公里）增温最为显著。由于即使在可持续发展路径（SSP1）下，城市扩张及其引起的增温依然显著，研究认为最脆弱的城市地区需要采取限制或重新分配城市扩张的政策，并结合缓解城市高温的规划策略。
      </>,
    ],
  },
  {
    id: "data-and-related-work",
    headingEn: "Data and related work",
    headingZh: "数据与相关研究",
    en: [
      <>
        The Earth Engine app above lets you explore the projected urban land
        expansion, and the underlying data are openly available on{" "}
        <a href="https://resourcewatch.org" target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          WRI Resource Watch
        </a>
        . A follow-up study,{" "}
        <a href="https://doi.org/10.1029/2020JD033831" target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          &ldquo;Persistent increases in nighttime heat stress from urban
          expansion despite heat island mitigation&rdquo;
        </a>{" "}
        (Journal of Geophysical Research: Atmospheres, 2021), uses regional
        climate simulations to show that about half of the nighttime heat
        stress increase from urban expansion persists even after large-scale
        deployment of cool roofs.
      </>,
    ],
    zh: [
      <>
        上方的Earth Engine应用可用于浏览城市用地扩张预测，基础数据可在{" "}
        <a href="https://resourcewatch.org" target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          WRI Resource Watch
        </a>
        {" "}上公开获取。后续研究
        <a href="https://doi.org/10.1029/2020JD033831" target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          《Persistent increases in nighttime heat stress from urban expansion despite heat island mitigation》
        </a>
        （Journal of Geophysical Research: Atmospheres，2021）利用区域气候模拟表明，即使大规模推广冷屋顶，城市扩张导致的夜间热应激增加仍有约一半会持续存在。
      </>,
    ],
  },
];

export const metadata: Metadata = {
  title: "Urban Expansion 2050",
  description:
    "Global urban land expansion and heat island projections through 2050 from research by Kangning (Ken) Huang.",
  alternates: {
    canonical: canonicalUrl("/urban-expansion"),
  },
  openGraph: withOpenGraphDefaults({
    type: "website",
    title: pageTitle("Urban Expansion 2050"),
    description:
      "Global urban land expansion and heat island projections through 2050 from research by Kangning (Ken) Huang.",
    url: canonicalUrl("/urban-expansion"),
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Kangning (Ken) Huang — Urban Expansion 2050",
      },
    ],
  }),
};

export default function UrbanExpansionPage() {
  const pageSchema = webPageSchema({
    path: "/urban-expansion",
    title: "Urban Expansion 2050",
    description:
      "Global urban land expansion and heat island projections through 2050 from research by Kangning (Ken) Huang.",
  });

  const breadcrumbs = breadcrumbSchema([
    { name: "Projects", path: "/projects" },
    { name: "Urban Expansion 2050", path: "/urban-expansion" },
  ]);

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
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <h1 className="font-display text-4xl text-ink">
          <T en="Urban Expansion 2050" zh="2050年全球城市扩张" />
        </h1>
        <p className="mt-2 text-ink-muted">
          <T
            en="Global urban land expansion projections"
            zh="全球城市用地扩张预测"
          />
        </p>

      <div className="mt-6 max-w-3xl space-y-4 text-[15px] leading-[1.75] text-ink-muted">
        <T
          en={
            <p>
              This project visualizes projected global urban land expansion through
              2050. Urban populations are expected to increase by 2&ndash;3 billion
              by mid-century, requiring massive expansion of built-up areas.
              Understanding where and how this growth will occur is critical for
              planning climate adaptation strategies.
            </p>
          }
          zh={
            <p>
              本项目可视化展示到2050年的全球城市用地扩张预测。预计到本世纪中叶，城市人口将增加20至30亿，需要大规模扩展建成区。了解这种增长将在何处、以何种方式发生，对于规划气候适应策略至关重要。
            </p>
          }
        />
        <p>
          <T
            en="The projections are based on the research published in:"
            zh="预测基于以下研究成果："
          />
        </p>
        <blockquote className="border-l-2 border-ember pl-4 italic text-ink-muted">
          Kangning Huang, Xia Li, Xiaoping Liu, Karen C. Seto (2019).
          &ldquo;Projecting global urban land expansion and heat island
          intensification through 2050.&rdquo;{" "}
          <span className="font-medium text-ember">
            Environmental Research Letters
          </span>
          , 14(11): 114037.
        </blockquote>
        <T
          en={
            <p>
              The underlying data is available as an open database on{" "}
              <a
                href="https://resourcewatch.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ember hover:underline"
              >
                WRI Resource Watch
              </a>
              .
            </p>
          }
          zh={
            <p>
              基础数据可在{" "}
              <a
                href="https://resourcewatch.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ember hover:underline"
              >
                WRI Resource Watch
              </a>
              {" "}上作为开放数据库获取。
            </p>
          }
        />
      </div>

      <div className="relative mt-8 overflow-hidden rounded-xl border border-rule" style={{ paddingBottom: "75%" }}>
        <iframe
          src="https://knhuang.users.earthengine.app/view/urban-land-expansion-2050"
          className="absolute inset-0 h-full w-full"
          title="Urban Land Expansion 2050 – Google Earth Engine App"
          allowFullScreen
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href="https://doi.org/10.1088/1748-9326/ab4b71"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full bg-ember px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ember-dark"
        >
          <T en="Read the paper" zh="阅读论文" /> &#8599;
        </a>
        <a
          href="https://resourcewatch.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-rule px-5 py-2.5 text-sm font-medium text-ink-muted transition-all hover:border-ember hover:text-ember"
        >
          <T en="Data on Resource Watch" zh="Resource Watch 数据" /> &#8599;
        </a>
      </div>

      <div className="mt-12 max-w-3xl text-[15px] leading-[1.75] text-ink-muted">
        {EXPLAINER_SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="mt-10 first:mt-0">
            <h2 className="font-display text-2xl text-ink">
              <T en={section.headingEn} zh={section.headingZh} />
            </h2>
            <div className="mt-3 space-y-4">
              {section.en.map((para, i) => (
                <p key={i}>
                  <T en={para} zh={section.zh[i]} />
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
      </div>
    </>
  );
}
