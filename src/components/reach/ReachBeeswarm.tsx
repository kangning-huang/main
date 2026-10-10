"use client";

import { useId, useState, type ReactNode } from "react";
import { useLanguage } from "@/lib/language-context";
import { RING_NAMES, sameFocus, type RippleFocus, type RippleKeyword, type RippleTheme, type RippleView, type RippleWeight } from "@/lib/ripple";
import { getBeeswarm, type BeeswarmLayout } from "@/lib/reach-alt";
import { CalloutBadge, KeywordLabel, halo, markHandlers } from "./ReachAltMarks";

const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (a: number, b: number) => (b > 0 ? Math.round((100 * a) / b) : 0);

interface Props {
  view: RippleView;
  weight: RippleWeight;
  active: RippleFocus;
  selected: RippleFocus;
  onHover: (f: RippleFocus) => void;
  onSelect: (f: RippleFocus) => void;
  calloutRank: Map<string, number>;
  title: string;
  desc: string;
  /** Phones: details open under the row that holds the selection. */
  details: ReactNode;
}

/**
 * Preview view A: one beeswarm row per theme, x = mean reach distance (the Ripple's radius,
 * unrolled), at every width. Up and down within a row only keeps bubbles apart.
 */
export default function ReachBeeswarm({ view, weight, active, selected, onHover, onSelect, calloutRank, title, desc, details }: Props) {
  const { language } = useLanguage();
  const zh = language === "zh";
  const layouts = getBeeswarm(view.meta.lens);
  const uid = useId().replace(/:/g, "");
  const [focused, setFocused] = useState<RippleFocus>(null);

  const activeTheme = active?.kind === "theme" ? active.id : null;
  const activeKw = active?.kind === "keyword" ? active.id : null;
  const kwLit = (k: RippleKeyword) => (activeTheme ? k.theme === activeTheme || k.also.includes(activeTheme) : activeKw ? k.id === activeKw : true);
  const kwText = (k: RippleKeyword) => (zh ? (k.zh ?? k.en) : k.en);
  const handlers = (f: RippleFocus) => markHandlers(f, { selected, onHover, onSelect, setFocused });

  const axis = (L: BeeswarmLayout, short: boolean) => (
    <svg viewBox={`0 0 ${L.width} 20`} className="h-auto w-full" aria-hidden="true">
      {L.guides.map((g) => {
        const name = RING_NAMES[g.d];
        return (
          <text
            key={g.d}
            x={g.x}
            y={14}
            textAnchor={g.d === 0 ? "start" : g.d === L.maxD ? "end" : "middle"}
            className="fill-ink-muted"
            style={{ fontSize: short ? 10.5 : 11.5 }}
          >
            {short ? (zh ? name.short.zh : name.short.en) : zh ? name.zh : name.en}
          </text>
        );
      })}
    </svg>
  );

  const row = (t: RippleTheme, L: BeeswarmLayout, height: number) => {
    const kws = view.keywords.filter((k) => k.theme === t.id).sort((a, b) => b.works - a.works || (a.id < b.id ? -1 : 1));
    return (
      <svg
        viewBox={`0 0 ${L.width} ${height}`}
        className="h-auto w-full select-none overflow-visible"
        role="group"
        aria-label={zh ? t.zh : t.en}
        onClick={() => onSelect(null)}
      >
        {L.guides.map((g) => (
          <line key={g.d} x1={g.x} x2={g.x} y1={0} y2={height} stroke={g.d === 0 ? "var(--color-rule)" : "var(--color-rule-faint)"} strokeWidth={1} />
        ))}
        {kws.map((k) => {
          const n = L.nodes[k.id];
          const f: RippleFocus = { kind: "keyword", id: k.id };
          const r = weight === "absolute" ? n.r : n.rY;
          const ring = sameFocus(active, f) || (focused !== null && sameFocus(focused, f));
          const aria = zh
            ? `${kwText(k)}：${t.zh}，${k.works} 篇施引，平均距离 ${k.dMean.toFixed(2)}，${pct(k.outside, k.works)}% 在本人主题之外，${k.echo ? "本人论文亦有此词" : "新词汇"}`
            : `${k.en}: ${k.works} citing works in ${t.en}, mean reach ${k.dMean.toFixed(2)}, ${pct(k.outside, k.works)}% outside home topics; ${k.echo ? "echo of Ken's own keywords" : "new vocabulary"}`;
          return (
            <g
              key={k.id}
              role="button"
              tabIndex={0}
              aria-label={aria}
              aria-pressed={sameFocus(selected, f)}
              className="cursor-pointer outline-none ripple-fade"
              style={{ opacity: kwLit(k) ? 1 : 0.16 }}
              {...handlers(f)}
            >
              <circle cx={n.x} cy={n.y} r={Math.max(Math.max(n.r, n.rY) + 3, 12)} fill="transparent" />
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                className="ripple-anim"
                fill={k.echo ? "var(--color-paper)" : t.color}
                stroke={k.echo ? t.color : "var(--color-paper)"}
                strokeWidth={k.echo ? 2 : 1.5}
              />
              {ring && <circle cx={n.x} cy={n.y} r={r + 3.5} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} />}
            </g>
          );
        })}
        {kws.map((k) => {
          const n = L.nodes[k.id];
          const isActive = activeKw === k.id;
          if (!kwLit(k) && !isActive) return null;
          const rest = n.label[language];
          const rank = calloutRank.get(k.id);
          if (rest) {
            return (
              <g key={k.id}>
                <KeywordLabel label={rest} text={kwText(k)} size={L.labelSize} rank={rank} badgeR={L.badge} strong={isActive} />
                {rank !== undefined && !rest.badge && n.badge && <CalloutBadge x={n.badge[0]} y={n.badge[1]} r={L.badge} n={rank} />}
              </g>
            );
          }
          return (
            <g key={k.id}>
              {rank !== undefined && n.badge && <CalloutBadge x={n.badge[0]} y={n.badge[1]} r={L.badge} n={rank} />}
              {isActive && (
                <text
                  x={n.x}
                  y={n.y - Math.max(n.r, n.rY) - 7}
                  textAnchor="middle"
                  className="pointer-events-none fill-ink"
                  style={{ fontSize: L.labelSize + 0.5, fontWeight: 600, ...halo() }}
                >
                  {kwText(k)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div
      role="group"
      aria-labelledby={`${uid}-title`}
      aria-describedby={`${uid}-desc`}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onSelect(null);
          onHover(null);
        }
      }}
    >
      <p id={`${uid}-title`} className="sr-only">
        {title}
      </p>
      <p id={`${uid}-desc`} className="sr-only">
        {desc}
      </p>
      {/* Distance axis, kept in view under the site header while the rows scroll past. */}
      <div className="sticky top-16 z-10 border-b border-rule-faint bg-paper/95 pt-1 backdrop-blur-sm">
        <div className="hidden min-[720px]:block">{axis(layouts.wide, false)}</div>
        <div className="min-[720px]:hidden">{axis(layouts.narrow, true)}</div>
      </div>
      {view.themes.map((t) => {
        const tf: RippleFocus = { kind: "theme", id: t.id };
        const wide = layouts.wide.rows.find((r) => r.theme === t.id);
        const narrow = layouts.narrow.rows.find((r) => r.theme === t.id);
        const open = sameFocus(selected, tf) || (selected?.kind === "keyword" && view.keywords.some((k) => k.id === selected.id && k.theme === t.id));
        const dim = activeTheme !== null && activeTheme !== t.id;
        const volume =
          weight === "absolute"
            ? zh
              ? `${fmt(t.works)} 篇施引`
              : `${fmt(t.works)} citing work${t.works === 1 ? "" : "s"}`
            : zh
              ? `每年 ${t.perYear.toFixed(0)} 次`
              : `${t.perYear.toFixed(0)} cites / yr`;
        return (
          <section key={t.id} className="border-t border-rule-faint pt-2.5 pb-1.5 first-of-type:border-t-0">
            <button
              type="button"
              onClick={() => onSelect(sameFocus(selected, tf) ? null : tf)}
              onPointerEnter={(e) => e.pointerType === "mouse" && onHover(tf)}
              onPointerLeave={(e) => e.pointerType === "mouse" && onHover(null)}
              aria-pressed={sameFocus(selected, tf)}
              className={`flex w-full items-baseline justify-between gap-3 text-left transition-opacity ${dim ? "opacity-40" : ""}`}
            >
              <span className="flex items-baseline gap-2 text-sm font-medium text-ink">
                <span className="inline-block h-2.5 w-2.5 shrink-0 translate-y-[1px] rounded-full" style={{ background: t.color }} aria-hidden="true" />
                {zh ? t.zh : t.en}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-ink-muted">
                {volume}
                <span className="hidden min-[720px]:inline">
                  {zh ? ` · ${pct(t.outside, t.works)}% 在本人主题之外` : ` · ${pct(t.outside, t.works)}% outside home topics`}
                </span>
              </span>
            </button>
            {wide && wide.height > 0 && narrow ? (
              <>
                <div className="mt-1 hidden min-[720px]:block">{row(t, layouts.wide, wide.height)}</div>
                <div className="mt-1 min-[720px]:hidden">{row(t, layouts.narrow, narrow.height)}</div>
              </>
            ) : (
              <p className="mt-1 text-xs text-ink-faint">
                {zh
                  ? `起步：施引文献少于 ${view.meta.params.emergingBelowWorks} 篇，暂不显示关键词。`
                  : `Emerging: fewer than ${view.meta.params.emergingBelowWorks} citing works, so no keyword bubbles yet.`}
              </p>
            )}
            {open && details && <div className="mt-2 rounded-lg border border-rule bg-paper-warm/60 p-3 min-[720px]:hidden">{details}</div>}
          </section>
        );
      })}
    </div>
  );
}
