# Steering update — 2026-10-10 (Ken)

**At Ripple launch, retire the Fields Sankey entirely.**

Do **not** keep `ReachFlowChart` behind a "Fields" / Ripple|Fields toggle.

- Section 01 of `/reach` = **Ripple only** (circle ≥720, strip &lt;720).
- Do not wire a Fields toggle on the page.
- You may leave `ReachFlowChart.tsx`, `build-reach-flow.mjs`, and `src/data/reach-flow.json` in the repo unused for now (cleanup later); or stop importing them from `page.tsx`. Prefer not deleting large files mid-preview unless trivial.
- Method note: no need to explain a live Sankey counting-rule difference as a dual chart; a one-liner that Ripple counts unique citing works per theme is enough.
- All other Ken defaults still stand: breadth headline + All default lens, "Form & methods" rename, phone unrolled strip, citing-work cache out of git, preview branch only (do not merge).
