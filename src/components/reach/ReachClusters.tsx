"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { useLanguage } from "@/lib/language-context";
import { sameFocus, type RippleFocus, type RippleKeyword, type RippleView, type RippleWeight } from "@/lib/ripple";
import { getClusters, partnersOf, type ClustersLayout } from "@/lib/reach-alt";
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
  /** Phones: details open under the map. */
  details: ReactNode;
}

/**
 * Preview view C: a VOSviewer-style keyword map. Distance = how often two keywords share
 * citing works (association strength); when a lens has too few shared works, the keywords
 * are packed by theme instead and no links are drawn. Positions come from build-reach-clusters.mjs.
 */
export default function ReachClusters({ view, weight, active, selected, onHover, onSelect, calloutRank, title, desc, details }: Props) {
  const { language } = useLanguage();
  const zh = language === "zh";
  const uid = useId().replace(/:/g, "");
  const C = getClusters(view.meta.lens);
  const cooc = C.meta.method === "cooccurrence";
  const [focused, setFocused] = useState<RippleFocus>(null);

  const partners = useMemo(() => {
    const m = new Map<string, Map<string, number>>();
    for (const l of C.links) {
      if (!m.has(l.a)) m.set(l.a, new Map());
      if (!m.has(l.b)) m.set(l.b, new Map());
      m.get(l.a)!.set(l.b, l.n);
      m.get(l.b)!.set(l.a, l.n);
    }
    return m;
  }, [C]);
  const themeById = useMemo(() => new Map(view.themes.map((t) => [t.id, t])), [view]);
  // Tab order as in the Ripple: theme by theme, largest first.
  const keywords = useMemo(() => {
    const order = new Map(view.themes.map((t, i) => [t.id, i]));
    return [...view.keywords].sort((a, b) => (order.get(a.theme) ?? 0) - (order.get(b.theme) ?? 0) || b.works - a.works || (a.id < b.id ? -1 : 1));
  }, [view]);

  const activeTheme = active?.kind === "theme" ? active.id : null;
  const activeKw = active?.kind === "keyword" ? active.id : null;
  const kwLit = (k: RippleKeyword) =>
    activeTheme
      ? k.theme === activeTheme || k.also.includes(activeTheme)
      : activeKw
        ? k.id === activeKw || (cooc && !!partners.get(activeKw)?.has(k.id))
        : true;
  const kwText = (k: RippleKeyword) => (zh ? (k.zh ?? k.en) : k.en);
  const handlers = (f: RippleFocus) => markHandlers(f, { selected, onHover, onSelect, setFocused });
  const maxN = C.links[0]?.n ?? 1;
  const linkWidth = (n: number) => 0.6 + 2.4 * Math.sqrt(n / maxN);
  const unlinked = C.meta.unlinked.map((u) => view.keywords.find((k) => k.id === u.id)).filter((k): k is RippleKeyword => !!k);

  const map = (L: ClustersLayout, id: string) => {
    const at = (kid: string) => {
      const n = L.nodes[kid];
      return n && n.x !== undefined && n.y !== undefined ? { x: n.x, y: n.y } : null;
    };
    // Lines: the strongest pairs at rest; every pair of the keyword in focus.
    const links = !cooc
      ? []
      : activeKw
        ? C.links.filter((l) => l.a === activeKw || l.b === activeKw)
        : C.links.filter((l) => {
            if (l.n < C.meta.params.restLinkMin) return false;
            if (!activeTheme) return true;
            const a = view.keywords.find((k) => k.id === l.a);
            const b = view.keywords.find((k) => k.id === l.b);
            return !!a && !!b && kwLit(a) && kwLit(b);
          });
    return (
      <svg
        viewBox={`0 0 ${L.width} ${L.height}`}
        className="h-auto w-full select-none"
        role="group"
        aria-labelledby={`${uid}-${id}-title`}
        aria-describedby={`${uid}-${id}-desc`}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onSelect(null);
            onHover(null);
          }
        }}
      >
        <title id={`${uid}-${id}-title`}>{title}</title>
        <desc id={`${uid}-${id}-desc`}>{desc}</desc>
        <rect width={L.width} height={L.height} fill="transparent" onClick={() => onSelect(null)} />

        <g aria-hidden="true" className="pointer-events-none">
          {links.map((l) => {
            const a = at(l.a);
            const b = at(l.b);
            if (!a || !b) return null;
            const focusLink = activeKw !== null;
            return (
              <line
                key={`${l.a}-${l.b}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={focusLink ? "var(--color-ink-muted)" : "var(--color-ink-faint)"}
                strokeOpacity={focusLink ? 0.7 : 0.3}
                strokeWidth={linkWidth(l.n)}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {L.notes.map((n) => (
          <text
            key={n.theme}
            x={n.x}
            y={n.y}
            textAnchor="middle"
            className="pointer-events-none fill-ink-muted ripple-fade"
            style={{ fontSize: L.noteSize, opacity: active ? 0.35 : 1, ...halo() }}
          >
            {n.lines[language].map((line, i) => (
              <tspan key={i} x={n.x} dy={i === 0 ? 0 : "1.3em"}>
                {line}
              </tspan>
            ))}
          </text>
        ))}

        {L.groups.map((g) => {
          const t = themeById.get(g.theme);
          if (!t) return null;
          return (
            <text key={g.theme} x={g.x} y={g.y} dy="0.35em" textAnchor="middle" className="pointer-events-none fill-ink-muted" style={{ fontSize: 12 }}>
              {zh ? t.zh : t.en}
            </text>
          );
        })}

        {keywords.map((k) => {
          const n = L.nodes[k.id];
          const t = themeById.get(k.theme);
          if (!n || n.x === undefined || n.y === undefined || !t) return null;
          const f: RippleFocus = { kind: "keyword", id: k.id };
          const r = weight === "absolute" ? n.r : n.rY;
          const ring = sameFocus(active, f) || (focused !== null && sameFocus(focused, f));
          const shared = activeKw && activeKw !== k.id ? partners.get(activeKw)?.get(k.id) : undefined;
          const aria = zh
            ? `${kwText(k)}：${t.zh}，${k.works} 篇施引，${pct(k.outside, k.works)}% 在本人主题之外`
            : `${k.en}: ${k.works} citing works in ${t.en}, ${pct(k.outside, k.works)}% outside home topics${shared ? `; shares ${shared} citing works with the keyword in focus` : ""}`;
          return (
            <g
              key={k.id}
              role="button"
              tabIndex={0}
              aria-label={aria}
              aria-pressed={sameFocus(selected, f)}
              className="cursor-pointer outline-none ripple-fade"
              style={{ opacity: kwLit(k) ? 1 : 0.14 }}
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
                strokeWidth={k.echo ? 2.25 : 1.5}
              />
              {ring && <circle cx={n.x} cy={n.y} r={r + 4} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} />}
            </g>
          );
        })}

        {keywords.map((k) => {
          const n = L.nodes[k.id];
          if (!n || n.x === undefined || n.y === undefined || !n.label) return null;
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
          // No resting label: the badge beside the bubble, and the name while it is in focus or a partner of it.
          const transient = isActive || (activeKw !== null && kwLit(k));
          return (
            <g key={k.id}>
              {rank !== undefined && n.badge && <CalloutBadge x={n.badge[0]} y={n.badge[1]} r={L.badge} n={rank} />}
              {transient && (
                <text
                  x={n.x}
                  y={n.y - Math.max(n.r, n.rY) - 7}
                  textAnchor="middle"
                  className="pointer-events-none fill-ink"
                  style={{ fontSize: L.labelSize, fontWeight: isActive ? 600 : 500, ...halo() }}
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
    <div>
      <div className="hidden min-[720px]:block">{map(C.wide, "w")}</div>
      <div className="min-[720px]:hidden">{map(C.narrow, "n")}</div>
      {unlinked.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-muted">
          <span>
            {zh
              ? `未上图：施引文献中与上图关键词同现的不足 ${C.meta.params.minSharedWorks} 篇——`
              : `Off the map: fewer than ${C.meta.params.minSharedWorks} of their citing works carry another keyword shown —`}
          </span>
          {unlinked.map((k) => {
            const t = themeById.get(k.theme);
            const n = C.wide.nodes[k.id];
            const r = Math.min(10, weight === "absolute" ? n.r : n.rY);
            const f: RippleFocus = { kind: "keyword", id: k.id };
            const on = sameFocus(active, f);
            return (
              <button
                key={k.id}
                type="button"
                aria-pressed={sameFocus(selected, f)}
                onClick={() => onSelect(sameFocus(selected, f) ? null : f)}
                onPointerEnter={(e) => e.pointerType === "mouse" && onHover(f)}
                onPointerLeave={(e) => e.pointerType === "mouse" && onHover(null)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 transition-colors ${on ? "border-ink text-ink" : "border-rule hover:border-ink-faint hover:text-ink"}`}
              >
                <svg width={2 * r + 4} height={2 * r + 4} aria-hidden="true">
                  <circle
                    cx={r + 2}
                    cy={r + 2}
                    r={r}
                    fill={k.echo ? "var(--color-paper)" : t?.color}
                    stroke={k.echo ? t?.color : "none"}
                    strokeWidth={k.echo ? 2 : 0}
                  />
                </svg>
                {kwText(k)}
              </button>
            );
          })}
        </div>
      )}
      {selected && details && <div className="mt-3 rounded-lg border border-rule bg-paper-warm/60 p-3 min-[720px]:hidden">{details}</div>}
    </div>
  );
}

