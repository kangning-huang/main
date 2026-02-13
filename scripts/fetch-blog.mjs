/**
 * Pre-build script: fetch Substack posts and write to a JSON file.
 * If the API is unreachable (e.g. from GitHub Actions), the existing
 * committed JSON file is used as a fallback.
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/data/blog-posts.json");

const API_URL = "https://kangninghuang.substack.com/api/v1/posts?limit=10";

function stripHtml(html) {
  return html
    // Remove Substack subscription widget blocks
    .replace(
      /<div[^>]*class="subscription-widget-wrap[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g,
      ""
    )
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;|&mdash;|&ndash;/g, (m) =>
      m === "&mdash;" ? "\u2014" : m === "&ndash;" ? "\u2013" : "\u2019"
    )
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = await res.json();

    const data = posts.map((post) => {
      const plainBody = post.body_html ? stripHtml(post.body_html) : "";
      const excerpt = plainBody
        ? plainBody.slice(0, 800)
        : post.truncated_body_text
          ? post.truncated_body_text.slice(0, 800)
          : post.subtitle || post.description || "";

      return {
        title: post.title,
        date: new Date(post.post_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        subtitle: post.subtitle || post.description || "",
        excerpt,
        url:
          post.canonical_url ||
          `https://kangninghuang.substack.com/p/${post.slug}`,
        coverImage: post.cover_image || null,
        wordcount: post.wordcount || null,
      };
    });

    writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
    console.log(`[fetch-blog] Wrote ${data.length} posts to ${OUT}`);
  } catch (err) {
    console.warn(
      `[fetch-blog] Could not fetch from Substack (${err.message}). Using existing fallback JSON.`
    );
  }
}

main();
