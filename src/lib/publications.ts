import { Publication, CURATED_PUBLICATIONS } from "./constants";
import scholarData from "@/data/scholar-citations.json";

// Types for Google Scholar data
interface ScholarPublication {
  title: string;
  citationCount: number;
  year?: number;
}

interface ScholarData {
  totalCitations: number;
  hIndex: number;
  i10Index: number;
  citedByYears: Record<string, number>;
  publications: ScholarPublication[];
  lastUpdated: string;
}

/**
 * Normalize a title for fuzzy matching
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .slice(0, 60); // Use first 60 chars for matching
}

/**
 * Get Google Scholar citation data
 */
export function getScholarData(): ScholarData {
  return scholarData as ScholarData;
}

/**
 * Return the curated publication list enriched with Google Scholar citation counts.
 * Uses pre-fetched data from scholar-citations.json (updated weekly by GitHub Actions).
 */
export async function fetchPublications(): Promise<Publication[]> {
  const pubs = structuredClone(CURATED_PUBLICATIONS);
  const data = getScholarData();

  // Build a map of normalized titles to citation counts from Google Scholar
  const citationMap = new Map<string, number>();
  for (const pub of data.publications) {
    citationMap.set(normalizeTitle(pub.title), pub.citationCount);
  }

  // Update citation counts for matching publications
  for (const pub of pubs) {
    const normalizedTitle = normalizeTitle(pub.title);
    const count = citationMap.get(normalizedTitle);
    if (count != null) {
      pub.citationCount = count;
    }
  }

  return pubs;
}
