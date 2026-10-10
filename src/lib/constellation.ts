/**
 * Build-time accessors for src/data/constellation.json (scripts/influence/build-constellation.mjs).
 * Shape: docs/reach/constellation-data-contract.ts, plus the layout extras the map needs
 * (region ellipses, label spots, radii, panel facts). Positions are shared by both lenses,
 * so switching lens changes sizes, visibility and lines, never where anything sits.
 */
import constellationData from "@/data/constellation.json";
import type { ReachLens } from "@/lib/influence";

/** What the map is showing details for. */
export type ConstellationFocus = { kind: "paper" | "keyword" | "region"; id: string } | null;

export const sameConstellationFocus = (a: ConstellationFocus, b: ConstellationFocus) => a?.kind === b?.kind && a?.id === b?.id;

/** A resting label placed by the builder, in map units: text anchored at (x, y), optional leader and two-line split. */
export interface ConstellationLabel {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  lines?: string[];
  leader?: [number, number, number, number];
}

export interface ConstellationCitingWork {
  doi: string | null;
  openalex?: string;
  title: string;
  year: number;
  citedBy: number;
}

export interface ConstellationRegion {
  id: string;
  en: string;
  zh: string;
  color: string;
  /** Centre, normalised 0–1. */
  x: number;
  y: number;
  /** Citing works (this lens) carrying at least one of the region's keywords. */
  works: number;
  perYear: number;
  keywords: number;
  /** Ellipse in map units; rot in degrees. */
  shape: { cx: number; cy: number; rx: number; ry: number; rot: number };
  /** Name position in map units (text centred, baseline-centred). */
  name: { x: number; y: number };
}

export interface ConstellationKeyword {
  id: string;
  en: string;
  zh?: string;
  region: string;
  /** Normalised 0–1. */
  x: number;
  y: number;
  works: number;
  perYear: number;
  /** Also a keyword on one of Ken's own papers in this lens. */
  echo: boolean;
  /** DOIs whose citers use it, most citers first. */
  papers: string[];
  cited: { doi: string; n: number }[];
  top: ConstellationCitingWork[];
  /** Disc radius in map units for citing works / cites per year (0 = none in this lens). */
  r: number;
  rY: number;
  label: { en: ConstellationLabel | null; zh: ConstellationLabel | null };
  /** False when the keyword has too few citing works to draw in this lens (r = rY = 0). */
  shown?: boolean;
}

export interface ConstellationPaper {
  doi: string;
  short: string;
  lens: "lead" | "coauthor";
  works: number;
  /** Normalised 0–1: mean position of its citers' keywords. */
  landing: [number, number];
  /** Normalised 0–1: mean position of its own keywords. */
  aim: [number, number];
  /** |landing − aim| in keyword-steps (mean nearest-neighbour keyword distance). */
  drift: number;
  /** The two regions it joins (≥ 25% of its citers' keyword weight in each). */
  bridge: [string, string] | null;
  /** Top keywords, joined by faint lines at rest. */
  lines: string[];
  title: string;
  year: number;
  full: string;
  /** Share of its citers' keyword weight per region. */
  shares: Record<string, number>;
  aimRegion: string | null;
  landRegion: string | null;
  /** Citing works carrying at least one mapped keyword. */
  mappedWorks: number;
  top: ConstellationCitingWork[];
  /** Label spot in map units; `leader` when the label had to move off its star. */
  label: { x: number; y: number; anchor: "start" | "middle" | "end"; leader?: [number, number, number, number] };
}

export interface ConstellationFolded {
  doi: string;
  short: string;
  full: string;
  lens: "lead" | "coauthor";
  works: number;
  region: string | null;
}

export interface ConstellationView {
  meta: {
    asOf: string;
    model: string;
    params: Record<string, number | string>;
    lens: ReachLens;
    citingWorks: number;
    mappedWorks: number;
    layout: { width: number; height: number; labelSize: number; regionSize: number; paperSize: number; starR: number };
    scale: { maxWorks: number; maxPerYear: number; rMax: number; rMin: number };
    /** Papers with too few citing works for a star. */
    folded: ConstellationFolded[];
  };
  regions: ConstellationRegion[];
  keywords: ConstellationKeyword[];
  papers: ConstellationPaper[];
}

export type ConstellationData = { all: ConstellationView; lead: ConstellationView };

const data = constellationData as unknown as ConstellationData;

export function getConstellation(lens: ReachLens): ConstellationView {
  return data[lens];
}

export const num = (v: number | string | undefined, fallback: number) => (typeof v === "number" ? v : fallback);

/** Drift arrows shown at rest: the largest few at or above the threshold (same rule as the builder). */
export function restDrift(view: ConstellationView): Set<string> {
  const min = num(view.meta.params.driftRestMin, 3);
  const max = num(view.meta.params.driftRestMax, 4);
  return new Set(
    [...view.papers]
      .filter((p) => p.drift >= min)
      .sort((a, b) => b.drift - a.drift || (a.doi < b.doi ? -1 : 1))
      .slice(0, max)
      .map((p) => p.doi)
  );
}

/** Five-point star polygon centred on (x, y): outer radius R, inner r (the schematic's proportions). */
export function starPoints(x: number, y: number, R: number, r = R * 0.43): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? R : r;
    pts.push(`${(x + rad * Math.cos(a)).toFixed(2)},${(y + rad * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}
