#!/usr/bin/env node
/**
 * Next.js `output: "export"` regenerates out/404.html from app/not-found and
 * can clobber public/404.html. Re-copy our lightweight /main redirect 404 after
 * build so GitHub Pages unknown-path fallback still strips the old basePath.
 *
 * This is a browser backup only — crawlers still see HTTP 404. True 301s need
 * Cloudflare Redirect Rules (orange-cloud proxy).
 */
import { copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "public", "404.html");
const dest = join(root, "out", "404.html");

if (!existsSync(src)) {
  console.warn("[preserve-404-redirect] public/404.html missing; skip");
  process.exit(0);
}
if (!existsSync(join(root, "out"))) {
  console.warn("[preserve-404-redirect] out/ missing; skip");
  process.exit(0);
}

copyFileSync(src, dest);
console.log("[preserve-404-redirect] restored out/404.html with /main redirect backup");
