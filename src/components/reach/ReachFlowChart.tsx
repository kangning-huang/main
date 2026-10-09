"use client";

import { useMemo, useState } from "react";
import T from "@/components/T";
import flowData from "@/data/reach-flow-preview.json";
import { fieldZh } from "@/lib/influence";

const W = 820;
const H = 560;
const NODE_W = 14;
const LEFT_X = 200;
const RIGHT_X = W - 280;
const GAP = 6;
const LABEL_SPACING = 16;

type Mode = "absolute" | "citesPerYear";

interface LayoutNode {
  id: string;
  label: { en: string; zh: string };
  color?: string;
  value: number;
  y: number;
  h: number;
  labelY: number;
}

function layout(nodes: Omit<LayoutNode, "y" | "h" | "labelY">[], scale: number): LayoutNode[] {
  let y = 8;
  let lastLabel = -Infinity;
  return nodes.map((n) => {
    const h = Math.max(n.value * scale, 3);
    const mid = y + h / 2;
    const labelY = Math.max(mid, lastLabel + LABEL_SPACING);
    lastLabel = labelY;
    const node = { ...n, y, h, labelY };
    y += h + GAP;
    return node;
  });
}

export default function ReachFlowChart() {
  const [mode, setMode] = useState<Mode>("citesPerYear");
  const valueKey = mode === "absolute" ? "absolute" : "citesPerYear";

  const { leftRaw, rightRaw, merged, total, shares } = useMemo(() => {
    const leftRaw = flowData.left
      .map((n) => ({
        id: n.id,
        label: n.label,
        color: n.color,
        value: n[valueKey] as number,
      }))
      .filter((n) => n.value > 0)
      .sort((a, b) => b.value - a.value);

    const rightCandidates = flowData.right
      .map((n) => ({
        id: n.id,
        label: { en: n.name, zh: fieldZh(n.name) },
        value: n[valueKey] as number,
        level: n.level,
        members: ((n as { members?: { name: string }[] }).members ?? []).map((m) => m.name),
      }))
      .filter((n) => n.value > 0)
      .sort((a, b) => b.value - a.value);

    // Show top 8 right nodes; fold rest into Other
    const top = rightCandidates.filter((n) => n.id !== "__other").slice(0, 16);
    const topIds = new Set(top.map((n) => n.id));
    const otherVal =
      rightCandidates.filter((n) => !topIds.has(n.id)).reduce((s, n) => s + n.value, 0);
    const rightRaw = [
      ...top,
      ...(otherVal > 0
        ? [{ id: "__other", label: { en: "Other", zh: "其他" }, value: otherVal, level: "other" }]
        : []),
    ];

    const merged: Record<string, number> = {};
    for (const l of flowData.links) {
      const r = topIds.has(l.right) ? l.right : "__other";
      const k = `${l.left}|${r}`;
      merged[k] = (merged[k] ?? 0) + (l[valueKey] as number);
    }

    const total = leftRaw.reduce((s, n) => s + n.value, 0);
    const shares = flowData.stats[mode === "absolute" ? "absolute" : "citesPerYear"].shares;
    return { leftRaw, rightRaw, merged, total, shares };
  }, [mode, valueKey]);

  if (!leftRaw.length || !rightRaw.length || total <= 0) {
    return <p className="text-sm text-ink-muted">No flow data.</p>;
  }

  const maxNodes = Math.max(leftRaw.length, rightRaw.length);
  const scale = (H - 24 - GAP * (maxNodes - 1)) / total;
  const left = layout(leftRaw, scale);
  const right = layout(rightRaw, scale);
  const leftOffset: Record<string, number> = Object.fromEntries(left.map((n) => [n.id, n.y]));
  const rightOffset: Record<string, number> = Object.fromEntries(right.map((n) => [n.id, n.y]));
  const ribbons: { d: string; color: string; title: string }[] = [];
  for (const l of left) {
    for (const r of right) {
      const v = merged[`${l.id}|${r.id}`];
      if (!v) continue;
      const h = v * scale;
      const y0 = leftOffset[l.id];
      const y1 = rightOffset[r.id];
      leftOffset[l.id] += h;
      rightOffset[r.id] += h;
      const x0 = LEFT_X + NODE_W;
      const x1 = RIGHT_X;
      const mx = (x0 + x1) / 2;
      ribbons.push({
        d: `M${x0},${y0}C${mx},${y0} ${mx},${y1} ${x1},${y1}L${x1},${y1 + h}C${mx},${y1 + h} ${mx},${y0 + h} ${x0},${y0 + h}Z`,
        color: l.color ?? "#888",
        title: `${l.label.en} → ${r.label.en}: ${mode === "absolute" ? `${Math.round(v)} citing works` : `${v.toFixed(1)} cites/yr`} (OpenAlex)`,
      });
    }
  }
  const svgH = Math.max(H, right[right.length - 1].labelY + 12, left[left.length - 1].labelY + 12);
  const topShare = Object.entries(shares).sort((a, b) => b[1] - a[1])[0];
  const heatish = Math.round(((shares["heat-health"] ?? 0) + (shares.cooling ?? 0)) * 10) / 10;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-ink md:text-4xl">
            <T en="Where citing work sits" zh="施引文献落在何处" />
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] text-ink-muted">
            <T
              en={
                mode === "absolute"
                  ? `OpenAlex citing works (self-cites removed) → adaptive subfields & topics. Expansion still leads (${topShare?.[1]}%); heat + cooling together are ${heatish}%.`
                  : `Each citing work weighted by 1 / years since the cited paper (floor 1 yr). Expansion ${shares.expansion}%; heat + cooling rise to ${heatish}%.`
              }
              zh={
                mode === "absolute"
                  ? `OpenAlex 施引文献（已剔除自引）→ 自适应子领域与主题。扩张仍居首（${topShare?.[1]}%）；高温+降温合计 ${heatish}%。`
                  : `每篇施引按 1/被引论文发表年数加权（下限 1 年）。扩张 ${shares.expansion}%；高温+降温升至 ${heatish}%。`
              }
            />
          </p>
        </div>
        <div className="flex rounded-full border border-rule p-0.5 text-sm" role="group" aria-label="Weighting">
          <button
            type="button"
            aria-pressed={mode === "citesPerYear"}
            onClick={() => setMode("citesPerYear")}
            className={`rounded-full px-3 py-1 ${mode === "citesPerYear" ? "bg-ember-light text-ember-dark" : "text-ink-muted hover:text-ink"}`}
          >
            <T en="Cites / year" zh="年化引用" />
          </button>
          <button
            type="button"
            aria-pressed={mode === "absolute"}
            onClick={() => setMode("absolute")}
            className={`rounded-full px-3 py-1 ${mode === "absolute" ? "bg-ember-light text-ember-dark" : "text-ink-muted hover:text-ink"}`}
          >
            <T en="Absolute cites" zh="绝对引用" />
          </button>
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-faint sm:hidden">
        <T en="Scroll sideways for full chart →" zh="左右滑动查看完整图 →" />
      </p>
      <figure className="mt-3 overflow-x-auto rounded-xl border border-rule bg-paper-warm/30 p-3 sm:p-4">
        <svg
          viewBox={`0 0 ${W} ${svgH}`}
          className="h-auto w-full min-w-[640px]"
          role="img"
          aria-label="Flow from research lines to OpenAlex subfields and topics of citing works"
        >
          {ribbons.map((r, i) => (
            <path key={i} d={r.d} fill={r.color} fillOpacity={0.4} className="transition-opacity hover:[fill-opacity:0.75]">
              <title>{r.title}</title>
            </path>
          ))}
          {left.map((n) => (
            <g key={n.id}>
              <rect x={LEFT_X} y={n.y} width={NODE_W} height={n.h} rx={2} fill={n.color}>
                <title>{`${n.label.en}: ${n.value}`}</title>
              </rect>
              <text x={LEFT_X - 8} y={n.labelY} dy="0.35em" textAnchor="end" className="fill-ink text-[12px]">
                <T en={n.label.en} zh={n.label.zh} />
                <tspan className="fill-ink-muted">
                  {" "}
                  {mode === "absolute" ? Math.round(n.value) : n.value.toFixed(0)}
                </tspan>
              </text>
            </g>
          ))}
          {right.map((n) => (
            <g key={n.id}>
              <rect x={RIGHT_X} y={n.y} width={NODE_W} height={n.h} rx={2} fill="var(--color-ink-muted)">
                <title>{`${n.label.en}: ${mode === "absolute" ? Math.round(n.value) : n.value.toFixed(1) + "/yr"}${(n as { members?: string[] }).members?.length ? "\nIncludes: " + (n as { members?: string[] }).members!.join(", ") : ""}`}</title>
              </rect>
              <text x={RIGHT_X + NODE_W + 8} y={n.labelY} dy="0.35em" className="fill-ink text-[12px]">
                <T en={n.label.en} zh={n.label.zh} />
                <tspan className="fill-ink-muted">
                  {" "}
                  {mode === "absolute" ? Math.round(n.value) : n.value.toFixed(0)}
                </tspan>
              </text>
            </g>
          ))}
        </svg>
        <figcaption className="mt-2 text-xs text-ink-faint">
          <T
            en={`Preview L4+R1 · OpenAlex ${flowData.meta.asOf} · default = cites/year (toggle Absolute) · self-citations removed · named subfields + domain groups on right (hover for members) · keywords on hover only. Not live. Theme map: data/influence/fine-themes.json.`}
            zh={`预览 L4+R1 · OpenAlex ${flowData.meta.asOf} · 默认年化引用（可切绝对）· 已剔除自引 · 右侧自适应子领域/主题 · 关键词仅悬停。尚未上线。主题映射：data/influence/fine-themes.json。`}
          />
        </figcaption>
      </figure>
    </div>
  );
}
