"use client";

import T from "@/components/T";
import { useReachLens } from "./ReachLens";

export default function ReachIntro() {
  const { view, lens } = useReachLens();
  const { totals } = view;
  const lensEn = lens === "lead" ? "first / last / corresponding-author" : "published";
  const lensZh = lens === "lead" ? "第一/通讯作者" : "已发表";
  return (
    <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">
      <T
        en={`${totals.uniqueCitingWorks.toLocaleString()} citing works · ${totals.papers} ${lens === "lead" ? "lead" : "published"} papers · ${totals.countriesCount} countries (OpenAlex).`}
        zh={`${totals.uniqueCitingWorks.toLocaleString()} 篇施引 · ${totals.papers} 篇${lens === "lead" ? "第一/通讯作者" : "已发表"}论文 · ${totals.countriesCount} 个国家/地区（OpenAlex）。`}
      />
    </p>
  );
}
