import type { Metadata } from "next";
import { LINKS } from "@/lib/constants";
import { fetchPublications, getScholarData, isPublished, isInPress, isUnderReview } from "@/lib/publications";
import CitationChart from "@/components/CitationChart";
import PublicationList from "@/components/PublicationList";
import { canonicalUrl, withOpenGraphDefaults, pageTitle, webPageSchema, scholarlyArticleListSchema, breadcrumbSchema, highlightVideoSchemas } from "@/lib/seo";
import T from "@/components/T";

export const metadata: Metadata = {
  title: "Publications",
  description:
    "Publications by Kangning (Ken) Huang on urban heat islands, global urban expansion, climate adaptation, flood risk, urban scaling laws, and remote sensing. Updated with live Google Scholar citation metrics.",
  alternates: {
    canonical: canonicalUrl("/publications"),
  },
  openGraph: withOpenGraphDefaults({
    type: "website",
    title: pageTitle("Publications"),
    description:
      "Publications by Kangning (Ken) Huang on urban heat islands, global urban expansion, climate adaptation, flood risk, urban scaling laws, and remote sensing.",
    url: canonicalUrl("/publications"),
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

export default async function PublicationsPage() {
  const publications = await fetchPublications();
  const scholarData = getScholarData();
  const pageSchema = webPageSchema({
    path: "/publications",
    title: "Publications",
    description:
      "Full list of publications by Kangning (Ken) Huang, updated with citation metrics from Google Scholar.",
  });

  const published = publications.filter(isPublished);
  const inPress = publications.filter(isInPress);
  const underReview = publications.filter(isUnderReview);
  const headlineCount = published.length + inPress.length;

  const breadcrumbs = breadcrumbSchema([{ name: "Publications", path: "/publications" }]);
  const videoSchemas = highlightVideoSchemas(publications);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(scholarlyArticleListSchema(publications)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {videoSchemas.map((schema, i) => (
        <script
          key={`video-ld-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-ink">
            <T en="Publications" zh="学术论文" />
          </h1>
          <p className="mt-2 text-ink-muted">
            <T
              en={`${headlineCount} publications`}
              zh={`${headlineCount} 篇论文`}
            />
            {underReview.length > 0 && (
              <span className="ml-2 text-sm text-ink-faint">
                <T
                  en={`· ${underReview.length} under review`}
                  zh={`· ${underReview.length} 篇审稿中`}
                />
              </span>
            )}
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

      <PublicationList
        published={published}
        inPress={inPress}
        underReview={underReview}
      />
      </div>
    </>
  );
}
