# CLAUDE.md

## Project Overview

This is Kangning (Ken) Huang's personal academic portfolio website, built with Next.js 16, TypeScript, and Tailwind CSS 4. It is deployed to GitHub Pages via static export at `https://kangning-huang.github.io/main/`.

## Development

- Install dependencies: `npm install`
- Build: `npm run build` (output goes to `out/`)
- Dev server: `npm run dev` (serves at `http://localhost:3000/main/`)

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
- Co-authored papers go under `// ── Co-author ──`.
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
