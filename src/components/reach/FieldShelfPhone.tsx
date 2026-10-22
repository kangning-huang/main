"use client";

import { useLanguage } from "@/lib/language-context";
import { FIELD_AREA, fieldShelfPapers, fieldShelfThemes, type FieldShelfTips, type FieldShelfView, type TipsStatus } from "@/lib/field-shelf";
import FieldShelfCanvas from "./FieldShelfCanvas";
import { PaperDetails, paperReadout } from "./FieldShelfShelf";
import { WorkDetails } from "./FieldShelfTooltip";

const fmt = (n: number) => n.toLocaleString("en-US");
const pctOf = (a: number, b: number) => (b > 0 ? Math.round((100 * a) / b) : 0);

interface Props {
  view: FieldShelfView;
  lit: Uint8Array | null;
  hits: Uint8Array | null;
  pinPaper: number | null;
  onPinPaper: (p: number | null) => void;
  /** Square shown in the result card (search, "Show me one", or a tap on the field). */
  pinSquare: number | null;
  onPinSquare: (i: number | null) => void;
  tips: FieldShelfTips | null;
  status: TipsStatus;
  onLoad: () => void;
  canvasLabel: string;
}

/**
 * Phones (< 720 px): the field is a picture (one paint, the year-order fill once) and the shelf
 * becomes a list. Tap a paper to light its citers and list its most-cited ones; search and
 * "Show me one" (above) open a card. A tap on the field picks the nearest square, as a bonus.
 */
export default function FieldShelfPhone({ view, lit, hits, pinPaper, onPinPaper, pinSquare, onPinSquare, tips, status, onLoad, canvasLabel }: Props) {
  const { language } = useLanguage();
  const zh = language === "zh";
  const groups = fieldShelfThemes
    .map((t) => ({ theme: t, items: view.shelf.items.map((it) => it.p).filter((p) => fieldShelfPapers[p].theme === t.id) }))
    .filter((g) => g.items.length > 0);
  const pinned = pinPaper !== null ? fieldShelfPapers[pinPaper] : null;

  return (
    <div className="space-y-4">
      <div className={`z-10 -mx-1 bg-paper/95 px-1 pt-1 pb-2 backdrop-blur-sm ${pinned ? "sticky top-16" : ""}`}>
        <div className="relative w-full rounded-lg border border-rule-faint" style={{ aspectRatio: `${FIELD_AREA.width} / ${FIELD_AREA.height}`, maxHeight: FIELD_AREA.height }}>
          <FieldShelfCanvas
            view={view}
            lit={lit}
            hits={hits}
            entrance
            onPick={(i) => {
              if (i !== null) onLoad();
              onPinSquare(i);
            }}
            hitRadius={4}
            label={canvasLabel}
            className="absolute inset-0 h-full w-full"
          />
        </div>
        <p className="mt-1.5 text-xs leading-snug text-ink-muted">
          {pinned ? (
            <>
              <span className="font-medium text-ink">{paperReadout(pinned, zh)}</span>
              <button type="button" onClick={() => onPinPaper(null)} className="ml-2 text-teal">
                {zh ? "清除" : "Clear"}
              </button>
            </>
          ) : zh ? (
            `${fmt(view.totals.citingWorks)} 个方块，每篇施引文献一个。点按下方论文，或搜索、随机看一篇。`
          ) : (
            `${fmt(view.totals.citingWorks)} squares, one per citing work. Tap a paper below, search, or show one.`
          )}
        </p>
      </div>

      {pinSquare !== null && (
        <div className="relative rounded-xl border border-rule bg-paper p-3.5">
          <button
            type="button"
            onClick={() => onPinSquare(null)}
            aria-label={zh ? "关闭" : "Close"}
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full text-ink-faint hover:bg-paper-warm hover:text-ink"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
          <div className="pr-6">
            <WorkDetails view={view} index={pinSquare} tip={tips?.get(view.squares[pinSquare].id)} status={status} zh={zh} onRetry={onLoad} />
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">{zh ? "我的论文" : "Ken's papers"}</h3>
        {groups.map(({ theme, items }) => (
          <section key={theme.id} className="mt-3" aria-label={zh ? theme.zh : theme.en}>
            <h4 className="text-xs text-ink-muted">{zh ? theme.zh : theme.en}</h4>
            <ul className="mt-1 divide-y divide-rule-faint border-y border-rule-faint">
              {items.map((p) => {
                const paper = fieldShelfPapers[p];
                const open = pinPaper === p;
                const lead = paper.lens === "lead";
                return (
                  <li key={p}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => onPinPaper(open ? null : p)}
                      className="grid w-full grid-cols-[auto_1fr_auto] items-baseline gap-x-2 py-2 text-left"
                    >
                      <span
                        className={`inline-block h-3 w-2 translate-y-[1px] rounded-[2px] ${lead ? "border-[1.5px] border-ink" : "border border-rule"}`}
                        aria-label={lead ? (zh ? "第一/末位/通讯作者" : "lead author") : zh ? "合作" : "co-authored"}
                      />
                      <span className={`min-w-0 text-sm leading-snug ${open ? "font-medium text-ember-dark" : lead ? "text-ink" : "text-ink-muted"}`}>{paper.short}</span>
                      <span className="text-xs whitespace-nowrap tabular-nums text-ink-muted">
                        {paper.citing === 0
                          ? zh
                            ? `${paper.year} · 暂为 0`
                            : `${paper.year} · 0 yet`
                          : zh
                            ? `${fmt(paper.citing)} · ${pctOf(paper.outside, paper.citing)}% 主题外`
                            : `${fmt(paper.citing)} · ${pctOf(paper.outside, paper.citing)}% out`}
                      </span>
                    </button>
                    {open && (
                      <div className="pb-3 pl-4">
                        <PaperDetails view={view} p={p} tips={tips} status={status} onLoad={onLoad} compact />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
