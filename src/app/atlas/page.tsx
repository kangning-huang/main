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
  "Atlas of Urban Futures: a world map of cities from Kangning (Ken) Huang's research. Click a city to see results from several papers: built mass and scaling (Nature Cities, in press), surface heat-island trends (Scientific Reports 2025) and informal-settlement cooling (npj 2026).";

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
            <T en="Atlas of Urban Futures" zh="城市未来图集" />
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-muted animate-fade-up delay-1">
            <T
              en="One map of the cities in my datasets. Click a city to see what each paper says about it: built mass and scaling (Nature Cities, in press), surface heat-island trends 2003–2020 (Scientific Reports 2025), and cooling after informal-settlement demolition (npj Environmental Social Sciences 2026). Dot color shows how many papers cover that city; use the filter chips to highlight one study."
              zh="我数据集中所有城市的一张地图。点击一座城市，查看各篇论文对其的结果：建成质量与标度（Nature Cities，即将发表）、2003–2020 年地表热岛趋势（Scientific Reports 2025），以及城中村拆除后的降温效应（npj Environmental Social Sciences 2026）。圆点颜色表示覆盖该城市的论文数量；可用筛选按钮突出某一项研究。"
            />
          </p>
          <p className="mt-2 text-xs text-ink-faint animate-fade-up delay-2">
            <T
              en="City key: GHSL Urban Centre Database 2015. Map: Natural Earth via world-atlas (no third-party tiles). "
              zh="城市主键：GHSL 城市中心数据库 2015。底图：Natural Earth（world-atlas，无第三方瓦片）。"
            />
            <Link href="/publications#nested-economies-of-scale-in-global-city-mass" className="text-ember hover:underline">
              <T en="Paper →" zh="论文 →" />
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
