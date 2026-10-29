"""Research-page theme banners, in the look of the Nature Cities nested-hex banner
("Scaling and form", make_research_highlight_banner_nested.py in the Blog_Posts
drafts folder): Manhattan aerial duotoned to deep navy, thin glowing edges, soft drop
shadows / hillshade for relief. Each theme has its own sequential colour scheme,
dark -> light: growth cividis (navy -> grey -> yellow, cyan frontier), heat magma,
flood glassy water blues (ice-white 100-year line). No text.

  public/research/urban-futures.jpg  raster grid: today's urban land + future-expansion probability
  public/research/heat.jpg           magma heat field with isotherm contours
  public/research/flood-coasts.jpg   depth-shaded 10/100/500-year flood extents from a river

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


# one sequential scheme per theme, each dark -> light so "more" always reads brighter
CIVIDIS = [(0, 32, 77), (49, 68, 107), (102, 105, 112), (149, 143, 120), (203, 186, 105), (255, 234, 70)]
MAGMA = [(44, 12, 74), (118, 26, 112), (192, 42, 86), (238, 96, 44), (252, 172, 52), (255, 238, 150)]
BLUES = [(10, 30, 78), (27, 63, 143), (47, 127, 208), (98, 198, 232), (178, 234, 250)]
FOAM = (230, 250, 255)


def lerp(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(len(a)))


def ramp(t, stops=RAMP):
    t = min(max(t, 0.0), 1.0) * (len(stops) - 1)
    i = min(int(t), len(stops) - 2)
    return tuple(int(c) for c in lerp(stops[i], stops[i + 1], t - i))


def ramp_arr(t, stops):
    """Vectorised ramp: t (array in 0..1) -> float RGB array."""
    st = np.array(stops, float)
    t = np.clip(t, 0, 1) * (len(stops) - 1)
    i = np.minimum(t.astype(int), len(stops) - 2)
    f = (t - i)[..., None]
    return st[i] * (1 - f) + st[i + 1] * f


def shadow(base, lay, offset=(3, 4), radius=4, strength=0.55):
    """Soft drop shadow of a layer's alpha, cast down-right, for a sense of relief."""
    al = np.asarray(lay)[..., 3].astype(float) * strength
    dx, dy = offset[0] * S, offset[1] * S
    # shift with edge replication, so a shadow cast off-frame leaves no bare strip at the border
    al = np.pad(al, ((max(dy, 0), max(-dy, 0)), (max(dx, 0), max(-dx, 0))), mode="edge")
    al = al[max(-dy, 0): max(-dy, 0) + SH, max(-dx, 0): max(-dx, 0) + SW]
    sh = np.zeros((SH, SW, 4), np.uint8)
    sh[..., 3] = al.clip(0, 255).astype(np.uint8)
    base.alpha_composite(Image.fromarray(sh, "RGBA").filter(ImageFilter.GaussianBlur(radius * S)))


def hillshade(elev, az=315, alt=40, z=1.0):
    """Lambertian shade of a surface, 1 on flat ground; light from the upper left."""
    gy, gx = np.gradient(elev)
    a, b = math.radians(az), math.radians(alt)
    lx, ly, lz = math.cos(b) * math.sin(a), -math.cos(b) * math.cos(a), math.sin(b)
    nx, ny = -gx * z, -gy * z
    return (nx * lx + ny * ly + lz) / np.sqrt(nx ** 2 + ny ** 2 + 1) / lz


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
    """Square cells on the street-grid axes. Solid ice-white cells are today's urban land;
    the other cells are coloured by cividis (navy -> grey -> yellow) by their probability of
    becoming urban by 2050 (dim = unlikely, bright = likely); cyan outlines the most likely frontier."""
    base = dark_base(top=0.18)
    street_grid(base, alpha=20)

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
    cast, dcast = layer()                            # only solid cells cast a shadow
    for (j, i), x in np.ndenumerate(cx):
        y, m = cy[j, i], mask[j, i]
        if m <= 0.02:
            continue
        poly = cell_poly(x, y, 1.2 * S)
        if urban[j, i]:                              # today: solid, lit, ice-white blocks
            df.polygon(poly, fill=(206, 228, 242, int(200 * m)))
            dcast.polygon(poly, fill=(0, 0, 0, int(200 * m)))
            de.line(poly + [poly[0]], fill=(255, 255, 255) + (int(150 * m),), width=S)
        elif p[j, i] > 0.3:                          # future: navy-grey (possible) -> yellow (likely)
            v = p[j, i]
            t = (v - 0.3) / 0.7
            df.polygon(poly, fill=ramp(0.3 + 0.7 * t, CIVIDIS) + (int(min(255, (40 + 200 * t ** 1.2) * m)),))
            if v > 0.45:
                dcast.polygon(poly, fill=(0, 0, 0, int(230 * v ** 1.5 * m)))
            if v > 0.3:                              # low-probability cells fade out, no dark mesh
                de.line(poly + [poly[0]], fill=ramp(min(1, 0.3 + 0.85 * v), CIVIDIS) + (int((140 * v - 20) * m),), width=S)
    shadow(base, cast, offset=(3, 4), radius=3, strength=0.7)
    base.alpha_composite(fill.filter(ImageFilter.GaussianBlur(0.5 * S)))
    glow(base, edge, 2.5 * S, 1.2)

    # cyan: the stepped outline of the most likely 2050 frontier (p > 0.72)
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
            da.line([a0, a1], fill=CYAN + (int(240 * mask[j, i]),), width=round(1.8 * S))
    glow(base, amb, 5 * S, 1.5)
    return base


