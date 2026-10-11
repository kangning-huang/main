# Homepage headshot: Google Scholar–style circle

Classical edits only (Pillow + NumPy). No generative models, inpainting, or
face retouching.

## Source

- **Current (2026-10-12):** user-supplied face crop
  `_source/ken-couple-headshot-user-crop.jpg` (893×1174; process.py
  center-crops to square on the shorter side before resize).
- Prior auto face square kept: `_source/ken-couple-headshot-face-square.jpg`.
- Couple selfie raw kept: `_source/ken-couple-headshot-raw.jpg` (768×1024).
- Prior panel source kept: `_source/ken-panel-headshot-raw.jpg`.
- Google Scholar profile: https://scholar.google.com/citations?user=s_domssAAAAJ&hl=en

## Reproduce

```sh
python3 scripts/headshot/process.py
python3 scripts/headshot/process.py path/to/original.jpg
```

## Steps

1. Center-square the source if `w ≠ h` (crop to `min(w,h)` centered).
2. Gentle grade (warm R×1.03 / B×0.97, contrast ×1.04, +2 lift).
3. Full-image square crop `(0, 0, w, h)`.
4. Lanczos resize + light unsharp (r 0.8, 35%, threshold 2).
5. Encode JPEG q84 progressive, WebP q80 m6, AVIF q60 speed 4.

## Outputs

| File | 1x | 2x |
|---|---|---|
| `public/headshot/headshot-square-*` | 160×160 | 300×300 |

## Front end

`src/components/HeroHeadshot.tsx` — plain `rounded-full` circle beside the name
(AVIF → WebP → JPG, 1x/2x).
