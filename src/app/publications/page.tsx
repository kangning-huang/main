import type { Metadata } from "next";
import { LINKS } from "@/lib/constants";
import { fetchPublications } from "@/lib/publications";
import type { Publication } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Publications",
  description:
    "Full list of publications by Kangning (Ken) Huang, auto-updated from Semantic Scholar.",
};

export default async function PublicationsPage() {
  const publications = await fetchPublications();

  // Group by year
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

  const totalCitations = publications.reduce(
    (sum, p) => sum + p.citationCount,
    0
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Publications</h1>
          <p className="mt-2 text-foreground-secondary">
            {publications.length} publications &middot; {totalCitations}{" "}
            total citations
          </p>
        </div>
        <a
          href={LINKS.googleScholar}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground-secondary hover:border-nyu-violet hover:text-nyu-violet transition-colors"
        >
          View on Google Scholar &#8599;
        </a>
      </div>

      <p className="mt-4 text-sm text-foreground-secondary">
        Publication data is automatically fetched from Semantic Scholar. For the
        most complete and up-to-date list, please visit{" "}
        <a
          href={LINKS.googleScholar}
          target="_blank"
          rel="noopener noreferrer"
          className="text-nyu-violet hover:underline"
        >
          Google Scholar
        </a>
        .
      </p>

      <div className="mt-10 space-y-10">
        {years.map((year) => (
          <section key={year}>
            <h2 className="sticky top-[73px] z-10 bg-white py-2 text-lg font-bold text-nyu-violet border-b border-border">
              {year}
            </h2>
            <div className="mt-4 space-y-4">
              {byYear[year].map((pub, i) => (
                <article
                  key={i}
                  className="rounded-lg border border-border p-4 hover:border-nyu-violet/30 transition-colors"
                >
                  <h3 className="font-medium text-foreground leading-snug">
                    {pub.doi ? (
                      <a
                        href={`https://doi.org/${pub.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-nyu-violet transition-colors"
                      >
                        {pub.title}
                      </a>
                    ) : pub.url ? (
                      <a
                        href={pub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-nyu-violet transition-colors"
                      >
                        {pub.title}
                      </a>
                    ) : (
                      pub.title
                    )}
                  </h3>
                  <p className="mt-1 text-sm text-foreground-secondary">
                    {pub.authors}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    {pub.venue && (
                      <span className="font-medium text-nyu-violet">
                        {pub.venue}
                      </span>
                    )}
                    {pub.citationCount > 0 && (
                      <span className="rounded bg-background-alt px-2 py-0.5 text-xs text-foreground-secondary">
                        {pub.citationCount} citations
                      </span>
                    )}
                    {pub.doi && (
                      <a
                        href={`https://doi.org/${pub.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-foreground-secondary hover:text-nyu-violet"
                      >
                        DOI &#8599;
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
