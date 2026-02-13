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
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-ink">Publications</h1>
          <p className="mt-2 text-ink-muted">
            {publications.length} publications &middot; {totalCitations}{" "}
            total citations
          </p>
        </div>
        <a
          href={LINKS.googleScholar}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-rule px-4 py-2 text-sm font-medium text-ink-muted transition-all hover:border-ember hover:text-ember"
        >
          View on Google Scholar &#8599;
        </a>
      </div>

      <p className="mt-4 text-sm text-ink-faint">
        Publication data is automatically fetched from Semantic Scholar. For the
        most complete and up-to-date list, please visit{" "}
        <a
          href={LINKS.googleScholar}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ember hover:underline"
        >
          Google Scholar
        </a>
        .
      </p>

      <div className="mt-10 space-y-10">
        {years.map((year) => (
          <section key={year}>
            <h2 className="sticky top-[65px] z-10 border-b border-rule bg-paper/95 py-2 font-display text-xl text-ember backdrop-blur-sm">
              {year}
            </h2>
            <div className="mt-4 space-y-1">
              {byYear[year].map((pub, i) => (
                <article
                  key={i}
                  className="pub-item group py-4"
                >
                  <h3 className="text-[15px] font-medium leading-snug text-ink">
                    {pub.doi ? (
                      <a
                        href={`https://doi.org/${pub.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors group-hover:text-ember"
                      >
                        {pub.title}
                      </a>
                    ) : pub.url ? (
                      <a
                        href={pub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors group-hover:text-ember"
                      >
                        {pub.title}
                      </a>
                    ) : (
                      pub.title
                    )}
                  </h3>
                  <p className="mt-1 text-sm text-ink-faint">
                    {pub.authors}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    {pub.venue && (
                      <span className="font-medium text-ember">
                        {pub.venue}
                      </span>
                    )}
                    {pub.citationCount > 0 && (
                      <span className="rounded-full bg-paper-deep px-2.5 py-0.5 text-xs text-ink-muted">
                        {pub.citationCount} citations
                      </span>
                    )}
                    {pub.doi && (
                      <a
                        href={`https://doi.org/${pub.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-underline text-xs text-ink-faint hover:text-ember"
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
