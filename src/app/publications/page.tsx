import type { Metadata } from "next";
import { LINKS } from "@/lib/constants";
import { fetchPublications, getScholarData } from "@/lib/publications";
import type { Publication } from "@/lib/constants";
import CitationChart from "@/components/CitationChart";
import PublicationCard from "@/components/PublicationCard";
import Script from "next/script";
import { canonicalUrl, webPageSchema, scholarlyArticleListSchema } from "@/lib/seo";
import T from "@/components/T";

export const metadata: Metadata = {
  title: "Publications",
  description:
    "Publications by Kangning (Ken) Huang on urban heat islands, global urban expansion, climate adaptation, flood risk, urban scaling laws, and remote sensing. Updated with live Google Scholar citation metrics.",
  alternates: {
    canonical: canonicalUrl("/publications"),
  },
  openGraph: {
    title: "Publications — Kangning (Ken) Huang",
    description:
      "Publications by Kangning (Ken) Huang on urban heat islands, global urban expansion, climate adaptation, flood risk, urban scaling laws, and remote sensing.",
    url: canonicalUrl("/publications"),
  },
};

export default async function PublicationsPage() {
  const publications = await fetchPublications();
  const scholarData = getScholarData();
  const pageSchema = webPageSchema({
    path: "/publications",
    title: "Publications",
    description:
      "Full list of publications by Kangning (Ken) Huang, updated with citation metrics from Google Scholar.",
  });

  const byYear = publications.reduce<Record<number, Publication[]>>(
    (acc, pub) => {
      if (!acc[pub.year]) acc[pub.year] = [];
      acc[pub.year].push(pub);
      return acc;
    },
    {}
  );
  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <>
      <Script
        id="jsonld-publications"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <Script
        id="jsonld-scholarly-articles"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(scholarlyArticleListSchema(publications)) }}
      />
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-ink">
            <T en="Publications" zh="学术论文" />
          </h1>
          <p className="mt-2 text-ink-muted">
            <T
              en={`${publications.length} publications`}
              zh={`${publications.length} 篇论文`}
            />
          </p>
        </div>
        <a
          href={LINKS.googleScholar}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-rule px-4 py-2 text-sm font-medium text-ink-muted transition-all hover:border-ember hover:text-ember"
        >
          <T en="View on Google Scholar" zh="在谷歌学术上查看" /> &#8599;
        </a>
      </div>

      {/* Citation metrics chart */}
      <div className="mt-8">
        <CitationChart
          citedByYears={scholarData.citedByYears}
          totalCitations={scholarData.totalCitations}
          hIndex={scholarData.hIndex}
          i10Index={scholarData.i10Index}
        />
      </div>

      <div className="mt-10 space-y-10">
        {years.map((year) => (
          <section key={year}>
            <h2 className="sticky top-[65px] z-10 border-b border-rule bg-paper/95 py-2 font-display text-xl text-ember backdrop-blur-sm">
              {year}
            </h2>
            <div className="mt-4 space-y-1">
              {byYear[year].map((pub, i) => (
                <PublicationCard key={i} pub={pub} />
              ))}
            </div>
          </section>
        ))}
      </div>
      </div>
    </>
  );
}
