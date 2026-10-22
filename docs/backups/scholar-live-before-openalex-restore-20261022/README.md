# Scholar Field & Shelf snapshot (before OpenAlex restore)

Taken 2026-10-22 Asia/Shanghai immediately before rolling live Field & Shelf
back to OpenAlex after Ken rejected the thin Scholar prototype (#148 / e2b541a).

## Gap that triggered the rollback
- Scholar live (this snapshot): 3 papers, 296 citing squares, 8 grey-lit, prototype sample
- OpenAlex restored: 27 papers, 3217 citing squares (asOf 2026-10-19 backup)

## Scholar pipeline kept on main
- `scripts/scholar-reach/` (fetch-citing.mjs, build-field-shelf-from-scholar.mjs)
- `src/data/scholar-citations.json` (still present; Field & Shelf no longer consumes it for the viz)
- Branch `reach/google-scholar` and this backup preserve the cutover artifacts for a later full-coverage Scholar attempt

Do not re-point live Field & Shelf at the prototype until square coverage meets or beats OpenAlex.
