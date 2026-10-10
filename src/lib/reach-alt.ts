/**
 * Build-time accessors for the two preview views of the Ripple keywords (docs/reach/VIZ-ALT-REPORT.md):
 * A, beeswarm rows (scripts/influence/build-reach-beeswarm.mjs → reach-beeswarm.json), and
 * C, a keyword co-occurrence map (scripts/influence/build-reach-clusters.mjs → reach-clusters.json).
 * Counts, themes and distances stay in ripple.json; these files hold positions and pair counts.
 */
import beeswarmData from "@/data/reach-beeswarm.json";
import clustersData from "@/data/reach-clusters.json";
import type { ReachLens } from "@/lib/influence";

export type ReachViz = "ripple" | "beeswarm" | "clusters";
export const REACH_VIZ: ReachViz[] = ["ripple", "beeswarm", "clusters"];

/** A resting label: text anchored at (x, y), optional leader [x1, y1, x2, y2] and inline callout badge. */
export interface AltLabel {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  lines?: string[];
  leader?: [number, number, number, number];
  badge?: [number, number];
}

export interface AltNode {
  x: number;
  y: number;
  /** Radius for citing works / for cites per year, at this layout's scale. */
  r: number;
  rY: number;
  label: { en: AltLabel | null; zh: AltLabel | null };
  /** Callout badge beside the bubble, when the label could not carry it. */
  badge?: [number, number];
}

export interface BeeswarmLayout {
  width: number;
  x0: number;
  x1: number;
  rMax: number;
  rMin: number;
  labelSize: number;
  badge: number;
  maxD: number;
  guides: { d: number; x: number }[];
  rows: { theme: string; height: number }[];
  nodes: Record<string, AltNode>;
}

export interface ClustersLayout {
  width: number;
  height: number;
  rMax: number;
  rMin: number;
  labelSize: number;
  badge: number;
  noteSize: number;
  turn?: number;
  /** Theme captions over packed groups (fallback layout only). */
  groups: { theme: string; x: number; y: number }[];
  /** Captions in the empty space beside a theme that sits apart; (x, y) is the first line's baseline. */
  notes: { theme: string; x: number; y: number; lines: { en: string[]; zh: string[] } }[];
  /** Keywords on the map have x/y; unlinked ones carry only their radii. */
  nodes: Record<string, Partial<AltNode> & { r: number; rY: number }>;
}

export interface ClustersView {
  meta: {
    asOf: string;
    lens: ReachLens;
    /** "cooccurrence": distance = relatedness. "theme": too few shared works, packed by theme. */
    method: "cooccurrence" | "theme";
    citingWorks: number;
    keywords: number;
    pairs: number;
    linkedPairs: number;
    robustPairs: number;
    robustKeywords: number;
    params: { minSharedWorks: number; robustPairWorks: number; robustShareMin: number; restLinkMin: number; detachedRatio: number };
    unlinked: { id: string; sharedWorks: number }[];
    /** Themes whose keywords sit apart: ratio = gap ÷ typical neighbour spacing; bridged of works carry another theme's keyword. */
    apart: { theme: string; ratio: number; works: number; bridged: number }[];
    drift: { id: string; recount: number; ripple: number }[];
    fit?: { energy: number; spearmanSimilarityVsDistance: number; linkedPairs: number; nearestIsTopPartner: number };
  };
  /** Keyword pairs sharing at least one citing work: n works, s association strength. */
  links: { a: string; b: string; n: number; s: number }[];
  wide: ClustersLayout;
  narrow: ClustersLayout;
}

const beeswarm = beeswarmData as unknown as Record<ReachLens, { wide: BeeswarmLayout; narrow: BeeswarmLayout }>;
const clusters = clustersData as unknown as Record<ReachLens, ClustersView>;

export function getBeeswarm(lens: ReachLens) {
  return beeswarm[lens];
}

export function getClusters(lens: ReachLens): ClustersView {
  return clusters[lens];
}

/** Keywords sharing citing works with `id`, most shared first. */
export function partnersOf(view: ClustersView, id: string): { id: string; n: number }[] {
  return view.links
    .filter((l) => l.a === id || l.b === id)
    .map((l) => ({ id: l.a === id ? l.b : l.a, n: l.n }))
    .sort((a, b) => b.n - a.n || (a.id < b.id ? -1 : 1));
}
