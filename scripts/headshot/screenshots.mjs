#!/usr/bin/env node
// Capture desktop + mobile hero screenshots of a locally served static export.
// Usage: node scripts/headshot/screenshots.mjs <variant> <baseUrl> <outDir...>
import { chromium } from "playwright";
import { copyFile, mkdir } from "fs/promises";
import { join } from "path";

const [variant, baseUrl = "http://localhost:4173", ...outDirs] = process.argv.slice(2);
if (!variant || outDirs.length === 0) {
  console.error("usage: screenshots.mjs <variant> <baseUrl> <outDir...>");
  process.exit(1);
}

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
};

// CHROMIUM_PATH lets you reuse an already-installed browser build.
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
for (const [name, vp] of Object.entries(VIEWPORTS)) {
  const { width, height, ...opts } = vp;
  const page = await browser.newPage({ viewport: { width, height }, ...opts });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500); // let fade-up animations finish
  const file = `preview-headshot-${variant}-${name}.png`;
  const [first, ...rest] = outDirs;
  await mkdir(first, { recursive: true });
  await page.screenshot({ path: join(first, file) });
  for (const dir of rest) {
    await mkdir(dir, { recursive: true });
    await copyFile(join(first, file), join(dir, file));
  }
  console.log(file);
  await page.close();
}
await browser.close();
