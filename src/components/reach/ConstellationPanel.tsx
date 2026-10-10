"use client";

import { useLanguage } from "@/lib/language-context";
import type { RippleWeight } from "@/lib/ripple";
import { num, restDrift, starPoints, type ConstellationCitingWork, type ConstellationFocus, type ConstellationKeyword, type ConstellationView } from "@/lib/constellation";

const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (x: number) => `${Math.round(x * 100)}%`;

function useText() {
  const { language } = useLanguage();
  const zh = language === "zh";
  return { zh, t: (en: string, zhText: string) => (zh ? zhText : en) };
}

function Swatch({ color }: { color: string }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />;
}

/** Small star glyph: solid = lead author, hollow = coauthored. */
export function StarGlyph({ lead, size = 12 }: { lead: boolean; size?: number }) {
  const c = size / 2;
  return (
    <svg width={size} height={size} aria-hidden="true" className="inline-block shrink-0 align-[-1px]">
      <polygon
        points={starPoints(c, c + 0.4, c - 0.75)}
        fill={lead ? "var(--color-ink)" : "var(--color-paper)"}
        stroke="var(--color-ink)"
        strokeWidth={lead ? 0.75 : 1.1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Keyword disc glyph in its region colour: filled = new vocabulary, hollow = also on Ken's papers. */
function KeywordDot({ color, echo, r = 4 }: { color: string; echo: boolean; r?: number }) {
  return (
    <svg width={2 * r + 3} height={2 * r + 3} aria-hidden="true" className="inline-block shrink-0">
      <circle
        cx={r + 1.5}
        cy={r + 1.5}
        r={r}
        fill={echo ? "var(--color-paper)" : color}
        fillOpacity={echo ? 1 : 0.45}
        stroke={color}
        strokeWidth={echo ? 1.5 : 1.1}
      />
    </svg>
  );
}

export function KeywordChip({
  k,
  color,
  onSelect,
  count,
}: {
  k: ConstellationKeyword;
  color: string;
  onSelect: (f: ConstellationFocus) => void;
  /** Shown after the name: citing works, or cites per year to one decimal. */
  count?: number | string;
}) {
  const { zh } = useText();
  return (
    <button
      type="button"
      onClick={() => onSelect({ kind: "keyword", id: k.id })}
      className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-paper px-2.5 py-0.5 text-xs text-ink-muted transition-colors hover:border-ember hover:text-ink"
    >
      <KeywordDot color={color} echo={k.echo} r={3.5} />
      {zh ? (k.zh ?? k.en) : k.en}
      {count !== undefined && <span className="tabular-nums text-ink-faint">{typeof count === "number" ? fmt(count) : count}</span>}
    </button>
  );
}

function CitingWorks({ works }: { works: ConstellationCitingWork[] }) {
  const { t } = useText();
  if (works.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-medium text-ink">{t("Most-cited citing works", "被引最多的施引文献")}</h4>
      <ol className="mt-1.5 space-y-2">
        {works.map((w) => (
          <li key={w.openalex ?? w.doi ?? w.title} className="leading-snug">
            <a
              href={w.doi ? `https://doi.org/${w.doi}` : `https://openalex.org/${w.openalex}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-ember"
            >
              {w.title}
            </a>
            <span className="block text-xs text-ink-faint">
              {t(`${w.year} · cited by ${fmt(w.citedBy)} (OpenAlex)`, `${w.year} · 被引 ${fmt(w.citedBy)}（OpenAlex）`)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Short labels for every paper in the lens: stars and the papers folded into regions. */
function paperIndex(view: ConstellationView) {
  const m = new Map<string, { short: string; lens: "lead" | "coauthor"; star: boolean }>();
  for (const p of view.papers) m.set(p.doi, { short: p.short, lens: p.lens, star: true });
  for (const p of view.meta.folded) if (!m.has(p.doi)) m.set(p.doi, { short: p.short, lens: p.lens, star: false });
  return m;
}

/** Details for the paper, keyword or region in focus. */
export function ConstellationDetails({
  view,
  focus,
  weight,
  onSelect,
}: {
  view: ConstellationView;
  focus: NonNullable<ConstellationFocus>;
  weight: RippleWeight;
  onSelect: (f: ConstellationFocus) => void;
}) {
  const { zh, t } = useText();
  const region = (id: string | null) => view.regions.find((r) => r.id === id);
  const regionName = (id: string | null) => {
    const r = region(id);
    return r ? (zh ? r.zh : r.en) : "–";
  };
  const papers = paperIndex(view);

  if (focus.kind === "paper") {
    const p = view.papers.find((x) => x.doi === focus.id);
    if (!p) return null;
    const lead = p.lens === "lead";
    const shares = Object.entries(p.shares)
      .map(([id, s]) => ({ r: region(id), s }))
      .filter((x): x is { r: NonNullable<ReturnType<typeof region>>; s: number } => !!x.r && x.s > 0)
      .sort((a, b) => b.s - a.s);
    const moved = p.aimRegion && p.landRegion && p.aimRegion !== p.landRegion;
    return (
      <div className="space-y-4 text-sm">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            <StarGlyph lead={lead} />
            {lead ? t("Lead-author paper", "第一/通讯作者论文") : t("Coauthored paper", "合作论文")}
          </p>
          <h3 className="mt-1 font-display text-2xl leading-tight text-ink">{p.short}</h3>
          <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" className="mt-1 block leading-snug text-ink-muted hover:text-ember">
            {p.title}
          </a>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <dt className="text-ink-faint">{t("Citing works", "施引文献")}</dt>
          <dd className="tabular-nums text-ink">
            {fmt(p.works)}
            <span className="text-ink-muted">{t(` · ${fmt(p.mappedWorks)} carry a mapped keyword`, ` · 其中 ${fmt(p.mappedWorks)} 篇带有图中关键词`)}</span>
          </dd>
          <dt className="text-ink-faint">{t("Drift", "漂移")}</dt>
          <dd className="text-ink">
            {t(`${p.drift.toFixed(1)} keyword-steps`, `${p.drift.toFixed(1)} 步（关键词间距）`)}
            <span className="block text-xs text-ink-muted">
              {moved
                ? t(
                    `Its own keywords sit mostly in ${regionName(p.aimRegion)}; its citers' mostly in ${regionName(p.landRegion)}.`,
                    `本文关键词主要位于${regionName(p.aimRegion)}，施引文献关键词主要位于${regionName(p.landRegion)}。`
                  )
                : t(`Its own keywords and its citers' both sit mostly in ${regionName(p.landRegion)}.`, `本文与施引文献的关键词都主要位于${regionName(p.landRegion)}。`)}
            </span>
          </dd>
          {p.bridge && (
            <>
              <dt className="text-ink-faint">{t("Bridge", "桥梁")}</dt>
              <dd className="text-ink">{p.bridge.map(regionName).join(zh ? " 与 " : " + ")}</dd>
            </>
          )}
        </dl>
        <div>
          <h4 className="text-xs font-medium text-ink">{t("Where its citers' keywords sit", "施引文献关键词的分布")}</h4>
          <ul className="mt-1.5 space-y-1">
            {shares.map(({ r, s }) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelect({ kind: "region", id: r.id })}
                  className="group grid w-full grid-cols-[1fr_auto] items-center gap-x-3 text-left"
                >
                  <span className="flex items-center gap-1.5 truncate text-ink-muted group-hover:text-ink">
                    <Swatch color={r.color} />
                    {zh ? r.zh : r.en}
                  </span>
                  <span className="tabular-nums text-ink">{pct(s)}</span>
                  <span className="col-span-2 mt-0.5 h-1 rounded-full bg-rule-faint">
                    <span className="block h-1 rounded-full" style={{ width: pct(s), background: r.color }} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-ink-faint">{t("Share of its citing works' keyword mentions, by region.", "按区域统计的施引文献关键词占比。")}</p>
        </div>
        <CitingWorks works={p.top} />
      </div>
    );
  }

  if (focus.kind === "keyword") {
    const k = view.keywords.find((x) => x.id === focus.id);
    if (!k) return null;
    const r = region(k.region);
    return (
      <div className="space-y-4 text-sm">
        <div>
          <button
            type="button"
            onClick={() => onSelect({ kind: "region", id: k.region })}
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink"
          >
            {r && <Swatch color={r.color} />}
            {regionName(k.region)}
          </button>
          <h3 className="mt-1 font-display text-2xl leading-tight text-ink">{zh ? (k.zh ?? k.en) : k.en}</h3>
          {zh && k.zh && <p className="text-xs text-ink-faint">{k.en}</p>}
          <p className="mt-1 text-xs text-ink-muted">
            {k.echo
              ? t("Also a keyword on Ken's own papers (hollow disc).", "本人论文也有此关键词（空心圆）。")
              : t("New vocabulary the citing works bring (filled disc).", "施引文献带来的新词汇（实心圆）。")}
          </p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <dt className="text-ink-faint">{t("Citing works", "施引文献")}</dt>
          <dd className="tabular-nums text-ink">{fmt(k.works)}</dd>
          <dt className="text-ink-faint">{t("Cites / yr", "年化引用")}</dt>
          <dd className="tabular-nums text-ink">{k.perYear.toFixed(1)}</dd>
        </dl>
        <div>
          <h4 className="text-xs font-medium text-ink">{t("Which of Ken's papers they cite", "引用了哪些本人论文")}</h4>
          <ul className="mt-1.5 space-y-1">
            {k.cited.slice(0, 6).map((c) => {
              const p = papers.get(c.doi);
              return (
                <li key={c.doi} className="flex items-baseline justify-between gap-3">
                  {p?.star ? (
                    <button
                      type="button"
                      onClick={() => onSelect({ kind: "paper", id: c.doi })}
                      className="flex items-center gap-1.5 text-left text-ink hover:text-ember"
                    >
                      <StarGlyph lead={p.lens === "lead"} />
                      {p.short}
                    </button>
                  ) : (
                    <a href={`https://doi.org/${c.doi}`} target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-ember">
                      {p?.short ?? c.doi}
                    </a>
                  )}
                  <span className="shrink-0 tabular-nums text-ink-muted">{fmt(c.n)}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <CitingWorks works={k.top} />
        {weight === "perYear" && (
          <p className="text-xs text-ink-faint">
            {t(
              "Cites / yr weights each citing work by 1 / years since the newest of Ken's papers it cites (floor 1 year).",
              "年化引用：每篇施引按 1/其所引本人最新论文的发表年数加权（下限 1 年）。"
            )}
          </p>
        )}
      </div>
    );
  }

  const r = region(focus.id);
  if (!r) return null;
  const kws = view.keywords.filter((k) => k.region === r.id && k.r > 0).sort((a, b) => b.works - a.works || (a.id < b.id ? -1 : 1));
  const feeding = view.papers
    .map((p) => ({ p, s: p.shares[r.id] ?? 0 }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.p.works - a.p.works);
  const folded = view.meta.folded.filter((p) => p.region === r.id);
  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{t("Region", "区域")}</p>
        <h3 className="mt-1 flex items-center gap-2 font-display text-2xl leading-tight text-ink">
          <Swatch color={r.color} />
          {zh ? r.zh : r.en}
        </h3>
        <p className="mt-1 text-ink-muted">
          {t(
            `${fmt(r.works)} citing works carry one of its ${kws.length} keywords · ${r.perYear.toFixed(0)} cites / yr`,
            `${fmt(r.works)} 篇施引文献带有其 ${kws.length} 个关键词之一 · 每年 ${r.perYear.toFixed(0)} 次`
          )}
        </p>
      </div>
      <div>
        <h4 className="text-xs font-medium text-ink">{t("Keywords, largest first", "关键词（按大小）")}</h4>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {kws.map((k) => (
            <KeywordChip key={k.id} k={k} color={r.color} onSelect={onSelect} count={weight === "absolute" ? k.works : k.perYear.toFixed(1)} />
          ))}
        </div>
      </div>
      {feeding.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-ink">
            {t("Papers whose citers use it · share of their keyword mentions", "其施引文献使用该区域词汇的论文 · 占比")}
          </h4>
          <ul className="mt-1.5 space-y-1">
            {feeding.map(({ p, s }) => (
              <li key={p.doi} className="flex items-baseline justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onSelect({ kind: "paper", id: p.doi })}
                  className="flex items-center gap-1.5 text-left text-ink hover:text-ember"
                >
                  <StarGlyph lead={p.lens === "lead"} />
                  {p.short}
                </button>
                <span className="shrink-0 tabular-nums text-ink-muted">{pct(s)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {folded.length > 0 && (
        <p className="text-xs leading-relaxed text-ink-faint">
          {t(
            `Fewer than ${num(view.meta.params.starMinWorks, 30)} citing works, so no star; their citers' keywords sit mostly here: `,
            `施引少于 ${num(view.meta.params.starMinWorks, 30)} 篇、不画星的论文，其施引关键词主要在此：`
          )}
          {folded.map((p) => `${p.short} (${fmt(p.works)})`).join(" · ")}
        </p>
      )}
    </div>
  );
}

/** "Worth a look": the largest drift, the most even bridge, the largest region, all from the data. */
export function constellationCallouts(view: ConstellationView, zh: boolean): { focus: NonNullable<ConstellationFocus>; title: string; body: string }[] {
  const out: { focus: NonNullable<ConstellationFocus>; title: string; body: string }[] = [];
  const name = (id: string | null) => {
    const r = view.regions.find((x) => x.id === id);
    return r ? (zh ? r.zh : r.en) : "–";
  };
  const drift = [...view.papers].sort((a, b) => b.drift - a.drift || (a.doi < b.doi ? -1 : 1))[0];
  if (drift && drift.drift >= 1) {
    const moved = drift.aimRegion && drift.landRegion && drift.aimRegion !== drift.landRegion;
    out.push({
      focus: { kind: "paper", id: drift.doi },
      title: zh ? "漂移最大" : "Largest drift",
      body: zh
        ? `${drift.short}：施引文献的关键词与本文自身关键词相距 ${drift.drift.toFixed(1)} 步${moved ? `，从${name(drift.aimRegion)}落到${name(drift.landRegion)}` : ""}。`
        : `${drift.short}: its citers' keywords sit ${drift.drift.toFixed(1)} keyword-steps from its own${moved ? `, from ${name(drift.aimRegion)} to ${name(drift.landRegion)}` : ""}.`,
    });
  }
  const bridges = view.papers
    .filter((p) => p.bridge)
    .map((p) => ({ p, a: p.shares[p.bridge![0]] ?? 0, b: p.shares[p.bridge![1]] ?? 0 }))
    .sort((x, y) => Math.min(y.a, y.b) - Math.min(x.a, x.b) || y.p.works - x.p.works);
  if (bridges[0]) {
    const { p, a, b } = bridges[0];
    out.push({
      focus: { kind: "paper", id: p.doi },
      title: zh ? "桥梁" : "Bridge",
      body: zh
        ? `${p.short}：施引文献关键词 ${pct(a)} 在${name(p.bridge![0])}，${pct(b)} 在${name(p.bridge![1])}。`
        : `${p.short}: ${pct(a)} of its citers' keyword mentions sit in ${name(p.bridge![0])}, ${pct(b)} in ${name(p.bridge![1])}.`,
    });
  }
  const biggest = [...view.regions].filter((r) => r.keywords > 0).sort((a, b) => b.works - a.works)[0];
  if (biggest) {
    const fed = view.papers.filter((p) => p.landRegion === biggest.id).length;
    out.push({
      focus: { kind: "region", id: biggest.id },
      title: zh ? "最大的区域" : "Largest region",
      body: zh
        ? `${biggest.zh}：${fmt(view.meta.mappedWorks)} 篇带有图中关键词的施引文献中有 ${fmt(biggest.works)} 篇${fed ? `；${fed} 颗星落在这里` : ""}。`
        : `${biggest.en}: ${fmt(biggest.works)} of the ${fmt(view.meta.mappedWorks)} citing works that carry a mapped keyword${fed ? `; ${fed} ${fed === 1 ? "star lands" : "stars land"} here` : ""}.`,
    });
  }
  return out;
}

export function ConstellationCallouts({
  view,
  onSelect,
  compact = false,
}: {
  view: ConstellationView;
  onSelect: (f: ConstellationFocus) => void;
  compact?: boolean;
}) {
  const { zh } = useText();
  const items = constellationCallouts(view, zh);
  if (items.length === 0) return null;
  return (
    <ol className={compact ? "space-y-2" : "space-y-3"}>
      {items.map((c, i) => (
        <li key={c.title}>
          <button type="button" onClick={() => onSelect(c.focus)} className="group flex w-full gap-2.5 text-left text-sm leading-snug">
            <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-ink text-[10.5px] font-bold text-paper">
              {i + 1}
            </span>
            <span>
              <span className="font-medium text-ink group-hover:text-ember">{c.title}</span>
              <span className="text-ink-muted"> — {c.body}</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export function ConstellationReadingGuide({ view }: { view: ConstellationView }) {
  const { t } = useText();
  const stars = num(view.meta.params.starMinWorks, 30);
  const items = [
    t("Each disc is a keyword carried by works that cite Ken's papers; its area counts those works.", "每个圆是施引文献携带的关键词，面积表示施引文献数。"),
    t(
      "Keywords used in similar research sit close together. Closeness = similar topics; directions mean nothing.",
      "用于相近研究的关键词彼此靠近。距离近 = 主题相近；方向没有含义。"
    ),
    t(
      "Tinted areas are regions: groups of keywords with similar meaning, named after their largest keywords.",
      "浅色区域是语义相近的关键词群，以其中最大的关键词命名。"
    ),
    t(
      `Stars are Ken's papers with at least ${stars} citing works, placed where their citers' keywords sit. Solid = lead author; hollow = coauthored.`,
      `星为施引至少 ${stars} 篇的本人论文，位于其施引文献关键词所在之处。实心 = 第一/通讯作者；空心 = 合作。`
    ),
    t(
      "A dashed arrow runs from where a paper's own keywords sit (aim) to where its citers' keywords sit.",
      "虚线箭头从论文自身关键词所在处（原意）指向其施引文献关键词所在处。"
    ),
    t("Hover, tap or Tab to a star, keyword or region name for details; Esc returns to rest.", "悬停、点按或用 Tab 键查看星、关键词或区域详情；Esc 返回。"),
  ];
  return (
    <ul className="space-y-1.5 text-sm leading-snug text-ink-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** Encoding key, as in the design schematic: stars, drift, keyword area, echo, and what position means. */
export function ConstellationLegend({ view, weight }: { view: ConstellationView; weight: RippleWeight }) {
  const { t } = useText();
  const max = weight === "absolute" ? view.meta.scale.maxWorks : view.meta.scale.maxPerYear;
  const nice = (v: number) => {
    const p = 10 ** Math.floor(Math.log10(v));
    return (
      [1, 2, 5, 10]
        .map((m) => m * p)
        .filter((x) => x <= v)
        .pop() ?? p
    );
  };
  const refs = [nice(max), nice(max / 8)].filter((v, i, a) => v > 0 && a.indexOf(v) === i);
  const { rMax, rMin } = view.meta.scale;
  const rOf = (v: number) => Math.max(rMin, rMax * Math.sqrt(v / max));
  const h = 2 * rOf(refs[0]) + 2;
  let x = 1;
  const discs = refs.map((v) => {
    const r = rOf(v);
    const el = <circle key={v} cx={x + r} cy={h - 1 - r} r={r} fill="var(--color-ink-faint)" fillOpacity={0.35} stroke="var(--color-ink-faint)" />;
    x += 2 * r + 8;
    return el;
  });
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-ink-muted">
      <span className="flex items-center gap-2">
        <StarGlyph lead size={14} />
        {t("Lead-author paper", "第一/通讯作者论文")}
      </span>
      <span className="flex items-center gap-2">
        <StarGlyph lead={false} size={14} />
        {t("Coauthored paper", "合作论文")}
      </span>
      <span className="flex items-center gap-2">
        <svg width="44" height="12" aria-hidden="true">
          <circle cx="4.5" cy="6" r="3" fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth="1.25" />
          <path d="M9 6H36" stroke="var(--color-ink)" strokeWidth="1.25" strokeDasharray="4 3" />
          <path d="M35 2.5L42 6L35 9.5z" fill="var(--color-ink)" />
        </svg>
        {t("Drift: from its own keywords to its citers'", "漂移：从自身关键词到施引文献关键词")}
      </span>
      <span className="flex items-center gap-2">
        <svg width={x} height={h} aria-hidden="true">
          {discs}
        </svg>
        {t(
          `Keyword (area = ${weight === "absolute" ? "citing works" : "cites / yr"}: ${refs.map((v) => fmt(v)).join(" · ")})`,
          `关键词（面积 = ${weight === "absolute" ? "施引文献数" : "年化引用"}：${refs.map((v) => fmt(v)).join(" · ")}）`
        )}
      </span>
      <span className="flex items-center gap-2">
        <svg width="14" height="14" aria-hidden="true">
          <circle cx="7" cy="7" r="5.25" fill="none" stroke="var(--color-ink-muted)" strokeWidth="1.6" />
        </svg>
        {t("Also on Ken's own paper", "本人论文也有此词")}
      </span>
      <span className="text-ink-faint">{t("Closeness = similar topics; directions mean nothing.", "距离近 = 主题相近；方向没有含义。")}</span>
      {restDrift(view).size === 0 && (
        <span className="text-ink-faint">
          {t(
            `No star drifts ${num(view.meta.params.driftRestMin, 3)} or more keyword-steps, so no arrow shows at rest; “Show all drift” or a star draws them.`,
            `没有星漂移达到 ${num(view.meta.params.driftRestMin, 3)} 步，因此静止时不显示箭头；点“显示全部漂移”或点选星即可看到。`
          )}
        </span>
      )}
    </div>
  );
}

/** The map as tables: regions with their keywords, then stars with landing, aim and drift. */
export function ConstellationTable({ view }: { view: ConstellationView }) {
  const { zh, t } = useText();
  const name = (id: string | null) => {
    const r = view.regions.find((x) => x.id === id);
    return r ? (zh ? r.zh : r.en) : "–";
  };
  return (
    <div className="mt-3 space-y-6 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{t("Regions and their keywords", "区域及其关键词")}</caption>
        <thead className="text-xs text-ink-faint">
          <tr>
            <th className="py-1 pr-3 font-normal">{t("Region", "区域")}</th>
            <th className="py-1 pr-3 text-right font-normal">{t("Citing works", "施引文献")}</th>
            <th className="py-1 font-normal">{t("Keywords (citing works; * also on Ken's papers)", "关键词（施引文献数；* 本人论文也有）")}</th>
          </tr>
        </thead>
        <tbody>
          {view.regions
            .filter((r) => r.keywords > 0)
            .map((r) => (
              <tr key={r.id} className="border-t border-rule align-top">
                <td className="py-1.5 pr-3 text-ink">{zh ? r.zh : r.en}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{fmt(r.works)}</td>
                <td className="py-1.5 text-ink-muted">
                  {view.keywords
                    .filter((k) => k.region === r.id && k.r > 0)
                    .sort((a, b) => b.works - a.works)
                    .map((k) => `${zh ? (k.zh ?? k.en) : k.en}${k.echo ? "*" : ""} (${fmt(k.works)})`)
                    .join(" · ")}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{t("Stars: Ken's papers on the map", "星：图中的本人论文")}</caption>
        <thead className="text-xs text-ink-faint">
          <tr>
            <th className="py-1 pr-3 font-normal">{t("Paper", "论文")}</th>
            <th className="py-1 pr-3 text-right font-normal">{t("Citing works", "施引文献")}</th>
            <th className="py-1 pr-3 font-normal">{t("Own keywords sit in (aim)", "自身关键词所在（原意）")}</th>
            <th className="py-1 pr-3 font-normal">{t("Citers' keywords sit in (landing)", "施引关键词所在（落点）")}</th>
            <th className="py-1 pr-3 text-right font-normal">{t("Drift (keyword-steps)", "漂移（步）")}</th>
            <th className="py-1 font-normal">{t("Bridge", "桥梁")}</th>
          </tr>
        </thead>
        <tbody>
          {[...view.papers]
            .sort((a, b) => b.works - a.works)
            .map((p) => (
              <tr key={p.doi} className="border-t border-rule">
                <td className="py-1.5 pr-3">
                  <a
                    href={`https://doi.org/${p.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-ink hover:text-ember"
                  >
                    <StarGlyph lead={p.lens === "lead"} />
                    {p.short}
                  </a>
                </td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{fmt(p.works)}</td>
                <td className="py-1.5 pr-3 text-ink-muted">{name(p.aimRegion)}</td>
                <td className="py-1.5 pr-3 text-ink-muted">{name(p.landRegion)}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{p.drift.toFixed(1)}</td>
                <td className="py-1.5 text-ink-muted">{p.bridge ? p.bridge.map(name).join(" + ") : ""}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
