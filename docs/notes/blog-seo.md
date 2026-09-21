# Blog SEO strategy (Substack-first)

**Decision (2026-09-21):** Keep Substack as the article host. Do not implement first-party `/blog/*` article pages on `kangning-huang.com` unless Ken explicitly asks to migrate.

## Why

- Articles are already written and published on Substack (`kangninghuang.substack.com`).
- Ranking equity for posts already lives on Substack URLs.
- Mirroring full posts on the personal domain would create duplicate-content / wrong-canonical risk for little gain.
- Lower-risk path matches the current live implementation.

## Current live evidence

| Check | Result |
| --- | --- |
| `/blog` role | Index / teaser only |
| Post card `href`s | `https://kangninghuang.substack.com/p/...` (outbound) |
| Sitemap | Lists `https://kangning-huang.com/blog` once; no `/blog/<slug>` entries |
| Listing canonical | `https://kangning-huang.com/blog` |
| Substack article canonical | Self-canonical on Substack (sample verified) |
| First-party article routes | None under `src/app/blog/` (only `page.tsx`) |

## Rules

1. Full articles stay on Substack; personal-site `/blog` lists and links out.
2. Never add `/blog/[slug]` (or similar) that hosts duplicated article HTML/MDX.
3. Never add invented first-party article URLs to `src/app/sitemap.ts`.
4. Canonicals for full articles belong on Substack URLs.
5. Keep the build-time fetch into `src/data/blog-posts.json` (`scripts/fetch-blog.mjs`).

## Optional later polish (not required for correctness)

- ItemList JSON-LD on `/blog` whose item URLs are the Substack post URLs (not on-domain fakes).
- Prefer `rel="noopener"` over `noopener noreferrer` on outbound cards if referrer attribution to Substack is desired.

## Override

Only switch to first-party `/blog/*` posts if Ken explicitly requests hosting articles on-domain and accepts the migration / canonical work.
