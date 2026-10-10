/**
 * Build-time accessors for src/data/ripple.json (scripts/influence/build-ripple.mjs).
 * The browser computes nothing but hover state: positions, sizes and labels come from the builder.
 */
import rippleData from "@/data/ripple.json";
import type { ReachLens } from "@/lib/influence";

export type RippleWeight = "absolute" | "perYear";

/** What the map is showing details for: a theme (sector) or a keyword (bubble). */
export type RippleFocus = { kind: "theme" | "keyword"; id: string } | null;

export const sameFocus = (a: RippleFocus, b: RippleFocus) => a?.kind === b?.kind && a?.id === b?.id;

export interface RippleLabel {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  inside: boolean;
  /** Leader line from the bubble edge to the label: [x1, y1, x2, y2]. */
  leader?: [number, number, number, number];
  /** Present when the label wraps onto two lines. */
  lines?: string[];
}

export interface RippleShape {
  x: number;
  y: number;
  r: number;
  rY: number;
  label: { en: RippleLabel | null; zh: RippleLabel | null };
}

export interface RippleCitingWork {
  doi: string | null;
  openalex: string;
  title: string;
  year: number;
  citedBy: number;
  cites: string[];
}

export interface RippleKeyword {
  id: string;
  en: string;
  zh?: string;
  theme: string;
  also: string[];
  works: number;
  perYear: number;
  lift: number;
  dMean: number;
  echo: boolean;
  bridge: boolean;
  dFallback: boolean;
  tagged: number;
  outside: number;
  totalWorks: number;
  /** Citing works carrying the keyword in each bridge theme. */
  alsoWorks: Record<string, number>;
  rank: number;
  order: number;
  cited: { doi: string; n: number }[];
  trend: { recent: number; prior: number };
  top: RippleCitingWork[];
  circle: RippleShape;
  strip: RippleShape;
}

export interface RippleTheme {
  id: string;
  en: string;
  zh: string;
  color: string;
  works: number;
  perYear: number;
  outside: number;
  emerging: boolean;
  angle: [number, number];
  keywords: number;
  medianD: number | null;
}

export interface RipplePaper {
  doi: string;
  short: string;
  year: number;
  theme: string;
  lens: "lead" | "coauthor";
  works: number;
}

export interface RippleCallout {
  kind: "farthest" | "rising" | "bridge";
  keyword: string;
  detail: {
    dMean?: number;
    outside?: number;
    works?: number;
    recentShare?: number;
    priorShare?: number;
    recent?: number;
    prior?: number;
    windows?: { recent: [number, number]; prior: [number, number] };
    totalWorks?: number;
    byTheme?: Record<string, number>;
  };
}

export interface RippleCircleLayout {
  size: number;
  c: number;
  disc: number;
  arcIn: number;
  arcMax: number;
  rho0: number;
  rho1: number;
  rim: number;
  corridor: number;
  rMax: number;
  rMin: number;
  labelSize: number;
  ringLabelSize: number;
  maxD: number;
  rings: { d: number; r: number }[];
}

export interface RippleStripLayout {
  width: number;
  x0: number;
  x1: number;
  rMax: number;
  rMin: number;
  labelSize: number;
  pad: number;
  maxD: number;
  rows: { theme: string; height: number }[];
  guides: { d: number; x: number }[];
}

export interface RippleView {
  meta: {
    asOf: string;
    lens: ReachLens;
    params: Record<string, number>;
    outsideHome: number;
    citingWorks: number;
    headline: { en: string; zh: string; sentence: { en: string; zh: string } };
    homeTopics: number;
    untagged: number;
    distanceCounts: number[];
    perYearTotal: number;
    windows: { recent: [number, number]; prior: [number, number] };
    scale: { maxWorks: number; maxPerYear: number; rMax: number; rMin: number; stripRMax: number; stripRMin: number };
    layout: { overlaps: number; maxRadialShift: number };
  };
  themes: RippleTheme[];
  papers: RipplePaper[];
  keywords: RippleKeyword[];
  callouts: RippleCallout[];
  layout: { circle: RippleCircleLayout; strip: RippleStripLayout };
}

const data = rippleData as unknown as Record<ReachLens, RippleView>;

export function getRipple(lens: ReachLens): RippleView {
  return data[lens];
}

/** Plain-language ring names for a reach distance (0 = home topic … 4 = another domain). */
export const RING_NAMES: { en: string; zh: string; short: { en: string; zh: string } }[] = [
  { en: "home topics", zh: "本人主题", short: { en: "home", zh: "本人" } },
  { en: "same subfield", zh: "同一子领域", short: { en: "subfield", zh: "子领域" } },
  { en: "same field", zh: "同一领域", short: { en: "field", zh: "领域" } },
  { en: "same domain", zh: "同一大类", short: { en: "domain", zh: "大类" } },
  { en: "other domain", zh: "其他大类", short: { en: "other", zh: "其他" } },
];

/** Nearest ring for a mean distance, for prose ("mostly same subfield"). */
export function ringFor(d: number) {
  return RING_NAMES[Math.min(RING_NAMES.length - 1, Math.max(0, Math.round(d)))];
}

/** WCAG relative luminance → ink or white text on a filled mark. */
export function textOn(hex: string): string {
  const c = hex.replace("#", "");
  const ch = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  // Contrast with white vs with ink (#141211, L ≈ 0.0065): pick the higher.
  return (1.05 / (L + 0.05) >= (L + 0.05) / 0.0565 ? "#ffffff" : "#141211");
}

/** Polar helpers: 0° = 12 o'clock, clockwise (the builder's convention). */
export function polar(c: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [c + r * Math.sin(a), c - r * Math.cos(a)];
}

export function annularSector(c: number, r0: number, r1: number, a0: number, a1: number): string {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x0, y0] = polar(c, r1, a0);
  const [x1, y1] = polar(c, r1, a1);
  const [x2, y2] = polar(c, r0, a1);
  const [x3, y3] = polar(c, r0, a0);
  const f = (n: number) => n.toFixed(2);
  return `M${f(x0)},${f(y0)}A${r1},${r1} 0 ${large} 1 ${f(x1)},${f(y1)}L${f(x2)},${f(y2)}A${r0},${r0} 0 ${large} 0 ${f(x3)},${f(y3)}Z`;
}

/** Arc path for text: clockwise on the top half, counter-clockwise on the bottom half so text stays upright. */
export function textArc(c: number, r: number, a0: number, a1: number): { d: string; flipped: boolean } {
  const mid = (a0 + a1) / 2;
  const flipped = mid > 90 && mid < 270;
  const [sx, sy] = polar(c, r, flipped ? a1 : a0);
  const [ex, ey] = polar(c, r, flipped ? a0 : a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  const f = (n: number) => n.toFixed(2);
  return { d: `M${f(sx)},${f(sy)}A${r},${r} 0 ${large} ${flipped ? 0 : 1} ${f(ex)},${f(ey)}`, flipped };
}
