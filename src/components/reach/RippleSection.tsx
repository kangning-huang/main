"use client";

import { useEffect, useState } from "react";
import T from "@/components/T";
import { useLanguage } from "@/lib/language-context";
import { REACH_VIZ, getBeeswarm, getClusters, type ReachViz } from "@/lib/reach-alt";
import { getRipple, sameFocus, type RippleFocus, type RippleWeight } from "@/lib/ripple";
import { getConstellation, restDrift, sameConstellationFocus, type ConstellationFocus, type ConstellationView } from "@/lib/constellation";
import { readQuery, updateQuery } from "@/lib/url-state";
import ConstellationMap from "./ConstellationMap";
import ConstellationPhone from "./ConstellationPhone";
import { ConstellationCallouts, ConstellationDetails, ConstellationLegend, ConstellationReadingGuide, ConstellationTable, constellationCallouts } from "./ConstellationPanel";
import ReachBeeswarm from "./ReachBeeswarm";
import ReachClusters, { ClusterPartners } from "./ReachClusters";
import { useReachLens } from "./ReachLens";
import RippleMap from "./RippleMap";
import RippleStrip from "./RippleStrip";
import RippleTable from "./RippleTable";
import { RippleCallouts, RippleDetails, RippleLegend, RippleReadingGuide, calloutSentence } from "./RipplePanel";

const fmt = (n: number) => n.toLocaleString("en-US");

// Preview branches only (preview/reach-viz-alt, preview/reach-constellation): alternative views behind a toggle, Ripple stays the default.
const VIZ_NAMES: Record<ReachViz, { en: string; zh: string; kicker: { en: string; zh: string } }> = {
  ripple: { en: "Ripple", zh: "涟漪图", kicker: { en: "Ripple map", zh: "涟漪图" } },
  beeswarm: { en: "Beeswarm (A)", zh: "蜂群图 (A)", kicker: { en: "Beeswarm · reach by theme", zh: "蜂群图 · 分主题距离" } },
  clusters: { en: "Clusters (C)", zh: "聚类图 (C)", kicker: { en: "Clusters · keyword map", zh: "聚类图 · 关键词关联" } },
  constellation: { en: "Constellation", zh: "星座图", kicker: { en: "Constellation · vocabulary map", zh: "星座图 · 词汇地图" } },
};

/** A Constellation focus that exists (and is drawn) in this lens, else null. */
function validConstellation(view: ConstellationView, f: ConstellationFocus): ConstellationFocus {
  if (!f) return null;
  if (f.kind === "paper") return view.papers.some((p) => p.doi === f.id) ? f : null;
  if (f.kind === "keyword") return view.keywords.some((k) => k.id === f.id && k.r > 0) ? f : null;
  return view.regions.some((r) => r.id === f.id && r.keywords > 0) ? f : null;
}

