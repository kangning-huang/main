"""Research-page theme banners: four cities, four lenses.

Each banner is one city seen straight down (Sentinel-2), with one real data layer
on the same north-up grid, so the layer fits the image by construction:

  urban-futures  Lagos      chance of becoming urban by 2050, SSP2 (URBANMOD, Huang et al. 2019, ERL)
  heat           Shanghai   summer land surface temperature, Landsat 8/9, 2020-2024
  flood-coasts   Jakarta    land below the 100-year storm tide plus sea-level rise, 2050 and 2100, SSP5-8.5
  scaling-form   New York   built mass on nested H3 hexagons, levels 7/6/5 (Nature Cities 2026),
                            in the original nested-hex banner's style (navy duotone, glow, amber cascade)

Style (after the Nov 2026 critique): a light, muted base that keeps the photo's
detail; no glow; at most one line level; one shape carries each frame. Each
theme keeps its own sequential scheme (cividis, magma, water blues, viridis).
Legends and captions live in HTML (src/app/research/page.tsx), not in the image.

Reads data/<theme>.npz from fetch_layers.py. Writes public/research/<theme>
.jpg/.webp at 1x (1090 x 406) and @2x.

    python3 scripts/research-banners/make_banners.py [theme ...]
"""

from __future__ import annotations

import sys
from pathlib import Path

import contourpy
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
OUT = HERE.parents[1] / "public" / "research"

W, H = 1090, 406
S = 2
SW, SH = W * S, H * S

NAVY = np.array((11, 16, 42), float)
ICE = (226, 244, 252)
CYAN = (110, 222, 236)

CIVIDIS = [(0, 32, 77), (49, 68, 107), (102, 105, 112), (149, 143, 120), (203, 186, 105), (255, 234, 70)]
MAGMA = [(118, 26, 112), (192, 42, 86), (238, 96, 44), (252, 160, 52), (254, 214, 120)]
WATER = [(27, 63, 143), (47, 127, 208), (98, 198, 232)]
VIRIDIS = [(59, 82, 139), (33, 145, 140), (94, 201, 98), (253, 231, 37)]


def ramp_arr(t, stops):
    st = np.array(stops, float)
    t = np.clip(t, 0, 1) * (len(stops) - 1)
    i = np.minimum(t.astype(int), len(stops) - 2)
    f = (t - i)[..., None]
    return st[i] * (1 - f) + st[i + 1] * f


def load(theme):
    return dict(np.load(DATA / f"{theme}.npz"))


# ------------------------------------------------------------------ base
def base(rgb, sat=0.35, tint=0.18, gain=0.86, gamma=0.8):
    """Sentinel-2 reflectance -> muted, cool, mid-light base that keeps detail."""
    rgb = np.nan_to_num(rgb, nan=np.nanmedian(rgb))
    lo, hi = np.percentile(rgb, 1), np.percentile(rgb, 99.3)
    x = np.clip((rgb - lo) / (hi - lo), 0, 1) ** gamma
    lum = x @ np.array([0.299, 0.587, 0.114])
    x = lum[..., None] + (x - lum[..., None]) * sat           # mute colour
    x = x * gain
    cool = np.array((0.55, 0.66, 0.86))
    x = x * (1 - tint) + (x * cool + NAVY / 255 * 0.5) * tint  # slight blue-grey grade
    # gentle local-contrast lift so streets and blocks stay legible after muting
    blur = ndimage.gaussian_filter(x, (6, 6, 0))
    x = np.clip(x + (x - blur) * 0.45, 0, 1)
    return x * 255


def over(img, colour, alpha):
    """Composite a colour (H x W x 3 or 3-tuple) with per-pixel alpha (0..1)."""
    a = np.clip(alpha, 0, 1)[..., None]
    return img * (1 - a) + np.asarray(colour, float) * a


def dim(img, alpha, amount):
    """Darken the base where alpha > 0 (a soft 'shadow' so a layer lifts off the photo)."""
    return img * (1 - amount * np.clip(alpha, 0, 1)[..., None])


def stroke(img, polylines, colour, width, alpha):
    lay = Image.new("L", (SW, SH), 0)
    d = ImageDraw.Draw(lay)
    for pl in polylines:
        if len(pl) > 2:
            d.line([tuple(p) for p in pl], fill=255, width=width, joint="curve")
    a = np.asarray(lay.filter(ImageFilter.GaussianBlur(0.6)), float) / 255 * alpha
    return over(img, colour, a)


def contour(field, level, min_len=40):
    lines = contourpy.contour_generator(z=field).lines(level)
    return [l for l in lines if len(l) >= min_len]


def soft_mask(m, sigma=1.2):
    return np.clip(ndimage.gaussian_filter(m.astype(float), sigma), 0, 1)


