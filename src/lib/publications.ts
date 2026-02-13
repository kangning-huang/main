import { Publication, FALLBACK_PUBLICATIONS } from "./constants";

const SEMANTIC_SCHOLAR_API =
  "https://api.semanticscholar.org/graph/v1";

async function findAuthorId(): Promise<string | null> {
  try {
    const res = await fetch(
      `${SEMANTIC_SCHOLAR_API}/author/search?query=Kangning+Huang&fields=name,affiliations,paperCount`,
      { next: { revalidate: 604800 } } // cache for 1 week
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Find the correct Kangning Huang (NYU Shanghai, environmental studies)
    const author = data.data?.find(
      (a: { name: string; affiliations?: string[]; paperCount?: number }) =>
        a.name === "Kangning Huang" &&
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

export async function fetchPublications(): Promise<Publication[]> {
  try {
    const authorId = await findAuthorId();
    if (!authorId) return FALLBACK_PUBLICATIONS;

    const res = await fetch(
      `${SEMANTIC_SCHOLAR_API}/author/${authorId}/papers?fields=title,year,venue,citationCount,externalIds,authors,url&limit=100`,
      { next: { revalidate: 604800 } }
    );
    if (!res.ok) return FALLBACK_PUBLICATIONS;

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
      .sort((a: Publication, b: Publication) => b.year - a.year || b.citationCount - a.citationCount);

    return papers.length > 0 ? papers : FALLBACK_PUBLICATIONS;
  } catch {
    return FALLBACK_PUBLICATIONS;
  }
}
