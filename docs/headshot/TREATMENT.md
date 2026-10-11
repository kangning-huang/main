# Homepage headshot: Google Scholar–style circle

Classical edits only (Pillow + NumPy). No generative models, inpainting, or
face retouching.

## Source

- Full-res panel photo: `_source/ken-panel-headshot-raw.jpg` (1280×854).
- Google Scholar profile downloads (provenance only; CDN max is 256×171):
  - `_source/ken-scholar-profile-view.jpg` — `view_photo`
  - `_source/ken-scholar-profile-medium.jpg` — `medium_photo`
- Scholar profile: https://scholar.google.com/citations?user=s_domssAAAAJ&hl=en
- Scholar CDN:
  - https://scholar.googleusercontent.com/citations?view_op=view_photo&user=s_domssAAAAJ&citpid=10
  - https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=s_domssAAAAJ&citpid=10

The Scholar `medium_photo` is effectively a Lanczos downscale of the full-res
raw (MAE ≈ 3.5 / 255), so outputs are rendered from the raw file for sharpness
while matching Scholar’s framing content.

## Reproduce

```sh
python3 scripts/headshot/process.py
python3 scripts/headshot/process.py path/to/original.jpg
```

## Steps

1. Gentle grade (warm R×1.03 / B×0.97, contrast ×1.04, +2 lift). Backdrop is
   left as photographed — same look as Scholar, not the old teal-bokeh mask.
2. Face-centred square crop `(590, 135, 890, 435)` → 300×300.
3. Lanczos resize + light unsharp (r 0.8, 35%, threshold 2).
4. Encode JPEG q84 progressive, WebP q80 m6, AVIF q60 speed 4.

## Outputs

| File | 1x | 2x |
|---|---|---|
| `public/headshot/headshot-square-*` | 160×160 | 300×300 |

Editorial `headshot-portrait-*` assets are removed from the live path.

## Front end

`src/components/HeroHeadshot.tsx` — plain `rounded-full` circle beside the name
(AVIF → WebP → JPG, 1x/2x). No teal offset frame; light ring only.
