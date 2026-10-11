"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLanguage } from "@/lib/language-context";
import {
  doiUrl,
  fieldShelfPapers,
  fieldShelfThemes,
  openAlexUrl,
  topCiters,
  type FieldShelfPaper,
  type FieldShelfTips,
  type FieldShelfView,
  type TipsStatus,
} from "@/lib/field-shelf";
import { authorLine } from "./FieldShelfTooltip";

const fmt = (n: number) => n.toLocaleString("en-US");

/** Vertical rhythm of the shelf, CSS px (not scaled: it holds text). */
export function shelfMetrics(view: FieldShelfView) {
  const themeH = view.shelf.themeLines * 13;
  const spineTop = themeH + 8;
  const spineBottom = spineTop + view.shelf.spineH;
  const countTop = spineBottom + 5;
  const anchorY = countTop + 17;
  const readoutTop = anchorY + 5;
  return { themeH, spineTop, spineBottom, countTop, anchorY, readoutTop, height: readoutTop + 20 };
}

/** "ERL 2019 · 392 citing", or "Sci Rep 2026 · no citing works yet". */
export function paperReadout(p: FieldShelfPaper, zh: boolean) {
  if (p.citing === 0) return zh ? `${p.label} · ${p.year} · 暂无施引文献` : `${p.label} · ${p.year} · no citing works yet`;
  return zh ? `${p.label} · ${fmt(p.citing)} 篇施引文献` : `${p.label} · ${fmt(p.citing)} citing`;
}

export function paperAria(p: FieldShelfPaper, zh: boolean) {
  const role = p.lens === "lead" ? (zh ? "第一/通讯作者" : "lead author") : zh ? "合作" : "co-authored";
  if (p.citing === 0) return zh ? `${p.short}（${role}），暂无施引文献` : `${p.short} (${role}): no citing works yet`;
  return zh ? `${p.short}（${role}），${fmt(p.citing)} 篇施引文献` : `${p.short} (${role}): ${fmt(p.citing)} citing works`;
}

interface Props {
  view: FieldShelfView;
  /** Paper whose citers are lit (hovered, focused or pinned). */
  active: number | null;
  pinned: number | null;
  /** Papers cited by the square in focus: ringed in teal, with a line from the square. */
  cited: number[] | null;
  readout: ReactNode;
  onHover: (p: number | null) => void;
  onPin: (p: number | null) => void;
}

/**
 * The shelf: Ken's papers as upright spines on a board, grouped by theme, then by year. Lead-author
 * spines are ink-edged; co-authored ones are hairline. Counts sit under the board ("0 yet" for a
 * paper nobody cites so far). Positions are percentages of the builder's reference width, so the
 * shelf needs no measuring and renders the same on the server.
 */
