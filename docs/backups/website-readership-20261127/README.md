# Before the /reach website-readership section

Snapshot of `src/app/reach/page.tsx` taken on 2026-11-27, before adding the website-readership block.

The block is only on `/reach`. The homepage was not changed.

To reverse the change, restore the backed-up page and remove the files added with it:

- `src/app/reach/page.tsx` (restore from `src/app/reach/page.tsx` in this folder)
- `src/components/reach/WebsiteReadership.tsx`
- `src/lib/website-readership.ts`
- `src/data/website-readership.json`
- `scripts/fetch-website-readership.ts`
- `scripts/website-readership.test.ts`
- `.github/workflows/update-website-readership.yml`
- `docs/ops/website-readership.md`

Also remove `allowImportingTsExtensions` from `tsconfig.json` if nothing else needs it.
