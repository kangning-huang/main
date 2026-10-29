# Research-page theme banners

`make_banners.py` renders three of the four section banners on `/research` into `public/research/`, each at 1090 × 406 and @2x. They share one look with the Nature Cities nested-hex banner (`scaling-form.jpg`, made by `make_research_highlight_banner_nested.py` in the Blog_Posts drafts folder):
- the same Manhattan aerial, duotoned to deep navy;
- thin glowing edges, soft drop shadows or hillshade for relief, one accent line;
- no text.

Each theme has its own sequential colour scheme, dark → light, so "more" always reads brighter.

| Banner | Colour scheme | Element | Accent |
|---|---|---|---|
| `urban-futures` | cividis: navy → grey → yellow | Raster grid on the street-grid axes. Solid ice-white cells are today's urban land; the other cells are shaded by their probability of becoming urban by 2050. The page overlays a small key (`legend` in `src/app/research/page.tsx`). | cyan stepped outline of the most likely expansion (p > 0.72) |
| `heat` | magma: plum → red → orange → yellow-white | Hillshaded heat field with isotherm contours in the same ramp. | hottest isotherm, pale yellow |
| `flood-coasts` | glassy water blues: deep blue → azure → aqua → foam | A river and a depth-shaded flood surface spreading inland in two lobes; the 10-, 100- and 500-year extents are stacked translucent sheets, each lifted slightly and casting a soft shadow. | ice-white 100-year line, foam-white shore |

These are **illustrations, not results**: the probability, heat and flood fields are synthetic. The `/research` page fades the lower third of each banner into the section title (a CSS `mask-image`), so the overlays keep their weight in the upper two thirds.

```bash
python3 scripts/research-banners/make_banners.py [urban-futures|heat|flood-coasts]   # numpy, scipy, Pillow, contourpy; a few seconds
```

`photos/manhattan-aerial.jpg` is the base photo from the hex banner, copied from the Blog_Posts drafts folder (`video/images/3E42DA94-…jpeg`).