/** Section 01 of /reach: the Ripple map (circle ≥ 720 px, strip below), or a preview alternative. */
export default function RippleSection() {
  const { lens } = useReachLens();
  const { language } = useLanguage();
  const zh = language === "zh";
  const view = getRipple(lens);
  const clusters = getClusters(lens);
  const beeswarm = getBeeswarm(lens);
  const cview = getConstellation(lens);
  const [viz, setViz] = useState<ReachViz>("ripple");
  const [weight, setWeight] = useState<RippleWeight>("absolute");
  const [selected, setSelected] = useState<RippleFocus>(null);
  const [hovered, setHovered] = useState<RippleFocus>(null);
  const [cSelected, setCSelected] = useState<ConstellationFocus>(null);
  const [cHovered, setCHovered] = useState<ConstellationFocus>(null);
  const [allDrift, setAllDrift] = useState(false);
  const [ready, setReady] = useState(false);

  // ?viz=…&theme=…&kw=…&weight=perYear (Constellation: ?paper=…&kw=…&region=…&drift=all) → state,
  // once after mount (?lens is read by ReachLensProvider).
  useEffect(() => {
    const kw = readQuery("kw");
    const theme = readQuery("theme");
    const v = readQuery("viz");
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from the URL after hydration */
    if (v === "constellation") {
      const paper = readQuery("paper");
      const region = readQuery("region");
      if (paper) setCSelected({ kind: "paper", id: paper.toLowerCase() });
      else if (kw) setCSelected({ kind: "keyword", id: kw });
      else if (region) setCSelected({ kind: "region", id: region });
      if (readQuery("drift") === "all") setAllDrift(true);
    } else if (kw) setSelected({ kind: "keyword", id: kw });
    else if (theme) setSelected({ kind: "theme", id: theme });
    if (readQuery("weight") === "perYear") setWeight("perYear");
    if (v && (REACH_VIZ as string[]).includes(v)) setViz(v as ReachViz);
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const valid = (f: RippleFocus): RippleFocus => {
    if (!f) return null;
    const ok = f.kind === "theme" ? view.themes.some((t) => t.id === f.id) : view.keywords.some((k) => k.id === f.id);
    return ok ? f : null;
  };
  const sel = valid(selected);
  const active = valid(hovered) ?? sel;
  const selKind = sel?.kind ?? null;
  const selId = sel?.id ?? null;
  const cSel = validConstellation(cview, cSelected);
  const cActive = validConstellation(cview, cHovered) ?? cSel;
  const cSelKind = cSel?.kind ?? null;
  const cSelId = cSel?.id ?? null;
  const isConstellation = viz === "constellation";

  useEffect(() => {
    if (!ready) return;
    updateQuery({
      viz: viz === "ripple" ? null : viz,
      theme: !isConstellation && selKind === "theme" ? selId : null,
      kw: isConstellation ? (cSelKind === "keyword" ? cSelId : null) : selKind === "keyword" ? selId : null,
      paper: isConstellation && cSelKind === "paper" ? cSelId : null,
      region: isConstellation && cSelKind === "region" ? cSelId : null,
      drift: isConstellation && allDrift ? "all" : null,
      weight: weight === "perYear" ? "perYear" : null,
    });
  }, [ready, viz, isConstellation, selKind, selId, cSelKind, cSelId, allDrift, weight]);

  const calloutRank = new Map(view.callouts.map((c, i) => [c.keyword, i + 1]));
  const select = (f: RippleFocus) => {
    setSelected(f);
    setHovered(null);
  };
  const cSelect = (f: ConstellationFocus) => {
    setCSelected(f);
    setCHovered(null);
  };
  // A keyword in focus follows the reader between views when the other view shows it too.
  const switchViz = (v: ReachViz) => {
    if (v === "constellation" && !isConstellation && sel?.kind === "keyword" && cview.keywords.some((k) => k.id === sel.id && k.r > 0)) {
      cSelect({ kind: "keyword", id: sel.id });
    } else if (v !== "constellation" && isConstellation && cSel?.kind === "keyword" && view.keywords.some((k) => k.id === cSel.id)) {
      select({ kind: "keyword", id: cSel.id });
    }
    setViz(v);
  };

  const headline = zh ? view.meta.headline.zh : view.meta.headline.en;
  const calloutText = view.callouts
    .map((_, i) => calloutSentence(view, i, zh))
    .filter(Boolean)
    .map((s, i) => `${i + 1}. ${s!.title}: ${s!.body}`)
    .join(" ");
  const svgTitle =
    viz === "beeswarm"
      ? zh
        ? "蜂群图：按主题与距离排列的施引文献关键词"
        : "Beeswarm: keywords of citing works by theme and reach distance"
      : viz === "clusters"
        ? zh
          ? "关键词关联图：按同现程度排列的施引文献关键词"
          : "Keyword map: keywords of citing works placed by how often they appear together"
        : zh
          ? "涟漪图：施引文献关键词与其距离"
          : "Ripple map: keywords of citing works and how far they reach";
  const svgDesc = `${headline} ${calloutText}`;
  const selectedName = (() => {
    if (isConstellation) {
      if (!cSel) return "";
      if (cSel.kind === "paper") return cview.papers.find((p) => p.doi === cSel.id)?.short ?? "";
      if (cSel.kind === "region") {
        const r = cview.regions.find((x) => x.id === cSel.id);
        return r ? (zh ? r.zh : r.en) : "";
      }
      const k = cview.keywords.find((x) => x.id === cSel.id);
      return k ? (zh ? (k.zh ?? k.en) : k.en) : "";
    }
    if (!sel) return "";
    if (sel.kind === "theme") {
      const t = view.themes.find((x) => x.id === sel.id);
      return t ? (zh ? t.zh : t.en) : "";
    }
    const k = view.keywords.find((x) => x.id === sel.id);
    return k ? (zh ? (k.zh ?? k.en) : k.en) : "";
  })();

  const extraFor = (f: RippleFocus) =>
    viz === "clusters" && f?.kind === "keyword" ? <ClusterPartners view={view} id={f.id} onSelect={select} /> : undefined;
  const details = sel ? <RippleDetails view={view} focus={sel} weight={weight} onSelect={select} extra={extraFor(sel)} /> : null;
  const cDetails = cSel ? <ConstellationDetails view={cview} focus={cSel} weight={weight} onSelect={cSelect} /> : null;

  const pill = (on: boolean) =>
    `rounded-full px-3 py-1 transition-colors ${on ? "bg-ember-light text-ember-dark" : "text-ink-muted hover:text-ink"}`;
  const chip = (on: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
      on ? "border-ink text-ink" : "border-rule text-ink-muted hover:border-ink-faint hover:text-ink"
    }`;

  const controls = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex w-fit flex-wrap rounded-[1.25rem] border border-dashed border-ember p-0.5 text-sm" role="group" aria-label={zh ? "视图（预览）" : "View (preview)"}>
          {REACH_VIZ.map((v) => (
            <button key={v} type="button" aria-pressed={viz === v} onClick={() => switchViz(v)} className={pill(viz === v)}>
              {zh ? VIZ_NAMES[v].zh : VIZ_NAMES[v].en}
            </button>
          ))}
        </div>
        <span className="text-[11px] uppercase tracking-[0.12em] text-ember-dark">
          <T en="Preview" zh="预览" />
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex w-fit rounded-full border border-rule p-0.5 text-sm" role="group" aria-label={zh ? "权重" : "Weighting"}>
          <button type="button" aria-pressed={weight === "absolute"} onClick={() => setWeight("absolute")} className={pill(weight === "absolute")}>
            <T en="Citing works" zh="施引文献数" />
          </button>
          <button type="button" aria-pressed={weight === "perYear"} onClick={() => setWeight("perYear")} className={pill(weight === "perYear")}>
            <T en="Cites / year" zh="年化引用" />
          </button>
        </div>
        {isConstellation && (
          <button
            type="button"
            aria-pressed={allDrift}
            onClick={() => setAllDrift((on) => !on)}
            className={`hidden rounded-full border px-3 py-1 text-sm transition-colors min-[720px]:inline-flex ${
              allDrift ? "border-ember bg-ember-light text-ember-dark" : "border-rule text-ink-muted hover:text-ink"
            }`}
          >
            <T en="Show all drift" zh="显示全部漂移" />
          </button>
        )}
      </div>
      {isConstellation ? (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={zh ? "区域" : "Regions"}>
          {cview.regions.map((r) => {
            const f: ConstellationFocus = { kind: "region", id: r.id };
            const on = sameConstellationFocus(cSel, f);
            const empty = r.keywords === 0;
            return (
              <button
                key={r.id}
                type="button"
                aria-pressed={on}
                disabled={empty}
                title={empty ? (zh ? "此视角中没有施引文献" : "No citing works in this lens") : undefined}
                onClick={() => cSelect(on ? null : f)}
                onPointerEnter={(e) => e.pointerType === "mouse" && !empty && setCHovered(f)}
                onPointerLeave={(e) => e.pointerType === "mouse" && setCHovered(null)}
                className={`${chip(on)} ${empty ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: r.color }} aria-hidden="true" />
                {zh ? r.zh : r.en}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={zh ? "主题" : "Themes"}>
          {view.themes.map((t) => {
            const f: RippleFocus = { kind: "theme", id: t.id };
            const on = sameFocus(sel, f);
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() => select(on ? null : f)}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(f)}
                onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(null)}
                className={chip(on)}
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: t.color }} aria-hidden="true" />
                {zh ? t.zh : t.en}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const common = { view, weight, active, selected: sel, onSelect: select, calloutRank, title: svgTitle, desc: svgDesc };

  const legend = (() => {
    if (viz === "beeswarm") {
      const note = zh
        ? "横向：平均距离——本人主题 → 同一子领域 → 同一领域 → 同一大类（OpenAlex 层级；间距与涟漪图的环相同，按平方根）。行内上下位置仅为避免重叠。"
        : "Across: mean reach distance, home topics → same subfield → same field → same domain (OpenAlex hierarchy; square-root spacing, as the Ripple's rings). Up and down within a row only keeps bubbles apart.";
      return (
        <>
          <div className="hidden min-[720px]:block">
            <RippleLegend view={view} weight={weight} scale={beeswarm.wide} note={note} />
          </div>
          <div className="min-[720px]:hidden">
            <RippleLegend view={view} weight={weight} scale={beeswarm.narrow} note={note} />
          </div>
        </>
      );
    }
    if (viz === "clusters") {
      const m = clusters.meta;
      const note =
        m.method === "cooccurrence"
          ? zh
            ? `距离越近 = 同时带有两个关键词的施引文献越多（基于 ${fmt(m.citingWorks)} 篇施引文献的关联强度 VOS 映射；没有坐标轴）。连线：共同出现于至少 ${m.params.restLinkMin} 篇施引文献的关键词对。`
            : `Closer = more citing works carry both keywords (VOS map of association strength over ${fmt(m.citingWorks)} citing works; no axes). Lines join pairs that share at least ${m.params.restLinkMin} citing works.`
          : zh
            ? `按研究主题分组，组内位置没有含义：此视角中只有 ${m.robustPairs} 对关键词共同出现于至少 ${m.params.robustPairWorks} 篇施引文献，不足以映射关联度。`
            : `Grouped by research theme; position within a group means nothing. Only ${m.robustPairs} keyword pairs share ${m.params.robustPairWorks} or more citing works in this lens, too few to map relatedness.`;
      return (
        <>
          <div className="hidden min-[720px]:block">
            <RippleLegend view={view} weight={weight} scale={clusters.wide} note={note} />
          </div>
          <div className="min-[720px]:hidden">
            <RippleLegend view={view} weight={weight} scale={clusters.narrow} note={note} />
          </div>
        </>
      );
    }
    if (isConstellation) return <ConstellationLegend view={cview} weight={weight} />;
    return <RippleLegend view={view} weight={weight} />;
  })();

  // The Constellation's header: the schematic's title when drift arrows show at rest; otherwise the
  // largest drift, so the headline never promises arrows the map does not draw.
  const shownRegions = cview.regions.filter((r) => r.keywords > 0).length;
  const maxDrift = Math.max(0, ...cview.papers.map((p) => p.drift));
  const cHeadline =
    restDrift(cview).size > 0
      ? zh
        ? "论文落在其施引文献所在之处；箭头显示它们偏离原意的漂移。"
        : "Papers sit where their citers are; arrows show drift from where they aimed."
      : zh
        ? `论文落在其施引文献所在之处，与原意相距都不超过 ${maxDrift.toFixed(1)} 步。`
        : `Papers sit where their citers are, never more than ${maxDrift.toFixed(1)} keyword-steps from where they aimed.`;
  const cTitle = zh ? "星座图：施引文献词汇的区域、本人论文的位置与漂移" : "Constellation map: regions of citing-work vocabulary, Ken's papers and their drift";
  const cDesc = constellationCallouts(cview, zh)
    .map((c, i) => `${i + 1}. ${c.title}: ${c.body}`)
    .join(" ");

  return (
    <div>
      {/* lg: chart on the left spanning the rows; headline, controls and panel stacked on the right. */}
      <div className="grid gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_auto_1fr]">
        <header className="lg:col-start-2 lg:row-start-1">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">
            01 · {zh ? VIZ_NAMES[viz].kicker.zh : VIZ_NAMES[viz].kicker.en}
          </p>
          {isConstellation ? (
            <>
              <h2 id="ripple-heading" className="mt-2 font-display text-3xl leading-tight text-ink md:text-[2.25rem] lg:text-[2rem]">
                {cHeadline}
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                {zh
                  ? `${shownRegions} 个区域 · ${cview.papers.length} 颗星 · ${fmt(cview.meta.citingWorks)} 篇施引文献中 ${fmt(cview.meta.mappedWorks)} 篇带有图中关键词 · OpenAlex，${cview.meta.asOf} · 已剔除自引`
                  : `${shownRegions} regions · ${cview.papers.length} stars · ${fmt(cview.meta.mappedWorks)} of ${fmt(cview.meta.citingWorks)} citing works carry a mapped keyword · OpenAlex, ${cview.meta.asOf} · self-citations removed`}
              </p>
            </>
          ) : (
            <>
              <h2 id="ripple-heading" className="mt-2 font-display text-3xl leading-tight text-ink md:text-[2.25rem] lg:text-[2rem]">
                {zh ? `${view.meta.headline.sentence.zh}。` : `${view.meta.headline.sentence.en}.`}
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                {zh
                  ? `${fmt(view.meta.citingWorks)} 篇施引文献中的 ${fmt(view.meta.outsideHome)} 篇 · OpenAlex，${view.meta.asOf} · 已剔除自引`
                  : `${fmt(view.meta.outsideHome)} of ${fmt(view.meta.citingWorks)} citing works · OpenAlex, ${view.meta.asOf} · self-citations removed`}
              </p>
            </>
          )}
        </header>

        <div className="lg:col-start-2 lg:row-start-2">{controls}</div>

        <figure className="m-0 min-w-0 lg:col-start-1 lg:row-span-3 lg:row-start-1">
          {/* Phones: callouts above the chart (wider screens show them in the panel). */}
          <div className="mb-4 min-[720px]:hidden">
            {isConstellation ? <ConstellationCallouts view={cview} onSelect={cSelect} compact /> : <RippleCallouts view={view} onSelect={select} compact />}
          </div>
          {viz === "ripple" && (
            <>
              <div className="mx-auto hidden max-w-[800px] min-[720px]:block">
                <RippleMap {...common} onHover={setHovered} />
              </div>
              <div className="min-[720px]:hidden">
                <RippleStrip view={view} weight={weight} active={active} selected={sel} onSelect={select} calloutRank={calloutRank} details={details} />
              </div>
            </>
          )}
          {viz === "beeswarm" && (
            <div className="mx-auto max-w-[800px]">
              <ReachBeeswarm {...common} onHover={setHovered} details={details} />
            </div>
          )}
          {viz === "clusters" && (
            <div className="mx-auto max-w-[800px]">
              <ReachClusters {...common} onHover={setHovered} details={details} />
            </div>
          )}
          {isConstellation && (
            <>
              <div className="mx-auto hidden max-w-[800px] min-[720px]:block">
                <ConstellationMap
                  view={cview}
                  weight={weight}
                  active={cActive}
                  selected={cSel}
                  onHover={setCHovered}
                  onSelect={cSelect}
                  allDrift={allDrift}
                  title={cTitle}
                  desc={cDesc}
                />
              </div>
              <div className="min-[720px]:hidden">
                <ConstellationPhone view={cview} weight={weight} selected={cSel} onSelect={cSelect} details={cDetails} />
              </div>
            </>
          )}
          <figcaption className="mt-4 border-t border-rule-faint pt-3">{legend}</figcaption>
        </figure>

        <aside className="hidden self-start rounded-xl border border-rule bg-paper-warm/40 p-5 min-[720px]:block lg:col-start-2 lg:row-start-3">
          {isConstellation ? (
            cActive ? (
              <>
                <ConstellationDetails view={cview} focus={cActive} weight={weight} onSelect={cSelect} />
                {cSel && (
                  <button type="button" onClick={() => cSelect(null)} className="mt-4 text-xs text-teal hover:text-ember">
                    <T en="← Back to the whole map (Esc)" zh="← 返回全图（Esc）" />
                  </button>
                )}
              </>
            ) : (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
                    <T en="Worth a look" zh="值得一看" />
                  </h3>
                  <div className="mt-2">
                    <ConstellationCallouts view={cview} onSelect={cSelect} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
                    <T en="How to read it" zh="怎么读" />
                  </h3>
                  <div className="mt-2">
                    <ConstellationReadingGuide view={cview} />
                  </div>
                </div>
              </div>
            )
          ) : active ? (
            <>
              <RippleDetails view={view} focus={active} weight={weight} onSelect={select} extra={extraFor(active)} />
              {sel && (
                <button type="button" onClick={() => select(null)} className="mt-4 text-xs text-teal hover:text-ember">
                  <T en="← Back to the whole map (Esc)" zh="← 返回全图（Esc）" />
                </button>
              )}
            </>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
                  <T en="Worth a look" zh="值得一看" />
                </h3>
                <div className="mt-2">
                  <RippleCallouts view={view} onSelect={select} />
                </div>
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
                  <T en="How to read it" zh="怎么读" />
                </h3>
                <div className="mt-2">
                  <RippleReadingGuide mode={viz} clusters={clusters.meta.method} />
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      <p className="sr-only" aria-live="polite">
        {selectedName ? (zh ? `已选择：${selectedName}` : `Selected: ${selectedName}`) : ""}
      </p>

      <details className="mt-6 text-sm">
        <summary className="cursor-pointer text-ink-muted hover:text-ink">
          <T en="Show as table" zh="以表格显示" />
        </summary>
        {isConstellation ? <ConstellationTable view={cview} /> : <RippleTable view={view} />}
      </details>
    </div>
  );
}
