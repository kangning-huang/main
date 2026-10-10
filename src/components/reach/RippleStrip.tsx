"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/lib/language-context";
import {
  RING_NAMES,
  sameFocus,
  type RippleFocus,
  type RippleKeyword,
  type RippleView,
  type RippleWeight,
} from "@/lib/ripple";

const fmt = (n: number) => n.toLocaleString("en-US");

interface Props {
  view: RippleView;
  weight: RippleWeight;
  active: RippleFocus;
  selected: RippleFocus;
  onSelect: (f: RippleFocus) => void;
  calloutRank: Map<string, number>;
  details: ReactNode;
}

/**
 * The Ripple circle unrolled for phones (< 720 px): one beeswarm row per theme,
 * reach distance on the horizontal axis (home topics at the left), same encoding.
 */
export default function RippleStrip({ view, weight, active, selected, onSelect, calloutRank, details }: Props) {
  const { language } = useLanguage();
  const S = view.layout.strip;
  const rOf = (k: RippleKeyword) => (weight === "absolute" ? k.strip.r : k.strip.rY);
  const kwText = (k: RippleKeyword) => (language === "zh" ? (k.zh ?? k.en) : k.en);
  const halo = { stroke: "var(--color-paper)", strokeWidth: 3, strokeLinejoin: "round" as const, paintOrder: "stroke" as const };

  return (
    <div onKeyDown={(e) => e.key === "Escape" && onSelect(null)}>
      <svg viewBox={`0 0 ${S.width} 18`} className="h-auto w-full" aria-hidden="true">
        {S.guides.map((g) => (
          <text
            key={g.d}
            x={g.x}
            y={12}
            textAnchor={g.d === 0 ? "start" : g.d === S.maxD ? "end" : "middle"}
            className="fill-ink-faint"
            style={{ fontSize: 10.5 }}
          >
            {language === "zh" ? RING_NAMES[g.d].short.zh : RING_NAMES[g.d].short.en}
          </text>
        ))}
      </svg>
      {view.themes.map((t) => {
        const row = S.rows.find((r) => r.theme === t.id);
        const kws = view.keywords.filter((k) => k.theme === t.id).sort((a, b) => b.works - a.works);
        const tf: RippleFocus = { kind: "theme", id: t.id };
        const open =
          sameFocus(selected, tf) || (selected?.kind === "keyword" && kws.some((k) => k.id === selected.id));
        const activeHere = active?.kind === "keyword" ? kws.find((k) => k.id === active.id) : undefined;
        return (
          <section key={t.id} className="border-t border-rule-faint pt-3 pb-2">
            <button
              type="button"
              onClick={() => onSelect(sameFocus(selected, tf) ? null : tf)}
              aria-pressed={sameFocus(selected, tf)}
              className="flex w-full items-baseline justify-between gap-3 text-left"
            >
              <span className="flex items-baseline gap-2 text-sm font-medium text-ink">
                <span className="inline-block h-2.5 w-2.5 shrink-0 translate-y-[1px] rounded-full" style={{ background: t.color }} />
                {language === "zh" ? t.zh : t.en}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-ink-muted">
                {weight === "absolute"
                  ? language === "zh"
                    ? `${fmt(t.works)} 篇`
                    : `${fmt(t.works)} works`
                  : language === "zh"
                    ? `每年 ${t.perYear.toFixed(0)}`
                    : `${t.perYear.toFixed(0)} / yr`}
              </span>
            </button>
            {row && row.height > 0 ? (
              <svg viewBox={`0 0 ${S.width} ${row.height}`} className="mt-1 h-auto w-full" role="group" aria-label={language === "zh" ? t.zh : t.en}>
                {S.guides.map((g) => (
                  <line key={g.d} x1={g.x} x2={g.x} y1={0} y2={row.height} stroke="var(--color-rule)" strokeDasharray={g.d === 0 ? undefined : "2 4"} />
                ))}
                {kws.map((k) => {
                  const f: RippleFocus = { kind: "keyword", id: k.id };
                  const r = rOf(k);
                  const isActive = sameFocus(active, f);
                  return (
                    <g
                      key={k.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={sameFocus(selected, f)}
                      aria-label={`${kwText(k)}: ${k.works} ${language === "zh" ? "篇施引" : "citing works"}`}
                      className="cursor-pointer outline-none"
                      onClick={() => onSelect(sameFocus(selected, f) ? null : f)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelect(sameFocus(selected, f) ? null : f);
                        }
                      }}
                    >
                      <circle cx={k.strip.x} cy={k.strip.y} r={Math.max(r + 3, 12.5)} fill="transparent" />
                      <circle
                        cx={k.strip.x}
                        cy={k.strip.y}
                        r={r}
                        className="ripple-anim"
                        fill={k.echo ? "var(--color-paper)" : t.color}
                        stroke={k.echo ? t.color : "var(--color-paper)"}
                        strokeWidth={k.echo ? 2 : 1.5}
                      />
                      {isActive && <circle cx={k.strip.x} cy={k.strip.y} r={r + 3.5} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} />}
                      {calloutRank.has(k.id) && (
                        <g transform={`translate(${(k.strip.x + r * 0.75 + 4).toFixed(1)},${(k.strip.y - r * 0.75 - 4).toFixed(1)})`} aria-hidden="true">
                          <circle r={7} fill="var(--color-ink)" stroke="var(--color-paper)" strokeWidth={1.25} />
                          <text dy="0.35em" textAnchor="middle" fill="var(--color-paper)" style={{ fontSize: 9, fontWeight: 700 }}>
                            {calloutRank.get(k.id)}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
                {kws.map((k) => {
                  const lab = k.strip.label[language];
                  const isActive = activeHere?.id === k.id;
                  if (!lab && !isActive) return null;
                  if (!lab) {
                    return (
                      <text key={k.id} x={k.strip.x} y={Math.max(10, k.strip.y - rOf(k) - 5)} textAnchor="middle" className="pointer-events-none fill-ink" style={{ fontSize: S.labelSize, fontWeight: 600, ...halo }}>
                        {kwText(k)}
                      </text>
                    );
                  }
                  return (
                    <g key={k.id} className="pointer-events-none">
                      {lab.leader && (
                        <line x1={lab.leader[0]} y1={lab.leader[1]} x2={lab.leader[2]} y2={lab.leader[3]} stroke="var(--color-ink-faint)" strokeWidth={0.75} />
                      )}
                      <text x={lab.x} y={lab.y} dy="0.35em" textAnchor={lab.anchor} className="fill-ink" style={{ fontSize: S.labelSize, fontWeight: isActive ? 600 : 400, ...halo }}>
                        {kwText(k)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <p className="mt-1 text-xs text-ink-faint">
                {language === "zh"
                  ? `起步：施引文献少于 ${view.meta.params.emergingBelowWorks} 篇，暂不显示关键词。`
                  : `Emerging: fewer than ${view.meta.params.emergingBelowWorks} citing works, so no keyword bubbles yet.`}
              </p>
            )}
            {open && <div className="mt-2 rounded-lg border border-rule bg-paper-warm/60 p-3">{details}</div>}
          </section>
        );
      })}
    </div>
  );
}
