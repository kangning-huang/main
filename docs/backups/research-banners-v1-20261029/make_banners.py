"""Research-page theme banners, in the look of the Nature Cities nested-hex banner
("Scaling and form", make_research_highlight_banner_nested.py in the Blog_Posts
drafts folder): Manhattan aerial duotoned to deep navy, a calm purple -> teal ->
soft-gold ramp, thin glowing cyan edges, one amber accent. No text.

  public/research/urban-futures.jpg  raster grid of future-expansion probability
  public/research/heat.jpg           isotherm contours of a surface-heat field
  public/research/flood-coasts.jpg   nested flood-extent polygons from a shoreline

Illustrations, not results: the fields are synthetic. The base photo and the
helpers (dark_base, glow, falloff, ramp) are the hex banner's, so the four read
as one set. The /research page fades the lower third of each banner into the
section title, so the overlays keep their weight in the upper two thirds.

Pure numpy + scipy + Pillow + contourpy. Rendered at 2x and saved at 1x and @2x.
Deterministic.

    python3 scripts/research-banners/make_banners.py
"""

import math
from pathlib import Path

import contourpy
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from scipy import ndimage

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / "public" / "research"
PHOTO = HERE / "photos" / "manhattan-aerial.jpg"

W, H = 1090, 406
S = 2
SW, SH = W * S, H * S

NAVY = (11, 16, 42)
CYAN = (110, 222, 236)
ICE = (196, 238, 248)
AMBER = (255, 196, 64)
RAMP = [(52, 24, 92), (64, 52, 140), (44, 104, 170), (34, 160, 168),
        (98, 198, 150), (236, 204, 112)]


def lerp(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(len(a)))


def ramp(t):
    t = min(max(t, 0.0), 1.0) * (len(RAMP) - 1)
    i = min(int(t), len(RAMP) - 2)
    return tuple(int(c) for c in lerp(RAMP[i], RAMP[i + 1], t - i))


# ------------------------------------------------------------------ base (as the hex banner)
def dark_base(top=0.47):
    """Manhattan aerial, duotoned into an Ocellus-like deep navy night map."""
    im = ImageOps.exif_transpose(Image.open(PHOTO)).convert("RGB")
    cw = im.width
    ch = round(cw * H / W)
    y0 = round(im.height * top)
    im = im.crop((0, y0, cw, y0 + ch)).resize((SW, SH), Image.LANCZOS)
    im = ImageOps.autocontrast(im, cutoff=1.5)
    lum = np.asarray(im).astype(float) @ np.array([0.299, 0.587, 0.114]) / 255
    lum = lum ** 1.35
    shadow = np.array(NAVY, float) / 255
    light = np.array((110, 140, 192), float) / 255
    a = shadow + (light - shadow) * lum[..., None] * 0.62
    yy, xx = np.mgrid[0:SH, 0:SW] / np.array([SH, SW])[:, None, None]
    v = 1 - 0.30 * (np.abs(xx - 0.45) / 0.55) ** 2.2 - 0.30 * np.clip((yy - 0.62) / 0.38, 0, 1) ** 2
    a = shadow + (a - shadow) * v[..., None]
    img = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    return img.filter(ImageFilter.GaussianBlur(0.8 * S)).convert("RGBA")


def layer():
    im = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def glow(base, lay, radius, strength=1.0):
    """Add a layer plus its blurred bloom (screen-ish additive)."""
    bloom = lay.filter(ImageFilter.GaussianBlur(radius))
    if strength != 1.0:
        r, g, b, al = bloom.split()
        bloom = Image.merge("RGBA", (r, g, b, al.point(lambda p: min(255, int(p * strength)))))
    base.alpha_composite(bloom)
    base.alpha_composite(lay)


def falloff(x, y, cx=470, cy=170, rx=470, ry=210, soft=0.42):
    """Soft elliptical mask in supersampled px: 1 in the core, fades to 0 at the rim."""
    r = math.hypot((x - cx * S) / (rx * S), (y - cy * S) / (ry * S))
    return max(0.0, min(1.0, (1.08 - r) / soft))