/** Details-panel section for the Clusters view: the keywords that share the most citing works with this one. */
export function ClusterPartners({ view, id, onSelect }: { view: RippleView; id: string; onSelect: (f: RippleFocus) => void }) {
  const { language } = useLanguage();
  const zh = language === "zh";
  const list = partnersOf(getClusters(view.meta.lens), id)
    .map((p) => ({ ...p, k: view.keywords.find((k) => k.id === p.id) }))
    .filter((p): p is { id: string; n: number; k: RippleKeyword } => !!p.k)
    .slice(0, 6);
  return (
    <div>
      <h4 className="text-xs font-medium text-ink">{zh ? "共同出现最多的关键词（同时带有两词的施引文献数）" : "Shares the most citing works with"}</h4>
      {list.length === 0 ? (
        <p className="mt-1 text-xs text-ink-faint">
          {zh ? "没有施引文献同时带有此词和图中其他关键词。" : "No citing work carries this keyword together with another keyword shown."}
        </p>
      ) : (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {list.map(({ id: pid, n, k }) => {
            const t = view.themes.find((x) => x.id === k.theme);
            return (
              <button
                key={pid}
                type="button"
                onClick={() => onSelect({ kind: "keyword", id: pid })}
                className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-paper px-2.5 py-0.5 text-xs text-ink-muted transition-colors hover:border-ember hover:text-ink"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={k.echo ? { boxShadow: `inset 0 0 0 1.5px ${t?.color}` } : { background: t?.color }}
                  aria-hidden="true"
                />
                {zh ? (k.zh ?? k.en) : k.en}
                <span className="tabular-nums text-ink-faint">{fmt(n)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
