"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { useLanguage } from "@/lib/language-context";
import { openAlexUrl, type FieldShelfTips, type FieldShelfView, type TipsStatus } from "@/lib/field-shelf";
import { authorLine } from "./FieldShelfTooltip";

const fmt = (n: number) => n.toLocaleString("en-US");
/** Options listed under the box; every hit is still lit in the field. */
const LISTED = 50;

interface Props {
  view: FieldShelfView;
  tips: FieldShelfTips | null;
  status: TipsStatus;
  onLoad: () => void;
  query: string;
  onQuery: (q: string) => void;
  /** Square indexes matching the query, most-cited first (null until the payload is in). */
  hits: number[] | null;
  /** Show a square's details in the field (desktop tooltip, phone card). */
  onLocate: (i: number) => void;
  onShowOne: () => void;
}

/**
 * Find a citing work by author, title, venue or year (all words must match), or let the page pick one.
 * A combobox: ↑ ↓ move through the hits and show each in the field; Enter opens the active hit in
 * OpenAlex; Esc closes the list, then clears the box. The payload loads on first focus.
 */
export default function FieldShelfSearch({ view, tips, status, onLoad, query, onQuery, hits, onLocate, onShowOne }: Props) {
  const { language } = useLanguage();
  const zh = language === "zh";
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listed = hits ? hits.slice(0, LISTED) : [];
  const showList = open && listed.length > 0;

  const move = (k: number) => {
    if (listed.length === 0) return;
    const next = Math.max(0, Math.min(listed.length - 1, k));
    setActive(next);
    setOpen(true);
    onLocate(listed[next]);
    document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(active + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(active - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && listed[active] !== undefined) window.open(openAlexUrl(view.squares[listed[active]].id), "_blank", "noopener,noreferrer");
      else move(0);
    } else if (e.key === "Escape") {
      e.stopPropagation();
      if (showList) setOpen(false);
      else if (query) onQuery("");
    }
  };

  const statusText = (() => {
    if (status === "error") return null;
    if (query.trim().length < 2) return status === "loading" ? (zh ? "正在加载施引文献列表…" : "Loading the citing works…") : "";
    if (!tips) return zh ? "正在加载…" : "Loading…";
    if (!hits || hits.length === 0) return zh ? "没有匹配的施引文献" : "No citing work matches";
    return zh ? `找到 ${fmt(hits.length)} 篇匹配文献，已在图中以青色点亮` : `${fmt(hits.length)} match${hits.length === 1 ? "" : "es"}, lit in teal`;
  })();

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-[1_1_14rem]">
          <svg width="14" height="14" viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint" aria-hidden="true">
            <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
            aria-label={zh ? "查找施引文献" : "Find a citing work"}
            placeholder={zh ? "查找施引文献：作者、标题、期刊、年份" : "Find a citing work: author, title, venue, year"}
            value={query}
            onFocus={() => {
              onLoad();
              setOpen(true);
            }}
            onChange={(e) => {
              onQuery(e.target.value);
              setActive(-1);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            onBlur={() => setOpen(false)}
            className="w-full rounded-full border border-rule bg-paper py-1.5 pr-3 pl-8 text-sm text-ink placeholder:text-ink-faint focus:border-teal focus:ring-2 focus:ring-teal/25 focus:outline-none"
          />
          <ul
            id={listId}
            role="listbox"
            aria-label={zh ? "匹配的施引文献" : "Matching citing works"}
            className={`absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-auto rounded-xl border border-rule bg-paper p-1 shadow-[0_12px_32px_-12px_rgba(20,18,17,0.25)] ${showList ? "" : "hidden"}`}
          >
            {listed.map((i, k) => {
              const sq = view.squares[i];
              const tip = tips?.get(sq.id);
              if (!tip) return null;
              return (
                <li
                  key={sq.id}
                  id={`${listId}-${k}`}
                  role="option"
                  aria-selected={k === active}
                  onPointerDown={(e) => e.preventDefault()}
                  onPointerEnter={(e) => {
                    if (e.pointerType !== "mouse") return;
                    setActive(k);
                    onLocate(i);
                  }}
                  onClick={() => {
                    setActive(k);
                    onLocate(i);
                    setOpen(false);
                  }}
                  className={`cursor-pointer rounded-lg px-2.5 py-1.5 ${k === active ? "bg-teal-light" : ""}`}
                >
                  <span className="line-clamp-2 text-[13px] leading-snug text-ink">{tip.title}</span>
                  <span className="block truncate text-xs text-ink-muted">{[authorLine(tip, zh), tip.venue, tip.year].filter(Boolean).join(" · ")}</span>
                </li>
              );
            })}
            {hits && hits.length > LISTED && (
              <li role="presentation" className="px-2.5 py-1.5 text-xs text-ink-faint">
                {zh ? `先显示前 ${LISTED} 篇（共 ${fmt(hits.length)} 篇）；多输入几个词可缩小范围。` : `First ${LISTED} of ${fmt(hits.length)}; type more words to narrow.`}
              </li>
            )}
          </ul>
        </div>
        <button
          type="button"
          onClick={onShowOne}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-ember hover:text-ember"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 4.5h2.5c3 0 4 7 7 7H14M2 11.5h2.5c1.2 0 2-1.1 2.7-2.4M9.3 6.9c.7-1.3 1.5-2.4 2.7-2.4H14M12 2.5l2 2-2 2M12 9.5l2 2-2 2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {zh ? "随机看一篇" : "Show me one"}
        </button>
      </div>
      {status === "error" ? (
        <p className="mt-1.5 text-xs text-ink-muted" aria-live="polite">
          {zh ? "施引文献列表未能加载。" : "The list of citing works did not load."}{" "}
          <button type="button" onClick={onLoad} className="text-teal hover:underline">
            {zh ? "重试" : "Retry"}
          </button>
        </p>
      ) : (
        <p className="mt-1.5 min-h-4 text-xs text-ink-faint" aria-live="polite">
          {statusText}
        </p>
      )}
    </div>
  );
}
