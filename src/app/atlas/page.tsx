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
  "Atlas of Urban Futures: a world map of cities from Kangning (Ken) Huang's research. Click a city to see built mass and scaling from the Nature Cities paper (in press), with more layers coming.";

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
              en="One map of the cities in my datasets. Click a city to see what each paper says about it — starting with built mass and scaling (Nature Cities, in press). Urban expansion and further layers join as the crosswalks land."
              zh="我数据集中所有城市的一张地图。点击一座城市，查看各篇论文对其的结果——目前先有建成质量与标度（Nature Cities，即将发表）。城市扩张等图层会在对照表就绪后加入。"
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
