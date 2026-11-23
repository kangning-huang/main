import type { Metadata } from "next";
import {
  canonicalUrl,
  withOpenGraphDefaults,
  pageTitle,
  webPageSchema,
  breadcrumbSchema,
} from "@/lib/seo";
import T from "@/components/T";
import AtlasExplorer from "@/components/atlas/AtlasExplorer";
import Link from "next/link";

const DESCRIPTION =
  "Interactive map of cities in Kangning Huang's research: built mass, heat islands, flood risk, informal-settlement cooling, 2050 expansion, and cooler-city UHS.";

export const metadata: Metadata = {
  title: "Atlas of Urban Futures",
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl("/atlas") },
  openGraph: withOpenGraphDefaults({
    type: "website",
    title: pageTitle("Atlas of Urban Futures"),
    description: DESCRIPTION,
    url: canonicalUrl("/atlas"),
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

export default function AtlasPage() {
  return (
    <>
      {/* Prefetch city dots ASAP (before MapLibre chunk). Next also emits :HL for this. */}
      <link rel="preload" href="/atlas/points.json" as="fetch" crossOrigin="anonymous" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              path: "/atlas",
              title: "Atlas of Urban Futures",
              description: DESCRIPTION,
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([{ name: "Atlas", path: "/atlas" }]),
          ),
        }}
      />

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <h1 className="section-heading animate-fade-up">
            <T en="Atlas of Urban Futures" zh="城市未来地图集" />
          </h1>
          <div className="mt-4 max-w-3xl space-y-3 text-[15px] leading-relaxed text-ink-muted animate-fade-up delay-1">
            <p>
              <T
                en="This atlas brings together city-level results from several of my papers. Select a study using the filters, then click a city to see its results. The studies cover built mass and nested scaling across 3,000+ cities (Nature Cities, 2026); surface heat-island trends in the 1,000 largest cities (Scientific Reports 2025); about 1.5 K of cooling after informal-settlement demolition (npj 2026); flood damage assessments that account for building height and place 42% of global losses in Southeast Asia (Scientific Reports 2026); urban land expansion of 78%–171% by 2050 (ERL 2019); nighttime heat-stress changes for which mitigation removes only about half of the increase (JGR 2021); and Cooler Cities · 101, showing median Urban Homogeneous Scale (UHS / block scale) and a within-city heat illustration from Zhang et al., PNAS 2026."
                zh="这个地图集汇集了我多篇论文中的城市数据和研究结果。选择一项研究，再点击城市，就可以查看对应的结果。 内容包括：3000 多座城市的建成质量与嵌套标度（Nature Cities，2026）；全球 1000 座大城市的地表热岛趋势（Scientific Reports 2025）；非正规住区拆除后约 1.5 K 的降温（npj 2026）；考虑建筑高度后，东南亚占全球洪灾损失约 42% 的评估结果（Scientific Reports 2026）；到 2050 年全球城市用地扩张 78%–171% 的情景预测（ERL 2019）；缓解措施只能消除约一半新增夜间热应力的结果（JGR 2021）；以及「更凉爽城市 · 101」，展示 Zhang 等（PNAS 2026）研究中的城市均质尺度（UHS／同质功能区尺度）中位数及城内热效应示意。"
              />
            </p>
            <p>
              <T
                en="I built this atlas so readers can examine global findings at the city level without using GIS software. The numbers in each city card come from the linked papers. They are not results of a new analysis."
                zh="我希望读者不用 GIS 软件，也能查看全球研究结论在具体城市中的表现。每张城市卡片上的数值都来自对应论文，并非重新开展的分析。"
              />
            </p>
          </div>
          <p className="mt-2 text-xs text-ink-faint animate-fade-up delay-2">
            <T
              en="City identifiers: GHSL Urban Centre Database 2015. Basemap: CARTO Positron / Dark Matter (© OpenStreetMap contributors © CARTO). The map follows your browser's light or dark mode. "
              zh="城市标识来自 GHSL Urban Centre Database 2015。底图采用 CARTO Positron / Dark Matter（© OpenStreetMap contributors © CARTO），并根据浏览器设置切换浅色或深色模式。"
            />
            <Link href="https://doi.org/10.1038/s44284-026-00532-x" className="text-ember hover:underline">
              <T en="Paper →" zh="查看论文 →" />
            </Link>
          </p>

          <div className="mt-8 animate-fade-up delay-3">
            <AtlasExplorer />
          </div>
        </div>
      </section>
    </>
  );
}
