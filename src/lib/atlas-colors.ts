/** Paper-count palette for Atlas dots + legend (shared; keep out of MapLibre chunk). */

const GREY = "rgba(120, 110, 100, 0.45)";

/** Sequential paper-count palette: 1–6 distinct steps (pale teal → deep teal → ember → deep rust). Grey = 0. */
export const PAPER_COUNT_COLORS: Record<number, string> = {
  0: GREY,
  1: "rgb(140, 190, 188)", // #8CBEBC
  2: "rgb(58, 155, 152)", // #3A9B98
  3: "rgb(13, 115, 119)", // #0D7377
  4: "rgb(8, 70, 78)", // #08464E
  5: "rgb(199, 75, 22)", // #C74B16
  6: "rgb(139, 34, 8)", // #8B2208
};

export const ATLAS_DOT_GREY = GREY;

export function colorForCount(n: number): string {
  if (n <= 0) return PAPER_COUNT_COLORS[0];
  if (n >= 6) return PAPER_COUNT_COLORS[6];
  return PAPER_COUNT_COLORS[n];
}

/** Sequential median-UHS fill for the Cooler Cities · 101 filter (quantile classes). */
export const UHS_COLORS: string[] = [
  "rgb(237, 224, 212)", // smallest blocks
  "rgb(196, 181, 162)",
  "rgb(140, 190, 188)",
  "rgb(58, 155, 152)",
  "rgb(8, 70, 78)", // largest blocks
];

/** Map a median UHS (m) into a 5-class color using fixed breaks (metres). */
export function colorForUhs(m: number | null | undefined, breaks: number[]): string {
  if (m == null || !Number.isFinite(m)) return ATLAS_DOT_GREY;
  let i = 0;
  while (i < breaks.length && m >= breaks[i]) i += 1;
  return UHS_COLORS[Math.min(i, UHS_COLORS.length - 1)];
}
