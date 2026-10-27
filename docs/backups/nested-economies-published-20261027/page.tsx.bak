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
  "Interactive world map of cities from Kangning Huang's research: built mass, heat islands, flood risk, informal-settlement cooling, urban expansion to 2050, and cooler-city UHS (PNAS).";

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
                en="This atlas puts the cities from several of my papers on one map. Filter chips isolate a study; click a city to open what that paper reports there — built mass and nested scaling across 3,000+ cities (Nature Cities, in press), surface heat-island trends in the 1,000 largest cities (Scientific Reports 2025), informal-settlement cooling of about 1.5 K (npj 2026), height-aware flood damage that shifts 42% of global loss toward Southeast Asia (Scientific Reports 2026), urban land expansion of 78%–171% by 2050 (ERL 2019), nighttime heat-stress change that mitigation only half-fixes (JGR 2021), and Cooler Cities · 101 — median Urban Homogeneous Scale (UHS / block scale) with a within-city heat illustration from Zhang et al., PNAS 2026."
                zh="这张地图集把我多篇论文里的城市放在同一张图上。用筛选标签查看单篇研究，点击城市即可看到该文在当地的结果——包括 3000 多座城市的建成质量与嵌套标度（Nature Cities，印刷中）、全球 1000 座大城市的地表热岛趋势（Scientific Reports 2025）、非正规住区拆除约 1.5 K 的降温（npj 2026）、把建筑高度算进去后东南亚占全球洪灾损失约 42%（Scientific Reports 2026）、到 2050 年城市用地扩张 78%–171%（ERL 2019）、缓解措施只能消除约一半的夜间热压力增强（JGR 2021），以及「更凉爽城市 · 101」——Zhang 等（PNAS 2026）的城市均质尺度（UHS／同质功能区尺度）中位数与城内热效应示意。"
              />
            </p>
            <p>
              <T
                en="I built it so readers can move from a global claim to a concrete place without opening a GIS stack. The numbers on each city card come from the linked papers; they are not a new analysis."
                zh="做这个工具，是为了让读者从一句全球结论落到具体城市，而不必打开一整套 GIS。卡片上的数字来自对应论文，不是新的分析。"
              />
            </p>
          </div>
          <p className="mt-2 text-xs text-ink-faint animate-fade-up delay-2">
            <T
              en="City key: GHSL Urban Centre Database 2015. Basemap: CARTO Positron / Dark Matter (© OpenStreetMap contributors © CARTO); follows your browser light/dark preference. "
              zh="城市标识来自 GHSL Urban Centre Database 2015。底图使用 CARTO Positron / Dark Matter（© OpenStreetMap contributors © CARTO），会随浏览器设置切换浅色或深色模式。"
            />
            <Link href="/publications#nested-economies-of-scale-in-global-city-mass" className="text-ember hover:underline">
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
