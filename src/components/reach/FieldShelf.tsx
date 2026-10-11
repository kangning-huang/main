"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import T from "@/components/T";
import { useLanguage } from "@/lib/language-context";
import { readQuery, updateQuery } from "@/lib/url-state";
import {
  FIELD_AREA,
  IMPACT_COLORS,
  IMPACT_LABELS,
  IMPACT_NOTES,
  citedByText,
  fieldShelfMeta,
  fieldShelfPapers,
  getFieldShelf,
  impactBin,
  impactColor,
  loadFieldShelfTips,
  openAlexUrl,
  citersOfPaper,
  pickOne,
  searchSquares,
  type FieldShelfImpactBin,
  type FieldShelfTips,
  type FieldShelfView,
  type TipsStatus,
} from "@/lib/field-shelf";
import FieldShelfCanvas, { fieldFrame, squareCentre } from "./FieldShelfCanvas";
import FieldShelfPhone from "./FieldShelfPhone";
import FieldShelfSearch from "./FieldShelfSearch";
import FieldShelfShelf, { PaperDetails, paperReadout, shelfMetrics } from "./FieldShelfShelf";
import FieldShelfTooltip, { ImpactSwatch, WorkDetails, authorLine, useFieldShelfTips } from "./FieldShelfTooltip";
import { useReachLens } from "./ReachLens";

const fmt = (n: number) => n.toLocaleString("en-US");
/** Gap between the shelf and the field box, px. */
const FIELD_GAP = 12;
/** A hovered square's card waits this long before closing, so the pointer can reach its links. */
const CLOSE_DELAY = 180;

/**
 * Stroke opacity for the shelf→field citation fan. Scales with √N so megahits (ERL ~392,
 * Nat Commun ~799) stay readable; small papers stay a bit stronger. Never caps the line count.
 */
function shelfFanOpacity(n: number): number {
  if (n <= 0) return 0;
  return Math.min(0.18, Math.max(0.05, 3.0 / Math.sqrt(n)));
}

function maskOf(view: FieldShelfView, keep: (i: number) => boolean): Uint8Array {
  const m = new Uint8Array(view.squares.length);
  for (let i = 0; i < m.length; i++) if (keep(i)) m[i] = 1;
  return m;
}

