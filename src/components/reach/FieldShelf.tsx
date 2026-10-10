"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import T from "@/components/T";
import { useLanguage } from "@/lib/language-context";
import { readQuery, updateQuery } from "@/lib/url-state";
import {
  BAND_COLORS,
  BAND_NAMES,
  BAND_NOTES,
  FIELD_AREA,
  distanceText,
  fieldShelfMeta,
  fieldShelfPapers,
  getFieldShelf,
  loadFieldShelfTips,
  openAlexUrl,
  pickOne,
  searchSquares,
  type FieldShelfTips,
  type FieldShelfView,
  type TipsStatus,
} from "@/lib/field-shelf";
import FieldShelfCanvas, { fieldFrame, squareCentre } from "./FieldShelfCanvas";
import FieldShelfPhone from "./FieldShelfPhone";
import FieldShelfSearch from "./FieldShelfSearch";
import FieldShelfShelf, { PaperDetails, paperReadout, shelfMetrics } from "./FieldShelfShelf";
import FieldShelfTooltip, { BandSwatch, WorkDetails, authorLine, useFieldShelfTips } from "./FieldShelfTooltip";
import { useReachLens } from "./ReachLens";

const fmt = (n: number) => n.toLocaleString("en-US");
const pctOf = (a: number, b: number) => (b > 0 ? Math.round((100 * a) / b) : 0);
/** Gap between the shelf and the field box, px. */
const FIELD_GAP = 12;
/** A hovered square's card waits this long before closing, so the pointer can reach its links. */
const CLOSE_DELAY = 180;

function maskOf(view: FieldShelfView, keep: (i: number) => boolean): Uint8Array {
  const m = new Uint8Array(view.squares.length);
  for (let i = 0; i < m.length; i++) if (keep(i)) m[i] = 1;
  return m;
}

/** Desktop (≥ 720 px): shelf above, field below, ≤ 4 lines from the square in focus to the papers it cites. */
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

/** Encoding key and the honest caption: what a square is, what the colours compare against, who dominates All. */
function FieldShelfLegend({ view }: { view: FieldShelfView }) {
  const { language } = useLanguage();
  const zh = language === "zh";
  const t = view.totals;
  const meta = fieldShelfMeta;
  const counts = [view.bands.core, view.bands.neighbour, view.bands.further];
  const share = meta.coauthorOnlyShare;
  const fourInFive = Math.abs(share - 0.8) <= 0.03;
  const inf = meta.influenceOutsideHome;
  const all = getFieldShelf("all").totals;
  const lead = getFieldShelf("lead").totals;
  return (
    <div className="space-y-2.5 text-xs leading-relaxed text-ink-muted">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        {([0, 1, 2] as const).map((b) => (
          <span key={b} className="flex items-center gap-1.5">
            <BandSwatch band={b} />
            <span>
              <span className="text-ink">{zh ? BAND_NAMES[b].zh : BAND_NAMES[b].en}</span> — {zh ? BAND_NOTES[b].zh : BAND_NOTES[b].en}{" "}
              <span className="tabular-nums">({fmt(counts[b])})</span>
            </span>
          </span>
        ))}
        <span>{zh ? "越靠近中心 = 离本人主题越近。方向没有含义。" : "Nearer the centre = nearer home. Direction means nothing."}</span>
      </div>
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
            ? `${fmt(t.citingWorks)} 个方块，每个对应一篇引用这些论文的 OpenAlex 文献。余烬色标出落在本人第一/通讯作者论文主题之外的文献。全部视角中约${fourInFive ? "五分之四" : `${Math.round(share * 100)}%`}的方块（${(share * 100).toFixed(1)}%）只引用合作论文；可切换到“第一 / 通讯作者”缩小范围。`
            : `${fmt(t.citingWorks)} squares — one per OpenAlex work that cites this corpus. Ember marks works outside the home topics of Ken's lead papers. ${fourInFive ? "About four in five" : `${Math.round(share * 100)}% of`} All squares (${(share * 100).toFixed(1)}%) cite only co-authored papers; use First / last / corresponding to narrow.`
          : zh
            ? `${fmt(t.citingWorks)} 个方块，每个对应一篇引用本人 ${t.leadPapers} 篇第一/通讯作者论文的 OpenAlex 文献。密度与全部视角相同，所以图更小；颜色不变。`
            : `${fmt(t.citingWorks)} squares — one per OpenAlex work citing Ken's ${t.leadPapers} first / last / corresponding-author papers. Same density as All, so the field is smaller; colours do not change.`}
      </p>
      <p className="text-ink-faint">
        {zh
          ? `本人主题固定为这 ${lead.leadPapers} 篇第一/通讯作者论文上的 ${meta.homeTopicsLeadCount} 个 OpenAlex 主题，两个视角相同，切换时方块不会变色。以此为准，全部视角 ${fmt(all.citingWorks)} 篇中 ${fmt(all.outsideHome)} 篇在主题之外（第一/通讯：${fmt(lead.citingWorks)} 篇中 ${fmt(lead.outsideHome)} 篇）${inf ? `；涟漪图的 ${fmt(inf.all)} 篇以全部 ${all.papers} 篇论文的 ${inf.homeTopics ?? ""} 个主题为准` : ""}。所有被收录的 OpenAlex 记录类型都是方块（论文、预印本、章节、同行评审意见等）；“随机看一篇”只挑期刊论文与综述。`
          : `Home topics are fixed: the ${meta.homeTopicsLeadCount} OpenAlex topics on Ken's ${lead.leadPapers} lead papers, in both views, so squares keep their colour when you switch. Against them, ${fmt(all.outsideHome)} of ${fmt(all.citingWorks)} All squares sit outside (Lead: ${fmt(lead.outsideHome)} of ${fmt(lead.citingWorks)})${inf ? `; the Ripple's ${fmt(inf.all)} measures against the ${inf.homeTopics ?? ""} topics of all ${all.papers} papers` : ""}. Every record type the pipeline counts is a square (articles, preprints, chapters, peer reviews …); “Show me one” picks articles and reviews.`}
      </p>
    </div>
  );
}

