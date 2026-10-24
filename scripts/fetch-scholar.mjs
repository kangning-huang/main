#!/usr/bin/env node
/**
 * Fetch citation data from Google Scholar via SerpAPI.
 *
 * Requires a SerpAPI key, provided via:
 *   - SERP_API_KEY environment variable (GitHub Actions), or
 *   - config/SerpApi-key.txt file (local development)
 *
 * Output: src/data/scholar-citations.json
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Google Scholar author ID
const AUTHOR_ID = 's_domssAAAAJ';

function getApiKey() {
  if (process.env.SERP_API_KEY) return process.env.SERP_API_KEY;

  const keyFile = join(__dirname, '..', 'config', 'SerpApi-key.txt');
  if (existsSync(keyFile)) {
    return readFileSync(keyFile, 'utf-8').trim();
  }

  throw new Error(
    'No SerpAPI key found. Set SERP_API_KEY env var or create config/SerpApi-key.txt'
  );
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SerpAPI request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  const apiKey = getApiKey();
  console.log(`Fetching Google Scholar data for author: ${AUTHOR_ID}`);

  const citationData = {
    totalCitations: 0,
    hIndex: 0,
    i10Index: 0,
    citedByYears: {},
    publications: [],
    lastUpdated: new Date().toISOString(),
  };

  // ── 1. Fetch author profile (metrics + citation graph) ──
  const profileUrl =
    `https://serpapi.com/search.json?engine=google_scholar_author` +
    `&author_id=${AUTHOR_ID}&hl=en&api_key=${apiKey}`;

  console.log('Fetching author profile...');
  const profile = await fetchJson(profileUrl);

  // Citation metrics
  const table = profile.cited_by?.table;
  if (table) {
    // table is an array of objects: [{citations: {all, since_xxxx}}, {h_index: ...}, {i10_index: ...}]
    for (const row of table) {
      if (row.citations) citationData.totalCitations = row.citations.all || 0;
      if (row.h_index) citationData.hIndex = row.h_index.all || 0;
      if (row.i10_index) citationData.i10Index = row.i10_index.all || 0;
    }
  }

  // Citation graph (yearly)
  const graph = profile.cited_by?.graph;
  if (graph) {
    for (const entry of graph) {
      if (entry.year && entry.citations != null) {
        citationData.citedByYears[String(entry.year)] = entry.citations;
      }
    }
  }

  console.log(`Total citations: ${citationData.totalCitations}`);
  console.log(`h-index: ${citationData.hIndex}`);
  console.log(`i10-index: ${citationData.i10Index}`);

  // ── 2. Fetch all publications (paginated) ──────────────
  console.log('\nFetching publications...');
  const allPubs = [];
  let start = 0;
  const pageSize = 100;

  while (true) {
    const pubUrl =
      `https://serpapi.com/search.json?engine=google_scholar_author` +
      `&author_id=${AUTHOR_ID}&hl=en&start=${start}&num=${pageSize}` +
      `&sortby=pubdate&api_key=${apiKey}`;

    console.log(`  Fetching page from offset ${start}...`);
    const data = await fetchJson(pubUrl);

    const articles = data.articles || [];
    for (const art of articles) {
      allPubs.push({
        title: art.title || '',
        citationCount: art.cited_by?.value || 0,
        year: parseInt(art.year, 10) || 0,
      });
    }

    console.log(`  Found ${articles.length} publications`);

    if (articles.length < pageSize) break;
    start += pageSize;
  }

  citationData.publications = allPubs;
  console.log(`\nTotal publications found: ${allPubs.length}`);
  console.log(
    `Years with citation data: ${Object.keys(citationData.citedByYears).sort().join(', ')}`
  );

  const hasValidMetrics = citationData.totalCitations > 0 && citationData.hIndex > 0;

  // ── 3. Save JSON (only if we got real data) ────────────
  const outputDir = join(__dirname, '..', 'src', 'data');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, 'scholar-citations.json');

  // Keep any prior Reach prototype if this run's citing step fails later.
  preserveExistingReachPrototype(citationData);

  if (!hasValidMetrics) {
    console.log('\nCitation metrics are invalid (0) — keeping existing cached file.');
  } else if (citationData.publications.length === 0) {
    console.log('\nNo publications returned — keeping existing cached file.');
  } else {
    writeFileSync(outputPath, JSON.stringify(citationData, null, 2));
    console.log(`\nSaved citation data to: ${outputPath}`);
  }

  // ── 4. Update CV citation metrics ───────────────────────
  updateCvCitations(citationData);

  // ── 5. Missing-publication check ────────────────────────
  checkMissingPublications(allPubs);

  // ── 6. Reach citing prototype (best-effort; uses same SERP_API_KEY) ──
  // Only after a successful profile fetch. Writes data/scholar-reach/* locally
  // and embeds a copy under citationData.reachScholarPrototype so the Sunday
  // workflow commit of scholar-citations.json carries real Scholar citing data.
  if (hasValidMetrics && citationData.publications.length > 0) {
    try {
      runReachScholarPrototype(citationData);
      // Re-save JSON so the embedded prototype is committed by the workflow.
      writeFileSync(outputPath, JSON.stringify(citationData, null, 2));
      console.log(`Re-saved citation data with Reach Scholar embed: ${outputPath}`);
    } catch (err) {
      console.warn('Reach citing prototype failed (non-fatal):', err.message || err);
      preserveExistingReachPrototype(citationData);
    }
  } else {
    console.log('Skipping Reach citing prototype — profile metrics invalid or empty.');
  }

  return citationData;
}

// ── CV citation updater ─────────────────────────────────────
function formatNumber(n) {
  return n.toLocaleString('en-US');
}

function updateCvCitations(citationData) {
  console.log('\n── Updating CV citation metrics ──');

  if (citationData.totalCitations <= 0 || citationData.hIndex <= 0) {
    console.log('Fetched citation metrics look invalid (0), skipping CV update to avoid bad overwrite.');
    return;
  }

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

    if (curatedTitles.has(norm)) continue;

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


// ── Reach Scholar citing prototype (SerpAPI) ────────────────
/**
 * After a successful profile fetch, run the Reach citing prototype and
 * embed a compact copy under citationData.reachScholarPrototype so the
 * Sunday workflow (which only commits scholar-citations.json) carries
 * real Scholar citing samples + grey-lit flags. Failures are logged and
 * do not fail the CV/profile update.
 */
