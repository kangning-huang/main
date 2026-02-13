import { Publication, CURATED_PUBLICATIONS } from "./constants";

/**
 * Return the curated publication list (sourced from Google Scholar),
 * enriched with live citation counts from OpenAlex where DOIs are available.
 * Falls back to the static counts in constants.ts if the API is unreachable.
 */
export async function fetchPublications(): Promise<Publication[]> {
  const pubs = structuredClone(CURATED_PUBLICATIONS);

  // Collect DOIs that we can look up
  const doisToLookup = pubs
    .filter((p) => p.doi)
    .map((p) => p.doi!);

  if (doisToLookup.length === 0) return pubs;

  try {
    // OpenAlex supports batch DOI lookup via pipe-separated filter
    // We'll batch in groups of 25 to stay within URL length limits
    const citationMap = new Map<string, number>();

    for (let i = 0; i < doisToLookup.length; i += 25) {
      const batch = doisToLookup.slice(i, i + 25);
      const doiFilter = batch.map((d) => `https://doi.org/${d}`).join("|");
      const res = await fetch(
        `https://api.openalex.org/works?filter=doi:${encodeURIComponent(doiFilter)}&select=doi,cited_by_count&per_page=50&mailto=kangning.huang@nyu.edu`,
        { next: { revalidate: 86400 } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const work of data.results || []) {
        if (work.doi && work.cited_by_count != null) {
          const normalizedDoi = work.doi
            .replace("https://doi.org/", "")
            .toLowerCase();
          citationMap.set(normalizedDoi, work.cited_by_count);
        }
      }
    }

    // Update citation counts for matching DOIs
    for (const pub of pubs) {
      if (pub.doi) {
        const count = citationMap.get(pub.doi.toLowerCase());
        if (count != null) {
          pub.citationCount = count;
        }
      }
    }
  } catch {
    // OpenAlex unavailable; keep fallback counts
  }

  return pubs;
}
