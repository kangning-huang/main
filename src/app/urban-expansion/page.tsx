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
        Across the five Shared Socioeconomic Pathways (SSPs), global urban land is projected to increase by 0.6–1.3 million km² between 2015 and 2050. This represents 78%–171% growth relative to the 2015 urban footprint. More than two-thirds of the new urban land is expected in Asia (46%–49%) and Africa (16%–25%). More than 70% is expected in humid temperate and tropical climate zones.
      </>,
      <>
        Urban expansion is projected to intensify urban heat islands. It increases average summer daytime and nighttime air temperatures by 0.5–0.7 °C, and by up to about 3 °C in some locations. On average, warming caused by urban expansion is about half the warming projected from greenhouse gas emissions under RCP 4.5. In some locations, it is up to twice as strong.
      </>,
    ],
    zh: [
      <>
        在五种共享社会经济路径（SSP）情景下，2015 至 2050 年间，全球城市用地预计增加 60 万至 130 万平方公里，相当于 2015 年城市用地面积的 78%–171%。新增城市用地中，超过三分之二位于亚洲（46%–49%）和非洲（16%–25%），超过 70% 位于湿润温带和热带气候区。
      </>,
      <>
        城市扩张预计将加剧城市热岛效应，使夏季白天和夜间的平均气温升高 0.5–0.7 °C，部分地区最高升温约 3 °C。平均而言，城市扩张带来的增温约为 RCP 4.5 情景下温室气体排放所致增温的一半。在部分地区，这一增温可达到温室气体增温的两倍。
      </>,
    ],
  },
  {
    id: "method",
    headingEn: "How the projections were made",
    headingZh: "研究方法",
    en: [
      <>
        The urban land projections come from URBANMOD-ZIPF, a global urban land change model that preserves Zipf’s law of urban cluster sizes. The model first uses the relationship between urban land per capita and GDP per capita to estimate total urban land demand in each region under each SSP. It then allocates new urban land at 5 km resolution using slope, distance to roads, population density, and land cover.
      </>,
      <>
        We estimate heat island intensification using sigmoid models that relate urban cluster size to land surface temperature measured by MODIS satellites. The models are fitted separately for arid, tropical, temperate, and cold climates. The estimated changes in land surface temperature are then translated into changes in air temperature.
      </>,
    ],
    zh: [
      <>
        城市用地预测来自 URBANMOD-ZIPF。这是一个全球城市用地变化模型，保持城市集群规模分布符合齐普夫定律。模型首先根据人均城市用地与人均 GDP 的关系，估算各地区在不同 SSP 情景下的城市用地需求。随后，根据坡度、到道路的距离、人口密度和土地覆盖，以 5 公里分辨率分配新增城市用地。
      </>,
      <>
        我们使用 S 型（sigmoid）模型估算城市热岛增强。模型将城市集群规模与 MODIS 卫星观测的地表温度联系起来，并分别在干旱、热带、温带和寒冷气候区拟合。随后，将估算的地表温度变化转换为气温变化。
      </>,
    ],
  },
  {
    id: "why-it-matters",
    headingEn: "Why it matters",
    headingZh: "研究意义",
    en: [
      <>
        This additional warming increases extreme heat risk for about half of the future urban population, mainly in the tropical Global South. These regions already face stronger greenhouse gas–driven warming in existing projections and have limited adaptive capacity. Medium-sized urban clusters (roughly 100–5,000 km²) experience the strongest warming. Urban expansion and the warming it causes remain substantial even under the sustainability pathway (SSP1). The study therefore concludes that the most vulnerable urban areas need policies that restrict or redistribute urban expansion, together with planning strategies that reduce urban heat.
      </>,
    ],
    zh: [
      <>
        城市扩张带来的额外增温，将使约一半的未来城市人口面临更高的极端高温风险，主要集中在热带全球南方地区。这些地区在现有预测中面临更强的温室气体增温，同时适应能力有限。其中，中等规模城市集群（约 100–5,000 平方公里）的增温最显著。 即使在可持续发展路径（SSP1）下，城市扩张及其带来的增温仍然显著。因此，研究认为，最脆弱的城市地区需要通过政策限制或重新分配城市扩张，并结合城市规划措施缓解高温。
      </>,
    ],
  },
  {
    id: "data-and-related-work",
    headingEn: "Data and related work",
    headingZh: "数据与相关研究",
    en: [
      <>
        The Earth Engine app above displays the projected expansion of urban land. The underlying data are openly available on{" "}
        <a href="https://resourcewatch.org" target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>WRI Resource Watch</a>. A follow-up study,{" "}
        <a href="https://doi.org/10.1029/2020JD033831" target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>“Persistent increases in nighttime heat stress from urban expansion despite heat island mitigation”</a>{" "}
        (Journal of Geophysical Research: Atmospheres, 2021), uses regional climate simulations to examine nighttime heat stress. It shows that about half of the increase caused by urban expansion remains even after large-scale deployment of cool roofs.
      </>,
    ],
    zh: [
      <>
        上方的 Earth Engine 应用展示全球城市用地扩张的预测结果。基础数据可在{" "}
        <a href="https://resourcewatch.org" target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>WRI Resource Watch</a>{" "}
        公开获取。后续研究
        <a href="https://doi.org/10.1029/2020JD033831" target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>《Persistent increases in nighttime heat stress from urban expansion despite heat island mitigation》</a>
        （Journal of Geophysical Research: Atmospheres，2021）利用区域气候模拟，分析城市扩张导致的夜间热应激。结果表明，即使大规模采用冷屋顶，新增夜间热应激仍有约一半无法消除。
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
              This project maps projected global urban land expansion through 2050. Urban populations are expected to grow by 2–3 billion by mid-century, requiring large increases in built-up land. Understanding where and how cities expand can help inform climate adaptation planning.
            </p>
          }
          zh={
            <p>
              这个项目展示到 2050 年全球城市用地扩张的预测结果。预计到本世纪中叶，全球城市人口将增加 20 至 30 亿，建成区也需要大幅扩张。了解城市未来会在哪里扩张、如何扩张，有助于制定气候适应规划。
            </p>
          }
        />
        <p>
          <T
            en="The projections are based on the research published in:"
            zh="这些预测依据以下研究。"
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
              The underlying data are openly available on{" "}
              <a
                href="https://resourcewatch.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ember hover:underline"
              >WRI Resource Watch</a>.
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
              >WRI Resource Watch</a>{" "}
              公开获取。
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
