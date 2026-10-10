/**
 * Accessors for the Field & Shelf preview (docs/reach/FIELD-SHELF-PLAN.md):
 * src/data/field-shelf.json (scripts/influence/build-field-shelf.mjs) is bundled with the page; the
 * tooltip payloads in public/data/field-shelf-tooltips-{all,lead}.json are fetched on first hover,
 * search or "Show me one". One square per work citing Ken's papers. Its band compares the work's
 * OpenAlex topic with the FIXED home topics of his lead papers, so a square keeps its colour in both
 * lenses: the All / Lead chip only filters squares and shelf.
 */
import fieldShelfData from "@/data/field-shelf.json";
import type { ReachLens } from "@/lib/influence";

/** 0 core (a home topic) · 1 neighbour (same subfield or field) · 2 further (same domain, another domain, or no topic). */
export type FieldShelfBand = 0 | 1 | 2;

/**
 * Mark colours on the paper surface (#fffcf7), checked with the dataviz validator: ink is the neutral
 * "inside" class; the ember arm is an ordinal ramp (ΔE 16.8, CVD 15.3). Light ember sits at 2.44:1, so
 * the legend, the tooltip's band line and the table carry the band too.
 */
export const BAND_COLORS = ["#141211", "#dd9270", "#c74b16"] as const;
export const HIT_COLOR = "#0d7377";
/** Opacity of squares outside the paper in focus or the search hits. */
export const DIM_ALPHA = 0.15;

export const BAND_NAMES: Record<FieldShelfBand, { en: string; zh: string }> = {
  0: { en: "Core", zh: "核心" },
  1: { en: "Neighbour", zh: "邻近" },
  2: { en: "Further", zh: "较远" },
};

/** What each band means, for legends. */
export const BAND_NOTES: Record<FieldShelfBand, { en: string; zh: string }> = {
  0: { en: "inside the home topics of Ken's lead papers", zh: "在本人第一/通讯作者论文的主题之内" },
  1: { en: "same subfield or field", zh: "同一子领域或领域" },
  2: { en: "same domain, another domain, or no topic", zh: "同一大类、其他大类或无主题" },
};

/** Topic distance d (OpenAlex hierarchy) in words; null = the work has no OpenAlex topic. */
export function distanceText(d: number | null, zh: boolean): string {
  const en = ["a home topic of Ken's lead papers", "same subfield as a home topic", "same field as a home topic", "same domain, different field", "another domain"];
  const cn = ["本人第一/通讯作者论文的主题", "与本人主题同一子领域", "与本人主题同一领域", "同一大类，不同领域", "其他大类"];
  if (d === null) return zh ? "无 OpenAlex 主题" : "no OpenAlex topic";
  return (zh ? cn : en)[d] ?? String(d);
}

export const bandOfDistance = (d: number | null): FieldShelfBand => (d === 0 ? 0 : d === 1 || d === 2 ? 1 : 2);

const TYPE_NAMES: Record<string, { en: string; zh: string }> = {
  article: { en: "Article", zh: "期刊论文" },
  review: { en: "Review", zh: "综述" },
  preprint: { en: "Preprint", zh: "预印本" },
  "book-chapter": { en: "Book chapter", zh: "书籍章节" },
  book: { en: "Book", zh: "书籍" },
  "conference-paper": { en: "Conference paper", zh: "会议论文" },
  "conference-abstract": { en: "Conference abstract", zh: "会议摘要" },
  "peer-review": { en: "Peer review", zh: "同行评审意见" },
  dissertation: { en: "Dissertation", zh: "学位论文" },
  "data-paper": { en: "Data paper", zh: "数据论文" },
  editorial: { en: "Editorial", zh: "社论" },
  report: { en: "Report", zh: "报告" },
  "reference-entry": { en: "Reference entry", zh: "参考条目" },
  paratext: { en: "Paratext", zh: "附文" },
  other: { en: "Other", zh: "其他" },
};
export const typeName = (type: string | null, zh: boolean) => (type ? ((zh ? TYPE_NAMES[type]?.zh : TYPE_NAMES[type]?.en) ?? type) : "");

export const openAlexUrl = (id: string) => `https://openalex.org/${id}`;
export const doiUrl = (doi: string) => `https://doi.org/${doi}`;

// ── Layout (bundled) ───────────────────────────────────────────────────────

export interface FieldShelfPaper {
  doi: string;
  short: string;
  /** Compact label, e.g. "ERL 2019". */
  label: string;
  /** The rest of the short label, e.g. "urban expansion to 2050". */
  desc: string;
  year: number;
  theme: string;
  lens: "lead" | "coauthor";
  title: string;
  venue: string | null;
  openalex: string;
  /** Non-self citing works. */
  citing: number;
  /** Of those, outside the lead home topics (d ≠ 0). */
  outside: number;
  /** Core / neighbour / further counts. */
  bands: [number, number, number];
}

