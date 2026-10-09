import { Publication, CURATED_PUBLICATIONS } from "./constants";
import scholarData from "@/data/scholar-citations.json";

export { publicationSlug } from "./constants";

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

export const ERL_2019_TITLE =
  "Projecting global urban land expansion and heat island intensification through 2050";

/**
 * Live Google Scholar citation count for a publication title, or null if unmatched.
 */
export function getScholarCitationCount(title: string): number | null {
  const target = normalizeTitle(title);
  const match = getScholarData().publications.find(
    (p) => normalizeTitle(p.title) === target
  );
  return match ? match.citationCount : null;
}

/** Venue says the paper is accepted / in press but not yet out. */
export function isInPress(pub: Publication): boolean {
  return /\(in press\)/i.test(pub.venue) || /accepted/i.test(pub.venue);
}

/** Venue says the paper is submitted, under review, or a bare preprint. */
export function isUnderReview(pub: Publication): boolean {
  if (isInPress(pub)) return false;
  return (
    /submitted/i.test(pub.venue) ||
    /under review/i.test(pub.venue) ||
    /^preprint$/i.test(pub.venue.trim())
  );
}

export function isPublished(pub: Publication): boolean {
  return !isInPress(pub) && !isUnderReview(pub);
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
