"use client";

import T from "@/components/T";
import { useReachLens } from "./ReachLens";

export default function ReachIntro() {
  const { view, lens } = useReachLens();
  const { totals } = view;
  const lensEn = lens === "lead" ? "first / last / corresponding-author" : "published";
  const lensZh = lens === "lead" ? "第一/通讯作者" : "已发表";
  return (
    <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-muted animate-fade-up delay-1">
      <T
        en={`Where the ideas travel after publication: the research areas, institutions and countries of the ${totals.uniqueCitingWorks.toLocaleString()} distinct works that cite Ken's ${totals.papers} ${lensEn} papers with a DOI — with every self-citation removed. Switch the filter to compare All vs lead-author corpus.`}
        zh={`论文发表之后，思想流向何处：引用黄康宁 ${totals.papers} 篇${lensZh}论文（有 DOI）的 ${totals.uniqueCitingWorks.toLocaleString()} 篇不同文献，来自哪些研究领域、机构与国家——已剔除全部自引。可用筛选切换“全部”与“第一/通讯作者”语料。`}
      />
    </p>
  );
}