export interface FieldShelfTheme {
  id: string;
  en: string;
  zh: string;
  color: string;
}

export interface FieldShelfSquare {
  /** OpenAlex short id, e.g. "W4220718869". */
  id: string;
  /** Top-left corner in the view's field box, px. */
  x: number;
  y: number;
  band: FieldShelfBand;
  year: number | null;
  /** Indexes into fieldShelf.papers: the pinned papers of this view it cites (1–4). */
  papers: number[];
}

export interface FieldShelfView {
  lens: ReachLens;
  field: { width: number; height: number; cx: number; cy: number; rx: number; ry: number; pitch: number; cell: number };
  shelf: {
    /** Reference stage width the x positions are in. */
    width: number;
    lines: 1 | 2;
    spineW: number;
    spineH: number;
    themeLines: number;
    /** Spine centres, in shelf order. */
    items: { p: number; x: number }[];
    groups: { theme: string; x0: number; x1: number; en: string[]; zh: string[] }[];
  };
  totals: {
    citingWorks: number;
    outsideHome: number;
    papers: number;
    leadPapers: number;
    coauthorPapers: number;
    citingLinksNonSelf: number;
    selfCitationsRemoved: number;
    coauthorOnly: number;
    maxPapersPerSquare: number;
  };
  bands: { core: number; neighbour: number; further: number };
  /** Citing works at distance 0–4, then without a topic. */
  distance: number[];
  multiCite: Record<string, number>;
  headline: { en: string; zh: string };
  squares: FieldShelfSquare[];
  /** Square index by OpenAlex id. */
  index: Map<string, number>;
}

type RawSquare = [number, number, number, number, number | null, number[]];
type RawView = Omit<FieldShelfView, "lens" | "squares" | "index"> & { squares: RawSquare[] };
interface RawData {
  meta: {
    asOf: string;
    homeTopicsLeadCount: number;
    homeTopicsLead: { id: string; name: string; subfield: string | null; field: string | null; domain: string | null }[];
    maxDistance: number;
    coauthorOnlyShare: number;
    influenceOutsideHome: { all: number; lead: number; homeTopics: number | null } | null;
    showMeOneTypes: string[];
    tooltips: { all: string; lead: string };
  };
  themes: FieldShelfTheme[];
  papers: FieldShelfPaper[];
  views: Record<ReachLens, RawView>;
}

const raw = fieldShelfData as unknown as RawData;

export const fieldShelfMeta = raw.meta;
export const fieldShelfPapers: FieldShelfPaper[] = raw.papers;
export const fieldShelfThemes: FieldShelfTheme[] = raw.themes;

function decode(lens: ReachLens): FieldShelfView {
  const v = raw.views[lens];
  const squares = v.squares.map(([n, x, y, band, year, papers]) => ({ id: `W${n}`, x, y, band: band as FieldShelfBand, year, papers }));
  return { ...v, lens, squares, index: new Map(squares.map((s, i) => [s.id, i])) };
}

const views: Partial<Record<ReachLens, FieldShelfView>> = {};
export function getFieldShelf(lens: ReachLens): FieldShelfView {
  return (views[lens] ??= decode(lens));
}

/** Both views share one field area (the larger field plus a margin), so switching lens never moves the page. */
export const FIELD_AREA = (() => {
  const a = raw.views.all.field;
  const l = raw.views.lead.field;
  return { width: Math.max(a.width, l.width) + 16, height: Math.max(a.height, l.height) + 8 };
})();

// ── Tooltip payloads (lazy) ────────────────────────────────────────────────

export interface FieldShelfTip {
  title: string;
  author: string | null;
  authors: number;
  venue: string | null;
  year: number | null;
  doi: string | null;
  d: number | null;
  topic: { name: string; subfield: string | null; field: string | null; domain: string | null } | null;
  type: string | null;
  citedBy: number;
  /** Lower-case, accent-free title + authors + venue + year, for search. */
  haystack: string;
}
export type FieldShelfTips = Map<string, FieldShelfTip>;

interface RawTips {
  venues: string[];
  topics: [string, string | null, string | null, string | null][];
  works: Record<string, { t: string; a: string | null; n: number; s?: string; v: number; y: number | null; doi?: string; d: number | null; tp: number; ty: string | null; c: number }>;
}

/** Lower case, accents and punctuation folded, for matching typed queries (Latin, Greek, Cyrillic, CJK, Hangul kept). */
export const fold = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ß-ɏͰ-ϿЀ-ӿ぀-ヿ㐀-鿿가-힯]+/g, " ")
    .trim();

