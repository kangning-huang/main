"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import T from "@/components/T";
import {
  influence,
  defaultLens,
  getView,
  type InfluenceView,
  type ReachLens,
  type InfluencePaper,
} from "@/lib/influence";

type Ctx = {
  lens: ReachLens;
  setLens: (l: ReachLens) => void;
  view: InfluenceView;
  papers: InfluencePaper[];
  autoFlipped: boolean;
};

const ReachLensContext = createContext<Ctx | null>(null);

export function useReachLens(): Ctx {
  const ctx = useContext(ReachLensContext);
  if (!ctx) throw new Error("useReachLens must be used inside ReachLensProvider");
  return ctx;
}

export function ReachLensProvider({ children }: { children: ReactNode }) {
  const [lens, setLens] = useState<ReachLens>(defaultLens);
  const view = useMemo(() => getView(lens), [lens]);
  const papers = useMemo(() => {
    if (lens === "lead") return influence.papers.filter((p) => p.lens === "lead");
    return influence.papers;
  }, [lens]);
  const value: Ctx = {
    lens,
    setLens,
    view,
    papers,
    autoFlipped: !!influence.meta.autoFlippedToLead,
  };
  return <ReachLensContext.Provider value={value}>{children}</ReachLensContext.Provider>;
}

export function ReachLensChip() {
  const { lens, setLens, view, autoFlipped } = useReachLens();
  const { meta } = influence;
  return (
    <div className="mt-6 flex flex-col gap-3 animate-fade-up delay-2">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Corpus filter">
        <button
          type="button"
          onClick={() => setLens("all")}
          className={`rounded-full border px-3 py-1 text-sm transition-colors ${
            lens === "all"
              ? "border-ember bg-ember-light text-ember-dark"
              : "border-rule text-ink-muted hover:border-ember hover:text-ember"
          }`}
          aria-pressed={lens === "all"}
        >
          <T en="All papers" zh="全部论文" />
        </button>
        <button
          type="button"
          onClick={() => setLens("lead")}
          className={`rounded-full border px-3 py-1 text-sm transition-colors ${
            lens === "lead"
              ? "border-ember bg-ember-light text-ember-dark"
              : "border-rule text-ink-muted hover:border-ember hover:text-ember"
          }`}
          aria-pressed={lens === "lead"}
        >
          <T en="First / last / corresponding author" zh="第一 / 通讯作者" />
        </button>
        {autoFlipped && lens === "lead" && (
          <span className="text-xs text-ink-faint">
            <T
              en={`Default flipped to lead: co-author-only citers were ${meta.coauthorOnlyCitingShare}% of All.`}
              zh={`因合作论文独占施引达 ${meta.coauthorOnlyCitingShare}%，默认切换为第一/通讯作者视角。`}
            />
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-rule bg-paper-warm/60 px-4 py-3 text-xs text-ink-muted">
        <span className="rounded bg-teal-light px-2 py-0.5 font-medium text-teal">
          <T en="Source: OpenAlex" zh="来源：OpenAlex" />
        </span>
        <span>
          <T en={`As of ${meta.asOf}`} zh={`截至 ${meta.asOf}`} />
        </span>
        <span>
          <T
            en={`${view.totals.papers} papers · ${view.totals.uniqueCitingWorks.toLocaleString()} citing works · ${view.totals.countriesCount} countries`}
            zh={`${view.totals.papers} 篇论文 · ${view.totals.uniqueCitingWorks.toLocaleString()} 篇施引 · ${view.totals.countriesCount} 个国家/地区`}
          />
        </span>
        <span>
          <T
            en={`${view.totals.selfCitationsRemoved} self-citations removed`}
            zh={`已剔除 ${view.totals.selfCitationsRemoved} 次自引`}
          />
        </span>
        <a href="#method" className="text-teal hover:text-ember">
          <T en="Method →" zh="方法 →" />
        </a>
      </div>
    </div>
  );
}
