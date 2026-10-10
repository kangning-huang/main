#!/usr/bin/env node
// Screenshots of the /reach Field & Shelf preview (section 01, ?viz=field-shelf) from a running dev
// server or a static export of out/.
// Usage: node scripts/reach/field-shelf-screenshots.mjs <baseUrl> <outDir...>
// CHROMIUM_PATH reuses an installed browser build; ONLY=name,name limits the shots.
// Writes preview-reach-field-shelf-*.png to every outDir.
import { chromium } from "playwright";
import { copyFile, mkdir, readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const [baseUrl = "http://localhost:3000", ...outDirs] = process.argv.slice(2);
if (outDirs.length === 0) {
  console.error("usage: field-shelf-screenshots.mjs <baseUrl> <outDir...>");
  process.exit(1);
}

const data = JSON.parse(await readFile(join(ROOT, "src", "data", "field-shelf.json"), "utf8"));
const Q = "?viz=field-shelf&lens=all";
const ERL = "10.1088/1748-9326/ab4b71";
const SHOTS = [
  // Required views.
  { name: "1280", width: 1280, height: 1000, query: Q },
  { name: "380", width: 380, height: 820, query: Q, mobile: true, element: true },
  { name: "hover", width: 1280, height: 1000, query: Q, hover: "multi" },
  // Review states.
  { name: "1280-lead", width: 1280, height: 1000, query: "?viz=field-shelf&lens=lead" },
  { name: "1280-shelf", width: 1280, height: 1000, query: `${Q}&shelf=${ERL}` },
  { name: "1280-search", width: 1280, height: 1000, query: Q, search: "seto" },
  { name: "1280-zh", width: 1280, height: 1000, query: Q, zh: true },
  { name: "720", width: 720, height: 1100, query: Q },
  { name: "380-paper", width: 380, height: 820, query: `${Q}&shelf=${ERL}`, mobile: true, element: true },
];

/** The square citing the most of Ken's papers (ties: outside the core, then farthest right), for the hover shot. */
function multiSquare(view) {
  const max = Math.max(...view.squares.map((q) => q[5].length));
  return view.squares
    .filter((q) => q[5].length === max)
    .sort((a, b) => (b[3] > 0) - (a[3] > 0) || a[1] - b[1])[0];
}

/** Mirror of fieldFrame() in FieldShelfCanvas.tsx. */
function frameOf(view, width) {
  const all = data.views.all.field;
  const lead = data.views.lead.field;
  const areaW = Math.max(all.width, lead.width) + 16;
  const areaH = Math.max(all.height, lead.height) + 8;
  const s = Math.min(1, width / areaW);
  const ox = width / 2 - view.field.cx * s;
  const oy = (areaH * s) / 2 - view.field.cy * s;
  return s === 1 ? { s, ox: Math.round(ox), oy: Math.round(oy) } : { s, ox, oy };
}

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
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${baseUrl}/reach${shot.query}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const section = page.locator("#ripple");
  const header = await page.evaluate(() => document.querySelector("header")?.getBoundingClientRect().height ?? 0);
  if (shot.element) {
    // The one-shot fill starts when the field is on screen: bring the visible canvas into view first.
    await page.evaluate(() => [...document.querySelectorAll("#ripple canvas")].find((c) => c.getBoundingClientRect().width > 0)?.scrollIntoView({ block: "center" }));
  } else {
    // Scroll the section just below the sticky site header, then let the one-shot fill run.
    await section.evaluate((el, offset) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - offset), header);
  }
  // Wait for the field: the first square appears once the client has hydrated, the fill takes ~2 s.
  await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll("#ripple canvas")].some((c) => {
          if (!c.width || !c.getBoundingClientRect().width) return false;
          const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
          for (let i = 3; i < d.length; i += 4) if (d[i]) return true;
          return false;
        }),
      null,
      { timeout: 20000 }
    )
    .catch(() => console.warn(`  ${shot.name}: field still blank after 20 s`));
  await page.waitForTimeout(2600);

  if (shot.search) {
    const box = page.locator('#ripple input[type="search"]');
    await box.click();
    await box.fill(shot.search);
    await page.waitForFunction(() => /match/.test(document.querySelector("#ripple [aria-live='polite']")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(500);
  }
  if (shot.hover) {
    const view = data.views.all;
    const q = multiSquare(view);
    const canvas = page.locator('#ripple canvas[role="img"]').first();
    const r = await canvas.boundingBox();
    const f = frameOf(view, r.width);
    const half = view.field.cell / 2;
    await page.mouse.move(r.x + f.ox + (q[1] + half) * f.s, r.y + f.oy + (q[2] + half) * f.s, { steps: 4 });
    // The tooltip payload loads on first hover.
    await page.waitForFunction(() => !/Loading details/.test(document.querySelector("#ripple .z-20")?.textContent ?? "Loading details"), null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(400);
    console.log(`hover: W${q[0]} cites ${q[5].length} papers`);
  }

  const file = `preview-reach-field-shelf-${shot.name}.png`;
  const [first, ...rest] = outDirs;
  await mkdir(first, { recursive: true });
  if (shot.element) {
    // Full-page capture clipped to the section; the sticky site header is made static first so it
    // is not stitched into the middle of the image.
    await page.addStyleTag({ content: "body > header, header.sticky, header[class*='sticky'] { position: static !important; }" });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const box = await section.evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { x: 0, y: b.top + window.scrollY, width: document.documentElement.clientWidth, height: b.height };
    });
    await page.screenshot({ path: join(first, file), fullPage: true, clip: box });
  } else {
    await page.screenshot({ path: join(first, file) });
  }
  for (const dir of rest) {
    await mkdir(dir, { recursive: true });
    await copyFile(join(first, file), join(dir, file));
  }
  console.log(file + (errors.length ? `  (page errors: ${errors.join(" | ")})` : ""));
  await context.close();
}
await browser.close();
