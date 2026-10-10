#!/usr/bin/env node
// Screenshots of the /reach Ripple map (section 01) from a running dev server or static export.
// Usage: node scripts/reach/ripple-screenshots.mjs <baseUrl> <outDir...>
// CHROMIUM_PATH reuses an installed browser build. Writes preview-ripple-*.png to every outDir.
import { chromium } from "playwright";
import { copyFile, mkdir } from "fs/promises";
import { join } from "path";

const [baseUrl = "http://localhost:3000", ...outDirs] = process.argv.slice(2);
if (outDirs.length === 0) {
  console.error("usage: ripple-screenshots.mjs <baseUrl> <outDir...>");
  process.exit(1);
}

const SHOTS = [
  // Required views.
  { name: "desktop-1280", width: 1280, height: 900, query: "" },
  { name: "720", width: 720, height: 1100, query: "" },
  { name: "mobile-380", width: 380, height: 820, query: "", mobile: true, element: true },
  // Interaction states for review.
  { name: "desktop-1280-theme-heat", width: 1280, height: 900, query: "?theme=heat-health" },
  { name: "desktop-1280-keyword", width: 1280, height: 900, query: "?kw=urban-heat-island" },
  { name: "desktop-1280-lead", width: 1280, height: 900, query: "?lens=lead" },
  { name: "desktop-1280-peryear", width: 1280, height: 900, query: "?weight=perYear" },
  { name: "desktop-1280-zh", width: 1280, height: 900, query: "", zh: true },
  { name: "mobile-380-keyword", width: 380, height: 820, query: "?kw=pm2-5", mobile: true, element: true },
];

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const only = process.env.ONLY ? new Set(process.env.ONLY.split(",")) : null;
for (const shot of SHOTS) {
  if (only && !only.has(shot.name)) continue;
  const context = await browser.newContext({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: shot.mobile ? 2 : 1,
    isMobile: !!shot.mobile,
    hasTouch: !!shot.mobile,
  });
  if (shot.zh) await context.addInitScript(() => localStorage.setItem("lang", "zh"));
  const page = await context.newPage();
  await page.goto(`${baseUrl}/reach${shot.query}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200); // fade-up and ripple transitions
  const file = `preview-ripple-${shot.name}.png`;
  const [first, ...rest] = outDirs;
  await mkdir(first, { recursive: true });
  const section = page.locator("#ripple");
  if (shot.element) {
    // Full-page capture clipped to the section: the sticky header stays at the top of the page, not stitched mid-image.
    const box = await section.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: 0, y: r.top + window.scrollY, width: document.documentElement.clientWidth, height: r.height };
    });
    await page.screenshot({ path: join(first, file), fullPage: true, clip: box });
  } else {
    // Scroll the section just below the sticky site header.
    const header = await page.evaluate(() => document.querySelector("header")?.getBoundingClientRect().height ?? 0);
    await section.evaluate((el, offset) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - offset), header);
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(first, file) });
  }
  for (const dir of rest) {
    await mkdir(dir, { recursive: true });
    await copyFile(join(first, file), join(dir, file));
  }
  console.log(file);
  await context.close();
}
await browser.close();
