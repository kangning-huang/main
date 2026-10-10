"use client";

import type { KeyboardEvent, PointerEvent } from "react";
import { sameFocus, type RippleFocus } from "@/lib/ripple";
import type { AltLabel } from "@/lib/reach-alt";

/** Paper-coloured outline that keeps text legible over lines and bubbles. */
export const halo = (width = 3.25) => ({
  stroke: "var(--color-paper)",
  strokeWidth: width,
  strokeLinejoin: "round" as const,
  paintOrder: "stroke" as const,
});

/** The Ripple's interaction model for a focusable mark: mouse hover previews, click / Enter / Space selects. */
export function markHandlers(
  f: RippleFocus,
  {
    selected,
    onHover,
    onSelect,
    setFocused,
  }: {
    selected: RippleFocus;
    onHover: (f: RippleFocus) => void;
    onSelect: (f: RippleFocus) => void;
    setFocused: (f: RippleFocus) => void;
  }
) {
  return {
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
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(sameFocus(selected, f) ? null : f);
      }
    },
  };
}

/** Numbered callout disc, matching the "Worth a look" list. */
export function CalloutBadge({ x, y, r, n }: { x: number; y: number; r: number; n: number }) {
  return (
    <g transform={`translate(${x},${y})`} aria-hidden="true" className="pointer-events-none">
      <circle r={r} fill="var(--color-ink)" stroke="var(--color-paper)" strokeWidth={1.5} />
      <text dy="0.35em" textAnchor="middle" fill="var(--color-paper)" style={{ fontSize: r * 1.25, fontWeight: 700 }}>
        {n}
      </text>
    </g>
  );
}

/** A label placed by the builder: optional leader, optional inline badge, one or two lines of text. */
export function KeywordLabel({
  label,
  text,
  size,
  rank,
  badgeR,
  strong = false,
}: {
  label: AltLabel;
  text: string;
  size: number;
  rank?: number;
  badgeR: number;
  strong?: boolean;
}) {
  const lines = label.lines ?? [text];
  return (
    <g className="pointer-events-none">
      {label.leader && (
        <line
          x1={label.leader[0]}
          y1={label.leader[1]}
          x2={label.leader[2]}
          y2={label.leader[3]}
          stroke="var(--color-ink-faint)"
          strokeWidth={0.75}
        />
      )}
      {label.badge && rank !== undefined && <CalloutBadge x={label.badge[0]} y={label.badge[1]} r={badgeR} n={rank} />}
      <text
        x={label.x}
        y={label.y}
        dy={lines.length === 1 ? "0.35em" : undefined}
        textAnchor={label.anchor}
        className="fill-ink"
        style={{ fontSize: size, fontWeight: strong ? 600 : 500, ...halo() }}
      >
        {lines.length === 1
          ? text
          : lines.map((line, i) => (
              <tspan key={i} x={label.x} dy={i === 0 ? `${(0.35 - ((lines.length - 1) * 1.15) / 2).toFixed(3)}em` : "1.15em"}>
                {line}
              </tspan>
            ))}
      </text>
    </g>
  );
}