def falloff_grid(**kw):
    yy, xx = np.mgrid[0:SH, 0:SW].astype(float)
    cx, cy = kw.get("cx", 470) * S, kw.get("cy", 170) * S
    rx, ry = kw.get("rx", 470) * S, kw.get("ry", 210) * S
    r = np.hypot((xx - cx) / rx, (yy - cy) / ry)
    return np.clip((1.08 - r) / kw.get("soft", 0.42), 0, 1)


def street_grid(base, alpha=30, centre=(440, 196)):
    """Faint glowing Manhattan street grid (rotated ~29 degrees), as in the hex banner."""
    grid, dg = layer()
    ang = math.radians(-29)
    ca, sa = math.cos(ang), math.sin(ang)
    L = 1400 * S
    for k in range(-40, 41):
        off = k * 34 * S
        for (ux, uy, vx, vy, step) in ((ca, sa, -sa, ca, 1), (-sa, ca, ca, sa, 3)):
            if k % step:
                continue
            cx, cy = centre[0] * S + vx * off, centre[1] * S + vy * off
            pts = [(cx + ux * t, cy + uy * t) for t in np.linspace(-L, L, 120)]
            for (x0, y0), (x1, y1) in zip(pts[:-1], pts[1:]):
                m = falloff((x0 + x1) / 2, (y0 + y1) / 2)
                if m > 0:
                    dg.line([(x0, y0), (x1, y1)], fill=CYAN + (int(alpha * m),), width=S)
    glow(base, grid, 3 * S, 1.3)


def smooth_noise(shape, sigma, seed):
    rng = np.random.default_rng(seed)
    n = ndimage.gaussian_filter(rng.normal(size=shape), sigma)
    return n / (np.abs(n).max() + 1e-9)


def gauss(xx, yy, cores):
    """Sum of gaussian bumps; cores = (cx, cy, amplitude, sigma) in banner px."""
    return sum(a * np.exp(-((xx / S - cx) ** 2 + (yy / S - cy) ** 2) / (2 * s ** 2)) for cx, cy, a, s in cores)


def lines_of(field, level, min_len=24):
    gen = contourpy.contour_generator(z=field, line_type=contourpy.LineType.Separate)
    return [ln for ln in gen.lines(level) if len(ln) >= min_len]


