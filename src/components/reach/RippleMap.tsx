"use client";

import { useId, useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useLanguage } from "@/lib/language-context";
import {
  RING_NAMES,
  annularSector,
  polar,
  ringFor,
  sameFocus,
  textArc,
  textOn,
  type RippleFocus,
  type RippleKeyword,
  type RippleTheme,
  type RippleView,
  type RippleWeight,
} from "@/lib/ripple";

const fmt = (n: number) => n.toLocaleString("en-US");
/** Rough DM Sans advance width; only decides whether an inside label still fits after a weight toggle. */
const estimateWidth = (s: string, size: number) =>
  [...s].reduce((w, ch) => w + (/[\u2e80-\u9fff]/.test(ch) ? 1 : 0.56), 0) * size;

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
}

/** Ripple circle (≥ 720 px). Hand-rolled SVG; every coordinate comes from build-ripple.mjs. */
export default function RippleMap({ view, weight, active, selected, onHover, onSelect, calloutRank, title, desc }: Props) {
  const { language } = useLanguage();
  const uid = useId().replace(/:/g, "");
  const L = view.layout.circle;
  const c = L.c;
  const [focused, setFocused] = useState<RippleFocus>(null);

  const themeOrder = useMemo(() => new Map(view.themes.map((t, i) => [t.id, i])), [view]);
  const themeById = useMemo(() => new Map(view.themes.map((t) => [t.id, t])), [view]);
  // Tab order: sectors' keywords from largest to smallest, sector by sector.
  const keywords = useMemo(
    () =>
      [...view.keywords].sort(
        (a, b) => (themeOrder.get(a.theme) ?? 0) - (themeOrder.get(b.theme) ?? 0) || b.works - a.works || (a.id < b.id ? -1 : 1)
      ),
    [view, themeOrder]
  );

  const valueOf = (t: RippleTheme) => (weight === "absolute" ? t.works : t.perYear);
  const maxTheme = Math.max(...view.themes.map(valueOf), 1);
  const band = (t: RippleTheme) => Math.max(2, (L.arcMax * valueOf(t)) / maxTheme);
  const rOf = (k: RippleKeyword) => (weight === "absolute" ? k.circle.r : k.circle.rY);
  const kwText = (k: RippleKeyword) => (language === "zh" ? (k.zh ?? k.en) : k.en);

  const activeTheme = active?.kind === "theme" ? active.id : null;
  const activeKw = active?.kind === "keyword" ? view.keywords.find((k) => k.id === active.id) ?? null : null;
  const kwLit = (k: RippleKeyword) =>
    activeTheme ? k.theme === activeTheme || k.also.includes(activeTheme) : activeKw ? k.id === activeKw.id : true;
  const themeLit = (t: RippleTheme) =>
    activeTheme ? t.id === activeTheme : activeKw ? t.id === activeKw.theme || activeKw.also.includes(t.id) : true;

  const angleOf = (k: RippleKeyword) => ((Math.atan2(k.circle.x - c, c - k.circle.y) * 180) / Math.PI + 360) % 360;

  /** Link from a theme's volume band to a keyword bubble (radial inside the sector, a chord across it). */
  const link = (t: RippleTheme, k: RippleKeyword) => {
    const [a0, a1] = t.angle;
    const ang = angleOf(k);
    const inside = ang >= a0 && ang <= a1;
    const startAng = inside ? ang : Math.abs(ang - a0) < Math.abs(ang - a1) ? a0 + 1 : a1 - 1;
    const [sx, sy] = polar(c, L.arcIn + band(t) + 1.5, startAng);
    const r = rOf(k) + 1.5;
    const dx = sx - k.circle.x;
    const dy = sy - k.circle.y;
    const len = Math.hypot(dx, dy) || 1;
    const ex = k.circle.x + (dx / len) * r;
    const ey = k.circle.y + (dy / len) * r;
    const pull = inside ? 1 : 0.35;
    const qx = c + ((sx + ex) / 2 - c) * pull;
    const qy = c + ((sy + ey) / 2 - c) * pull;
    return `M${sx.toFixed(1)},${sy.toFixed(1)}Q${qx.toFixed(1)},${qy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
  };

  const links: { key: string; d: string; color: string }[] = [];
  if (activeTheme) {
    const t = themeById.get(activeTheme);
    if (t) for (const k of view.keywords) if (k.theme === t.id || k.also.includes(t.id)) links.push({ key: `${t.id}-${k.id}`, d: link(t, k), color: t.color });
  } else if (activeKw) {
    for (const tid of [activeKw.theme, ...activeKw.also]) {
      const t = themeById.get(tid);
      if (t) links.push({ key: `${tid}-${activeKw.id}`, d: link(t, activeKw), color: t.color });
    }
  }

  const keyHandler = (f: RippleFocus) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(sameFocus(selected, f) ? null : f);
    }
  };
  const hoverHandlers = (f: RippleFocus) => ({
    onPointerEnter: (e: PointerEvent) => {
      if (e.pointerType === "mouse") onHover(f);
    },
    onPointerLeave: (e: PointerEvent) => {
      if (e.pointerType === "mouse") onHover(null);
    },
    onFocus: () => {
      setFocused(f);
      onHover(f);
    },
    onBlur: () => {
      setFocused(null);
      onHover(null);
    },
    onClick: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onSelect(sameFocus(selected, f) ? null : f);
    },
    onKeyDown: keyHandler(f),
  });

  const rimR = L.rim;
  const halo = { stroke: "var(--color-paper)", strokeWidth: 3.5, strokeLinejoin: "round" as const, paintOrder: "stroke" as const };

  return (
    <svg
      viewBox={`0 0 ${L.size} ${L.size}`}
      className="h-auto w-full select-none"
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
      <title id={`${uid}-title`}>{title}</title>
      <desc id={`${uid}-desc`}>{desc}</desc>
      <defs>
        {view.themes.map((t) => {
          const [a0, a1] = t.angle;
          const mid = (a0 + a1) / 2;
          const span = Math.max(a1 - a0, 40);
          const top = textArc(c, rimR + 13, mid - span / 2, mid + span / 2);
          const name = textArc(c, top.flipped ? rimR + 21 : rimR + 27, mid - span / 2, mid + span / 2);
          const count = textArc(c, top.flipped ? rimR + 35 : rimR + 13, mid - span / 2, mid + span / 2);
          return (
            <g key={t.id}>
              <path id={`${uid}-name-${t.id}`} d={name.d} />
              <path id={`${uid}-count-${t.id}`} d={count.d} />
            </g>
          );
        })}
      </defs>

      {/* Click on empty space returns the map to rest. */}
      <rect width={L.size} height={L.size} fill="transparent" onClick={() => onSelect(null)} />

      {/* Guide rings: distance from Ken's own topics. */}
      <g aria-hidden="true">
        {L.rings.map((ring) => (
          <circle key={ring.d} cx={c} cy={c} r={ring.r} fill="none" stroke="var(--color-rule)" strokeWidth={1} strokeDasharray={ring.d === 0 ? undefined : "2 4"} />
        ))}
        {L.rings.map((ring) => (
          <text
            key={ring.d}
            x={c}
            y={c - ring.r - 6}
            textAnchor="middle"
            className="fill-ink-faint"
            style={{ fontSize: L.ringLabelSize, ...halo }}
          >
            {language === "zh" ? RING_NAMES[ring.d].zh : RING_NAMES[ring.d].en}
          </text>
        ))}
      </g>

      {/* Sectors: rim arc + name, inner volume band. */}
      {view.themes.map((t) => {
        const [a0, a1] = t.angle;
        const f: RippleFocus = { kind: "theme", id: t.id };
        const lit = themeLit(t);
        const value = valueOf(t);
        const countText =
          weight === "absolute"
            ? language === "zh"
              ? `${fmt(t.works)} 篇施引${t.emerging ? " · 起步" : ""}`
              : `${fmt(t.works)} citing works${t.emerging ? " · emerging" : ""}`
            : language === "zh"
              ? `每年 ${value.toFixed(0)} 次${t.emerging ? " · 起步" : ""}`
              : `${value.toFixed(0)} cites / yr${t.emerging ? " · emerging" : ""}`;
        const label = `${language === "zh" ? t.zh : t.en}: ${countText}`;
        return (
          <g
            key={t.id}
            role="button"
            tabIndex={0}
            aria-label={label}
            aria-pressed={sameFocus(selected, f)}
            className="cursor-pointer outline-none ripple-fade"
            style={{ opacity: lit ? 1 : 0.3 }}
            {...hoverHandlers(f)}
          >
            <path d={annularSector(c, L.arcIn - 6, L.arcIn + L.arcMax + 10, a0, a1)} fill="transparent" />
            <path d={annularSector(c, rimR - 8, rimR + 46, a0, a1)} fill="transparent" />
            <path d={annularSector(c, L.arcIn, L.arcIn + band(t), a0, a1)} fill={t.color} className="ripple-anim" />
            <path d={annularSector(c, rimR - 1.5, rimR + 1.5, a0, a1)} fill={t.color} />
            <text className="fill-ink" style={{ fontSize: 13, fontWeight: 600 }}>
              <textPath href={`#${uid}-name-${t.id}`} startOffset="50%" textAnchor="middle">
                {language === "zh" ? t.zh : t.en}
              </textPath>
            </text>
            <text className="fill-ink-muted" style={{ fontSize: 11 }}>
              <textPath href={`#${uid}-count-${t.id}`} startOffset="50%" textAnchor="middle">
                {countText}
              </textPath>
            </text>
            {focused && sameFocus(focused, f) && (
              <path d={annularSector(c, L.arcIn - 4, L.arcIn + band(t) + 4, a0, a1)} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} />
            )}
          </g>
        );
      })}

      {/* Centre disc: the lens's citing works. */}
      <g aria-hidden="true">
        <circle cx={c} cy={c} r={L.disc} fill="var(--color-paper-warm)" stroke="var(--color-rule)" />
        <text x={c} y={c - 4} textAnchor="middle" className="fill-ink" style={{ fontSize: 22, fontWeight: 600 }}>
          {fmt(view.meta.citingWorks)}
        </text>
        <text x={c} y={c + 14} textAnchor="middle" className="fill-ink-muted" style={{ fontSize: 10.5 }}>
          {language === "zh" ? "篇施引文献" : "citing works"}
        </text>
        {weight === "perYear" && (
          <text x={c} y={c + 28} textAnchor="middle" className="fill-ink-faint" style={{ fontSize: 9.5 }}>
            {language === "zh" ? `≈ 每年 ${view.meta.perYearTotal.toFixed(0)}` : `≈ ${view.meta.perYearTotal.toFixed(0)} / yr`}
          </text>
        )}
      </g>

      {/* Membership links, drawn only when a theme or keyword is in focus. */}
      <g aria-hidden="true" fill="none">
        {links.map((l) => (
          <path key={l.key} d={l.d} stroke={l.color} strokeWidth={1.5} strokeOpacity={0.7} strokeLinecap="round" />
        ))}
      </g>

      {/* Bubbles. Filled = new vocabulary; outline = echo (also on Ken's own papers in that theme). */}
      {keywords.map((k) => {
        const t = themeById.get(k.theme);
        if (!t) return null;
        const f: RippleFocus = { kind: "keyword", id: k.id };
        const r = rOf(k);
        const lit = kwLit(k);
        const isActive = sameFocus(active, f);
        const ring = ringFor(k.dMean);
        const aria =
          language === "zh"
            ? `${kwText(k)}：${t.zh}，${k.works} 篇施引，${Math.round((100 * k.outside) / k.works)}% 在本人主题之外，${k.echo ? "本人论文亦有此词" : "新词汇"}`
            : `${k.en}: ${k.works} citing works in ${t.en}, ${Math.round((100 * k.outside) / k.works)}% outside home topics, mostly ${ring.en}; ${k.echo ? "echo of Ken's own keywords" : "new vocabulary"}`;
        return (
          <g
            key={k.id}
            role="button"
            tabIndex={0}
            aria-label={aria}
            aria-pressed={sameFocus(selected, f)}
            className="cursor-pointer outline-none ripple-anim animate-fade-in"
            style={{ transform: `translate(${k.circle.x}px, ${k.circle.y}px)`, opacity: lit ? 1 : 0.16 }}
            {...hoverHandlers(f)}
          >
            <circle r={Math.max(r + 3, 13)} fill="transparent" />
            <circle
              r={r}
              className="ripple-anim"
              fill={k.echo ? "var(--color-paper)" : t.color}
              stroke={k.echo ? t.color : "var(--color-paper)"}
              strokeWidth={k.echo ? 2.25 : 1.5}
            />
            {(isActive || (focused && sameFocus(focused, f))) && (
              <circle r={r + 4} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} />
            )}
          </g>
        );
      })}

      {/* Labels: the largest bubbles at rest; any bubble while it is in focus. */}
      <g>
        {keywords.map((k) => {
          const t = themeById.get(k.theme);
          if (!t) return null;
          const f: RippleFocus = { kind: "keyword", id: k.id };
          const isActive = sameFocus(active, f);
          const rest = k.circle.label[language] ?? null;
          const lit = kwLit(k);
          if (!rest && !isActive) return null;
          if (!lit && !isActive) return null;
          const r = rOf(k);
          const fitsInside = estimateWidth(kwText(k), L.labelSize) + 6 <= 2 * r;
          if (!rest || (rest.inside && !fitsInside)) {
            // Transient label above the bubble.
            return (
              <text
                key={k.id}
                x={k.circle.x}
                y={k.circle.y - r - 7}
                textAnchor="middle"
                className="pointer-events-none fill-ink"
                style={{ fontSize: L.labelSize + 1, fontWeight: 600, ...halo }}
              >
                {kwText(k)}
              </text>
            );
          }
          const fill = rest.inside ? (k.echo ? "var(--color-ink)" : textOn(t.color)) : "var(--color-ink)";
          return (
            <g key={k.id} className="pointer-events-none">
              {rest.leader && (
                <line
                  x1={rest.leader[0]}
                  y1={rest.leader[1]}
                  x2={rest.leader[2]}
                  y2={rest.leader[3]}
                  stroke="var(--color-ink-faint)"
                  strokeWidth={0.75}
                />
              )}
              <text
                x={rest.x}
                y={rest.y}
                dy={rest.lines ? undefined : "0.35em"}
                textAnchor={rest.anchor}
                fill={fill}
                style={{ fontSize: L.labelSize, fontWeight: isActive ? 600 : 500, ...(rest.inside ? {} : halo) }}
              >
                {rest.lines
                  ? rest.lines.map((line, i) => (
                      <tspan key={i} x={rest.x} dy={i === 0 ? `${(0.35 - ((rest.lines!.length - 1) * 1.15) / 2).toFixed(3)}em` : "1.15em"}>
                        {line}
                      </tspan>
                    ))
                  : kwText(k)}
              </text>
            </g>
          );
        })}
      </g>

      {/* Numbered callout badges. */}
      <g aria-hidden="true" className="pointer-events-none">
        {view.keywords
          .filter((k) => calloutRank.has(k.id))
          .map((k) => {
            const r = rOf(k);
            const ang = angleOf(k);
            // Just counter-clockwise of the outward direction, clear of the radial label slot.
            const a = ((ang - 50) * Math.PI) / 180;
            const bx = k.circle.x + Math.sin(a) * (r + 7);
            const by = k.circle.y - Math.cos(a) * (r + 7);
            return (
              <g key={k.id} transform={`translate(${bx.toFixed(1)},${by.toFixed(1)})`}>
                <circle r={8.5} fill="var(--color-ink)" stroke="var(--color-paper)" strokeWidth={1.5} />
                <text dy="0.35em" textAnchor="middle" fill="var(--color-paper)" style={{ fontSize: 10.5, fontWeight: 700 }}>
                  {calloutRank.get(k.id)}
                </text>
              </g>
            );
          })}
      </g>
    </svg>
  );
}
