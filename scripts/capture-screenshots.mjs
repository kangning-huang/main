#!/usr/bin/env node

/**
 * Script to capture screenshots of project websites
 * Run this locally with: node scripts/capture-screenshots.mjs
 *
 * Prerequisites:
 * 1. Install Playwright: npm install -D playwright
 * 2. Install browsers: npx playwright install chromium
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projects = [
  {
    name: 'robotaxi-safety-tracker',
    url: 'https://robotaxi-safety-tracker.com',
    viewport: { width: 1920, height: 1080 },
  },
  {
    name: 'nested-scaling-city-mass',
    url: 'https://kangning-huang.github.io/nested-scaling-city-mass/',
    viewport: { width: 1920, height: 1080 },
  },
  {
    name: '3d-urban-flood-risk',
    url: 'https://kangning-huang.github.io/3D-urban-flood-risk/',
    viewport: { width: 1920, height: 1080 },
  },
];

async function captureScreenshots() {
  console.log('Starting screenshot capture...\n');

  // Create output directory
  const outputDir = join(__dirname, '..', 'public', 'projects');
  await mkdir(outputDir, { recursive: true });
  console.log(`Output directory: ${outputDir}\n`);

  // Launch browser
  const browser = await chromium.launch({ headless: true });

  try {
    for (const project of projects) {
      console.log(`Capturing: ${project.name}`);
      console.log(`  URL: ${project.url}`);

      const page = await browser.newPage({
        viewport: project.viewport,
      });

      try {
        // Navigate to the page
        await page.goto(project.url, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        // Wait a bit for any animations or lazy-loaded content
        await page.waitForTimeout(2000);

        // Take screenshot
        const screenshotPath = join(outputDir, `${project.name}.jpg`);
        await page.screenshot({
          path: screenshotPath,
          type: 'jpeg',
          quality: 85,
          fullPage: false,
        });

        console.log(`  ✓ Saved to: public/projects/${project.name}.jpg\n`);
      } catch (error) {
        console.error(`  ✗ Error capturing ${project.name}:`, error.message);
        console.log();
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  console.log('Screenshot capture complete!');
}

captureScreenshots().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