def stroke(base, polylines, colour, width, alpha, mask, bloom, strength=1.2, dash=None, closed=False):
    lay, d = layer()
    w = max(1, round(width * S))
    for ln in polylines:
        pts = [tuple(p) for p in ln]
        if closed:
            pts = pts + [pts[0]]
        for k, ((x0, y0), (x1, y1)) in enumerate(zip(pts[:-1], pts[1:])):
            if dash and (k // dash) % 2:
                continue
            m = mask[min(SH - 1, max(0, int(y0))), min(SW - 1, max(0, int(x0)))]
            if m > 0.02:
                d.line([(x0, y0), (x1, y1)], fill=colour + (int(alpha * m),), width=w)
    glow(base, lay, bloom, strength)


# ------------------------------------------------------------------ urban futures: raster grid
def urban_futures():
    """Square cells on the street-grid axes; colour = probability of becoming urban by 2050."""
    base = dark_base(top=0.18)
    street_grid(base, alpha=24)

    c = 13 * S                                       # cell size, like the hex banner's R
    ang = math.radians(-29)
    ux, uy = np.array([math.cos(ang), math.sin(ang)]), np.array([-math.sin(ang), math.cos(ang)])
    origin = np.array([300.0, 165.0]) * S            # today's core
    n = 70
    ii, jj = np.meshgrid(np.arange(-n, n), np.arange(-n // 2, n // 2))
    cx = origin[0] + (ii + 0.5) * c * ux[0] + (jj + 0.5) * c * uy[0]
    cy = origin[1] + (ii + 0.5) * c * ux[1] + (jj + 0.5) * c * uy[1]

    # today's urban core, and probability decaying outward with corridors and noise
    core = gauss(cx, cy, [(300, 165, 1.0, 62), (395, 205, 0.55, 40), (225, 120, 0.4, 36)])
    urban = core > 0.55
    dist = ndimage.distance_transform_edt(~urban)
    corridor = gauss(cx, cy, [(560, 150, 0.9, 95), (720, 120, 0.6, 70), (470, 250, 0.35, 60)])
    noise = smooth_noise(cx.shape, 2.2, seed=2050)
    p = np.exp(-dist / 7.5) * (0.55 + 0.45 * corridor) + 0.55 * corridor * np.exp(-dist / 22)
    p = np.clip(p + 0.16 * noise, 0, 1)
    p[urban] = 0
    mask = np.vectorize(lambda x, y: falloff(x, y, cx=500, cy=165, rx=520, ry=230, soft=0.5))(cx, cy)

    def cell_poly(x, y, inset):
        h = c / 2 - inset
        return [(x + sx * h * ux[0] + sy * h * uy[0], y + sx * h * ux[1] + sy * h * uy[1])
                for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]

    fill, df = layer()
    edge, de = layer()
    for (j, i), x in np.ndenumerate(cx):
        y, m = cy[j, i], mask[j, i]
        if m <= 0.02:
            continue
        poly = cell_poly(x, y, 1.2 * S)
        if urban[j, i]:                              # today: hollow icy cells
            df.polygon(poly, fill=NAVY + (int(70 * m),))
            de.line(poly + [poly[0]], fill=ICE + (int(95 * m),), width=S)
        elif p[j, i] > 0.07:
            v = p[j, i]
            df.polygon(poly, fill=ramp(0.12 + 0.88 * v) + (int(min(255, (22 + 170 * v ** 1.3) * m)),))
            de.line(poly + [poly[0]], fill=CYAN + (int((40 + 95 * v) * m),), width=S)
    base.alpha_composite(fill.filter(ImageFilter.GaussianBlur(0.6 * S)))
    glow(base, edge, 2.5 * S, 1.2)

    # coarse 4x4 grid on the same axes, like the coarse hex lattice
    coarse, dc = layer()
    for k in range(-n, n + 1, 4):
        for a_dir, b_dir, rng_ in ((ux, uy, n // 2), (uy, ux, n)):
            p0 = origin + k * c * b_dir - rng_ * c * a_dir
            p1 = origin + k * c * b_dir + rng_ * c * a_dir
            seg = np.linspace(p0, p1, 160)
            for q0, q1 in zip(seg[:-1], seg[1:]):
                m = falloff(*(q0 + q1) / 2, cx=500, cy=165, rx=560, ry=250, soft=0.55)
                if m > 0.02:
                    dc.line([tuple(q0), tuple(q1)], fill=ICE + (int(44 * m),), width=S)
    glow(base, coarse, 4 * S, 1.1)

    # amber: the stepped outline of the most likely 2050 frontier (p > 0.72)
    hot = (p > 0.72) & (mask > 0.05)
    amb, da = layer()
    h = c / 2
    for (j, i), on in np.ndenumerate(hot):
        if not on:
            continue
        x, y = cx[j, i], cy[j, i]
        for (di, dj), (s0, s1) in (((1, 0), ((1, -1), (1, 1))), ((-1, 0), ((-1, -1), (-1, 1))),
                                   ((0, 1), ((-1, 1), (1, 1))), ((0, -1), ((-1, -1), (1, -1)))):
            jj2, ii2 = j + dj, i + di
            if 0 <= jj2 < hot.shape[0] and 0 <= ii2 < hot.shape[1] and hot[jj2, ii2]:
                continue
            a0 = (x + s0[0] * h * ux[0] + s0[1] * h * uy[0], y + s0[0] * h * ux[1] + s0[1] * h * uy[1])
            a1 = (x + s1[0] * h * ux[0] + s1[1] * h * uy[0], y + s1[0] * h * ux[1] + s1[1] * h * uy[1])
            da.line([a0, a1], fill=AMBER + (int(235 * mask[j, i]),), width=round(1.6 * S))
    glow(base, amb, 5 * S, 1.5)
    return base


# ------------------------------------------------------------------ heat: isotherm contours
def heat():
    """A surface-heat field: soft filled bands, thin glowing isotherms, an amber hot core."""
    base = dark_base(top=0.40)
    street_grid(base, alpha=22)
    yy, xx = np.mgrid[0:SH, 0:SW].astype(float)
    T = gauss(xx, yy, [(470, 160, 1.0, 120), (300, 205, 0.55, 70), (680, 120, 0.5, 80),
                       (840, 210, 0.3, 70), (150, 120, 0.25, 70)])
    T = T + 0.10 * smooth_noise((SH // 4, SW // 4), 6, seed=37).repeat(4, 0).repeat(4, 1)
    T = (T - T.min()) / (T.max() - T.min())
    mask = falloff_grid(cx=480, cy=165, rx=540, ry=240, soft=0.5)

    levels = [0.22, 0.34, 0.46, 0.58, 0.70, 0.82]
    # filled bands: each level adds a thin translucent wash, so heat accumulates inward
    for k, lv in enumerate(levels):
        band = ((T > lv) * mask * (16 + 7 * k)).astype(np.float32)
        col = np.broadcast_to(np.array(ramp((k + 1) / len(levels)), float), T.shape + (3,))
        lay = Image.fromarray(np.dstack([col, band]).clip(0, 255).astype(np.uint8), "RGBA")
        base.alpha_composite(lay.filter(ImageFilter.GaussianBlur(1.2 * S)))
    for k, lv in enumerate(levels[:-1]):
        stroke(base, lines_of(T, lv), ICE if k == len(levels) - 2 else CYAN,
               1.0 + 0.12 * k, 70 + 22 * k, mask, 2.5 * S, 1.2, dash=4 if k == 0 else None)
    stroke(base, lines_of(T, levels[-1]), AMBER, 1.8, 240, mask, 5 * S, 1.6)

    pool = (np.clip((T - 0.82) / 0.18, 0, 1) * mask * 110).astype(np.float32)
    amb = np.broadcast_to(np.array(AMBER, float), T.shape + (3,))
    base.alpha_composite(Image.fromarray(np.dstack([amb, pool]).astype(np.uint8), "RGBA")
                         .filter(ImageFilter.GaussianBlur(14 * S)))
    return base


# ------------------------------------------------------------------ flood: polygons
def rdp(pts, eps):
    """Ramer-Douglas-Peucker: keep the polygon's corners, drop near-collinear vertices."""
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    ab = b - a
    nrm = np.hypot(*ab) or 1.0
    d = np.abs(np.cross(ab, pts - a)) / nrm
    k = int(np.argmax(d))
    if d[k] > eps:
        return np.vstack([rdp(pts[: k + 1], eps)[:-1], rdp(pts[k:], eps)])
    return np.vstack([a, b])


def flood_coasts():
    """Shoreline at the lower right; 10-, 100- and 500-year flood extents as nested polygons."""
    base = dark_base(top=0.62)
    street_grid(base, alpha=22)
    yy, xx = np.mgrid[0:SH, 0:SW].astype(float)

    # water: a river along the right edge, running with Manhattan's street grid
    # (shore through x = 720 px at the top, sloping down-right), gently meandering
    shore_x = (720 + 0.554 * yy / S + 14 * np.sin(yy / S / 70 + 0.8)) * S
    water = xx > shore_x
    dist = ndimage.distance_transform_edt(~water)
    # low-lying basins let the water reach further inland, so extents grow in lobes
    basins = gauss(xx, yy, [(585, 105, 1.0, 55), (520, 205, 0.9, 60), (650, 255, 0.7, 45), (430, 120, 0.5, 45)])
    dist = dist / (1 + 2.2 * basins)
    dist = dist + 20 * S * smooth_noise((SH // 4, SW // 4), 6, seed=11).repeat(4, 0).repeat(4, 1)
    mask = falloff_grid(cx=620, cy=170, rx=560, ry=250, soft=0.5)

    # open water: the city under the river is dimmed, then a translucent navy-teal
    a = np.asarray(base).astype(float)
    wsoft = ndimage.gaussian_filter(water.astype(float), 2 * S)[..., None]
    a[..., :3] = a[..., :3] * (1 - 0.55 * wsoft) + np.array(NAVY, float) * 0.55 * wsoft
    base = Image.fromarray(a.clip(0, 255).astype(np.uint8), "RGBA")
    wl = (water * np.clip(mask * 1.4, 0, 1) * 70).astype(np.float32)
    col = np.broadcast_to(np.array((22, 62, 108), float), wl.shape + (3,))
    base.alpha_composite(Image.fromarray(np.dstack([col, wl]).astype(np.uint8), "RGBA")
                         .filter(ImageFilter.GaussianBlur(2 * S)))
    hair, dh = layer()
    for k in range(1, 40):
        off = k * 9
        pts = [((720 + off + 0.554 * y + 14 * math.sin(y / 70 + 0.8)) * S, y * S) for y in np.linspace(0, H, 90)]
        for (x0, y0_), (x1, y1) in zip(pts[:-1], pts[1:]):
            if 0 <= x0 < SW:
                m = min(1.0, mask[int(y0_), int(x0)] * 1.4)
                dh.line([(x0, y0_), (x1, y1)], fill=CYAN + (int(30 * m),), width=S)
    glow(base, hair, 2 * S, 1.0)
    ys = np.arange(0, SH, 4, dtype=float)
    shore_pts = np.column_stack([(720 + 0.554 * ys / S + 14 * np.sin(ys / S / 70 + 0.8)) * S, ys])
    stroke(base, [shore_pts], ICE, 1.3, 160, np.clip(mask * 1.4, 0, 1), 3 * S)

    extents = [(34 * S, (34, 160, 168), 80, CYAN, 1.3, 160),    # 10-year
               (70 * S, (44, 104, 170), 62, AMBER, 1.8, 240),   # 100-year: the regulatory line
               (112 * S, (64, 52, 140), 46, ICE, 1.1, 120)]     # 500-year
    land = ~water
    # each extent is one hole-free polygon, traced from its smoothed area
    areas = {}
    for reach, *_ in extents:
        r = ndimage.binary_fill_holes((dist < reach) | water)
        areas[reach] = ndimage.gaussian_filter(r.astype(float), 3 * S)
    for reach, fill_rgb, fill_a, edge_rgb, w, a in reversed(extents):
        region = land & (areas[reach] > 0.5)
        fa = (region * mask * fill_a).astype(np.float32)
        col = np.broadcast_to(np.array(fill_rgb, float), fa.shape + (3,))
        base.alpha_composite(Image.fromarray(np.dstack([col, fa]).astype(np.uint8), "RGBA")
                             .filter(ImageFilter.GaussianBlur(0.8 * S)))
    for reach, fill_rgb, fill_a, edge_rgb, w, a in extents:
        polys = [rdp(np.asarray(ln), 2.5 * S) for ln in lines_of(np.where(land, areas[reach], 1.0), 0.5, min_len=40)]
        stroke(base, polys, edge_rgb, w, a, mask, (5 if edge_rgb == AMBER else 2.5) * S,
               1.5 if edge_rgb == AMBER else 1.2, dash=3 if edge_rgb == ICE else None)
        if edge_rgb == AMBER:                                # polygon vertices, GIS-style
            dots, dd = layer()
            for pl in polys:
                for x, y in pl[1:-1:2]:
                    m = mask[min(SH - 1, int(y)), min(SW - 1, int(x))]
                    if m > 0.1:
                        r = 1.8 * S
                        dd.ellipse([x - r, y - r, x + r, y + r], fill=AMBER + (int(230 * m),))
            glow(base, dots, 3 * S, 1.3)
    return base


def save(img, stem):
    img = img.convert("RGB")
    OUT.mkdir(parents=True, exist_ok=True)
    paths = [OUT / f"{stem}@2x.jpg", OUT / f"{stem}.jpg"]
    img.save(paths[0], quality=86, subsampling=0, optimize=True, progressive=True)
    img.resize((W, H), Image.LANCZOS).save(paths[1], quality=90, subsampling=0, optimize=True, progressive=True)
    return paths


if __name__ == "__main__":
    import sys
    themes = {"urban-futures": urban_futures, "heat": heat, "flood-coasts": flood_coasts}
    for stem in sys.argv[1:] or themes:
        for p in save(themes[stem](), stem):
            print(p.relative_to(HERE.parents[1]), Image.open(p).size, f"{p.stat().st_size / 1024:.0f} KB")
