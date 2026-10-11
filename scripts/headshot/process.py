#!/usr/bin/env python3
"""Homepage headshot: Google Scholar–style circular avatar.

Classical operations only (Pillow): face-centred square crop, gentle levels,
resize, encode. No generative edits.

The live Scholar CDN only serves up to 256×171 (medium_photo). That file is
byte-identical (MAE ≈ 3.5/255) to a Lanczos downscale of
`_source/ken-panel-headshot-raw.jpg`, so we render from the full-res raw and
keep the Scholar downloads in `_source/` for provenance.

Usage:
    python3 scripts/headshot/process.py [_source/ken-panel-headshot-raw.jpg]

Writes public/headshot/headshot-square-{1x,2x}.{avif,webp,jpg}.
See docs/headshot/TREATMENT.md.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "_source/ken-panel-headshot-raw.jpg"
OUT = ROOT / "public/headshot"

# Face-centred square (source pixels). Matches the prior circle hero crop.
CROPS = {
    "square": (590, 135, 890, 435),  # 300 × 300
}
SIZES = {
    "square": {"1x": (160, 160), "2x": (300, 300)},
}


def gentle_grade(img: Image.Image) -> Image.Image:
    """Light contrast + warmth only — keep Scholar's natural backdrop."""
    a = np.asarray(img, np.float32)
    a = a * np.array([1.03, 1.0, 0.97], np.float32)  # slight warm
    a = (a - 128.0) * 1.04 + 128.0 + 2.0  # gentle contrast + lift
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    # Remove prior editorial portrait exports so they are not shipped.
    for stale in OUT.glob("headshot-portrait-*"):
        stale.unlink()
        print(f"removed {stale.relative_to(ROOT)}")

    src = Image.open(SRC).convert("RGB")
    graded = gentle_grade(src)

    for name, box in CROPS.items():
        crop = graded.crop(box)
        for density, size in SIZES[name].items():
            im = crop.resize(size, Image.LANCZOS) if size != crop.size else crop.copy()
            im = im.filter(ImageFilter.UnsharpMask(radius=0.8, percent=35, threshold=2))
            stem = OUT / f"headshot-{name}-{density}"
            im.save(f"{stem}.jpg", quality=84, optimize=True, progressive=True)
            im.save(f"{stem}.webp", quality=80, method=6)
            im.save(f"{stem}.avif", quality=60, speed=4)

    for f in sorted(OUT.iterdir()):
        print(f"{f.stat().st_size:>8}  {f.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
