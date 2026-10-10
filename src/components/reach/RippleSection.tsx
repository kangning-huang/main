"use client";

import { useEffect, useMemo, useState } from "react";
import T from "@/components/T";
import { useLanguage } from "@/lib/language-context";
import { getRipple, sameFocus, type RippleFocus, type RippleWeight } from "@/lib/ripple";
import { readQuery, updateQuery } from "@/lib/url-state";
import { useReachLens } from "./ReachLens";
import RippleMap from "./RippleMap";
import RippleStrip from "./RippleStrip";
import RippleTable from "./RippleTable";
import { RippleCallouts, RippleDetails, RippleLegend, RippleReadingGuide, calloutSentence } from "./RipplePanel";

const fmt = (n: number) => n.toLocaleString("en-US");

/** Section 01 of /reach: the Ripple map (circle ≥ 720 px, strip below). */
export default function RippleSection() {
  const { lens } = useReachLens();
  const { language } = useLanguage();
  const zh = language === "zh";
  const view = getRipple(lens);
  const [weight, setWeight] = useState<RippleWeight>("absolute");
  const [selected, setSelected] = useState<RippleFocus>(null);
  const [hovered, setHovered] = useState<RippleFocus>(null);
  const [ready, setReady] = useState(false);

  // ?theme=…&kw=…&weight=perYear → state, once after mount (?lens is read by ReachLensProvider).
  useEffect(() => {
    const kw = readQuery("kw");
    const theme = readQuery("theme");
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from the URL after hydration */
    if (kw) setSelected({ kind: "keyword", id: kw });
    else if (theme) setSelected({ kind: "theme", id: theme });
    if (readQuery("weight") === "perYear") setWeight("perYear");
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

  useEffect(() => {
    if (!ready) return;
    updateQuery({
      theme: selKind === "theme" ? selId : null,
      kw: selKind === "keyword" ? selId : null,
      weight: weight === "perYear" ? "perYear" : null,
    });
  }, [ready, selKind, selId, weight]);

  const calloutRank = useMemo(() => new Map(view.callouts.map((c, i) => [c.keyword, i + 1])), [view]);
  const select = (f: RippleFocus) => {
    setSelected(f);
    setHovered(null);
  };

  const headline = zh ? view.meta.headline.zh : view.meta.headline.en;
  const calloutText = view.callouts
    .map((_, i) => calloutSentence(view, i, zh))
    .filter(Boolean)
    .map((s, i) => `${i + 1}. ${s!.title}: ${s!.body}`)
    .join(" ");
  const svgTitle = zh ? "涟漪图：施引文献关键词与其距离" : "Ripple map: keywords of citing works and how far they reach";
  const svgDesc = `${headline} ${calloutText}`;
  const selectedName = (() => {
    if (!sel) return "";
    if (sel.kind === "theme") {
      const t = view.themes.find((x) => x.id === sel.id);
      return t ? (zh ? t.zh : t.en) : "";
    }
    const k = view.keywords.find((x) => x.id === sel.id);
    return k ? (zh ? (k.zh ?? k.en) : k.en) : "";
  })();

  const pill = (on: boolean) =>
    `rounded-full px-3 py-1 transition-colors ${on ? "bg-ember-light text-ember-dark" : "text-ink-muted hover:text-ink"}`;

  const controls = (
    <div className="flex flex-col gap-3">
      <div className="flex w-fit rounded-full border border-rule p-0.5 text-sm" role="group" aria-label={zh ? "权重" : "Weighting"}>
        <button type="button" aria-pressed={weight === "absolute"} onClick={() => setWeight("absolute")} className={pill(weight === "absolute")}>
          <T en="Citing works" zh="施引文献数" />
        </button>
        <button type="button" aria-pressed={weight === "perYear"} onClick={() => setWeight("perYear")} className={pill(weight === "perYear")}>
          <T en="Cites / year" zh="年化引用" />
        </button>
      </div>
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
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                on ? "border-ink text-ink" : "border-rule text-ink-muted hover:border-ink-faint hover:text-ink"
              }`}
            >
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: t.color }} aria-hidden="true" />
              {zh ? t.zh : t.en}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      {/* lg: chart on the left spanning the rows; headline, controls and panel stacked on the right. */}
      <div className="grid gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_auto_1fr]">
        <header className="lg:col-start-2 lg:row-start-1">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">
            01 · <T en="Ripple map" zh="涟漪图" />
          </p>
          <h2 id="ripple-heading" className="mt-2 font-display text-3xl leading-tight text-ink md:text-[2.25rem] lg:text-[2rem]">
            {zh ? `${view.meta.headline.sentence.zh}。` : `${view.meta.headline.sentence.en}.`}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {zh
              ? `${fmt(view.meta.citingWorks)} 篇施引文献中的 ${fmt(view.meta.outsideHome)} 篇 · OpenAlex，${view.meta.asOf} · 已剔除自引`
              : `${fmt(view.meta.outsideHome)} of ${fmt(view.meta.citingWorks)} citing works · OpenAlex, ${view.meta.asOf} · self-citations removed`}
          </p>
        </header>

        <div className="lg:col-start-2 lg:row-start-2">{controls}</div>

        <figure className="m-0 min-w-0 lg:col-start-1 lg:row-span-3 lg:row-start-1">
          {/* Phones: callouts above the strip (wider screens show them in the panel). */}
          <div className="mb-4 min-[720px]:hidden">
            <RippleCallouts view={view} onSelect={select} compact />
          </div>
          <div className="mx-auto hidden max-w-[800px] min-[720px]:block">
            <RippleMap
              view={view}
              weight={weight}
              active={active}
              selected={sel}
              onHover={setHovered}
              onSelect={select}
              calloutRank={calloutRank}
              title={svgTitle}
              desc={svgDesc}
            />
          </div>
          <div className="min-[720px]:hidden">
            <RippleStrip
              view={view}
              weight={weight}
              active={active}
              selected={sel}
              onSelect={select}
              calloutRank={calloutRank}
              details={sel ? <RippleDetails view={view} focus={sel} weight={weight} onSelect={select} /> : null}
            />
          </div>
          <figcaption className="mt-4 border-t border-rule-faint pt-3">
            <RippleLegend view={view} weight={weight} />
          </figcaption>
        </figure>

        <aside className="hidden self-start rounded-xl border border-rule bg-paper-warm/40 p-5 min-[720px]:block lg:col-start-2 lg:row-start-3">
          {active ? (
            <>
              <RippleDetails view={view} focus={active} weight={weight} onSelect={select} />
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
                  <RippleReadingGuide />
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      <p className="sr-only" aria-live="polite">
        {sel ? (zh ? `已选择：${selectedName}` : `Selected: ${selectedName}`) : ""}
      </p>

      <details className="mt-6 text-sm">
        <summary className="cursor-pointer text-ink-muted hover:text-ink">
          <T en="Show as table" zh="以表格显示" />
        </summary>
        <RippleTable view={view} />
      </details>
    </div>
  );
}