/** Two or three shelf papers worth lighting first, from the data (largest lead paper, largest overall, farthest reach). */
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
    (x) =>
      zh
        ? `${x.short}：${fmt(x.citing)} 篇施引，${pctOf(x.outside, x.citing)}% 在本人主题之外。`
        : `${x.short}: ${fmt(x.citing)} citing works, ${pctOf(x.outside, x.citing)}% outside the home topics.`
  );
  add(byCiting[0], zh ? "书架上最大的一本" : "Largest on the shelf", (x) =>
    zh ? `${x.short}（${x.lens === "lead" ? "第一/通讯作者" : "合作"}）：${fmt(x.citing)} 篇施引。` : `${x.short} (${x.lens === "lead" ? "lead" : "co-authored"}): ${fmt(x.citing)} citing works.`
  );
  const far = items.filter((p) => fieldShelfPapers[p].citing >= 30).sort((a, b) => fieldShelfPapers[b].outside / fieldShelfPapers[b].citing - fieldShelfPapers[a].outside / fieldShelfPapers[a].citing)[0];
  add(far, zh ? "走得最远" : "Travels farthest", (x) =>
    zh
      ? `${x.short}：${fmt(x.citing)} 篇施引中 ${fmt(x.outside)} 篇落在本人主题之外。`
      : `${x.short}: ${fmt(x.outside)} of its ${fmt(x.citing)} citing works sit outside the home topics.`
  );
  return out;
}

