#!/usr/bin/env node
/**
 * Fetch citation data from Google Scholar and save to JSON.
 * Uses direct HTTP requests and cheerio for parsing.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Google Scholar author ID
const AUTHOR_ID = 's_domssAAAAJ';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
      }
    }
  }
  throw new Error('All retries failed');
}

function parseNumber(str) {
  if (!str) return 0;
  return parseInt(str.replace(/,/g, ''), 10) || 0;
}

async function fetchScholarData() {
  console.log(`Fetching data for author ID: ${AUTHOR_ID}`);

  // Fetch the main profile page
  const profileUrl = `https://scholar.google.com/citations?user=${AUTHOR_ID}&hl=en`;
  const html = await fetchWithRetry(profileUrl);

  // Parse with regex (simpler than importing cheerio for this)
  const citationData = {
    totalCitations: 0,
    hIndex: 0,
    i10Index: 0,
    citedByYears: {},
    publications: [],
    lastUpdated: new Date().toISOString(),
  };

  // Extract citation metrics from the table
  // The indices table typically contains: Citations, h-index, i10-index
  const indicesMatch = html.match(/<td class="gsc_rsb_std">(\d[\d,]*)<\/td>/g);
  if (indicesMatch && indicesMatch.length >= 3) {
    citationData.totalCitations = parseNumber(indicesMatch[0].match(/>([\d,]+)</)?.[1]);
    citationData.hIndex = parseNumber(indicesMatch[2].match(/>([\d,]+)</)?.[1]);
    citationData.i10Index = parseNumber(indicesMatch[4].match(/>([\d,]+)</)?.[1]);
  }

  // Extract yearly citation data from the chart
  // The chart data is in the gsc_g_al (year) and gsc_g_a (count) classes
  const yearMatches = html.match(/<span class="gsc_g_t"[^>]*>(\d{4})<\/span>/g) || [];
  const countMatches = html.match(/<span class="gsc_g_al">(\d+)<\/span>/g) || [];

  const years = yearMatches.map(m => m.match(/>(\d{4})</)?.[1]);
  const counts = countMatches.map(m => parseNumber(m.match(/>(\d+)</)?.[1]));

  // Map years to counts
  for (let i = 0; i < years.length && i < counts.length; i++) {
    if (years[i]) {
      citationData.citedByYears[years[i]] = counts[i];
    }
  }

  // Extract publication data (title, citations)
  const pubMatches = html.matchAll(/<tr class="gsc_a_tr"[^>]*>[\s\S]*?<a[^>]*class="gsc_a_at"[^>]*>([^<]+)<\/a>[\s\S]*?<td class="gsc_a_c"[^>]*>[\s\S]*?(?:<a[^>]*>)?(\d*)</g);

  for (const match of pubMatches) {
    const title = match[1]?.trim();
    const citations = parseNumber(match[2]);
    if (title) {
      citationData.publications.push({ title, citationCount: citations });
    }
  }

  return citationData;
}

async function fetchAllPublications() {
  console.log('Fetching all publications with pagination...');

  const allPubs = [];
  let start = 0;
  const pageSize = 100;

  while (true) {
    const url = `https://scholar.google.com/citations?user=${AUTHOR_ID}&hl=en&cstart=${start}&pagesize=${pageSize}`;
    console.log(`Fetching publications from ${start}...`);

    try {
      const html = await fetchWithRetry(url);

      // Extract publication rows
      const pubRegex = /<tr class="gsc_a_tr"[^>]*>[\s\S]*?<a[^>]*class="gsc_a_at"[^>]*>([^<]+)<\/a>[\s\S]*?<td class="gsc_a_c"[^>]*>[\s\S]*?(?:<a[^>]*>)?(\d*)[\s\S]*?<td class="gsc_a_y"[^>]*>[\s\S]*?<span[^>]*>(\d*)<\/span>/g;

      let found = 0;
      for (const match of html.matchAll(pubRegex)) {
        const title = match[1]?.trim().replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code));
        const citations = parseNumber(match[2]);
        const year = parseNumber(match[3]);
        if (title) {
          allPubs.push({ title, citationCount: citations, year });
          found++;
        }
      }

      console.log(`Found ${found} publications on this page`);

      // Check if there are more pages
      if (found < pageSize || !html.includes('gsc_pgn_pnx')) {
        break;
      }

      start += pageSize;
      // Be polite to Google
      await new Promise(r => setTimeout(r, 1500));
    } catch (error) {
      console.error('Failed to fetch page:', error.message);
      break;
    }
  }

  return allPubs;
}

async function main() {
  try {
    // Fetch basic data
    const citationData = await fetchScholarData();

    // Fetch all publications with pagination
    const allPubs = await fetchAllPublications();
    if (allPubs.length > 0) {
      citationData.publications = allPubs;
    }

    // Print summary
    console.log(`\nTotal citations: ${citationData.totalCitations}`);
    console.log(`h-index: ${citationData.hIndex}`);
    console.log(`i10-index: ${citationData.i10Index}`);
    console.log(`Publications found: ${citationData.publications.length}`);
    console.log(`Years with citation data: ${Object.keys(citationData.citedByYears).sort().join(', ')}`);

    // Save to JSON file
    const outputDir = join(__dirname, '..', 'src', 'data');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = join(outputDir, 'scholar-citations.json');
    writeFileSync(outputPath, JSON.stringify(citationData, null, 2));
    console.log(`\nSaved citation data to: ${outputPath}`);

    return citationData;
  } catch (error) {
    console.error('Error fetching scholar data:', error);
    process.exit(1);
  }
}

main();
