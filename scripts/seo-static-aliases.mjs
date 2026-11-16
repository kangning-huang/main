#!/usr/bin/env node
/**
 * After `next export`, GitHub Pages serves /research as research.html but
 * /research/ 404s (no research/index.html). Emit lightweight HTML stubs so
 * trailing-slash URLs resolve and point crawlers at the clean canonical.
 *
 * Real HTTP 301s still need Cloudflare Redirect Rules (docs/ops/cloudflare-seo.md).
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync } from "node:fs";
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


function setHtmlLang(html, lang) {
  return html.replace(/<html\b([^>]*)>/i, (match, attrs) => {
    if (/\slang\s*=/i.test(attrs)) {
      return `<html${attrs.replace(/\slang=(["'])[^"']*\1/i, ` lang="${lang}"`)}>`;
    }
    return `<html lang="${lang}"${attrs}>`;
  });
}

function rewriteZhDocumentLang(dir, base = "") {
  let n = 0;
  if (!existsSync(dir)) return n;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "_next") continue;
      n += rewriteZhDocumentLang(full, `${base}/${name}`);
      continue;
    }
    if (!name.endsWith(".html")) continue;
    const route =
      name === "index.html" ? base || "/" : `${base}/${name.slice(0, -".html".length)}`;
    if (route !== "/zh" && !route.startsWith("/zh/")) continue;
    const html = readFileSync(full, "utf8");
    const updated = setHtmlLang(html, "zh-Hans");
    if (updated !== html) {
      writeFileSync(full, updated);
      n++;
    }
  }
  return n;
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

const zhHtml = join(OUT, "zh.html");
let langN = 0;
if (existsSync(zhHtml)) {
  const html = readFileSync(zhHtml, "utf8");
  const updated = setHtmlLang(html, "zh-Hans");
  if (updated !== html) {
    writeFileSync(zhHtml, updated);
    langN++;
  }
}
langN += rewriteZhDocumentLang(join(OUT, "zh"), "/zh");
console.log(`seo-static-aliases: set lang=zh-Hans on ${langN} /zh HTML files`);
