#!/usr/bin/env python3
"""Reproducible headshot treatment for the homepage hero.

Classical operations only (Pillow + NumPy): crop, colour-keyed backdrop
mask, blur, duotone, levels, white balance, resize, encode. Nothing is
generated or inpainted; every subject pixel comes from the source photo.

Usage:
    python3 scripts/headshot/process.py [_source/ken-panel-headshot-raw.jpg]

Writes public/headshot/headshot-portrait-{1x,2x}.{avif,webp,jpg} (editorial hero).
See docs/headshot/TREATMENT.md for the rationale behind each constant.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "_source/ken-panel-headshot-raw.jpg"
OUT = ROOT / "public/headshot"

# Crop boxes in source pixels (left, top, right, bottom).
# portrait: 4:5 head-and-shoulders for the editorial hero (shipped).
CROPS = {
    "portrait": (465, 100, 935, 688),  # 470 x 588 (4:5), ends above the paper
}
# Output sizes (w, h). 2x never exceeds the native crop, so nothing is upscaled.
SIZES = {
    "portrait": {"1x": (320, 400), "2x": (470, 588)},
}

# Site palette
INK = np.array([0x14, 0x12, 0x11], np.float32)
TEAL = np.array([0x0D, 0x73, 0x77], np.float32)

# Regions that are always subject even though they key as "blue" (the mic's
# blue brand cube, light-blue shirt and cuff). Source pixels.
CUBE_POLYGON = [(612, 394), (695, 401), (689, 467), (590, 471), (595, 410)]
FORCE_SUBJECT_BOXES = [
    (660, 435, 750, 600),  # shirt + tie
    (560, 580, 618, 635),  # shirt cuff
]


def backdrop_mask(rgb: np.ndarray) -> Image.Image:
    """1.0 = projected backdrop, 0.0 = subject. Keys the saturated blue screen."""
    r, b = rgb[..., 0].astype(np.int16), rgb[..., 2].astype(np.int16)
    key = (b > 150) & (b - r > 80) & (r < 130)  # r ceiling keeps lit skin out

    # Everything outside the subject's generous silhouette hull is backdrop
    # (catches dark building shapes on the screen that don't key as blue).
    hull = Image.new("L", (rgb.shape[1], rgb.shape[0]), 0)
    ImageDraw.Draw(hull).polygon(
        [
            (625, 165), (700, 160), (790, 165), (850, 215), (850, 330),
            (830, 395), (900, 430), (935, 470), (945, 854), (450, 854),
            (455, 600), (475, 520), (520, 440), (585, 395), (620, 330),
        ],
        fill=255,
    )
    inside = np.asarray(hull) > 0
    bg = key | ~inside

    m = Image.fromarray((bg * 255).astype(np.uint8))
    d = ImageDraw.Draw(m)
    for box in FORCE_SUBJECT_BOXES:
        d.rectangle(box, fill=0)
    d.polygon(CUBE_POLYGON, fill=0)
    # Clean speckle (open then close), then feather the edge.
    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    m = m.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    # Grow the backdrop ~2 px into the subject so blue fringe is replaced, then feather.
    m = m.filter(ImageFilter.MaxFilter(5))
    return m.filter(ImageFilter.GaussianBlur(2.5))


def masked_blur(img: Image.Image, mask: Image.Image, radius: float) -> np.ndarray:
    """Normalised-convolution blur of backdrop pixels only, so the dark suit
    doesn't bleed into the backdrop as a dark rim."""
    w = np.asarray(mask.filter(ImageFilter.MinFilter(9)).point(lambda v: 255 if v > 250 else 0), np.float32)
    wi = Image.fromarray(w.astype(np.uint8))
    a = np.asarray(img, np.float32) * (w[..., None] / 255.0)
    num = np.stack([np.asarray(Image.fromarray(a[..., c].astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius)), np.float32) for c in range(3)], -1)
    den = np.asarray(wi.filter(ImageFilter.GaussianBlur(radius)), np.float32)[..., None]
    return num / np.maximum(den, 1.0) * 255.0


def treat_backdrop(img: Image.Image, mask: Image.Image) -> np.ndarray:
    """Blur + luminance duotone (ink -> teal) + darken, so the skyline reads
    as abstract texture rather than a recognisable NYC view."""
    a = np.clip(masked_blur(img, mask, 7), 0, 255)
    lum = (0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]) / 255.0
    lum = np.clip((lum - 0.15) / 0.75, 0, 1) ** 1.25  # levels + gamma
    t = (lum * 0.85)[..., None]
    duo = INK * (1 - t) + TEAL * t
    # Lift the brightest lights a touch so the bokeh still glows.
    glow = np.clip(lum - 0.8, 0, 1)[..., None] * 140
    return np.clip(duo + glow * np.array([0.55, 0.85, 0.8]), 0, 255)


def treat_subject(img: Image.Image, mask: np.ndarray) -> np.ndarray:
    """Pull the blue spill off the subject and warm the skin slightly."""
    a = np.asarray(img, np.float32).copy()
    # Despill: in the soft edge band (hair, shoulders) cap blue relative to R/G.
    band = (mask[..., 0] > 0.02) & (mask[..., 0] < 0.98)
    band = np.asarray(Image.fromarray((band * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
    cap = np.maximum(a[..., 0], a[..., 1]) * 1.25 + 12
    a[..., 2] = np.where(band, np.minimum(a[..., 2], cap), a[..., 2])
    a = a * np.array([1.05, 1.0, 0.92])  # white balance: warmer
    a = (a - 128) * 1.06 + 128 + 4  # gentle contrast + lift
    return np.clip(a, 0, 255)


def vignette(w: int, h: int, strength: float = 0.35) -> np.ndarray:
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((x - w * 0.55) / w) ** 2 + ((y - h * 0.35) / h) ** 2)
    return (1 - strength * np.clip(d * 1.4, 0, 1) ** 2)[..., None]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    src = Image.open(SRC).convert("RGB")
    mask_img = backdrop_mask(np.asarray(src))
    mask = np.asarray(mask_img, np.float32)[..., None] / 255.0
    comp = treat_backdrop(src, mask_img) * mask + treat_subject(src, mask) * (1 - mask)
    comp = comp * vignette(src.width, src.height)
    graded = Image.fromarray(comp.astype(np.uint8))

    for name, box in CROPS.items():
        crop = graded.crop(box)
        for density, size in SIZES[name].items():
            im = crop.resize(size, Image.LANCZOS) if size != crop.size else crop
            im = im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=40, threshold=2))
            stem = OUT / f"headshot-{name}-{density}"
            im.save(f"{stem}.jpg", quality=84, optimize=True, progressive=True)
            im.save(f"{stem}.webp", quality=80, method=6)
            im.save(f"{stem}.avif", quality=60, speed=4)
    for f in sorted(OUT.iterdir()):
        print(f"{f.stat().st_size:>8}  {f.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