# ------------------------------------------------------------------ themes
def urban_futures():
    d = load("urban-futures")
    img = base(d["rgb"], sat=0.4)
    p, cell = d["prob"], d["cell"]
    # One square per 5 km model cell, centred in the cell, its area proportional to the
    # chance the cell becomes urban by 2050. Cells already urban in 2015 and open water
    # carry no probability (NaN); the photo shows them.
    yy, xx = np.mgrid[0:SH, 0:SW]
    labels, idx = np.unique(cell, return_inverse=True)
    idx = idx.reshape(cell.shape)
    n = len(labels)
    k = np.arange(n)
    x0, x1 = ndimage.minimum(xx, idx, k), ndimage.maximum(xx, idx, k)
    y0, y1 = ndimage.minimum(yy, idx, k), ndimage.maximum(yy, idx, k)
    full = (x0 > 0) & (y0 > 0) & (x1 < SW - 1) & (y1 < SH - 1)
    nw, nh = np.median((x1 - x0 + 1)[full]), np.median((y1 - y0 + 1)[full])
    # cells clipped by the frame edge: place the square where the whole cell's centre is
    cxk = np.where(x0 == 0, x1 + 1 - nw / 2, np.where(x1 == SW - 1, x0 + nw / 2, (x0 + x1 + 1) / 2))
    cyk = np.where(y0 == 0, y1 + 1 - nh / 2, np.where(y1 == SH - 1, y0 + nh / 2, (y0 + y1 + 1) / 2))
    cx, cy = cxk[idx], cyk[idx]
    half = min(nw, nh) / 2
    pv = np.nan_to_num(ndimage.median(np.nan_to_num(p, nan=-1), idx, k)[idx], nan=0)
    side = 0.80 * half * np.sqrt(np.clip(pv, 0, 1))
    inside = (np.abs(yy + 0.5 - cy) <= side) & (np.abs(xx + 0.5 - cx) <= side) & (pv >= 0.10)
    a = soft_mask(inside, 0.7) * 0.74
    img = dim(img, ndimage.gaussian_filter(a, 6), 0.18)
    img = over(img, ramp_arr(np.clip(pv, 0, 1), CIVIDIS[1:]), a)
    return img


def heat():
    d = load("heat")
    img = base(d["rgb"])
    lst = d["lst"]
    water = d["water"] > 50
    land = ~water & np.isfinite(lst)
    lst = np.where(np.isfinite(lst), lst, np.nanmedian(lst))
    fine = ndimage.gaussian_filter(lst, 1.5)       # colour: follows blocks and roofs
    broad = ndimage.gaussian_filter(lst, 18)       # opacity: the shape of the heat island
    ref = np.percentile(lst[land], 25)             # cooler fringe of the frame
    top = np.percentile(fine[land], 99.5)
    t = np.clip((fine - ref) / (top - ref), 0, 1)
    tb = np.clip((broad - ref) / (np.percentile(broad[land], 99) - ref), 0, 1)
    a = np.clip(tb ** 2.4 * 1.05 * (0.30 + 0.70 * t), 0, 0.85) * soft_mask(land, 2)
    img = dim(img, a, 0.22)
    img = over(img, ramp_arr(t, MAGMA), a)
    print(f"  heat: ref {ref:.1f} C, top {top:.1f} C")
    return img


def flood_coasts():
    d = load("flood-coasts")
    img = base(d["rgb"])
    sea = ndimage.binary_opening(d["water"] > 70, iterations=2)
    def area(m):
        m = ndimage.gaussian_filter(m, 2.5) > 0.4
        m = ndimage.binary_closing(m, iterations=3)
        m = ndimage.binary_fill_holes(m | sea) & ~sea
        return m
    a50, a100 = area(d["m2050"]), area(d["m2100"])
    m50, m100 = soft_mask(a50, 1.2), soft_mask(a100, 1.2)
    img = dim(img, m100, 0.30)
    img = over(img, WATER[1], m100 * 0.55)
    img = over(img, (178, 234, 250), m50 * 0.78)
    line = contour(ndimage.gaussian_filter(a100.astype(float), 3), 0.5, 120)
    img = stroke(img, line, ICE, 2, 0.75)
    km2 = lambda m: float((m > 0.5).sum()) * (22 / 1000) ** 2
    print(f"  flood: 2050 {km2(m50):.0f} km2, 2100 {km2(m100):.0f} km2 in frame")
    return img


