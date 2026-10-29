# Research-page theme banners

`make_banners.py` renders three of the four section banners on `/research` into `public/research/`, each at 1090 × 406 and @2x. They share one look with the Nature Cities nested-hex banner (`scaling-form.jpg`, made by `make_research_highlight_banner_nested.py` in the Blog_Posts drafts folder):
- the same Manhattan aerial, duotoned to deep navy;
- a calm purple → teal → soft-gold ramp;
- thin glowing cyan edges and one amber accent;
- no text.

| Banner | Element | Amber accent |
|---|---|---|
| `urban-futures` | Raster grid on the street-grid axes. Hollow icy cells are today's urban core; the colour of the other cells is their probability of becoming urban. A coarse 4 × 4 grid nests over it. | stepped outline of the most likely frontier (p > 0.72) |
| `heat` | Translucent heat bands with thin glowing isotherms. | hottest isotherm and its glow |
| `flood-coasts` | A river along the street-grid axis; 10-, 100- and 500-year flood extents as nested polygons pushing inland into low basins. | 100-year line with its vertices |

These are **illustrations, not results**: the probability, heat and flood fields are synthetic. The `/research` page fades the lower third of each banner into the section title (a CSS `mask-image`), so the overlays keep their weight in the upper two thirds.

```bash
python3 scripts/research-banners/make_banners.py   # numpy, scipy, Pillow, contourpy; a few seconds
```

`photos/manhattan-aerial.jpg` is the base photo from the hex banner, copied from the Blog_Posts drafts folder (`video/images/3E42DA94-…jpeg`).
