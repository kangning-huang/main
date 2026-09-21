# CLAUDE.md

## Project Overview

This is Kangning (Ken) Huang's personal academic portfolio website, built with Next.js 16, TypeScript, and Tailwind CSS 4. It is deployed to GitHub Pages via static export at `https://kangning-huang.com/`.

## Development

- Install dependencies: `npm install`
- Build: `npm run build` (output goes to `out/`)
- Dev server: `npm run dev` (serves at `http://localhost:3000/`)

## Blog SEO (Substack-first)

**Standing decision:** Full articles live on Substack (`https://kangninghuang.substack.com`). The personal-site `/blog` route is a listing/teaser only.

Rules for anyone editing this repo:

1. **Do not** add first-party article routes such as `/blog/[slug]` that duplicate Substack content.
2. Blog cards must continue to link out to Substack post URLs (`target="_blank"`). Do not invent on-domain article URLs.
3. `src/app/sitemap.ts` must list only the `/blog` **index**, never fake `/blog/<slug>` URLs.
4. Canonicals for full articles belong on Substack. The site may canonicalize `https://kangning-huang.com/blog` for the listing page only.
5. Posts are fetched into `src/data/blog-posts.json` via `scripts/fetch-blog.mjs` at build time; keep that pipeline rather than migrating content into the repo.

See `docs/notes/blog-seo.md` for the rationale and evidence.

## When Adding a New Publication

Every time a new publication is added, **both the website and the CV must be updated**:

### 1. Update the website (`src/lib/constants.ts`)

Add or update the entry in the `CURATED_PUBLICATIONS` array. Each publication entry has this shape:

```ts
{
  title: "Full paper title",
  authors: "Author list (abbreviated, e.g. 'K Huang, X Li')",
  venue: "Journal Name",           // or "preprint" / "accepted"
  year: 2025,
  citationCount: 0,
  doi: "10.xxxx/xxxxx",            // optional, add when available
  isLeadAuthor: true,              // true if Kangning is first or last author
  preprint: "https://...",         // optional, link to preprint
  webUrl: "https://...",           // optional, link to interactive web app
}
```

- First/last author papers go under the `// ── First / last author ──` section.
- Co-authored papers go under the `// ── Co-author ──` section.
- Publications are roughly ordered by year (newest first) within each section.
- When a paper transitions from "preprint" to published, update the `venue` to the journal name and add the `doi`.

### 2. Update the CV (`cv/CV_Kangning_Huang.tex`)

The CV has several publication subsections under `\section{Publications}`:

- **Under Review / Preprint** (`\subsection{Articles, Under Review / Preprint}`): For papers not yet published. Use format: `Author list. "Title." Under review in \textit{Journal Name}.`
- **Peer-Reviewed Articles** (`\subsection{Peer-Reviewed Articles}`): For published papers. Use format: `Author list. Year. "Title." \href{URL}{\textit{Journal Name}}. Volume(Issue), Pages.`
- **Non-Peer-Reviewed Articles**: For commentaries, news & views, etc.

When a paper moves from under review to accepted/published:
1. Remove it from the "Under Review / Preprint" list.
2. Add it to the "Peer-Reviewed Articles" list in chronological order (newest first).
3. Add the DOI link as an `\href{}` on the journal name.

After updating the LaTeX source, recompile the PDF and place it at `public/CV_Kangning_Huang.pdf`.