# ------------------------------------------------------------------ heat: isotherm contours
def heat():
    """A surface-heat field in a magma ramp: deep plum at the edge, through red and orange,
    to a yellow-white core; thin glowing isotherms and shaded relief."""
    base = dark_base(top=0.40)
    street_grid(base, alpha=18)
    yy, xx = np.mgrid[0:SH, 0:SW].astype(float)
    T = gauss(xx, yy, [(470, 160, 1.0, 120), (300, 205, 0.55, 70), (680, 120, 0.5, 80),
                       (840, 210, 0.3, 70), (150, 120, 0.25, 70)])
    T = T + 0.10 * smooth_noise((SH // 4, SW // 4), 6, seed=37).repeat(4, 0).repeat(4, 1)
    T = (T - T.min()) / (T.max() - T.min())
    mask = falloff_grid(cx=480, cy=165, rx=540, ry=240, soft=0.5)

    # continuous warm wash under the bands, shaded as relief so the heat dome reads in 3D
    shade = np.clip(hillshade(ndimage.gaussian_filter(T, 6 * S) * 260 * S, z=0.9), 0.55, 1.35)
    t = np.clip((T - 0.12) / 0.88, 0, 1)
    col = ramp_arr(t, MAGMA) * shade[..., None]
    al = (np.clip((T - 0.12) / 0.45, 0, 1) ** 1.1 * mask * 215).astype(np.float32)
    base.alpha_composite(Image.fromarray(np.dstack([col.clip(0, 255), al]).astype(np.uint8), "RGBA")
                         .filter(ImageFilter.GaussianBlur(1.0 * S)))

    levels = [0.22, 0.34, 0.46, 0.58, 0.70, 0.82]
    for k, lv in enumerate(levels[:-1]):
        tone = ramp(min(1, (lv - 0.12) / 0.88 + 0.22), MAGMA)
        stroke(base, lines_of(T, lv), tone, 1.0 + 0.14 * k, 90 + 25 * k, mask, 2.5 * S, 1.3,
               dash=4 if k == 0 else None)
    stroke(base, lines_of(T, levels[-1]), (255, 222, 110), 2.0, 245, mask, 6 * S, 1.8)

    pool = (np.clip((T - 0.78) / 0.22, 0, 1) * mask * 200).astype(np.float32)
    hotc = np.broadcast_to(np.array((255, 236, 160), float), T.shape + (3,))
    base.alpha_composite(Image.fromarray(np.dstack([hotc, pool]).astype(np.uint8), "RGBA")
                         .filter(ImageFilter.GaussianBlur(14 * S)))
    return base


# ------------------------------------------------------------------ flood: depth field
def flood_coasts():
    """A river along the street grid and a flood that spreads inland from it, drawn like
    the heat banner: a smooth depth field in blues (deep = saturated, shallow = pale) with
    hillshade relief; 10-, 100- and 500-year extents as stacked translucent sheets with
    glowing edges, ice-white = 100-year."""
    base = dark_base(top=0.62)
    street_grid(base, alpha=18)
    yy, xx = np.mgrid[0:SH, 0:SW].astype(float)

    def shore(y):                                        # y in banner px -> shore x in banner px
        return 650 + 0.554 * y + 14 * np.sin(y / 70 + 0.8)

    water = xx > shore(yy / S) * S
    land = ~water
    mask = falloff_grid(cx=560, cy=170, rx=600, ry=260, soft=0.5)
    # flood depth on land: falls off with distance inland from the bank; the reach swells
    # into two low-lying lobes along the river, so the extents nest without islands
    y = yy / S
    inland = shore(y) - xx / S
    L = 90 + 330 * np.exp(-(y - 105) ** 2 / (2 * 60 ** 2)) + 250 * np.exp(-(y - 285) ** 2 / (2 * 60 ** 2))
    inland = inland + 10 * smooth_noise((SH // 4, SW // 4), 8, seed=11).repeat(4, 0).repeat(4, 1)
    D = ndimage.gaussian_filter(np.where(land, np.clip(1 - inland / L, 0, 1), 1.0), 5 * S)

    # relief: the flood as a basin lit from the upper left
    shade = np.clip(hillshade(ndimage.gaussian_filter(-D, 5 * S) * 160 * S, z=0.9), 0.7, 1.25)
    wd = np.clip(ndimage.distance_transform_edt(water) / (190 * S), 0, 1)
    t = np.where(water, 0.62 - 0.45 * wd, 0.22 + 0.62 * D)   # river deepest blue offshore
    col = ramp_arr(t, BLUES) * np.where(water, 1.0, shade)[..., None]
    al = np.where(water, 175 - 35 * wd, np.clip((D - 0.02) / 0.35, 0, 1) ** 1.1 * 205) * np.clip(mask * 1.3, 0, 1)
    flood = Image.fromarray(np.dstack([col.clip(0, 255), al]).astype(np.uint8), "RGBA").filter(
        ImageFilter.GaussianBlur(0.8 * S))
    shadow(base, flood, offset=(-3, 4), radius=6, strength=0.55)  # sits into the ground
    base.alpha_composite(flood)

    # faint flow lines on the river, then the bank
    hair, dh = layer()
    for k in range(1, 50):
        pts = [((shore(y) + k * 9) * S, y * S) for y in np.linspace(0, H, 90)]
        for (x0, y0_), (x1, y1) in zip(pts[:-1], pts[1:]):
            if 0 <= x0 < SW:
                m = min(1.0, mask[int(y0_), int(x0)] * 1.4)
                dh.line([(x0, y0_), (x1, y1)], fill=ICE + (int(26 * m),), width=S)
    glow(base, hair, 2 * S, 1.0)
    ys = np.arange(0, SH, 4, dtype=float)
    stroke(base, [np.column_stack([shore(ys / S) * S, ys])], FOAM, 1.4, 190, np.clip(mask * 1.4, 0, 1), 3 * S)

    # extents as stacked glass sheets: each water level is a translucent plane, lifted a
    # little above the one below, casting a soft shadow and catching a light rim
    Dl = np.where(land, D, 1.0)
    sheets = ((0.14, 0.30, 30, ICE, 1.1, 150, 3),           # 500-year: widest, lowest, faint
              (0.40, 0.55, 44, ICE, 2.0, 245, None),       # 100-year: the regulatory line
              (0.68, 0.85, 56, FOAM, 1.3, 190, None))      # 10-year: shallowest reach, brightest
    for k, (lv, tone, fa, rgb, w, a, dash) in enumerate(sheets):
        lift = (k + 1) * 2 * S
        region = ndimage.gaussian_filter(((Dl > lv) & land).astype(float), 2 * S)
        al = region * np.clip(mask * 1.3, 0, 1) * fa
        al = np.vstack([al[lift:], np.repeat(al[-1:], lift, 0)])     # lifted, no seam at the top
        sheet = np.zeros((SH, SW, 4), np.uint8)
        sheet[..., :3] = ramp(tone, BLUES)
        sheet[..., 3] = al.clip(0, 255).astype(np.uint8)
        moved = Image.fromarray(sheet, "RGBA")
        shadow(base, moved, offset=(-2, 5), radius=5, strength=0.9)
        base.alpha_composite(moved)
        lines = [ln - np.array([0, lift]) for ln in lines_of(Dl, lv, min_len=40)]
        stroke(base, [ln - np.array([S, S]) for ln in lines], (255, 255, 255), 0.8, 70, mask, 1.5 * S, 1.0)
        stroke(base, lines, rgb, w, a, mask, (5 if k == 1 else 2.5) * S, 1.6 if k == 1 else 1.2, dash=dash)
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
