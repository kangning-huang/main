"use client";

import { useId, useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useLanguage } from "@/lib/language-context";
import type { RippleWeight } from "@/lib/ripple";
import {
  restDrift,
  sameConstellationFocus,
  starPoints,
  type ConstellationFocus,
  type ConstellationKeyword,
  type ConstellationPaper,
  type ConstellationView,
} from "@/lib/constellation";
import { KeywordLabel, halo } from "./ReachAltMarks";

const fmt = (n: number) => n.toLocaleString("en-US");

interface Props {
  view: ConstellationView;
  weight: RippleWeight;
  active: ConstellationFocus;
  selected: ConstellationFocus;
  onHover: (f: ConstellationFocus) => void;
  onSelect: (f: ConstellationFocus) => void;
  /** Every star's drift arrow, not only the largest few. */
  allDrift: boolean;
  title: string;
  desc: string;
}

/**
 * Constellation map (≥ 720 px). Keywords of citing works sit near keywords that mean similar
 * things; stars are Ken's papers at the mean position of their citers' keywords. Hand-rolled
 * SVG: every coordinate comes from build-constellation.mjs, the browser only tracks focus.
 */
export default function ConstellationMap({ view, weight, active, selected, onHover, onSelect, allDrift, title, desc }: Props) {
  const { language } = useLanguage();
  const zh = language === "zh";
  const uid = useId().replace(/:/g, "");
  const L = view.meta.layout;
  const W = L.width;
  const H = L.height;
  const [focused, setFocused] = useState<ConstellationFocus>(null);

  const regionById = useMemo(() => new Map(view.regions.map((r) => [r.id, r])), [view]);
  // A region with no keyword drawn in this lens (e.g. no lead-author citers) is left out.
  const regions = useMemo(() => view.regions.filter((r) => r.keywords > 0), [view]);
  const kwById = useMemo(() => new Map(view.keywords.map((k) => [k.id, k])), [view]);
  // Tab order: region by region (largest first), keywords largest first.
  const keywords = useMemo(() => {
    const order = new Map(view.regions.map((r, i) => [r.id, i]));
    return [...view.keywords].sort((a, b) => (order.get(a.region) ?? 0) - (order.get(b.region) ?? 0) || b.works - a.works || (a.id < b.id ? -1 : 1));
  }, [view]);
  const papers = useMemo(() => [...view.papers].sort((a, b) => b.works - a.works || (a.doi < b.doi ? -1 : 1)), [view]);
  const rest = useMemo(() => restDrift(view), [view]);

  const px = (x: number) => x * W;
  const py = (y: number) => y * H;
  const rOf = (k: ConstellationKeyword) => (weight === "absolute" ? k.r : k.rY);
  const kwText = (k: ConstellationKeyword) => (zh ? (k.zh ?? k.en) : k.en);
  const regionName = (id: string) => {
    const r = regionById.get(id);
    return r ? (zh ? r.zh : r.en) : id;
  };

  const activePaper = active?.kind === "paper" ? (view.papers.find((p) => p.doi === active.id) ?? null) : null;
  const activeKw = active?.kind === "keyword" ? (kwById.get(active.id) ?? null) : null;
  const activeRegion = active?.kind === "region" && regionById.has(active.id) ? active.id : null;
  const paperKws = useMemo(
    () => (activePaper ? new Set(view.keywords.filter((k) => k.papers.includes(activePaper.doi)).map((k) => k.id)) : null),
    [activePaper, view]
  );
  const kwLit = (k: ConstellationKeyword) =>
    activePaper ? !!paperKws?.has(k.id) : activeKw ? k.id === activeKw.id : activeRegion ? k.region === activeRegion : true;
  const paperLit = (p: ConstellationPaper) =>
    activePaper
      ? p.doi === activePaper.doi
      : activeKw
        ? activeKw.papers.includes(p.doi)
        : activeRegion
          ? p.landRegion === activeRegion || !!p.bridge?.includes(activeRegion)
          : true;

  // Lines between stars and keywords.
  const nOf = (k: ConstellationKeyword, doi: string) => k.cited.find((c) => c.doi === doi)?.n ?? 0;
  const lines: {
    key: string;
    p: ConstellationPaper;
    k: ConstellationKeyword;
    w: number;
    strong: boolean;
  }[] = [];
  if (activePaper) {
    const max = Math.max(1, ...view.keywords.map((k) => nOf(k, activePaper.doi)));
    for (const k of view.keywords) {
      const n = nOf(k, activePaper.doi);
      if (n > 0 && rOf(k) > 0)
        lines.push({
          key: `${activePaper.doi}-${k.id}`,
          p: activePaper,
          k,
          w: 0.6 + 2.2 * Math.sqrt(n / max),
          strong: true,
        });
    }
  } else if (activeKw) {
    const max = Math.max(1, ...activeKw.cited.map((c) => c.n));
    for (const p of view.papers) {
      const n = nOf(activeKw, p.doi);
      if (n > 0)
        lines.push({
          key: `${p.doi}-${activeKw.id}`,
          p,
          k: activeKw,
          w: 0.6 + 2.2 * Math.sqrt(n / max),
          strong: true,
        });
    }
  } else {
    for (const p of view.papers) {
      for (const id of p.lines) {
        const k = kwById.get(id);
        if (!k || rOf(k) <= 0) continue;
        if (activeRegion && k.region !== activeRegion) continue;
        lines.push({ key: `${p.doi}-${id}`, p, k, w: 1, strong: false });
      }
    }
  }
  const segment = (p: ConstellationPaper, k: ConstellationKeyword) => {
    const x1 = px(p.landing[0]);
    const y1 = py(p.landing[1]);
    const x2 = px(k.x);
    const y2 = py(k.y);
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const a = L.starR + 2;
    const b = rOf(k) + 1.5;
    return {
      x1: x1 + ((x2 - x1) * a) / len,
      y1: y1 + ((y2 - y1) * a) / len,
      x2: x2 - ((x2 - x1) * b) / len,
      y2: y2 - ((y2 - y1) * b) / len,
      len,
    };
  };

  const driftShown = (p: ConstellationPaper) => (activePaper ? p.doi === activePaper.doi : allDrift || rest.has(p.doi));

  const handlers = (f: ConstellationFocus) => ({
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
      onSelect(sameConstellationFocus(selected, f) ? null : f);
    },
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(sameConstellationFocus(selected, f) ? null : f);
      }
    },
  });
  const isFocused = (f: ConstellationFocus) => focused !== null && sameConstellationFocus(focused, f);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
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
        <marker id={`${uid}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="var(--color-ink)" />
        </marker>
      </defs>

      {/* Click on empty space returns the map to rest. */}
      <rect width={W} height={H} fill="transparent" onClick={() => onSelect(null)} />

      {/* Regions: soft tints; the one in focus strengthens. */}
      <g aria-hidden="true">
        {regions.map((r) => {
          const on = activeRegion === r.id;
          const s = r.shape;
          return (
            <ellipse
              key={r.id}
              cx={s.cx}
              cy={s.cy}
              rx={s.rx}
              ry={s.ry}
              transform={s.rot ? `rotate(${s.rot} ${s.cx} ${s.cy})` : undefined}
              fill={r.color}
              className="ripple-fade"
              style={{ fillOpacity: on ? 0.17 : activeRegion ? 0.045 : 0.08 }}
            />
          );
        })}
      </g>

      {/* Faint lines from each star to its top keywords; every keyword of the star in focus. */}
      <g aria-hidden="true" className="pointer-events-none">
        {lines.map(({ key, p, k, w, strong }) => {
          const s = segment(p, k);
          if (s.len < L.starR + rOf(k) + 4) return null;
          return (
            <line
              key={key}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke={strong ? "var(--color-ink-muted)" : "var(--color-ink-faint)"}
              strokeOpacity={strong ? 0.55 : paperLit(p) ? 0.5 : 0.15}
              strokeWidth={w}
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* Region names. */}
      {regions.map((r) => {
        const f: ConstellationFocus = { kind: "region", id: r.id };
        const on = activeRegion === r.id;
        const faded = (activeRegion && !on) || (activeKw && activeKw.region !== r.id);
        const label = zh ? r.zh : r.en;
        const w = label.length * L.regionSize * (zh ? 1 : 0.56) + 16;
        return (
          <g
            key={r.id}
            role="button"
            tabIndex={0}
            aria-label={zh ? `${r.zh}：${fmt(r.works)} 篇施引，${r.keywords} 个关键词` : `${r.en}: ${fmt(r.works)} citing works, ${r.keywords} keywords`}
            aria-pressed={sameConstellationFocus(selected, f)}
            className="cursor-pointer outline-none ripple-fade"
            style={{ opacity: faded ? 0.4 : 1 }}
            {...handlers(f)}
          >
            <rect x={r.name.x - w / 2} y={r.name.y - 11} width={w} height={22} rx={11} fill="transparent" />
            <text
              x={r.name.x}
              y={r.name.y}
              dy="0.35em"
              textAnchor="middle"
              className={on ? "fill-ink" : "fill-ink-muted"}
              style={{ fontSize: L.regionSize, fontWeight: 600, ...halo(3) }}
            >
              {label}
            </text>
            {(on || isFocused(f)) && (
              <line x1={r.name.x - w / 2 + 8} x2={r.name.x + w / 2 - 8} y1={r.name.y + 10} y2={r.name.y + 10} stroke={r.color} strokeWidth={2} />
            )}
          </g>
        );
      })}

      {/* Keyword discs: area = citing works; filled = new vocabulary, hollow = also on Ken's own papers. */}
      {keywords.map((k) => {
        const r = rOf(k);
        const color = regionById.get(k.region)?.color ?? "var(--color-ink-muted)";
        const x = px(k.x);
        const y = py(k.y);
        if (r <= 0) {
          // Too few citing works in this lens: a faint placeholder keeps the region's shape.
          if (!regionById.get(k.region)?.keywords) return null;
          return <circle key={k.id} cx={x} cy={y} r={2.5} fill="none" stroke={color} strokeOpacity={0.4} strokeDasharray="1.5 1.5" aria-hidden="true" />;
        }
        const f: ConstellationFocus = { kind: "keyword", id: k.id };
        const lit = kwLit(k);
        const ring = sameConstellationFocus(active, f) || isFocused(f);
        const aria = zh
          ? `${kwText(k)}：${regionName(k.region)}，${fmt(k.works)} 篇施引，${k.echo ? "本人论文亦有此词" : "新词汇"}`
          : `${k.en}: ${fmt(k.works)} citing works, ${regionName(k.region)}; ${k.echo ? "also a keyword on Ken's own papers" : "new vocabulary"}`;
        return (
          <g
            key={k.id}
            role="button"
            tabIndex={0}
            aria-label={aria}
            aria-pressed={sameConstellationFocus(selected, f)}
            className="cursor-pointer outline-none ripple-fade"
            style={{ opacity: lit ? 1 : 0.18 }}
            {...handlers(f)}
          >
            <circle cx={x} cy={y} r={Math.max(r + 3, 9)} fill="transparent" />
            <circle
              cx={x}
              cy={y}
              r={r}
              className="ripple-anim"
              fill={k.echo ? "none" : color}
              fillOpacity={0.45}
              stroke={color}
              strokeWidth={k.echo ? 1.75 : 1.25}
            />
            {ring && <circle cx={x} cy={y} r={r + 4} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} />}
          </g>
        );
      })}

      {/* Drift: from where a paper's own keywords sit (aim) to where its citers' sit (landing). */}
      <g aria-hidden="true" className="pointer-events-none">
        {papers.filter(driftShown).map((p) => {
          const ax = px(p.aim[0]);
          const ay = py(p.aim[1]);
          const lx = px(p.landing[0]);
          const ly = py(p.landing[1]);
          const len = Math.hypot(lx - ax, ly - ay);
          if (len < L.starR + 10) return null;
          const ux = (lx - ax) / len;
          const uy = (ly - ay) / len;
          const right = ux < 0;
          // "aim" is spelled out on the arrows shown at rest and on the paper in focus; with every arrow on, the legend carries it.
          const named = activePaper ? p.doi === activePaper.doi : rest.has(p.doi);
          return (
            <g key={p.doi} className="ripple-fade" style={{ opacity: paperLit(p) ? 1 : 0.2 }}>
              <path
                d={`M${(ax + ux * 5).toFixed(1)} ${(ay + uy * 5).toFixed(1)}L${(lx - ux * (L.starR + 3)).toFixed(1)} ${(ly - uy * (L.starR + 3)).toFixed(1)}`}
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth={1.25}
                strokeDasharray="4 3"
                markerEnd={`url(#${uid}-arrow)`}
              />
              <circle cx={ax} cy={ay} r={4} fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth={1.5} />
              {named && (
                <text
                  x={ax + (right ? 7 : -7)}
                  y={ay}
                  dy="0.35em"
                  textAnchor={right ? "start" : "end"}
                  className="fill-ink-muted"
                  style={{ fontSize: 10.5, ...halo(2.5) }}
                >
                  {zh ? "原意" : "aim"}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Keyword labels: the builder's resting spots; a hovered keyword without one gets a label above. */}
      <g>
        {keywords.map((k) => {
          const r = rOf(k);
          if (r <= 0) return null;
          const f: ConstellationFocus = { kind: "keyword", id: k.id };
          const isActive = sameConstellationFocus(active, f);
          const lit = kwLit(k);
          const restLabel = k.label[language] ?? null;
          if (!restLabel) {
            if (!isActive) return null;
            return (
              <text
                key={k.id}
                x={px(k.x)}
                y={py(k.y) - r - 7}
                textAnchor="middle"
                className="pointer-events-none fill-ink"
                style={{
                  fontSize: L.labelSize + 0.5,
                  fontWeight: 600,
                  ...halo(),
                }}
              >
                {kwText(k)}
              </text>
            );
          }
          return (
            <g key={k.id} className="ripple-fade" style={{ opacity: lit ? 1 : 0.22 }}>
              <KeywordLabel label={restLabel} text={kwText(k)} size={L.labelSize} badgeR={0} strong={isActive} />
            </g>
          );
        })}
      </g>

      {/* Stars: Ken's papers with at least 30 non-self citing works; solid = lead author, hollow = coauthored. */}
      {papers.map((p) => {
        const f: ConstellationFocus = { kind: "paper", id: p.doi };
        const x = px(p.landing[0]);
        const y = py(p.landing[1]);
        const lit = paperLit(p);
        const ring = sameConstellationFocus(active, f) || isFocused(f);
        const lead = p.lens === "lead";
        const bridge = p.bridge ? p.bridge.map(regionName).join(zh ? " 与 " : " and ") : null;
        const aria = zh
          ? `${p.short}（${lead ? "第一/通讯作者" : "合作"}）：${fmt(p.works)} 篇施引，漂移 ${p.drift.toFixed(1)} 步${bridge ? `，连接${bridge}` : ""}`
          : `${p.short} (${lead ? "lead author" : "coauthored"}): ${fmt(p.works)} citing works, drift ${p.drift.toFixed(1)} keyword-steps${bridge ? `; bridges ${bridge}` : ""}`;
        return (
          <g
            key={p.doi}
            role="button"
            tabIndex={0}
            aria-label={aria}
            aria-pressed={sameConstellationFocus(selected, f)}
            className="cursor-pointer outline-none ripple-fade"
            style={{ opacity: lit ? 1 : 0.25 }}
            {...handlers(f)}
          >
            <circle cx={x} cy={y} r={L.starR + 5} fill="transparent" />
            <polygon
              points={starPoints(x, y, L.starR)}
              fill={lead ? "var(--color-ink)" : "var(--color-paper)"}
              stroke="var(--color-ink)"
              strokeWidth={lead ? 1 : 1.5}
              strokeLinejoin="round"
            />
            {ring && <circle cx={x} cy={y} r={L.starR + 4} fill="none" stroke="var(--color-ink)" strokeWidth={1.25} strokeDasharray="2 2" />}
            {p.label.leader && (
              <line
                x1={p.label.leader[0]}
                y1={p.label.leader[1]}
                x2={p.label.leader[2]}
                y2={p.label.leader[3]}
                stroke="var(--color-ink-faint)"
                strokeWidth={0.75}
              />
            )}
            <text
              x={p.label.x}
              y={p.label.y}
              dy="0.35em"
              textAnchor={p.label.anchor}
              className="fill-ink"
              style={{ fontSize: L.paperSize, fontWeight: 600, ...halo(3.5) }}
            >
              {p.short}
              {p.bridge && (
                <tspan className="fill-ink-muted" style={{ fontWeight: 500 }}>
                  {zh ? " · 桥梁" : " · bridge"}
                </tspan>
              )}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