def edges(labels, width):
    """Pixels where the label changes (inside the labelled area), dilated to ~width px."""
    e = (np.diff(labels, axis=0, prepend=labels[:1]) != 0) | (np.diff(labels, axis=1, prepend=labels[:, :1]) != 0)
    e |= np.roll(e, -1, 0) | np.roll(e, -1, 1)
    if width > 2:
        e = ndimage.binary_dilation(e, iterations=(width - 2) // 2)
    return e


# ---------------------------------------------------------- scaling-form: original nested-hex style
# Ported from make_research_highlight_banner_nested.py (nested_v1) in the Blog_Posts draft folder
# bigger-cities-denser-neighborhoods: same navy duotone, purple -> teal -> soft-gold density
# hexes, thin glowing cyan edges, ice-white coarse strokes and the amber cascade. What changed:
# the base is a top-down Sentinel-2 image of New York (not the oblique Manhattan photo), the
# lattices are the paper's real H3 level 7 / 6 / 5 cells, and the shading is real built mass.
HEX_FILL = float(__import__("os").environ.get("HEX_FILL", 0.8))  # 1.0 = the original banner's opacity
# HEX_FADE shrinks the original's radial falloffs round the centre: 1.0 = original reach,
# smaller = hexagons dissolve sooner toward the edges (all three levels, edges and fills)
HEX_FADE = float(__import__("os").environ.get("HEX_FADE", 0.65))
NX_CYAN = (110, 222, 236)
NX_ICE = (196, 238, 248)
NX_AMBER = (255, 196, 64)
NX_RAMP = [(52, 24, 92), (64, 52, 140), (44, 104, 170), (34, 160, 168), (98, 198, 150), (236, 204, 112)]


def nx_ramp(t):
    return tuple(int(c) for c in ramp_arr(np.array(t), NX_RAMP))


def nx_layer():
    im = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def nx_glow(base, lay, radius, strength=1.0):
    bloom = lay.filter(ImageFilter.GaussianBlur(radius))
    if strength != 1.0:
        r, g, b, al = bloom.split()
        bloom = Image.merge("RGBA", (r, g, b, al.point(lambda p: min(255, int(p * strength)))))
    base.alpha_composite(bloom)
    base.alpha_composite(lay)


def nx_falloff(x, y, cx=470, cy=200, rx=470, ry=230, soft=0.42):
    r = np.hypot((x - cx * S) / (rx * S), (y - cy * S) / (ry * S))
    return np.clip((1.08 - r) / soft, 0, 1)


def nx_dark_base(rgb):
    """The original's navy duotone, applied to the satellite image's luminance."""
    from PIL import ImageOps

    x = np.nan_to_num(rgb, nan=float(np.nanmedian(rgb)))
    x = np.clip(x / np.percentile(x, 99.5), 0, 1)
    im = ImageOps.autocontrast(Image.fromarray((x * 255).astype(np.uint8)), cutoff=1.5)
    lum = np.asarray(im).astype(float) @ np.array([0.299, 0.587, 0.114]) / 255
    lum = lum ** 1.1                                        # original 1.35; satellite is flatter
    shadow = NAVY / 255
    light = np.array((110, 140, 192), float) / 255
    a = shadow + (light - shadow) * lum[..., None] * 0.95   # original 0.62
    yy, xx = np.mgrid[0:SH, 0:SW] / np.array([SH, SW])[:, None, None]
    v = 1 - 0.30 * (np.abs(xx - 0.45) / 0.55) ** 2.2 - 0.30 * np.clip((yy - 0.62) / 0.38, 0, 1) ** 2
    a = shadow + (a - shadow) * v[..., None]
    img = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    # the original blurred its photo slightly; the satellite needs the opposite
    return img.filter(ImageFilter.UnsharpMask(radius=2, percent=70, threshold=2)).convert("RGBA")


def nx_inset(poly, d):
    c = poly.mean(0)
    v = poly - c
    r = np.linalg.norm(v, axis=1, keepdims=True)
    return c + v * (1 - d / r)


def nx_ring(poly):
    return [tuple(p) for p in poly] + [tuple(poly[0])]


def scaling_form():
    d = load("scaling-form")
    base = nx_dark_base(d["rgb"])
    P = {r: d[f"poly{r}"] for r in (5, 6, 7)}
    C = {r: P[r].mean(1) for r in (5, 6, 7)}
    dens = {r: d[f"mass{r}"] / d[f"area{r}"] for r in (5, 6, 7)}      # t per km2

    # built-mass density of each level-7 cell -> 0..1 on a log scale (30th .. 99.5th pct),
    # so, as in the original, only the densest core reaches soft gold
    lo, hi = np.percentile(dens[7], 30), np.percentile(dens[7], 99.5)
    v7 = np.clip(np.log(np.maximum(dens[7], lo) / lo) / np.log(hi / lo), 0, 1)

    # each scale reaches further than the one below it, as in the original
    k = HEX_FADE
    fo = dict(cx=440, cy=196)                                        # centred on the peak
    m7 = nx_falloff(*C[7].T, rx=430 * k, ry=215 * k, soft=0.42 + 0.3 * (1 - k), **fo) ** (1 / k)
    m6 = nx_falloff(*C[6].T, rx=560 * k, ry=290 * k, soft=0.5 + 0.3 * (1 - k), **fo) ** (1 / k)
    floor5 = 0.35 * k ** 2                                           # original 0.35
    m5 = floor5 + (1 - floor5) * nx_falloff(*C[5].T, rx=720 * k, ry=380 * k, soft=0.6 + 0.3 * (1 - k), **fo)

    # level 7: semi-transparent density cells + thin glowing cyan edges
    fill, df = nx_layer()
    edge, de = nx_layer()
    for poly, v, m in zip(P[7], v7, m7):
        if m <= 0.02:
            continue
        q = nx_inset(poly, 1.4 * S)
        # HEX_FILL scales the original's fill opacity (34 + 120 v^1.3) so the satellite shows through
        df.polygon([tuple(p) for p in q], fill=nx_ramp(v) + (int(min(255, (34 + 120 * v ** 1.3) * m * HEX_FILL)),))
        de.line(nx_ring(q), fill=NX_CYAN + (int((50 + 85 * v) * m),), width=S)
    base.alpha_composite(fill.filter(ImageFilter.GaussianBlur(0.6 * S)))
    nx_glow(base, edge, 2.5 * S, 1.2)
    # luminous cores: soft amber light pooling over the densest cells
    pool, dp = nx_layer()
    for poly, v, m in zip(P[7], v7, m7):
        if v > 0.72 and m > 0.02:
            dp.polygon([tuple(p) for p in nx_inset(poly, -0.0)], fill=NX_AMBER + (int(90 * (v - 0.72) / 0.28 * m * HEX_FILL),))
    base.alpha_composite(pool.filter(ImageFilter.GaussianBlur(7 * S)))

    # level 6 (cyan) and level 5 (ice-white) strokes
    def strokes(polys, mask, colour, width, alpha, bloom, strength):
        lay, dl = nx_layer()
        for poly, m in zip(polys, mask):
            if m > 0.02:
                dl.line(nx_ring(poly), fill=colour + (int(alpha * m),), width=max(1, round(width * S)), joint="curve")
        nx_glow(base, lay, bloom, strength)

    strokes(P[6], m6, NX_CYAN, 1.5, 120, 2.5 * S, 1.1)
    strokes(P[5], m5, NX_ICE, 2.6, 125, 5 * S, 1.3)

    # amber cascade, nested around the peak: the densest level-7 cell, the level-6 cell
    # that contains it, and the level-5 cell that contains that
    from matplotlib.path import Path as MPath

    i7 = int(np.argmax(np.where(m7 > 0.5, dens[7], -1)))
    pk = C[7][i7]
    i6 = next(i for i in np.argsort(np.linalg.norm(C[6] - pk, axis=1)) if MPath(P[6][i]).contains_point(pk))
    i5 = next(i for i in np.argsort(np.linalg.norm(C[5] - pk, axis=1)) if MPath(P[5][i]).contains_point(pk))
    for poly, width, bloom, strength, alpha in ((P[5][i5], 2.2, 6, 1.2, 150), (P[6][i6], 1.6, 4, 1.4, 210),
                                                (nx_inset(P[7][i7], 0.5 * S), 1.5, 4, 1.6, 255)):
        lay, dl = nx_layer()
        dl.line(nx_ring(poly), fill=NX_AMBER + (alpha,), width=max(1, round(width * S)), joint="curve")
        nx_glow(base, lay, bloom * S, strength)

    print(f"  scaling: L5 {len(P[5])}, L6 {len(P[6])}, L7 {len(P[7])} cells; "
          f"L7 density {lo / 1e6:.2f}-{hi / 1e6:.2f} Mt/km2 (30th-99.5th pct); "
          f"peak L7 {dens[7][i7] / 1e6:.2f} Mt/km2")
    return np.asarray(base.convert("RGB"), float)


def save(img, stem):
    OUT.mkdir(parents=True, exist_ok=True)
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    im.save(OUT / f"{stem}@2x.jpg", quality=74, optimize=True, progressive=True)
    im.save(OUT / f"{stem}@2x.webp", quality=70, method=6)
    sm = im.resize((W, H), Image.LANCZOS)
    sm.save(OUT / f"{stem}.jpg", quality=82, optimize=True, progressive=True)
    sm.save(OUT / f"{stem}.webp", quality=76, method=6)
    print(f"  wrote {stem} (.jpg/.webp, 1x/@2x)")


THEMES = {
    "urban-futures": urban_futures,
    "heat": heat,
    "flood-coasts": flood_coasts,
    "scaling-form": scaling_form,
}

if __name__ == "__main__":
    for name in sys.argv[1:] or THEMES:
        print(name)
        save(THEMES[name](), name)
