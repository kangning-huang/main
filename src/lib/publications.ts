import { Publication, FALLBACK_PUBLICATIONS } from "./constants";

const OPENALEX_AUTHOR_ID = "A5081998850";
const AUTHOR_NAME = "Kangning Huang";

const SEMANTIC_SCHOLAR_API = "https://api.semanticscholar.org/graph/v1";

/**
 * Fetch publications from OpenAlex (primary), Semantic Scholar (secondary),
 * or fallback to static data. OpenAlex has reliable, up-to-date citation
 * counts and a free API without aggressive rate limits.
 */
export async function fetchPublications(): Promise<Publication[]> {
  // Try OpenAlex first
  const openAlexPubs = await fetchFromOpenAlex();
  if (openAlexPubs.length > 0) return openAlexPubs;

  // Try Semantic Scholar as fallback
  const semanticPubs = await fetchFromSemanticScholar();
  if (semanticPubs.length > 0) return semanticPubs;

  return FALLBACK_PUBLICATIONS;
}

async function fetchFromOpenAlex(): Promise<Publication[]> {
  try {
    const pages: Publication[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 3) {
      const res = await fetch(
        `https://api.openalex.org/works?filter=author.id:${OPENALEX_AUTHOR_ID}&sort=publication_year:desc&per_page=50&page=${page}&select=title,publication_year,primary_location,cited_by_count,doi,authorships&mailto=kangning.huang@nyu.edu`,
        { next: { revalidate: 86400 } }
      );
      if (!res.ok) return [];
      const data = await res.json();
      const results = data.results || [];
      if (results.length === 0) break;

      for (const work of results) {
        // Only include papers where Kangning Huang is actually an author
        const authors: string[] = (work.authorships || []).map(
          (a: { author: { display_name: string } }) => a.author.display_name
        );
        const isAuthor = authors.some(
          (name: string) =>
            name.toLowerCase().includes("kangning") &&
            name.toLowerCase().includes("huang")
        );
        if (!isAuthor) continue;

        const venue =
          work.primary_location?.source?.display_name || "";
        const doi = work.doi
          ? work.doi.replace("https://doi.org/", "")
          : undefined;

        pages.push({
          title: work.title || "",
          authors: formatAuthors(authors),
          venue,
          year: work.publication_year || 0,
          citationCount: work.cited_by_count || 0,
          doi,
        });
      }

      hasMore = results.length === 50;
      page++;
    }

    return pages
      .filter((p) => p.title && p.year)
      .sort((a, b) => b.year - a.year || b.citationCount - a.citationCount);
  } catch {
    return [];
  }
}

function formatAuthors(authors: string[]): string {
  if (authors.length <= 5) return authors.join(", ");
  return `${authors.slice(0, 4).join(", ")}, ... ${authors[authors.length - 1]}`;
}

async function findAuthorId(): Promise<string | null> {
  try {
    const res = await fetch(
      `${SEMANTIC_SCHOLAR_API}/author/search?query=${encodeURIComponent(AUTHOR_NAME)}&fields=name,affiliations,paperCount`,
      { next: { revalidate: 604800 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const author = data.data?.find(
      (a: { name: string; affiliations?: string[]; paperCount?: number }) =>
        a.name === AUTHOR_NAME &&
        (a.affiliations?.some(
          (aff: string) =>
            aff.toLowerCase().includes("nyu") ||
            aff.toLowerCase().includes("new york university") ||
            aff.toLowerCase().includes("yale")
        ) ||
          (a.paperCount && a.paperCount > 10))
    );
    return author?.authorId || data.data?.[0]?.authorId || null;
  } catch {
    return null;
  }
}

async function fetchFromSemanticScholar(): Promise<Publication[]> {
  try {
    const authorId = await findAuthorId();
    if (!authorId) return [];

    const res = await fetch(
      `${SEMANTIC_SCHOLAR_API}/author/${authorId}/papers?fields=title,year,venue,citationCount,externalIds,authors,url&limit=100`,
      { next: { revalidate: 604800 } }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const papers: Publication[] = (data.data || [])
      .filter((p: { title: string; year: number }) => p.title && p.year)
      .map(
        (p: {
          title: string;
          year: number;
          venue?: string;
          citationCount?: number;
          externalIds?: { DOI?: string };
          authors?: { name: string }[];
          url?: string;
        }) => ({
          title: p.title,
          authors: p.authors?.map((a) => a.name).join(", ") || "",
          venue: p.venue || "",
          year: p.year,
          citationCount: p.citationCount || 0,
          doi: p.externalIds?.DOI,
          url: p.url,
        })
      )
      .sort(
        (a: Publication, b: Publication) =>
          b.year - a.year || b.citationCount - a.citationCount
      );

    return papers;
  } catch {
    return [];
  }
}