function preserveExistingReachPrototype(citationData) {
  const outputPath = join(__dirname, '..', 'src', 'data', 'scholar-citations.json');
  if (!existsSync(outputPath)) return;
  try {
    const prev = JSON.parse(readFileSync(outputPath, 'utf-8'));
    if (prev.reachScholarPrototype && !citationData.reachScholarPrototype) {
      citationData.reachScholarPrototype = prev.reachScholarPrototype;
    }
  } catch (err) {
    console.warn('Could not preserve prior reachScholarPrototype:', err.message);
  }
}

function runReachScholarPrototype(citationData) {
  // Branch reach/google-scholar-full: FULL citing fetch for all dois.json papers.
  // Live Field & Shelf on main stays OpenAlex until square coverage ≥ ~3217.
  // reach/google-scholar-full branch: always run FULL citing (all 27 shelf papers).
  // Do not merge this branch's fetch-scholar.mjs to main until cutover is approved.
  const FULL = true;
  console.log(FULL ? '\n── Reach Scholar citing FULL (all shelf papers) ──' : '\n── Reach Scholar citing prototype ──');
  const scriptPath = join(__dirname, 'scholar-reach', 'fetch-citing.mjs');
  if (!existsSync(scriptPath)) {
    console.warn('scripts/scholar-reach/fetch-citing.mjs missing — skipping citing prototype.');
    preserveExistingReachPrototype(citationData);
    return;
  }

  const args = FULL ? [scriptPath] : [scriptPath, '--prototype'];
  const result = spawnSync(process.execPath, args, {
    cwd: join(__dirname, '..'),
    env: process.env,
    encoding: 'utf-8',
    maxBuffer: 200 * 1024 * 1024,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    console.warn(
      `Reach citing prototype exited ${result.status}${result.error ? ` (${result.error.message})` : ''} — continuing without failing CV update.`
    );
    preserveExistingReachPrototype(citationData);
    return;
  }

  const reachDir = join(__dirname, '..', 'data', 'scholar-reach');
  const samplePath = join(reachDir, 'sample-field-shelf.json');
  const metaPath = join(reachDir, 'meta.json');
  if (!existsSync(samplePath)) {
    console.warn('Prototype finished but sample-field-shelf.json missing — skipping embed.');
    preserveExistingReachPrototype(citationData);
    return;
  }

  try {
    const sample = JSON.parse(readFileSync(samplePath, 'utf-8'));
    const meta = existsSync(metaPath)
      ? JSON.parse(readFileSync(metaPath, 'utf-8'))
      : {};
    const squares = sample.squares || [];
    const greyLit =
      Array.isArray(sample.greyLitSample) && sample.greyLitSample.length
        ? sample.greyLitSample
        : squares.filter((s) => s.detectedGreyLit);
    const embedKey = FULL ? 'reachScholarFull' : 'reachScholarPrototype';
    // For full runs, keep squares in data/scholar-reach/ (committed separately);
    // embed summary + papers + greyLitSample here to avoid multi‑MB scholar-citations.json.
    citationData[embedKey] = {
      $comment: FULL
        ? 'Scholar-backed Reach citing FULL fetch (all dois.json shelf papers). citedBy = Google Scholar via SerpAPI — never invented. DO NOT merge to live Field & Shelf until squareCount ≥ OpenAlex (~3217). Full squares live in data/scholar-reach/sample-field-shelf.json.'
        : 'Scholar-backed Reach citing prototype embedded for GH Actions. citedBy = Google Scholar via SerpAPI — never invented.',
      asOf: sample.meta?.asOf || new Date().toISOString().slice(0, 10),
      source: sample.meta?.source || 'Google Scholar (SerpAPI)',
      encoding: sample.meta?.encoding || 'citing-work-scholar-cited-by',
      prototype: !FULL,
      full: FULL,
      meta: {
        ...(sample.meta || {}),
        fetchStatus: meta.status || 'ok',
        startedAt: meta.startedAt || null,
        finishedAt: meta.finishedAt || null,
        squareCount: squares.length,
        greyLitSquares: greyLit.length,
        papers: (sample.papers || []).length,
        fetchStats: meta.fetchStats || null,
        openAlexBenchmarkSquares: 3217,
        coverageVsOpenAlex: squares.length / 3217,
      },
      papers: sample.papers || [],
      // Full square list committed via scholar-citations.json (workflow only
      // commits this path on main's update-scholar.yml).
      squares,
      greyLitSample: greyLit,
      squaresPath: 'data/scholar-reach/sample-field-shelf.json',
    };
    console.log(
      `Embedded ${embedKey}: ${(sample.papers || []).length} papers, ${squares.length} squares, ${greyLit.length} grey-lit.`
    );
  } catch (err) {
    console.warn('Failed to embed reachScholarPrototype:', err.message);
    preserveExistingReachPrototype(citationData);
  }
}

main().catch(error => {
  console.error('Error fetching scholar data:', error);
  process.exit(1);
});