export default function FieldShelfShelf({ view, active, pinned, cited, readout, onHover, onPin }: Props) {
  const { language } = useLanguage();
  const zh = language === "zh";
  const S = view.shelf;
  const m = shelfMetrics(view);
  const pc = (x: number) => `${(100 * x) / S.width}%`;
  const first = S.items[0];
  const last = S.items[S.items.length - 1];
  const board0 = first ? first.x - S.spineW / 2 - 6 : 0;
  const board1 = last ? last.x + S.spineW / 2 + 6 : 0;

  return (
    <div className="relative" style={{ height: m.height }}>
      {/* Theme names over a hairline bracket. */}
      {S.groups.map((g) => (
        <div key={g.theme} className="absolute top-0" style={{ left: pc(g.x0), width: pc(g.x1 - g.x0) }} aria-hidden="true">
          <div className="flex flex-col items-center justify-end text-center text-[10.5px] leading-[13px] whitespace-nowrap text-ink-muted" style={{ height: m.themeH }}>
            {(zh ? g.zh : g.en).map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          <div className="absolute inset-x-0 border-x border-t border-rule" style={{ top: m.themeH + 3, height: 3 }} />
        </div>
      ))}

      {/* The board. */}
      <div className="absolute h-[2px] bg-rule" style={{ left: pc(board0), width: pc(board1 - board0), top: m.spineBottom }} aria-hidden="true" />

      {S.items.map(({ p, x }) => {
        const paper = fieldShelfPapers[p];
        const lead = paper.lens === "lead";
        const isActive = active === p;
        const isCited = !!cited?.includes(p);
        const faded = active !== null && !isActive;
        const tone = isActive
          ? "border-ember bg-ember-light text-ember-dark"
          : isCited
            ? "border-teal bg-teal-light text-teal"
            : lead
              ? "border-ink bg-paper text-ink"
              : "border-rule bg-paper text-ink-muted";
        return (
          <button
            key={p}
            type="button"
            aria-pressed={pinned === p}
            aria-label={paperAria(paper, zh)}
            title={`${paper.short}\n${paper.title}${paper.venue ? ` — ${paper.venue}` : ""}`}
            onPointerEnter={(e) => e.pointerType === "mouse" && onHover(p)}
            onPointerLeave={(e) => e.pointerType === "mouse" && onHover(null)}
            onFocus={() => onHover(p)}
            onBlur={() => onHover(null)}
            onClick={() => onPin(pinned === p ? null : p)}
            className={`absolute flex justify-center overflow-hidden rounded-[3px] outline-none transition-[left,width,opacity,background-color,border-color,color] duration-300 focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper motion-reduce:transition-none ${tone} ${
              lead ? "border-[1.5px]" : "border"
            } ${faded ? "opacity-45" : ""}`}
            style={{ left: pc(x - S.spineW / 2), width: pc(S.spineW), top: m.spineTop, height: S.spineH }}
          >
            <span className="pt-[7px] text-start text-[10.5px] leading-[13px] whitespace-nowrap" style={{ writingMode: "vertical-rl" }}>
              <span className={lead ? "font-semibold" : "font-medium"}>{paper.label}</span>
              {S.lines === 2 && (
                <>
                  <br />
                  <span className="text-[10px] font-normal opacity-80">{paper.desc}</span>
                </>
              )}
            </span>
          </button>
        );
      })}

      {/* Citing works per paper, under the board. */}
      {S.items.map(({ p, x }) => {
        const paper = fieldShelfPapers[p];
        return (
          <span
            key={p}
            className={`absolute -translate-x-1/2 text-[10px] leading-[13px] whitespace-nowrap tabular-nums transition-[left] duration-300 motion-reduce:transition-none ${
              paper.citing === 0 ? "text-ink-faint" : active === p ? "font-semibold text-ember-dark" : "text-ink-muted"
            }`}
            style={{ left: pc(x), top: m.countTop }}
            aria-hidden="true"
          >
            {paper.citing === 0 ? (zh ? "目前为 0" : "0 yet") : fmt(paper.citing)}
          </span>
        );
      })}

      <p className="absolute inset-x-0 truncate text-center text-[13px] leading-5" style={{ top: m.readoutTop }}>
        {readout}
      </p>
    </div>
  );
}

/**
 * A shelf paper in focus: what it is, how many works cite it, and its most-cited citers
 * (OpenAlex cited_by_count, from the lazy payload). Hovering a citer previews its square on the field.
 */
export function PaperDetails({
  view,
  p,
  tips,
  status,
  onLoad,
  onPreview,
  compact = false,
}: {
  view: FieldShelfView;
  p: number;
  tips: FieldShelfTips | null;
  status: TipsStatus;
  onLoad: () => void;
  onPreview?: (i: number | null) => void;
  /** Phones: the list row already names the paper. */
  compact?: boolean;
}) {
  const { language } = useLanguage();
  const zh = language === "zh";
  const paper = fieldShelfPapers[p];
  const theme = fieldShelfThemes.find((t) => t.id === paper.theme);
  const [more, setMore] = useState(false);
  useEffect(() => {
    if (paper.citing > 0) onLoad();
  }, [paper.citing, onLoad]);
  const top = tips ? topCiters(view, tips, p, more ? 15 : 5) : null;
  const lead = paper.lens === "lead";

  return (
    <div className="space-y-4 text-sm">
      {!compact && (
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            {theme ? (zh ? theme.zh : theme.en) : paper.theme} · {lead ? (zh ? "第一/通讯作者" : "lead author") : zh ? "合作论文" : "co-authored"}
          </p>
          <h3 className="mt-1 font-display text-2xl leading-tight text-ink">{paper.short}</h3>
          <p className="mt-1 leading-snug text-ink-muted">
            {paper.title}
            {paper.venue ? <span className="text-ink-faint"> — {paper.venue}</span> : null}
          </p>
          <p className="mt-1.5 flex gap-3 text-xs">
            <a href={doiUrl(paper.doi)} target="_blank" rel="noopener noreferrer" className="text-teal hover:text-ember">
              DOI ↗
            </a>
            <a href={openAlexUrl(paper.openalex)} target="_blank" rel="noopener noreferrer" className="text-teal hover:text-ember">
              OpenAlex ↗
            </a>
          </p>
        </div>
      )}
      {paper.citing === 0 ? (
        <p className="leading-snug text-ink-muted">
          {zh ? `发表于 ${paper.year} 年。OpenAlex 暂未收录引用它的非自引文献，因此没有方块亮起。` : `Published ${paper.year}; no non-self citing work in OpenAlex yet, so no squares light up.`}
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            <dt className="text-ink-faint">{zh ? "引用这些论文的文献" : "Citing works"}</dt>
            <dd className="tabular-nums text-ink">
              {fmt(paper.citing)} <span className="text-ink-muted">{zh ? "（不含自引）" : "(non-self)"}</span>
            </dd>
            <dt className="text-ink-faint">{zh ? "引用它的高被引文献（≥100）" : "High-impact citers (≥100)"}</dt>
            <dd className="tabular-nums text-ink">
              {fmt(view.squares.filter((sq) => sq.papers.includes(p) && sq.citedBy >= 100).length)}
            </dd>
          </dl>
          <div>
            <h4 className="text-xs font-medium text-ink">{zh ? "引用它且被引最多的文献" : "Most-cited works citing it"}</h4>
            {top ? (
              <ol className="mt-1.5 space-y-2">
                {top.map((i) => {
                  const sq = view.squares[i];
                  const tip = tips?.get(sq.id);
                  if (!tip) return null;
                  return (
                    <li key={sq.id} className="leading-snug">
                      <a
                        href={openAlexUrl(sq.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onPointerEnter={(e) => e.pointerType === "mouse" && onPreview?.(i)}
                        onPointerLeave={(e) => e.pointerType === "mouse" && onPreview?.(null)}
                        onFocus={() => onPreview?.(i)}
                        onBlur={() => onPreview?.(null)}
                        className="text-ink hover:text-ember"
                      >
                        {tip.title}
                      </a>
                      <span className="block text-xs text-ink-faint">
                        {[authorLine(tip, zh), tip.venue, tip.year].filter(Boolean).join(" · ")}
                        {zh ? ` · 被引 ${fmt(tip.citedBy)} 次（OpenAlex）` : ` · cited by ${fmt(tip.citedBy)} (OpenAlex)`}
                      </span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="mt-1.5 text-xs text-ink-faint">
                {status === "error" ? (
                  <>
                    {zh ? "列表未能加载。" : "The list did not load."}{" "}
                    <button type="button" onClick={onLoad} className="text-teal hover:underline">
                      {zh ? "重试" : "Retry"}
                    </button>
                  </>
                ) : zh ? (
                  "正在加载…"
                ) : (
                  "Loading…"
                )}
              </p>
            )}
            {top && paper.citing > 5 && (
              <button type="button" onClick={() => setMore((v) => !v)} className="mt-2 text-xs text-teal hover:text-ember">
                {more ? (zh ? "收起" : "Show fewer") : zh ? `再显示 ${Math.min(10, paper.citing - 5)} 篇` : `Show ${Math.min(10, paper.citing - 5)} more`}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