/** Desktop (≥ 720 px): shelf above, field below. Square focus: ≤ 4 lines. Shelf paper focus: lines from every citer. */
function Stage({
  view,
  lit,
  hits,
  activePaper,
  pinnedPaper,
  focus,
  focusPinned,
  tips,
  status,
  readout,
  canvasLabel,
  onLoad,
  onHoverPaper,
  onPinPaper,
  onHoverSquare,
  onPickSquare,
  onKeepCard,
  onClosePin,
}: {
  view: FieldShelfView;
  lit: Uint8Array | null;
  hits: Uint8Array | null;
  activePaper: number | null;
  pinnedPaper: number | null;
  focus: number | null;
  focusPinned: boolean;
  tips: FieldShelfTips | null;
  status: TipsStatus;
  readout: ReactNode;
  canvasLabel: string;
  onLoad: () => void;
  onHoverPaper: (p: number | null) => void;
  onPinPaper: (p: number | null) => void;
  onHoverSquare: (i: number | null) => void;
  onPickSquare: (i: number | null) => void;
  onKeepCard: () => void;
  onClosePin: () => void;
}) {
  const { language } = useLanguage();
  const zh = language === "zh";
  const stageRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const m = shelfMetrics(view);
  const boxTop = m.height + FIELD_GAP;
  const frame = width > 0 ? fieldFrame(view, width) : null;
  const boxH = FIELD_AREA.height * (frame?.s ?? 1);
  const c = focus !== null && frame ? squareCentre(view, focus, frame) : null;
  const cited = focus !== null ? view.squares[focus].papers : null;
  const anchors = (cited ?? []).flatMap((p) => {
    const it = view.shelf.items.find((x) => x.p === p);
    return it ? [{ p, x: (it.x / view.shelf.width) * width }] : [];
  });
  const r = (view.field.cell / 2) * (frame?.s ?? 1) + 3;
  // Shelf paper focus (and no square card): draw every citing link. Square focus keeps ≤ 4 lines.
  const shelfFan = activePaper !== null && focus === null && frame && width > 0;
  const fanCiters = shelfFan ? citersOfPaper(view, activePaper) : [];
  const fanItem = shelfFan ? view.shelf.items.find((x) => x.p === activePaper) : null;
  const fanAnchorX = fanItem ? (fanItem.x / view.shelf.width) * width : 0;
  const fanAlpha = shelfFanOpacity(fanCiters.length);
  const cellCss = view.field.cell * (frame?.s ?? 1);
  const fanPath = shelfFan
    ? fanCiters
        .map((i) => {
          const pt = squareCentre(view, i, frame);
          return `M${pt.x.toFixed(1)} ${(boxTop + pt.y).toFixed(1)}L${fanAnchorX.toFixed(1)} ${m.anchorY}`;
        })
        .join("")
    : "";

  return (
    <div ref={stageRef} className="relative">
      <FieldShelfShelf view={view} active={activePaper} pinned={pinnedPaper} cited={cited} readout={readout} onHover={onHoverPaper} onPin={onPinPaper} />
      <div className="relative w-full" style={{ marginTop: FIELD_GAP, aspectRatio: `${FIELD_AREA.width} / ${FIELD_AREA.height}`, maxHeight: FIELD_AREA.height }}>
        <FieldShelfCanvas
          view={view}
          lit={lit}
          hits={hits}
          entrance
          onHover={(i) => {
            if (i !== null) onLoad();
            onHoverSquare(i);
          }}
          onPick={onPickSquare}
          label={canvasLabel}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      {shelfFan && fanItem && (
        <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" width={width} height={boxTop + boxH} aria-hidden="true">
          {/* All citing links (thin, low α); lit squares redrawn on top so megahits stay readable. */}
          {fanPath ? (
            <path d={fanPath} fill="none" stroke="var(--color-teal)" strokeWidth={0.55} strokeOpacity={fanAlpha} strokeLinecap="butt" />
          ) : null}
          {fanCiters.map((i) => {
            const pt = squareCentre(view, i, frame);
            const half = cellCss / 2;
            return (
              <rect
                key={view.squares[i].id}
                x={pt.x - half}
                y={boxTop + pt.y - half}
                width={cellCss}
                height={cellCss}
                fill={impactColor(view.squares[i].citedBy)}
              />
            );
          })}
          <circle cx={fanAnchorX} cy={m.anchorY} r={2.5} fill="var(--color-teal)" />
        </svg>
      )}
      {c && (
        <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" width={width} height={boxTop + boxH} aria-hidden="true">
          {anchors.map((a) => (
            <g key={a.p}>
              <line x1={c.x} y1={boxTop + c.y} x2={a.x} y2={m.anchorY} stroke="var(--color-teal)" strokeOpacity={0.8} strokeWidth={1} />
              <circle cx={a.x} cy={m.anchorY} r={2.25} fill="var(--color-teal)" />
            </g>
          ))}
          <rect x={c.x - r} y={boxTop + c.y - r} width={2 * r} height={2 * r} fill="none" stroke="var(--color-teal)" strokeWidth={1.5} />
        </svg>
      )}
      {c && focus !== null && (
        <FieldShelfTooltip
          x={c.x}
          y={boxTop + c.y}
          bounds={{ width, height: boxTop + boxH + 160 }}
          avoid={anchors.map((a) => [c.x, boxTop + c.y, a.x, m.anchorY])}
          shelfBottom={m.anchorY}
          onClose={focusPinned ? onClosePin : undefined}
          onPointerEnter={onKeepCard}
          onPointerLeave={() => onHoverSquare(null)}
          zh={zh}
        >
          <WorkDetails
            view={view}
            index={focus}
            tip={tips?.get(view.squares[focus].id)}
            status={status}
            zh={zh}
            onRetry={onLoad}
            hint={focusPinned ? undefined : zh ? "点击方块即可打开" : "click the square to open"}
          />
        </FieldShelfTooltip>
      )}
    </div>
  );
}

