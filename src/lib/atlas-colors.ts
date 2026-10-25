/** Palettes for Atlas dots + legend (shared; keep out of MapLibre chunk). */

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

/** 5-class sequential teal/earth (low → high), shared by UHS / mass / flood / expansion. */
export const SEQ_TEAL: string[] = [
  "rgb(237, 224, 212)",
  "rgb(196, 181, 162)",
  "rgb(140, 190, 188)",
  "rgb(58, 155, 152)",
  "rgb(8, 70, 78)",
];

/** Alias kept for Cooler Cities UHS call sites. */
export const UHS_COLORS = SEQ_TEAL;

/**
 * Cooling (DID effectK): more negative = stronger cooling.
 * Index 0 = strongest (most negative), index 4 = weakest.
 */
export const SEQ_COOLING: string[] = [
  "rgb(8, 70, 78)", // strongest cooling
  "rgb(13, 115, 119)",
  "rgb(58, 155, 152)",
  "rgb(140, 190, 188)",
  "rgb(196, 181, 162)", // weakest
];

/**
 * Diverging palette for heat trend / night ΔWBGT.
 * Index 0 = most negative (cool/teal), 2 ≈ near zero, 4 = most positive (warm/ember).
 */
export const DIV_HEAT: string[] = [
  "rgb(8, 70, 78)", // cool / declining
  "rgb(58, 155, 152)",
  "rgb(220, 210, 198)", // near zero
  "rgb(199, 75, 22)",
  "rgb(139, 34, 8)", // warm / rising
];

/** Quantile breaks at 20/40/60/80% among finite values (ascending). Empty if <2 values. */
export function quantileBreaks(values: number[], nClasses = 5): number[] {
  const vals = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (vals.length === 0) return [];
  if (vals.length < nClasses) return [vals[0]];
  const breaks: number[] = [];
  for (let i = 1; i < nClasses; i += 1) {
    const q = i / nClasses;
    breaks.push(vals[Math.min(vals.length - 1, Math.floor(q * vals.length))]);
  }
  return breaks;
}

/** Class index 0..colors.length-1 for value given ascending breaks (length = colors-1). */
export function classIndex(value: number, breaks: number[]): number {
  let i = 0;
  while (i < breaks.length && value >= breaks[i]) i += 1;
  return i;
}

export function colorFromBreaks(
  value: number | null | undefined,
  breaks: number[],
  colors: string[],
): string {
  if (value == null || !Number.isFinite(value) || breaks.length === 0) {
    return ATLAS_DOT_GREY;
  }
  const i = Math.min(classIndex(value, breaks), colors.length - 1);
  return colors[i];
}

/** Map a median UHS (m) into a 5-class color using quantile breaks (metres). */
export function colorForUhs(m: number | null | undefined, breaks: number[]): string {
  return colorFromBreaks(m, breaks, UHS_COLORS);
}
