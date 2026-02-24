#!/usr/bin/env node
/**
 * Fetch citation data from Google Scholar using Playwright.
 * Uses a real headless browser to avoid bot detection that blocks
 * plain HTTP requests.
 *
 * Prerequisites (local):
 *   npm install -D playwright
 *   npx playwright install chromium
 *
 * Output: src/data/scholar-citations.json
 */

import { chromium } from 'playwright';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Google Scholar author ID
const AUTHOR_ID = 's_domssAAAAJ';

function parseNumber(str) {
  if (!str) return 0;
  return parseInt(str.replace(/[^0-9]/g, ''), 10) || 0;
}

/** Random delay to appear more human-like. */
function delay(baseMs) {
  return new Promise(r => setTimeout(r, baseMs + Math.random() * 1000));
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log(`Fetching Google Scholar data for author: ${AUTHOR_ID}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
  });
  const page = await context.newPage();

  try {
    const citationData = {
      totalCitations: 0,
      hIndex: 0,
      i10Index: 0,
      citedByYears: {},
      publications: [],
      lastUpdated: new Date().toISOString(),
    };

    // ── 1. Main profile page (metrics + chart) ──────────────
    const profileUrl = `https://scholar.google.com/citations?user=${AUTHOR_ID}&hl=en`;
    console.log(`Navigating to profile: ${profileUrl}`);
    await page.goto(profileUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(2000);

    // Detect CAPTCHA / blocking
    const html = await page.content();
    if (html.includes('unusual traffic') || html.includes('CAPTCHA')) {
      throw new Error('Google Scholar is blocking access (CAPTCHA detected)');
    }

    // ── 2. Citation metrics table ───────────────────────────
    // The table has rows: Citations | h-index | i10-index
    // Each row has two <td class="gsc_rsb_std">: "All" and "Since ..."
    const metricsValues = await page.$$eval(
      'td.gsc_rsb_std',
      cells => cells.map(c => c.textContent?.trim() || '0')
    );

    if (metricsValues.length >= 6) {
      citationData.totalCitations = parseNumber(metricsValues[0]);
      citationData.hIndex = parseNumber(metricsValues[2]);
      citationData.i10Index = parseNumber(metricsValues[4]);
    }

    // ── 3. Yearly citation chart ────────────────────────────
    // The chart bars may not render in headless mode, so parse the
    // raw HTML for year labels (gsc_g_t) and counts (gsc_g_al)
    // — the same approach that worked in the original HTTP-based scraper.
    const pageHtml = await page.content();

    const yearLabelMatches = pageHtml.match(/<span class="gsc_g_t"[^>]*>(\d{4})<\/span>/g) || [];
    const countLabelMatches = pageHtml.match(/<span class="gsc_g_al">(\d+)<\/span>/g) || [];

    const chartYears = yearLabelMatches.map(m => m.match(/>(\d{4})</)?.[1]);
    const chartCounts = countLabelMatches.map(m => parseNumber(m.match(/>(\d+)</)?.[1]));

    for (let i = 0; i < chartYears.length && i < chartCounts.length; i++) {
      if (chartYears[i]) {
        citationData.citedByYears[chartYears[i]] = chartCounts[i];
      }
    }

    console.log(`Total citations: ${citationData.totalCitations}`);
    console.log(`h-index: ${citationData.hIndex}`);
    console.log(`i10-index: ${citationData.i10Index}`);

    // ── 4. Publications (paginated) ─────────────────────────
    console.log('\nFetching publications...');
    const allPubs = [];
    let start = 0;
    const pageSize = 100;

    while (true) {
      const pubUrl =
        `https://scholar.google.com/citations?user=${AUTHOR_ID}&hl=en` +
        `&cstart=${start}&pagesize=${pageSize}&sortby=pubdate`;
      console.log(`  Fetching page from offset ${start}...`);

      await page.goto(pubUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await delay(1500);

      const pubs = await page.$$eval('tr.gsc_a_tr', rows =>
        rows
          .map(row => {
            const titleEl = row.querySelector('a.gsc_a_at');
            const citEl = row.querySelector('td.gsc_a_c');
            const yearEl = row.querySelector('td.gsc_a_y span');
            return {
              title: titleEl?.textContent?.trim() || '',
              citationCount:
                parseInt(
                  (citEl?.textContent?.trim() || '0').replace(/[^0-9]/g, ''),
                  10
                ) || 0,
              year:
                parseInt(yearEl?.textContent?.trim() || '0', 10) || 0,
            };
          })
          .filter(p => p.title)
      );

      console.log(`  Found ${pubs.length} publications`);
      allPubs.push(...pubs);

      if (pubs.length < pageSize) break;

      // Check for a "next" button that is still enabled
      const hasNext = await page.$('button#gsc_bpf_more:not([disabled])');
      if (!hasNext) break;

      start += pageSize;
      await delay(2000);
    }

    citationData.publications = allPubs;
    console.log(`\nTotal publications found: ${allPubs.length}`);
    console.log(
      `Years with citation data: ${Object.keys(citationData.citedByYears).sort().join(', ')}`
    );

    // ── 5. Save JSON (only if we got real data) ────────────
    const outputDir = join(__dirname, '..', 'src', 'data');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = join(outputDir, 'scholar-citations.json');

    if (citationData.totalCitations === 0 && citationData.publications.length === 0) {
      console.log('\nScraping returned empty data — keeping existing cached file.');
    } else {
      writeFileSync(outputPath, JSON.stringify(citationData, null, 2));
      console.log(`\nSaved citation data to: ${outputPath}`);
    }

    // ── 6. Update CV citation metrics ───────────────────────
    updateCvCitations(citationData);

    // ── 7. Missing-publication check ────────────────────────
    checkMissingPublications(allPubs);

    return citationData;
  } finally {
    await browser.close();
  }
}

// ── CV citation updater ─────────────────────────────────────
function formatNumber(n) {
  return n.toLocaleString('en-US');
}

function updateCvCitations(citationData) {
  console.log('\n── Updating CV citation metrics ──');

  const cvPath = join(__dirname, '..', 'cv', 'CV_Kangning_Huang.tex');
  if (!existsSync(cvPath)) {
    console.log('Could not find CV_Kangning_Huang.tex, skipping CV update.');
    return;
  }

  let tex = readFileSync(cvPath, 'utf-8');

  // Match the line: {\small(\href{...}{Google Scholar} citations: X,XXX; h-index: XX)}
  const pattern = /(citations:\s*)[0-9,]+(;\s*h-index:\s*)[0-9]+/;
  const match = tex.match(pattern);

  if (!match) {
    console.log('Could not find citation metrics line in CV, skipping.');
    return;
  }

  const oldLine = match[0];
  const newLine = `${match[1]}${formatNumber(citationData.totalCitations)}${match[2]}${citationData.hIndex}`;

  if (oldLine === newLine) {
    console.log('CV citation metrics are already up to date.');
    return;
  }

  tex = tex.replace(pattern, newLine);
  writeFileSync(cvPath, tex);
  console.log(`Updated CV: "${oldLine}" → "${newLine}"`);
}

// ── Missing-publication checker ─────────────────────────────
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Jaccard-like word-overlap similarity for fuzzy title matching. */
function titlesSimilar(a, b) {
  // Prefix match (handles truncated titles)
  const shorter = a.length < b.length ? a : b;
  const longer = a.length >= b.length ? a : b;
  if (longer.startsWith(shorter.substring(0, Math.min(shorter.length, 50)))) {
    return true;
  }

  // Word-overlap
  const aWords = new Set(a.split(' ').filter(w => w.length > 3));
  const bWords = new Set(b.split(' ').filter(w => w.length > 3));
  const intersection = [...aWords].filter(w => bWords.has(w));
  const union = new Set([...aWords, ...bWords]);
  return union.size > 0 && intersection.length / union.size > 0.7;
}

function checkMissingPublications(scholarPubs) {
  console.log('\n── Checking for missing publications ──');

  const constantsPath = join(__dirname, '..', 'src', 'lib', 'constants.ts');
  if (!existsSync(constantsPath)) {
    console.log('Could not find constants.ts, skipping check.');
    return;
  }

  const source = readFileSync(constantsPath, 'utf-8');

  // Collect all titles from CURATED_PUBLICATIONS
  const titleRegex = /title:\s*"([^"]+)"/g;
  const curatedTitles = new Set();
  let m;
  while ((m = titleRegex.exec(source)) !== null) {
    curatedTitles.add(normalizeTitle(m[1]));
  }

  const missing = [];
  for (const pub of scholarPubs) {
    const norm = normalizeTitle(pub.title);

    // Exact match
    if (curatedTitles.has(norm)) continue;

    // Fuzzy match
    let fuzzy = false;
    for (const curated of curatedTitles) {
      if (titlesSimilar(norm, curated)) {
        fuzzy = true;
        break;
      }
    }
    if (fuzzy) continue;

    missing.push(pub);
  }

  if (missing.length === 0) {
    console.log(
      'All Google Scholar publications are accounted for in the website.'
    );
  } else {
    console.log(
      `\nFound ${missing.length} publication(s) on Google Scholar but NOT on the website:`
    );
    for (const pub of missing) {
      const tag = /poster|abstract/i.test(pub.title)
        ? ' [likely conference material]'
        : '';
      console.log(
        `  - [${pub.year}] "${pub.title}" (${pub.citationCount} citations)${tag}`
      );
    }
    console.log(
      '\nReview the list above. Journal articles should be added to'
    );
    console.log('CURATED_PUBLICATIONS in src/lib/constants.ts.');
  }
}

main().catch(error => {
  console.error('Error fetching scholar data:', error);
  process.exit(1);
});