function ReadingGuide() {
  const { language } = useLanguage();
  const zh = language === "zh";
  const items = zh
    ? [
        "每个方块是一篇引用本人论文的文献（OpenAlex，已剔除自引）。点击方块在 OpenAlex 中打开。",
        `墨色：在本人 ${fieldShelfMeta.homeTopicsLeadCount} 个第一/通讯作者论文主题之内。浅余烬色：同一子领域或领域。余烬色：更远（同一大类、其他大类或无主题）。`,
        "越靠近中心越接近本人主题；方向没有含义。",
        "书架上是本人论文，按主题再按年份排列；墨色描边的书脊是第一/末位/通讯作者论文。悬停或按 Tab 键可点亮引用它的方块。",
        "可按作者、标题、期刊或年份搜索，或点“随机看一篇”。Esc 返回。",
      ]
    : [
        "Each square is one work that cites Ken's papers (OpenAlex, self-citations removed). Click one to open it in OpenAlex.",
        `Ink: inside the ${fieldShelfMeta.homeTopicsLeadCount} home topics of Ken's lead papers. Light ember: a neighbouring topic (same subfield or field). Ember: further out (same domain, another domain, or no topic).`,
        "Nearer the centre = closer to those topics. Direction means nothing.",
        "The shelf holds Ken's papers by theme, then year; ink-edged spines are first / last / corresponding-author papers. Hover or Tab to one to light the works citing it.",
        "Search by author, title, venue or year, or press Show me one. Esc returns to rest.",
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
    () => view.squares.map((_, i) => i).sort((a, b) => view.squares[a].band - view.squares[b].band || (view.squares[b].year ?? 0) - (view.squares[a].year ?? 0) || (view.squares[a].id < view.squares[b].id ? -1 : 1)),
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
          {zh ? "施引文献表：标题、年份、第一作者、期刊、引用的本人论文、距离" : "Citing works: title, year, first author, venue, which of Ken's papers it cites, distance from the home topics"}
        </caption>
        <thead className="text-xs text-ink-faint">
          <tr>
            <th className="py-1 pr-3 font-normal">{zh ? "施引文献" : "Citing work"}</th>
            <th className="py-1 pr-3 text-right font-normal">{zh ? "年份" : "Year"}</th>
            <th className="py-1 pr-3 font-normal">{zh ? "期刊" : "Venue"}</th>
            <th className="py-1 pr-3 font-normal">{zh ? "引用本人论文" : "Builds on"}</th>
            <th className="py-1 font-normal">{zh ? "距离" : "Distance"}</th>
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
                <td className="py-1.5 whitespace-nowrap text-ink-muted">
                  <span className="mr-1.5 inline-block h-2 w-2" style={{ background: BAND_COLORS[sq.band] }} aria-hidden="true" />
                  {zh ? BAND_NAMES[sq.band].zh : BAND_NAMES[sq.band].en}
                  {tip ? <span className="text-ink-faint"> · {distanceText(tip.d, zh)}</span> : null}
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
 * Section 01 as Field & Shelf (preview, docs/reach/FIELD-SHELF-PLAN.md): every work citing Ken's papers
 * is one square, packed by topic distance from the fixed home topics of his lead papers; his papers sit
 * on a shelf above. Hover a paper to light its citers; hover a square for its card and ≤ 4 lines back to
 * the shelf; click to open it in OpenAlex. URL: ?viz=field-shelf&shelf=<doi>&fs=<OpenAlex id>.
 */
export default function FieldShelf({ vizToggle }: { vizToggle: ReactNode }) {
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

  // ?shelf=<doi>&fs=<OpenAlex id> → state, once after mount (?lens and ?viz are read elsewhere).
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
    ? `${fmt(N)} 个方块，每篇施引文献一个：核心 ${fmt(view.bands.core)}，邻近 ${fmt(view.bands.neighbour)}，较远 ${fmt(view.bands.further)}。完整列表见下方表格。`
    : `${fmt(N)} squares, one per citing work: ${fmt(view.bands.core)} core, ${fmt(view.bands.neighbour)} neighbour, ${fmt(view.bands.further)} further. The table below lists them all.`;
  const readout =
    activeP !== null ? (
      <span className="font-medium text-ink">{paperReadout(fieldShelfPapers[activeP], zh)}</span>
    ) : focusI !== null ? null : (
      <span className="text-ink-faint">
        {zh ? "悬停论文以点亮引用它的文献 · 悬停方块查看详情 · 点击在 OpenAlex 中打开" : "Hover a paper to light the works citing it · hover a square for details · click to open it in OpenAlex"}
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
          <h2 id="ripple-heading" className="mt-2 font-display text-3xl leading-tight text-ink md:text-[2.25rem] lg:text-[2rem]">
            {zh ? view.headline.zh : view.headline.en}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {zh
              ? `${fmt(N)} 篇施引文献中 ${fmt(view.totals.outsideHome)} 篇在本人 ${getFieldShelf("lead").totals.leadPapers} 篇第一/通讯作者论文的 ${fieldShelfMeta.homeTopicsLeadCount} 个主题之外 · OpenAlex，${fieldShelfMeta.asOf} · 已剔除自引`
              : `${fmt(view.totals.outsideHome)} of ${fmt(N)} citing works outside the ${fieldShelfMeta.homeTopicsLeadCount} home topics of Ken's ${getFieldShelf("lead").totals.leadPapers} lead papers · OpenAlex, ${fieldShelfMeta.asOf} · self-citations removed`}
          </p>
        </header>

        <div className="flex flex-col gap-3 lg:col-start-2 lg:row-start-2">
          {vizToggle}
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
