"use client";

import { useCallback, useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import type { ReachLens } from "@/lib/influence";
import {
  IMPACT_COLORS,
  IMPACT_LABELS,
  citedByText,
  doiUrl,
  fieldShelfPapers,
  idleTips,
  impactBin,
  loadFieldShelfTips,
  openAlexUrl,
  subscribeTips,
  tipsState,
  typeName,
  type FieldShelfImpactBin,
  type FieldShelfTip,
  type FieldShelfView,
  type TipsStatus,
} from "@/lib/field-shelf";

/** The lazily fetched tooltip payload for a lens, and a stable `load` that fetches it once. */
export function useFieldShelfTips(lens: ReachLens) {
  const state = useSyncExternalStore(
    subscribeTips,
    () => tipsState(lens),
    () => idleTips
  );
  const load = useCallback(() => {
    loadFieldShelfTips(lens).catch(() => {});
  }, [lens]);
  return { ...state, load };
}

export function authorLine(tip: FieldShelfTip, zh: boolean) {
  if (!tip.author) return "";
  return tip.authors > 1 ? `${tip.author}${zh ? " 等" : " et al."}` : tip.author;
}

export function ImpactSwatch({ bin, size = 9 }: { bin: FieldShelfImpactBin; size?: number }) {
  return <span className="inline-block shrink-0" style={{ width: size, height: size, background: IMPACT_COLORS[bin] }} aria-hidden="true" />;
}

const ExternalMark = () => (
  <svg width="9" height="9" viewBox="0 0 10 10" className="inline-block" aria-hidden="true">
    <path d="M3.5 1.5h5v5M8.5 1.5 2 8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * What one square is: title, first author, venue, year, which of Ken's papers it builds on, and how
 * highly cited the citing work itself is. No citation-intent text (OpenAlex has none). Builds on and
 * citedBy come from the bundled layout, so they show even before (or without) the lazy payload.
 */
export function WorkDetails({
  view,
  index,
  tip,
  status,
  zh,
  onRetry,
  hint,
}: {
  view: FieldShelfView;
  index: number;
  tip: FieldShelfTip | undefined;
  status: TipsStatus;
  zh: boolean;
  onRetry: () => void;
  hint?: ReactNode;
}) {
  const sq = view.squares[index];
  const meta = tip ? [authorLine(tip, zh), tip.venue, tip.year].filter(Boolean).join(" · ") : `${sq.id}${sq.year ? ` · ${sq.year}` : ""}`;
  const type = tip?.type && tip.type !== "article" ? typeName(tip.type, zh) : null;
  return (
    <div className="space-y-2 text-xs leading-snug">
      <div>
        {tip ? (
          <p className="line-clamp-3 text-[13px] font-medium leading-snug text-ink">{tip.title}</p>
        ) : status === "error" ? (
          <p className="text-[13px] text-ink-muted">
            {zh ? "详情未能加载。" : "Details did not load."}{" "}
            <button type="button" onClick={onRetry} className="text-teal underline-offset-2 hover:underline">
              {zh ? "重试" : "Retry"}
            </button>
          </p>
        ) : (
          <p className="text-[13px] text-ink-faint">{zh ? "正在加载详情…" : "Loading details…"}</p>
        )}
        <p className="mt-0.5 text-ink-muted">
          {meta}
          {type && <span className="ml-1.5 rounded bg-paper-deep px-1 py-px text-[10px] text-ink-muted">{type}</span>}
        </p>
      </div>
      <div>
        <p className="text-[10.5px] uppercase tracking-[0.12em] text-ink-faint">{zh ? "引用我的论文" : "Builds on"}</p>
        <ul className="mt-0.5 space-y-px text-ink">
          {sq.papers.map((p) => (
            <li key={p}>
              {fieldShelfPapers[p].short}
              {fieldShelfPapers[p].lens === "lead" && <span className="ml-1 text-[10px] text-ink-faint">{zh ? "第一/通讯" : "lead"}</span>}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-start gap-1.5">
        <ImpactSwatch bin={impactBin(sq.citedBy)} />
        <p className="-mt-px text-ink-muted">
          <span className="font-medium text-ink">{citedByText(sq.citedBy, zh)}</span>
          <span className="text-ink-faint"> · {zh ? IMPACT_LABELS[impactBin(sq.citedBy)].zh : IMPACT_LABELS[impactBin(sq.citedBy)].en}</span>
          {tip?.topic && (
            <span className="block text-ink-faint">
              {tip.topic.name}
              {tip.topic.subfield ? ` · ${tip.topic.subfield}` : ""}
            </span>
          )}
        </p>
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <a href={openAlexUrl(sq.id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-teal hover:text-ember">
          OpenAlex <ExternalMark />
        </a>
        {tip?.doi && (
          <a href={doiUrl(tip.doi)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-ink-muted hover:text-ember">
            DOI <ExternalMark />
          </a>
        )}
        {hint && <span className="text-ink-faint">{hint}</span>}
      </p>
    </div>
  );
}

/** Length of the segment [x1, y1, x2, y2] inside the rectangle (Liang–Barsky clipping). */
function insideLength([x1, y1, x2, y2]: Segment, r: { x0: number; y0: number; x1: number; y1: number }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const clip = (p: number, q: number) => {
    if (p === 0) return q >= 0;
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
    return true;
  };
  if (clip(-dx, x1 - r.x0) && clip(dx, r.x1 - x1) && clip(-dy, y1 - r.y0) && clip(dy, r.y1 - y1)) return (t1 - t0) * Math.hypot(dx, dy);
  return 0;
}

export type Segment = [number, number, number, number];

/**
 * The floating card beside the square in focus. Placed after layout at whichever spot around the
 * square hides least of its lines to the shelf (and never the square itself), inside the stage
 * horizontally. The pointer may move onto it (to reach the links) without it closing.
 */
export default function FieldShelfTooltip({
  x,
  y,
  bounds,
  avoid = [],
  shelfBottom = 0,
  onClose,
  onPointerEnter,
  onPointerLeave,
  zh,
  children,
}: {
  /** Square centre in stage px. */
  x: number;
  y: number;
  bounds: { width: number; height: number };
  /** Lines from the square to the shelf, stage px: kept visible where possible. */
  avoid?: Segment[];
  /** The card prefers not to cover the shelf above this line (stage px). */
  shelfBottom?: number;
  /** Shown for a pinned square (search, "Show me one", link): closes it. */
  onClose?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  zh: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const g = 14;
    const spots: [number, number][] = [
      [x + g, y - 28],
      [x - g - w, y - 28],
      [x + g, y + g],
      [x - g - w, y + g],
      [x - w / 2, y + g + 4],
      [x + g, y - h + 28],
      [x - g - w, y - h + 28],
    ];
    let best = { left: 0, top: 0, score: Infinity };
    spots.forEach(([l, t], k) => {
      const left = Math.max(0, Math.min(bounds.width - w, l));
      const top = Math.max(0, t);
      const r = { x0: left - 4, y0: top - 4, x1: left + w + 4, y1: top + h + 4 };
      const hidden = avoid.reduce((sum, seg) => sum + insideLength(seg, r), 0);
      const coversSquare = x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
      const overflow = Math.max(0, top + h - bounds.height);
      const overShelf = Math.max(0, shelfBottom - top);
      const score = 4 * hidden + 3 * overflow + 1.5 * overShelf + (coversSquare ? 1e4 : 0) + 2 * k;
      if (score < best.score) best = { left, top, score };
    });
    el.style.left = `${Math.round(best.left)}px`;
    el.style.top = `${Math.round(best.top)}px`;
    el.style.visibility = "visible";
  });
  return (
    <div
      ref={ref}
      className="absolute z-20 w-[288px] rounded-lg border border-rule bg-paper p-3 shadow-[0_8px_30px_-8px_rgba(20,18,17,0.18)]"
      style={{ left: 0, top: 0, visibility: "hidden" }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={zh ? "关闭" : "Close"}
          className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-ink-faint hover:bg-paper-warm hover:text-ink"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      )}
      <div className={onClose ? "pr-5" : undefined}>{children}</div>
    </div>
  );
}