function decodeTips(json: RawTips): FieldShelfTips {
  const out: FieldShelfTips = new Map();
  for (const [id, w] of Object.entries(json.works)) {
    const venue = w.v >= 0 ? (json.venues[w.v] ?? null) : null;
    const t = w.tp >= 0 ? json.topics[w.tp] : null;
    out.set(id, {
      title: w.t,
      author: w.a,
      authors: w.n,
      venue,
      year: w.y,
      doi: w.doi ?? null,
      d: w.d,
      topic: t ? { name: t[0], subfield: t[1], field: t[2], domain: t[3] } : null,
      type: w.ty,
      citedBy: w.c,
      haystack: ` ${fold([w.t, w.a ?? "", w.s ?? "", venue ?? "", w.y ?? ""].join(" "))} `,
    });
  }
  return out;
}

export type TipsStatus = "idle" | "loading" | "ready" | "error";
export interface TipsState {
  status: TipsStatus;
  tips: FieldShelfTips | null;
}

const IDLE: TipsState = { status: "idle", tips: null };
const tipStore: Record<ReachLens, TipsState> = { all: IDLE, lead: IDLE };
const pending: Partial<Record<ReachLens, Promise<FieldShelfTips>>> = {};
const listeners = new Set<() => void>();

/** The All payload covers every Lead work, so it also serves the Lead view once loaded. */
export function tipsState(lens: ReachLens): TipsState {
  if (lens === "lead" && tipStore.all.status === "ready") return tipStore.all;
  return tipStore[lens];
}
export const idleTips = IDLE;

export function subscribeTips(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function setTips(lens: ReachLens, s: TipsState) {
  tipStore[lens] = s;
  for (const fn of listeners) fn();
}

/** Fetch (once) the tooltip payload for a lens; failures can be retried. */
export function loadFieldShelfTips(lens: ReachLens): Promise<FieldShelfTips> {
  const ready = tipsState(lens);
  if (ready.status === "ready" && ready.tips) return Promise.resolve(ready.tips);
  if (lens === "lead" && pending.all) return pending.all;
  const inFlight = pending[lens];
  if (inFlight) return inFlight;
  setTips(lens, { status: "loading", tips: null });
  const p = fetch(raw.meta.tooltips[lens])
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<RawTips>;
    })
    .then((json) => {
      const tips = decodeTips(json);
      setTips(lens, { status: "ready", tips });
      return tips;
    })
    .catch((err) => {
      setTips(lens, { status: "error", tips: null });
      throw err;
    })
    .finally(() => {
      delete pending[lens];
    });
  pending[lens] = p;
  return p;
}

// ── Search and "Show me one" ───────────────────────────────────────────────

/** Squares of the view whose title, authors, venue or year contain every typed word; most-cited first. */
export function searchSquares(view: FieldShelfView, tips: FieldShelfTips, query: string): number[] {
  const words = fold(query).split(" ").filter(Boolean);
  if (words.length === 0) return [];
  const out: number[] = [];
  view.squares.forEach((s, i) => {
    const tip = tips.get(s.id);
    if (tip && words.every((w) => tip.haystack.includes(w))) out.push(i);
  });
  return out.sort((a, b) => (tips.get(view.squares[b].id)?.citedBy ?? 0) - (tips.get(view.squares[a].id)?.citedBy ?? 0) || (view.squares[b].year ?? 0) - (view.squares[a].year ?? 0));
}

/**
 * A random square for "Show me one": outside the home topics, an article or review with a venue,
 * among `within` if given (the citers of the paper in focus). Falls back to any outside square, then any.
 */
export function pickOne(view: FieldShelfView, tips: FieldShelfTips, within: ((i: number) => boolean) | null, random = Math.random): number | null {
  const all = view.squares.map((_, i) => i).filter((i) => !within || within(i));
  const types = new Set(fieldShelfMeta.showMeOneTypes);
  const tiers = [
    all.filter((i) => {
      const s = view.squares[i];
      const t = tips.get(s.id);
      return s.band !== 0 && !!t && !!t.venue && !!t.type && types.has(t.type);
    }),
    all.filter((i) => view.squares[i].band !== 0),
    all,
  ];
  const pool = tiers.find((t) => t.length > 0);
  return pool ? pool[Math.floor(random() * pool.length)] : null;
}

/** Most-cited citing works of a paper (needs the tooltip payload). */
export function topCiters(view: FieldShelfView, tips: FieldShelfTips, paper: number, n: number): number[] {
  const out: number[] = [];
  view.squares.forEach((s, i) => {
    if (s.papers.includes(paper)) out.push(i);
  });
  return out
    .sort((a, b) => (tips.get(view.squares[b].id)?.citedBy ?? 0) - (tips.get(view.squares[a].id)?.citedBy ?? 0) || (view.squares[b].year ?? 0) - (view.squares[a].year ?? 0))
    .slice(0, n);
}
