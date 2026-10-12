# Homepage headshot: Google Scholar–style circle

Classical edits only (Pillow + NumPy). No generative models, inpainting, or
face retouching.

## Source

- **Current (2026-10-12):** user-supplied full panel
  `_source/ken-panel-headshot-full-2026-10-12.jpg` (1086×725) with face-centred
  full-height square crop `(218, 0, 943, 725)` → 725×725 (zoomed out vs prior
  Scholar-matched tight face crops — shows shoulders, mic, white chair, blue
  cityscape backdrop).
- Prior panel raw (kept; not in pipeline):
  `_source/ken-panel-headshot-raw.jpg` (1280×854), last crop
  `(565, 110, 915, 460)` / 350×350 (~17% zoom-out from Scholar 300×300).
- Google Scholar profile downloads (provenance):
  - `_source/ken-scholar-profile-view.jpg` — `view_photo`
  - `_source/ken-scholar-profile-medium.jpg` — `medium_photo`
- Scholar profile: https://scholar.google.com/citations?user=s_domssAAAAJ&hl=en

### Unused (kept on disk; not in the pipeline)

- `_source/ken-couple-headshot-user-crop.jpg` — Ken-supplied crop (PR #120)
- `_source/ken-couple-headshot-face-square.jpg` — auto face square (PR #119)
- `_source/ken-couple-headshot-raw.jpg` — couple selfie raw
- `_source/ken-panel-headshot-raw.jpg` — earlier panel raw (Scholar-matched)

## Reproduce

```sh
python3 scripts/headshot/process.py
python3 scripts/headshot/process.py path/to/original.jpg
```

## Steps

1. Gentle grade (warm R×1.03 / B×0.97, contrast ×1.04, +2 lift). Backdrop is
   left as photographed — same look as Scholar, not a teal-bokeh mask.
2. Face-centred square crop `(218, 0, 943, 725)` → 725×725 (full image height;
   face ~horizontal centre, upper third — torso, mic, notes, chair visible).
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
