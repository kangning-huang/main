"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/lib/language-context";
import type { ReachViz } from "@/lib/reach-alt";
import { ringFor, type RippleFocus, type RippleKeyword, type RippleView, type RippleWeight } from "@/lib/ripple";

const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (a: number, b: number) => (b > 0 ? Math.round((100 * a) / b) : 0);

function useText() {
  const { language } = useLanguage();
  const zh = language === "zh";
  return { zh, t: (en: string, zhText: string) => (zh ? zhText : en) };
}

function Swatch({ color }: { color: string }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />;
}

function KeywordChip({ k, color, onSelect }: { k: RippleKeyword; color: string; onSelect: (f: RippleFocus) => void }) {
  const { zh } = useText();
  return (
    <button
      type="button"
      onClick={() => onSelect({ kind: "keyword", id: k.id })}
      className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-paper px-2.5 py-0.5 text-xs text-ink-muted transition-colors hover:border-ember hover:text-ink"
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={k.echo ? { boxShadow: `inset 0 0 0 1.5px ${color}` } : { background: color }}
        aria-hidden="true"
      />
      {zh ? (k.zh ?? k.en) : k.en}
    </button>
  );
}

/** Details for the focused theme or keyword. */
export function RippleDetails({
  view,
  focus,
  weight,
  onSelect,
  extra,
}: {
  view: RippleView;
  focus: NonNullable<RippleFocus>;
  weight: RippleWeight;
  onSelect: (f: RippleFocus) => void;
  /** View-specific section shown under a keyword's facts (the Clusters preview lists its co-occurring keywords). */
  extra?: ReactNode;
}) {
  const { zh, t } = useText();
  const theme = (id: string) => view.themes.find((x) => x.id === id);
  const paperShort = (doi: string) => view.papers.find((p) => p.doi === doi)?.short ?? doi;

  if (focus.kind === "theme") {
    const th = theme(focus.id);
    if (!th) return null;
    const papers = view.papers.filter((p) => p.theme === th.id);
    const own = view.keywords.filter((k) => k.theme === th.id).sort((a, b) => b.works - a.works);
    const bridgesIn = view.keywords.filter((k) => k.also.includes(th.id)).sort((a, b) => b.works - a.works);
    return (
      <div className="space-y-4 text-sm">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{t("Theme", "主题")}</p>
          <h3 className="mt-1 flex items-center gap-2 font-display text-2xl leading-tight text-ink">
            <Swatch color={th.color} />
            {zh ? th.zh : th.en}
          </h3>
          <p className="mt-1 text-ink-muted">
            {t(
              `${fmt(th.works)} citing works · ${th.perYear.toFixed(0)} cites / yr · ${pct(th.outside, th.works)}% outside home topics`,
              `${fmt(th.works)} 篇施引 · 每年 ${th.perYear.toFixed(0)} 次 · ${pct(th.outside, th.works)}% 在本人主题之外`
            )}
          </p>
          {th.emerging && (
            <p className="mt-2 text-xs text-ink-faint">
              {t(
                `Emerging: fewer than ${view.meta.params.emergingBelowWorks} citing works, so the map shows its arc but no keyword bubbles yet.`,
                `起步：施引文献少于 ${view.meta.params.emergingBelowWorks} 篇，地图只显示弧段，暂不显示关键词。`
              )}
            </p>
          )}
        </div>
        <div>
          <h4 className="text-xs font-medium text-ink">{t("Papers in this theme · non-self citing works", "本主题论文 · 非自引施引文献")}</h4>
          <ul className="mt-1.5 space-y-1">
            {papers.map((p) => (
              <li key={p.doi} className="flex items-baseline justify-between gap-3">
                <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-ember">
                  {p.short}
                  {p.lens === "lead" && <span className="ml-1.5 rounded bg-teal-light px-1 text-[10px] text-teal">{t("lead", "一作/通讯")}</span>}
                </a>
                <span className="shrink-0 tabular-nums text-ink-muted">{fmt(p.works)}</span>
              </li>
            ))}
          </ul>
        </div>
        {own.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-ink">{t("Keywords placed here", "本扇区关键词")}</h4>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {own.map((k) => (
                <KeywordChip key={k.id} k={k} color={th.color} onSelect={onSelect} />
              ))}
            </div>
          </div>
        )}
        {bridgesIn.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-ink">{t("Bridges from other themes", "来自其他主题的桥接词")}</h4>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {bridgesIn.map((k) => (
                <KeywordChip key={k.id} k={k} color={theme(k.theme)?.color ?? "#888"} onSelect={onSelect} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const k = view.keywords.find((x) => x.id === focus.id);
  if (!k) return null;
  const th = theme(k.theme);
  if (!th) return null;
  const ring = ringFor(k.dMean);
  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          <Swatch color={th.color} />
          {zh ? th.zh : th.en}
        </p>
        <h3 className="mt-1 font-display text-2xl leading-tight text-ink">{zh ? (k.zh ?? k.en) : k.en}</h3>
        {zh && k.zh && <p className="text-xs text-ink-faint">{k.en}</p>}
        <p className="mt-1 text-xs text-ink-muted">
          {k.echo
            ? t("Echo: also a keyword on Ken's own papers in this theme (outline bubble).", "回声：本人该主题论文也有此关键词（空心圆）。")
            : t("New: vocabulary the citing works bring (filled bubble).", "新词：施引文献带来的词汇（实心圆）。")}
        </p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        <dt className="text-ink-faint">{t("Citing works", "施引文献")}</dt>
        <dd className="tabular-nums text-ink">
          {t(`${fmt(k.works)} in this theme`, `本主题 ${fmt(k.works)} 篇`)}
          {k.totalWorks !== k.works && <span className="text-ink-muted">{t(` (${fmt(k.totalWorks)} in all)`, `（全部 ${fmt(k.totalWorks)} 篇）`)}</span>}
        </dd>
        <dt className="text-ink-faint">{t("Cites / yr", "年化引用")}</dt>
        <dd className="tabular-nums text-ink">{k.perYear.toFixed(1)}</dd>
        <dt className="text-ink-faint">{t("Outside home topics", "本人主题之外")}</dt>
        <dd className="tabular-nums text-ink">
          {pct(k.outside, k.works)}% <span className="text-ink-muted">({fmt(k.outside)})</span>
        </dd>
        <dt className="text-ink-faint">{t("Mean reach", "平均距离")}</dt>
        <dd className="text-ink">
          {k.dFallback
            ? t(
                `placed at the theme's median (${k.tagged} topic-tagged works, under ${view.meta.params.minTaggedForMean})`,
                `置于主题中位距离（仅 ${k.tagged} 篇有主题标注，少于 ${view.meta.params.minTaggedForMean} 篇）`
              )
            : t(`${k.dMean.toFixed(2)} · nearest ring: ${ring.en}`, `${k.dMean.toFixed(2)} · 最近的环：${ring.zh}`)}
        </dd>
        {k.bridge && (
          <>
            <dt className="text-ink-faint">{t("Also in", "也见于")}</dt>
            <dd className="text-ink">
              {k.also
                .map((id) => {
                  const o = theme(id);
                  return o ? `${zh ? o.zh : o.en} (${fmt(k.alsoWorks?.[id] ?? 0)})` : id;
                })
                .join(" · ")}
            </dd>
          </>
        )}
      </dl>
      {extra}
      <div>
        <h4 className="text-xs font-medium text-ink">{t("Which of Ken's papers they cite", "引用了哪些本人论文")}</h4>
        <ul className="mt-1.5 space-y-1">
          {k.cited.slice(0, 5).map((c) => (
            <li key={c.doi} className="flex items-baseline justify-between gap-3">
              <a href={`https://doi.org/${c.doi}`} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-ember">
                {paperShort(c.doi)}
              </a>
              <span className="shrink-0 tabular-nums text-ink-muted">{fmt(c.n)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-xs font-medium text-ink">{t("Most-cited citing works", "被引最多的施引文献")}</h4>
        <ol className="mt-1.5 space-y-2">
          {k.top.map((w) => (
            <li key={w.openalex} className="leading-snug">
              <a
                href={w.doi ? `https://doi.org/${w.doi}` : `https://openalex.org/${w.openalex}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink hover:text-ember"
              >
                {w.title}
              </a>
              <span className="block text-xs text-ink-faint">
                {t(`${w.year} · cited by ${fmt(w.citedBy)} (OpenAlex) · builds on ${w.cites.map(paperShort).join("; ")}`, `${w.year} · 被引 ${fmt(w.citedBy)}（OpenAlex）· 引用 ${w.cites.map(paperShort).join("；")}`)}
              </span>
            </li>
          ))}
        </ol>
      </div>
      {weight === "perYear" && (
        <p className="text-xs text-ink-faint">
          {t("Cites / yr weights each citing work by 1 / years since the paper it cites (floor 1 year).", "年化引用：每篇施引按 1/被引论文发表年数加权（下限 1 年）。")}
        </p>
      )}
    </div>
  );
}

const CALLOUT_TITLES = {
  farthest: { en: "Farthest reach", zh: "最远触达" },
  rising: { en: "Rising", zh: "上升最快" },
  bridge: { en: "Bridge", zh: "跨主题桥梁" },
};

/** One sentence per callout, generated from the builder's numbers. */
export function calloutSentence(view: RippleView, i: number, zh: boolean): { title: string; body: string } | null {
  const c = view.callouts[i];
  const k = view.keywords.find((x) => x.id === c?.keyword);
  if (!c || !k) return null;
  const name = zh ? (k.zh ?? k.en) : k.en;
  const th = view.themes.find((x) => x.id === k.theme);
  const thName = th ? (zh ? th.zh : th.en) : k.theme;
  const title = zh ? CALLOUT_TITLES[c.kind].zh : CALLOUT_TITLES[c.kind].en;
  const d = c.detail;
  if (c.kind === "farthest") {
    return {
      title,
      body: zh
        ? `“${name}”：${fmt(k.works)} 篇施引中 ${pct(k.outside, k.works)}% 落在本人主题之外（平均距离最近的环：${ringFor(k.dMean).zh}）。`
        : `“${name}”: ${pct(k.outside, k.works)}% of its ${fmt(k.works)} citing works sit outside Ken's home topics (nearest ring: ${ringFor(k.dMean).en}).`,
    };
  }
  if (c.kind === "rising" && d.windows && d.recentShare !== undefined && d.priorShare !== undefined) {
    const [r0, r1] = d.windows.recent;
    const [p0, p1] = d.windows.prior;
    return {
      title,
      body: zh
        ? `“${name}”：${r0}–${r1} 年占${thName}施引的 ${Math.round(d.recentShare * 100)}%，${p0}–${p1} 年为 ${Math.round(d.priorShare * 100)}%。`
        : `“${name}”: ${Math.round(d.recentShare * 100)}% of ${thName} citing works in ${r0}–${r1}, up from ${Math.round(d.priorShare * 100)}% in ${p0}–${p1}.`,
    };
  }
  if (c.kind === "bridge" && d.byTheme) {
    // A work can cite papers in several themes, so the per-theme counts need not sum to the total.
    const parts = Object.entries(d.byTheme)
      .sort((x, y) => y[1] - x[1])
      .map(([id, n]) => {
        const o = view.themes.find((x) => x.id === id);
        return { n: fmt(n), name: o ? (zh ? o.zh : o.en) : id };
      });
    return {
      title,
      body: zh
        ? `“${name}”：${fmt(d.totalWorks ?? k.totalWorks)} 篇施引文献带有此词，其中 ${parts.map((x) => `${x.n} 篇引用${x.name}论文`).join("，")}。`
        : `“${name}”: on ${fmt(d.totalWorks ?? k.totalWorks)} citing works; ${parts.map((x, i) => `${x.n} build on ${x.name}${i === 0 ? " papers" : ""}`).join(", ")}.`,
    };
  }
  return null;
}

export function RippleCallouts({ view, onSelect, compact = false }: { view: RippleView; onSelect: (f: RippleFocus) => void; compact?: boolean }) {
  const { zh } = useText();
  if (view.callouts.length === 0) return null;
  return (
    <ol className={compact ? "space-y-2" : "space-y-3"}>
      {view.callouts.map((c, i) => {
        const s = calloutSentence(view, i, zh);
        if (!s) return null;
        return (
          <li key={c.kind}>
            <button
              type="button"
              onClick={() => onSelect({ kind: "keyword", id: c.keyword })}
              className="group flex w-full gap-2.5 text-left text-sm leading-snug"
            >
              <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-ink text-[10.5px] font-bold text-paper">
                {i + 1}
              </span>
              <span>
                <span className="font-medium text-ink group-hover:text-ember">{s.title}</span>
                <span className="text-ink-muted"> — {s.body}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function RippleReadingGuide({ mode = "ripple", clusters = "cooccurrence" }: { mode?: ReachViz; clusters?: "cooccurrence" | "theme" }) {
  const { t } = useText();
  const items =
    mode === "beeswarm"
      ? [
          t("Each row is one of Ken's research themes; each bubble a keyword carried by works citing that theme's papers. Its area counts those works.", "每行是一个研究主题；每个圆是引用该主题论文的文献所携带的关键词，面积表示施引文献数。"),
          t("Farther right = cited from fields further from Ken's own research topics (mean reach distance).", "越靠右 = 施引文献所在领域离本人研究主题越远（平均距离）。"),
          t("Up and down within a row means nothing; it only keeps bubbles apart.", "行内上下位置没有含义，只为避免重叠。"),
          t("Filled = new vocabulary the citers bring. Outline = also a keyword on Ken's own papers.", "实心 = 施引者带来的新词；空心 = 本人论文也有的关键词。"),
          t("Hover, tap or Tab to a row or bubble for details; Esc returns to rest.", "悬停、点按或用 Tab 键查看主题与关键词详情；Esc 返回。"),
        ]
      : mode === "clusters"
        ? [
            t("Each bubble is a keyword carried by works that cite Ken's papers; its area counts those works, as in the Ripple.", "每个圆是施引文献携带的关键词，面积表示施引文献数（与涟漪图相同）。"),
            clusters === "cooccurrence"
              ? t("Keywords that often appear on the same citing works sit close together. Only distances matter: the map has no axes.", "常出现在同一批施引文献中的关键词彼此靠近。只有距离有意义，图没有坐标轴。")
              : t("This lens has too few citing works carrying two keywords to map relatedness, so keywords are grouped by theme.", "此视角中同时带有两个关键词的施引文献太少，无法映射关联度，因此按主题分组。"),
            t("Colour is the theme each keyword belongs to. Filled = new vocabulary; outline = also on Ken's own papers.", "颜色表示关键词所属主题。实心 = 新词；空心 = 本人论文也有。"),
            t("Hover, tap or Tab to a bubble for details and the keywords it appears with; Esc returns to rest.", "悬停、点按或用 Tab 键查看详情及常同现的关键词；Esc 返回。"),
          ]
        : [
            t("Each bubble is a keyword carried by works that cite Ken's papers; its area counts those works.", "每个圆是施引文献携带的关键词，面积表示施引文献数。"),
            t("Farther from the centre = cited from fields further from Ken's own research topics.", "离中心越远 = 施引文献所在领域离本人研究主题越远。"),
            t("Filled = new vocabulary the citers bring. Outline = also a keyword on Ken's own papers.", "实心 = 施引者带来的新词；空心 = 本人论文也有的关键词。"),
            t("Hover, tap or Tab to a sector or bubble for details; Esc returns to rest.", "悬停、点按或用 Tab 键查看扇区与关键词详情；Esc 返回。"),
          ];
  return (
    <ul className="space-y-1.5 text-sm leading-snug text-ink-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** Encoding key: fill vs outline, bubble area, rings. */
export function RippleLegend({
  view,
  weight,
  scale,
  note,
}: {
  view: RippleView;
  weight: RippleWeight;
  /** Bubble radii of the view drawn (defaults to the Ripple circle's). */
  scale?: { rMax: number; rMin: number };
  /** What position means in the view drawn (defaults to the Ripple's rings). */
  note?: ReactNode;
}) {
  const { zh, t } = useText();
  const max = weight === "absolute" ? view.meta.scale.maxWorks : view.meta.scale.maxPerYear;
  const nice = (v: number) => {
    const p = 10 ** Math.floor(Math.log10(v));
    return [1, 2, 5, 10].map((m) => m * p).filter((x) => x <= v).pop() ?? p;
  };
  const refs = [nice(max), nice(max / 6), nice(max / 30)].filter((v, i, a) => v > 0 && a.indexOf(v) === i);
  const rMax = scale?.rMax ?? view.meta.scale.rMax;
  const rMin = scale?.rMin ?? view.meta.scale.rMin;
  const rOf = (v: number) => Math.max(rMin, rMax * Math.sqrt(v / max));
  const width = refs.reduce((s, v) => s + 2 * rOf(v) + 14, 0);
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-ink-muted">
      <span className="flex items-center gap-2">
        <svg width="14" height="14" aria-hidden="true">
          <circle cx="7" cy="7" r="5.5" fill="var(--color-ink-muted)" />
        </svg>
        {t("new vocabulary", "新词")}
      </span>
      <span className="flex items-center gap-2">
        <svg width="14" height="14" aria-hidden="true">
          <circle cx="7" cy="7" r="5.25" fill="none" stroke="var(--color-ink-muted)" strokeWidth="1.75" />
        </svg>
        {t("echo of Ken's own keywords", "与本人论文相同的关键词")}
      </span>
      <span className="flex items-center gap-2">
        <svg width={width} height={2 * rOf(refs[0]) + 2} aria-hidden="true">
          {refs.reduce<{ x: number; els: React.ReactNode[] }>(
            (acc, v) => {
              const r = rOf(v);
              acc.els.push(
                <g key={v}>
                  <circle cx={acc.x + r} cy={2 * rOf(refs[0]) + 1 - r} r={r} fill="none" stroke="var(--color-ink-faint)" />
                </g>
              );
              acc.x += 2 * r + 14;
              return acc;
            },
            { x: 1, els: [] }
          ).els}
        </svg>
        <span>
          {refs.map((v) => (weight === "absolute" ? fmt(v) : v.toString())).join(" · ")}{" "}
          {weight === "absolute" ? t("citing works", "篇施引") : t("cites / yr", "次/年")}
        </span>
      </span>
      <span>
        {note ??
          (zh
            ? `环：本人主题 → 同一子领域 → 同一领域 → 同一大类（OpenAlex 层级）。`
            : `Rings: home topics → same subfield → same field → same domain (OpenAlex hierarchy).`)}
      </span>
    </div>
  );
}
