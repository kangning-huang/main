# Homepage headshot: image treatment

Classical edits only (Pillow 12.3 + NumPy 2.5). No generative models, inpainting or
face/body retouching: every subject pixel comes from the source photo, with only
global colour and contrast changes applied to it.

## Reproduce

```sh
python3 scripts/headshot/process.py                       # defaults to _source/ken-panel-headshot-raw.jpg
python3 scripts/headshot/process.py path/to/original.jpg  # or pass a path
```

Source: `_source/ken-panel-headshot-raw.jpg`, 1280×854 JPEG,
sha256 `4d38da7eb62068625ac4d9b833118306510d994dd726e167f67f68018eb5fb73`.

## Steps (in order, on the full frame)

1. **Backdrop key.** A pixel counts as backdrop if `B > 150 && B − R > 80 && R < 130`
   (int16 maths so the subtraction can't wrap). The `R < 130` ceiling keeps
   blue-lit skin out of the key.
2. **Silhouette hull.** Everything outside a generous hand-drawn polygon around
   the subject counts as backdrop too. This catches dark building shapes on the
   screen that don't key as blue. The polygon is `backdrop_mask()` → `hull`.
3. **Protected regions.** Forced to subject because they key as blue:
   - mic cube polygon `(612,394) (695,401) (689,467) (590,471) (595,410)`
   - shirt + tie box `(660,435)–(750,600)`
   - shirt cuff box `(560,580)–(618,635)`
4. **Mask cleanup.** Min/Max 3 px open + close (speckle), then grow the backdrop by
   MaxFilter 5 to absorb blue fringe, then Gaussian feather of 2.5 px.
5. **Backdrop.** Normalised-convolution Gaussian blur (radius 7) over backdrop
   pixels only, so the suit doesn't bleed into it as a dark rim. Then a luminance
   duotone from ink `#141211` to teal `#0d7377`:
   levels `(L − 0.15) / 0.75`, gamma 1.25, mix capped at 85% teal. Only the
   brightest lights get a faint glow. The NYC skyline ends up as abstract teal
   bokeh.
6. **Subject.**
   - Despill in the soft edge band (hair, shoulders, 7 px): `B ≤ max(R,G) × 1.25 + 12`.
   - White balance R × 1.05, B × 0.92 (warms skin, cuts blue cast).
   - Contrast × 1.06 around mid-grey, +4 lift.
7. **Composite + vignette.** Alpha-blend by the feathered mask, then a soft radial
   vignette (35%) centred at (55%, 35%) of the frame.
8. **Crop + resize + export.** Lanczos resize and a light unsharp mask
   (r 1.0, 40%, threshold 2). Encoders: JPEG q84 progressive, WebP q80 m6,
   AVIF q60 speed 4.

## Crops and outputs

The 2x images are the native crop, so nothing is upscaled.

| Crop | Source box (l, t, r, b) | 1x | 2x | Used by |
|---|---|---|---|---|
| square (shipped) | `(590, 135, 890, 435)`, 300×300 | 160×160 | 300×300 | circle hero |
| portrait (unused) | `(465, 100, 935, 688)`, 470×588 | — | — | editorial experiment, not shipped |

File sizes (bytes):

| File | AVIF | WebP | JPG |
|---|---:|---:|---:|
| `headshot-square-1x` | 2,692 | 3,156 | 5,216 |
| `headshot-square-2x` | 7,220 | 8,670 | 14,116 |

## Front end

`src/components/HeroHeadshot.tsx` renders a `<picture>` element: AVIF, then WebP, then
a JPG `<img>` with `1x`/`2x` srcset, explicit `width`/`height` (no CLS) and
`fetchpriority="high"`. Alt text follows the site language toggle:
EN "Kangning Huang speaking at a panel", ZH "黄康宁在论坛上发言".

Shipped layout: teal-ring **circle** beside the H1 (`src/components/HeroHeadshot.tsx`).

## Screenshots

`scripts/headshot/screenshots.mjs <variant> <baseUrl> <outDir...>` captures 1440×900
and 390×844 (2x DPR) views of a served `out/`. Set `CHROMIUM_PATH` to reuse an
installed Chromium. In-repo copies in `screenshots/` are WebP q90.
