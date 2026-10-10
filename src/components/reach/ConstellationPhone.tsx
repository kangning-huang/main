"use client";

import { useState, type ReactNode } from "react";
import { useLanguage } from "@/lib/language-context";
import type { RippleWeight } from "@/lib/ripple";
import { sameConstellationFocus, type ConstellationFocus, type ConstellationView } from "@/lib/constellation";
import { KeywordChip, StarGlyph } from "./ConstellationPanel";

const fmt = (n: number) => n.toLocaleString("en-US");
/** Keywords listed per card before "Show all". */
const FIRST = 8;

interface Props {
  view: ConstellationView;
  weight: RippleWeight;
  selected: ConstellationFocus;
  onSelect: (f: ConstellationFocus) => void;
  /** Details for the selection, opened inside the card it belongs to. */
  details: ReactNode;
}

/**
 * Phones (< 720 px): the Constellation as region cards instead of a crowded map. Each card lists
 * the region's keywords (largest first) and the stars that land there; bridges appear in both
 * regions they join. Same data, same selection and URL as the desktop map.
 */
export default function ConstellationPhone({ view, weight, selected, onSelect, details }: Props) {
  const { language } = useLanguage();
  const zh = language === "zh";
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const regions = view.regions.filter((r) => r.keywords > 0);
  const regionName = (id: string) => {
    const r = view.regions.find((x) => x.id === id);
    return r ? (zh ? r.zh : r.en) : id;
  };
  // Which card opens the details: a keyword's region, a star's landing region, the region itself.
  const home = (() => {
    if (!selected) return null;
    if (selected.kind === "region") return selected.id;
    if (selected.kind === "keyword") return view.keywords.find((k) => k.id === selected.id)?.region ?? null;
    return view.papers.find((p) => p.doi === selected.id)?.landRegion ?? null;
  })();

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-ink-muted">
        {zh
          ? "每张卡片是施引文献词汇中的一个区域（按施引文献数排序）。☆ 合作论文，★ 第一/通讯作者论文。"
          : "Each card is one neighbourhood of the citing works' vocabulary, largest first. ★ lead-author paper, ☆ coauthored."}
      </p>
      {regions.map((r) => {
        const kws = view.keywords
          .filter((k) => k.region === r.id && k.r > 0)
          .sort((a, b) => (weight === "absolute" ? b.works - a.works : b.perYear - a.perYear) || (a.id < b.id ? -1 : 1));
        const landing = view.papers.filter((p) => p.landRegion === r.id).sort((a, b) => b.works - a.works);
        const bridging = view.papers.filter((p) => p.landRegion !== r.id && p.bridge?.includes(r.id)).sort((a, b) => b.works - a.works);
        const folded = view.meta.folded.filter((p) => p.region === r.id);
        const f: ConstellationFocus = { kind: "region", id: r.id };
        const on = sameConstellationFocus(selected, f);
        return (
          <section
            key={r.id}
            id={`constellation-${r.id}`}
            aria-label={zh ? r.zh : r.en}
            className="scroll-mt-24 rounded-xl border p-3.5"
            style={{ borderColor: `${r.color}55`, background: `${r.color}0f` }}
          >
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(on ? null : f)}
              className="flex w-full items-baseline justify-between gap-3 text-left"
            >
              <span className="flex items-center gap-2 font-display text-xl leading-tight text-ink">
                <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: r.color }} aria-hidden="true" />
                {zh ? r.zh : r.en}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-ink-muted">{zh ? `${fmt(r.works)} 篇施引` : `${fmt(r.works)} citing works`}</span>
            </button>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {(open.has(r.id) || kws.length <= FIRST + 1 ? kws : kws.slice(0, FIRST)).map((k) => (
                <KeywordChip key={k.id} k={k} color={r.color} onSelect={onSelect} count={weight === "absolute" ? k.works : k.perYear.toFixed(1)} />
              ))}
              {kws.length > FIRST + 1 && (
                <button
                  type="button"
                  aria-expanded={open.has(r.id)}
                  onClick={() =>
                    setOpen((prev) => {
                      const next = new Set(prev);
                      if (next.has(r.id)) next.delete(r.id);
                      else next.add(r.id);
                      return next;
                    })
                  }
                  className="rounded-full px-2 py-0.5 text-xs text-teal hover:text-ember"
                >
                  {open.has(r.id) ? (zh ? "收起" : "Show fewer") : zh ? `显示全部 ${kws.length} 个` : `Show all ${kws.length}`}
                </button>
              )}
            </div>
            {(landing.length > 0 || bridging.length > 0) && (
              <ul className="mt-3 space-y-1 border-t border-rule-faint pt-2.5 text-sm">
                {[...landing, ...bridging].map((p) => {
                  const other = p.bridge ? p.bridge.find((id) => id !== r.id) : null;
                  return (
                    <li key={p.doi}>
                      <button
                        type="button"
                        aria-pressed={sameConstellationFocus(selected, { kind: "paper", id: p.doi })}
                        onClick={() => onSelect({ kind: "paper", id: p.doi })}
                        className="grid w-full grid-cols-[1fr_auto] items-baseline gap-x-3 text-left"
                      >
                        <span className="flex min-w-0 items-baseline gap-1.5 text-ink">
                          <StarGlyph lead={p.lens === "lead"} />
                          {p.short}
                        </span>
                        <span className="whitespace-nowrap text-xs tabular-nums text-ink-muted">
                          {zh ? `${fmt(p.works)} 篇 · 漂移 ${p.drift.toFixed(1)}` : `${fmt(p.works)} · drift ${p.drift.toFixed(1)}`}
                        </span>
                        {other && (
                          <span className="col-span-2 pl-[18px] text-xs leading-snug text-ink-faint">
                            {zh ? `桥梁：亦连接${regionName(other)}` : `bridge: also ${regionName(other)}`}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {folded.length > 0 && (
              <p className="mt-2 text-xs leading-relaxed text-ink-faint">
                {zh ? "施引较少（无星）：" : "Fewer citing works (no star): "}
                {folded.map((p) => `${p.short} (${fmt(p.works)})`).join(" · ")}
              </p>
            )}
            {home === r.id && details && <div className="mt-3 rounded-lg border border-rule bg-paper p-3">{details}</div>}
          </section>
        );
      })}
    </div>
  );
}