/** Encoding key: colour = citing work's own citations (log bins); centre = more cited. */
function FieldShelfLegend({ view }: { view: FieldShelfView }) {
  const { language } = useLanguage();
  const zh = language === "zh";
  const t = view.totals;
  const meta = fieldShelfMeta;
  const share = meta.coauthorOnlyShare;
  const fourInFive = Math.abs(share - 0.8) <= 0.03;
  const counts = view.impact.counts;
  return (
    <div className="space-y-2.5 text-xs leading-relaxed text-ink-muted">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {([0, 1, 2, 3, 4] as FieldShelfImpactBin[]).map((b) => (
          <span key={b} className="flex items-center gap-1.5">
            <ImpactSwatch bin={b} />
            <span>
              <span className="text-ink tabular-nums">{zh ? IMPACT_LABELS[b].zh : IMPACT_LABELS[b].en}</span>
              <span className="text-ink-faint"> · {zh ? IMPACT_NOTES[b].zh : IMPACT_NOTES[b].en}</span>{" "}
              <span className="tabular-nums">({fmt(counts[b] ?? 0)})</span>
            </span>
          </span>
        ))}
      </div>
      <p>
        {zh
          ? "颜色表示施引文献自身在 OpenAlex 的被引次数，按对数分段。越靠近中心，被引越多；方向没有含义。"
          : "Colour = the citing work's own OpenAlex citation count (log bins). Nearer the centre = more cited. Direction means nothing."}
      </p>
      <p className="tabular-nums">
        {zh
          ? `高被引施引文献中，${fmt(t.ge100)} 篇自身被引 ≥100 次 · ${fmt(t.ge1000)} 篇 ≥1,000 次 · 最高 ${fmt(t.maxCitedBy)} 次。`
          : `High-impact citers: ${fmt(t.ge100)} with ≥100 citations of their own · ${fmt(t.ge1000)} with ≥1,000 · max ${fmt(t.maxCitedBy)}.`}
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-2 rounded-[2px] border-[1.5px] border-ink" aria-hidden="true" />
          {zh ? "第一 / 末位 / 通讯作者论文" : "First / last / corresponding-author paper"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-2 rounded-[2px] border border-rule" aria-hidden="true" />
          {zh ? "合作论文" : "Co-authored"}
        </span>
        <span>{zh ? "书脊下的数字 = 该论文的非自引施引文献数。" : "Number under a spine = its non-self citing works."}</span>
      </div>
      <p>
        {view.lens === "all"
          ? zh
            ? `${fmt(t.citingWorks)} 个方块，每个对应一篇引用这些论文的 OpenAlex 文献。全部视角中约${fourInFive ? "五分之四" : `${Math.round(share * 100)}%`}的方块（${(share * 100).toFixed(1)}%）只引用合作论文；可切换到“第一 / 通讯作者”缩小范围。`
            : `${fmt(t.citingWorks)} squares — one per OpenAlex work that cites this corpus. ${fourInFive ? "About four in five" : `${Math.round(share * 100)}% of`} All squares (${(share * 100).toFixed(1)}%) cite only co-authored papers; use First / last / corresponding to narrow.`
          : zh
            ? `${fmt(t.citingWorks)} 个方块，代表引用我的 ${t.leadPapers} 篇第一/通讯作者论文的 OpenAlex 文献，每篇一个。方块密度与“全部”视角相同，所以图更小；切换视角时，同一文献颜色不变。`
            : `${fmt(t.citingWorks)} squares — one per OpenAlex work citing Ken's ${t.leadPapers} first / last / corresponding-author papers. Same density as All, so the field is smaller; a work keeps its colour across lenses.`}
      </p>
      <p className="text-ink-faint">
        {zh
          ? `被引次数直接取自 OpenAlex cited_by_count（${meta.asOf}），不编造数值。统计流程收录的各类文献都画成方块；“随机看一篇”优先选取自身被引较多的期刊论文和综述。`
          : `Citation counts are OpenAlex cited_by_count (${meta.asOf}), never invented. Every record type the pipeline counts is a square; “Show me one” prefers higher-cited articles and reviews.`}
      </p>
    </div>
  );
}

/**
 * Two or three shelf papers worth lighting first, from the data: the largest lead paper, the largest
 * overall, and the lead paper (≥ 30 citers) whose citers sit outside the home topics most often. Only
 * lead papers can "travel": the home topics are their own, while a co-authored paper in another field
 * (dust, snow) is outside by definition.
 */
function worthALook(view: FieldShelfView, zh: boolean) {
  const items = view.shelf.items.map((it) => it.p).filter((p) => fieldShelfPapers[p].citing > 0);
  const out: { p: number; title: string; body: string }[] = [];
  const add = (p: number | undefined, title: string, body: (paper: (typeof fieldShelfPapers)[number]) => string) => {
    if (p === undefined || out.some((o) => o.p === p)) return;
    out.push({ p, title, body: body(fieldShelfPapers[p]) });
  };
  const byCiting = [...items].sort((a, b) => fieldShelfPapers[b].citing - fieldShelfPapers[a].citing);
  add(
    byCiting.find((p) => fieldShelfPapers[p].lens === "lead"),
    zh ? "引用最多的第一/通讯作者论文" : "Most-cited lead paper",
    (x) => (zh ? `${x.short}，${fmt(x.citing)} 篇施引文献。` : `${x.short}: ${fmt(x.citing)} citing works.`)
  );
  add(byCiting[0], zh ? "书架上最大的一本" : "Largest on the shelf", (x) =>
    zh ? `${x.short}（${x.lens === "lead" ? "第一/通讯作者" : "合作"}），${fmt(x.citing)} 篇施引文献。` : `${x.short} (${x.lens === "lead" ? "lead" : "co-authored"}): ${fmt(x.citing)} citing works.`
  );
  add(
    byCiting.find((p) => fieldShelfPapers[p].lens === "coauthor"),
    zh ? "引用最多的合作论文" : "Most-cited co-authored paper",
    (x) => (zh ? `${x.short}，${fmt(x.citing)} 篇施引文献。` : `${x.short}: ${fmt(x.citing)} citing works.`)
  );
  return out;
}

function ReadingGuide() {
  const { language } = useLanguage();
  const zh = language === "zh";
  const items = zh
    ? [
        "每个方块是一篇引用本人论文的文献（OpenAlex，已剔除自引）。点击方块在 OpenAlex 中打开。",
        "颜色 = 该施引文献自身的被引次数（对数分段，余烬→墨色）。越深、越靠中心，说明引用本人的文献本身影响力越高。",
        "方向没有含义；中心是高被引核心，边缘是尚未被广泛引用的施引文献。",
        "书架上是本人论文，按主题再按年份排列；墨色描边的书脊是第一/末位/通讯作者论文。悬停或按 Tab 键可点亮引用它的方块，并画出每一条连线。",
        "可按作者、标题、期刊或年份搜索，或点“随机看一篇”。Esc 返回。",
      ]
    : [
        "Each square is one work that cites these papers (OpenAlex, self-citations removed). Click a square to open it in OpenAlex.",
        "Colour is the citing work's own citation count (log bins, ember to ink). Darker and nearer the centre means that citing paper is itself more cited.",
        "Direction on the field means nothing. The centre holds high-impact citers; the edge holds lightly cited ones.",
        "The shelf is Ken's papers by theme, then year. Ink-edged spines mark first-, last-, or corresponding-author papers. Hover or Tab a spine to light its citers and draw a thin link from each.",
        "Search by author, title, venue, or year, or press Show me one. Esc returns to rest.",
      ];
  return (
    <ul className="space-y-1.5 text-sm leading-snug text-ink-muted">
      {items.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ul>
  );
}

const TABLE_PAGE = 100;

/** The field as a table: every square, no hover needed. Titles come with the lazy payload; ids, years, papers and bands are always there. */
function FieldShelfTable({ view, tips, status, onLoad }: { view: FieldShelfView; tips: FieldShelfTips | null; status: TipsStatus; onLoad: () => void }) {
  const { language } = useLanguage();
  const zh = language === "zh";
  const [rows, setRows] = useState(TABLE_PAGE);
  const order = useMemo(
    () => view.squares.map((_, i) => i).sort((a, b) => view.squares[b].citedBy - view.squares[a].citedBy || (view.squares[b].year ?? 0) - (view.squares[a].year ?? 0) || (view.squares[a].id < view.squares[b].id ? -1 : 1)),
    [view]
  );
  useEffect(() => onLoad(), [onLoad]);
  return (
    <div className="overflow-x-auto">
      {status !== "ready" && (
        <p className="mt-3 text-xs text-ink-faint">
          {status === "error" ? (zh ? "标题未能加载，仅显示编号。" : "Titles did not load; showing ids only.") : zh ? "正在加载标题…" : "Loading titles…"}
        </p>
      )}
      <table className="mt-3 w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">
          {zh ? "施引文献表列出标题、年份、发表来源、引用了我的哪些论文，以及文献自身被引次数" : "Citing works: title, year, venue, which of Ken's papers it cites, own citation count"}
        </caption>
        <thead className="text-xs text-ink-faint">
          <tr>
            <th className="py-1 pr-3 font-normal">{zh ? "施引文献" : "Citing work"}</th>
            <th className="py-1 pr-3 text-right font-normal">{zh ? "年份" : "Year"}</th>
            <th className="py-1 pr-3 font-normal">{zh ? "期刊" : "Venue"}</th>
            <th className="py-1 pr-3 font-normal">{zh ? "引用本人论文" : "Builds on"}</th>
            <th className="py-1 text-right font-normal">{zh ? "自身被引" : "Citations"}</th>
          </tr>
        </thead>
        <tbody>
          {order.slice(0, rows).map((i) => {
            const sq = view.squares[i];
            const tip = tips?.get(sq.id);
            return (
              <tr key={sq.id} className="border-t border-rule-faint align-baseline">
                <td className="py-1.5 pr-3">
                  <a href={openAlexUrl(sq.id)} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-ember">
                    {tip?.title ?? sq.id}
                  </a>
                  {tip?.author && <span className="block text-xs text-ink-faint">{authorLine(tip, zh)}</span>}
                </td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-ink-muted">{sq.year ?? "—"}</td>
                <td className="py-1.5 pr-3 text-ink-muted">{tip?.venue ?? ""}</td>
                <td className="py-1.5 pr-3 text-ink-muted">{sq.papers.map((p) => fieldShelfPapers[p].label).join(", ")}</td>
                <td className="py-1.5 whitespace-nowrap text-right text-ink-muted">
                  <span className="mr-1.5 inline-block h-2 w-2 align-middle" style={{ background: impactColor(sq.citedBy) }} aria-hidden="true" />
                  <span className="tabular-nums">{fmt(sq.citedBy)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows < order.length && (
        <button type="button" onClick={() => setRows((n) => n + 5 * TABLE_PAGE)} className="mt-2 text-xs text-teal hover:text-ember">
          {zh ? `再显示 ${Math.min(5 * TABLE_PAGE, order.length - rows)} 行（共 ${fmt(order.length)} 行）` : `Show ${Math.min(5 * TABLE_PAGE, order.length - rows)} more of ${fmt(order.length)} rows`}
        </button>
      )}
    </div>
  );
}

/**
 * Section 01 of /reach: Field & Shelf. Every work citing Ken's papers is one square, coloured and packed
 * by that work's own OpenAlex cited_by_count (log bins; high → centre). Hover a paper to light its citers
 * and draw every citation link; hover a square for its card and ≤ 4 lines; click → OpenAlex.
 */
export default function FieldShelf({ vizToggle }: { vizToggle?: ReactNode } = {}) {
  const { lens } = useReachLens();
  const { language } = useLanguage();
  const zh = language === "zh";
  const view = getFieldShelf(lens);
  const { status, tips, load } = useFieldShelfTips(lens);

  const [hoverPaper, setHoverPaper] = useState<number | null>(null);
  const [pinPaper, setPinPaper] = useState<number | null>(null);
  const [hoverSq, setHoverSq] = useState<string | null>(null);
  const [pinSq, setPinSq] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [announce, setAnnounce] = useState("");
  const [tableOpen, setTableOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const closeTimer = useRef<number | null>(null);

  // ?shelf=<doi>&fs=<OpenAlex id> → state, once after mount (?lens is read by ReachLensProvider).
  useEffect(() => {
    const shelf = readQuery("shelf");
    const fs = readQuery("fs");
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from the URL after hydration */
    if (shelf) {
      const i = fieldShelfPapers.findIndex((p) => p.doi === shelf.toLowerCase());
      if (i >= 0) setPinPaper(i);
    }
    if (fs && /^W\d+$/.test(fs)) setPinSq(fs);
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const onShelf = useMemo(() => new Set(view.shelf.items.map((it) => it.p)), [view]);
  const pinP = pinPaper !== null && onShelf.has(pinPaper) ? pinPaper : null;
  const activeP = (hoverPaper !== null && onShelf.has(hoverPaper) ? hoverPaper : null) ?? pinP;
  const pinI = pinSq !== null ? (view.index.get(pinSq) ?? null) : null;
  const hoverI = hoverSq !== null ? (view.index.get(hoverSq) ?? null) : null;
  const focusI = hoverI ?? pinI;

  useEffect(() => {
    if (!ready) return;
    updateQuery({
      shelf: pinP !== null ? fieldShelfPapers[pinP].doi : null,
      fs: pinI !== null ? view.squares[pinI].id : null,
    });
  }, [ready, pinP, pinI, view]);

  // Details for a square pinned from the URL, or for a search still typed in after a lens switch; the
  // small Lead payload is fetched as soon as Lead is chosen.
  const searching = query.trim().length >= 2;
  useEffect(() => {
    if (pinI !== null || searching || lens === "lead") load();
  }, [pinI, searching, lens, load]);

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    []
  );

  const lit = useMemo(() => (activeP === null ? null : maskOf(view, (i) => view.squares[i].papers.includes(activeP))), [view, activeP]);
  const hitList = useMemo(() => (tips && searching ? searchSquares(view, tips, query) : null), [view, tips, query, searching]);
  const hits = useMemo(() => {
    if (!hitList) return null;
    const m = new Uint8Array(view.squares.length);
    for (const i of hitList) m[i] = 1;
    return m;
  }, [view, hitList]);

  const keepCard = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const hoverSquare = (i: number | null) => {
    keepCard();
    if (i !== null) setHoverSq(view.squares[i].id);
    else closeTimer.current = window.setTimeout(() => setHoverSq(null), CLOSE_DELAY);
  };
  const say = (i: number, t: FieldShelfTips | null) => {
    const sq = view.squares[i];
    const tip = t?.get(sq.id);
    setAnnounce(tip ? `${tip.title}. ${[authorLine(tip, zh), tip.venue, tip.year].filter(Boolean).join(", ")}` : sq.id);
  };
  const locate = (i: number) => {
    keepCard();
    setHoverSq(null);
    setPinSq(view.squares[i].id);
    say(i, tips);
  };
  const showOne = () => {
    const v = view;
    const within = activeP;
    loadFieldShelfTips(lens)
      .then((t) => {
        const i = pickOne(v, t, within !== null ? (k) => v.squares[k].papers.includes(within) : null);
        if (i === null) return;
        setQuery("");
        setHoverSq(null);
        setPinSq(v.squares[i].id);
        say(i, t);
      })
      .catch(() => setAnnounce(zh ? "施引文献列表未能加载。" : "The list of citing works did not load."));
  };
  const reset = () => {
    keepCard();
    setHoverSq(null);
    setPinSq(null);
    setHoverPaper(null);
    setPinPaper(null);
  };
  const pinPaperTo = (p: number | null) => {
    setPinPaper(p);
    if (p !== null) setAnnounce(paperReadout(fieldShelfPapers[p], zh));
  };

  const N = view.totals.citingWorks;
  const canvasLabel = zh
    ? `${fmt(N)} 个方块，每个代表一篇施引文献；颜色表示文献自身被引次数，越靠近中心，被引越多。其中 ${fmt(view.totals.ge100)} 篇被引 ≥100 次，${fmt(view.totals.ge1000)} 篇 ≥1,000 次。下表列出全部文献。`
    : `${fmt(N)} squares, one per citing work; colour is each work's own citation count, centre = higher impact. ${fmt(view.totals.ge100)} with ≥100 citations, ${fmt(view.totals.ge1000)} with ≥1,000. The table below lists them all.`;
  const readout =
    activeP !== null ? (
      <span className="font-medium text-ink">{paperReadout(fieldShelfPapers[activeP], zh)}</span>
    ) : focusI !== null ? null : (
      <span className="text-ink-faint">
        {zh ? "悬停论文以点亮引用并画出全部连线，悬停方块查看详情" : "Hover a paper to light its citers and draw every link, or a square for its details"}
      </span>
    );
  const callouts = worthALook(view, zh);

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Escape") reset();
      }}
    >
      <div className="grid gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_auto_1fr]">
        <header className="lg:col-start-2 lg:row-start-1">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">01 · {zh ? "田野与书架 · 每篇施引一个方块" : "Field & Shelf · one square per citing work"}</p>
          <h2 id="field-shelf-heading" className="mt-2 font-display text-3xl leading-tight text-ink md:text-[2.25rem] lg:text-[2rem]">
            {zh ? view.headline.zh : view.headline.en}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {zh
              ? `${fmt(view.totals.ge100)} 篇施引文献自身被引 ≥100 次 · ${fmt(view.totals.ge1000)} 篇 ≥1,000 次 · OpenAlex，${fieldShelfMeta.asOf} · 已剔除自引`
              : `${fmt(view.totals.ge100)} citing works with ≥100 citations of their own · ${fmt(view.totals.ge1000)} with ≥1,000 · OpenAlex, ${fieldShelfMeta.asOf} · self-citations removed`}
          </p>
        </header>

        <div className="flex flex-col gap-3 lg:col-start-2 lg:row-start-2">
          {vizToggle ?? null}
          <FieldShelfSearch view={view} tips={tips} status={status} onLoad={load} query={query} onQuery={setQuery} hits={hitList} onLocate={locate} onShowOne={showOne} />
        </div>

        <figure className="m-0 min-w-0 lg:col-start-1 lg:row-span-3 lg:row-start-1">
          <div className="hidden rounded-xl border border-rule-faint bg-paper px-3 pt-3 pb-2 min-[720px]:block">
            <Stage
              view={view}
              lit={lit}
              hits={hits}
              activePaper={activeP}
              pinnedPaper={pinP}
              focus={focusI}
              focusPinned={hoverI === null && pinI !== null}
              tips={tips}
              status={status}
              readout={readout}
              canvasLabel={canvasLabel}
              onLoad={load}
              onHoverPaper={setHoverPaper}
              onPinPaper={pinPaperTo}
              onHoverSquare={hoverSquare}
              onPickSquare={(i) => {
                if (i === null) {
                  reset();
                  return;
                }
                const id = view.squares[i].id;
                setPinSq(id);
                window.open(openAlexUrl(id), "_blank", "noopener,noreferrer");
              }}
              onKeepCard={keepCard}
              onClosePin={() => setPinSq(null)}
            />
          </div>
          <div className="min-[720px]:hidden">
            <FieldShelfPhone
              view={view}
              lit={lit}
              hits={hits}
              pinPaper={pinP}
              onPinPaper={pinPaperTo}
              pinSquare={pinI}
              onPinSquare={(i) => setPinSq(i === null ? null : view.squares[i].id)}
              tips={tips}
              status={status}
              onLoad={load}
              canvasLabel={canvasLabel}
            />
          </div>
          <figcaption className="mt-4 border-t border-rule-faint pt-3">
            <FieldShelfLegend view={view} />
          </figcaption>
        </figure>

        <aside className="hidden self-start rounded-xl border border-rule bg-paper-warm/40 p-5 min-[720px]:block lg:col-start-2 lg:row-start-3">
          {activeP !== null ? (
            <>
              <PaperDetails view={view} p={activeP} tips={tips} status={status} onLoad={load} onPreview={hoverSquare} />
              {pinP !== null && (
                <button type="button" onClick={() => pinPaperTo(null)} className="mt-4 text-xs text-teal hover:text-ember">
                  <T en="← Back to the whole field (Esc)" zh="← 返回全图（Esc）" />
                </button>
              )}
            </>
          ) : (
            <div className="space-y-5">
              {callouts.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
                    <T en="Worth a look" zh="值得一看" />
                  </h3>
                  <ol className="mt-2 space-y-3">
                    {callouts.map((c, i) => (
                      <li key={c.p}>
                        <button type="button" onClick={() => pinPaperTo(c.p)} className="group flex w-full gap-2.5 text-left text-sm leading-snug">
                          <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-ink text-[10.5px] font-bold text-paper">{i + 1}</span>
                          <span>
                            <span className="font-medium text-ink group-hover:text-ember">{c.title}</span>
                            <span className="text-ink-muted"> — {c.body}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
                  <T en="How to read it" zh="怎么读" />
                </h3>
                <div className="mt-2">
                  <ReadingGuide />
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <details className="mt-6 text-sm" onToggle={(e) => setTableOpen(e.currentTarget.open)}>
        <summary className="cursor-pointer text-ink-muted hover:text-ink">
          <T en="Show as table" zh="以表格显示" />
        </summary>
        {tableOpen ? (
          <FieldShelfTable view={view} tips={tips} status={status} onLoad={load} />
        ) : (
          <p className="mt-3 text-xs text-ink-faint">
            {zh ? `${fmt(N)} 行` : `${fmt(N)} rows`}
          </p>
        )}
      </details>
    </div>
  );
}
