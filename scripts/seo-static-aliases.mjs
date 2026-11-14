#!/usr/bin/env node
/**
 * After `next export`, GitHub Pages serves /research as research.html but
 * /research/ 404s (no research/index.html). Emit lightweight HTML stubs so
 * trailing-slash URLs resolve and point crawlers at the clean canonical.
 *
 * Real HTTP 301s still need Cloudflare Redirect Rules (docs/ops/cloudflare-seo.md).
 */
import { mkdirSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = new URL("../out/", import.meta.url).pathname;

function htmlStub(canonicalPath) {
  const href = canonicalPath === "/" ? "/" : canonicalPath;
  const abs = `https://kangning-huang.com${href === "/" ? "" : href}`;
  const lang = href === "/zh" || href.startsWith("/zh/") ? "zh-Hans" : "en";
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8"/>
  <title>Redirecting…</title>
  <link rel="canonical" href="${abs}"/>
  <meta http-equiv="refresh" content="0;url=${href}"/>
  <script>location.replace(${JSON.stringify(href)});</script>
</head>
<body>
  <p>Moved to <a href="${href}">${abs}</a>.</p>
</body>
</html>
`;
}

function collectHtmlRoutes(dir, base = "") {
  const routes = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith("_") || name === "404.html") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "_next") continue;
      routes.push(...collectHtmlRoutes(full, `${base}/${name}`));
      continue;
    }
    if (name.endsWith(".html")) {
      const route =
        name === "index.html"
          ? base || "/"
          : `${base}/${name.slice(0, -".html".length)}`;
      routes.push(route);
    }
  }
  return routes;
}

if (!existsSync(OUT)) {
  console.error("out/ missing — run next build first");
  process.exit(1);
}

const routes = collectHtmlRoutes(OUT).filter((r) => r !== "/");
let n = 0;
for (const route of routes) {
  const dir = join(OUT, route.slice(1));
  const indexPath = join(dir, "index.html");
  const htmlFile = join(OUT, `${route.slice(1)}.html`);
  // Don't clobber a real directory index if Next ever emits one
  if (existsSync(indexPath) && !existsSync(htmlFile)) {
    continue;
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(indexPath, htmlStub(route));
  n++;
}
console.log(`seo-static-aliases: wrote ${n} trailing-slash stubs`);
