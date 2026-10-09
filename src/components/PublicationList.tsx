"use client";

import { useState } from "react";
import type { Publication } from "@/lib/constants";
import PublicationCard from "@/components/PublicationCard";
import T from "@/components/T";

type Filter = "all" | "lead";

const FILTERS: { key: Filter; en: string; zh: string }[] = [
  { key: "all", en: "All", zh: "全部" },
  { key: "lead", en: "First / last / corresponding author", zh: "第一/通讯/末位作者" },
];

function groupByYear(pubs: Publication[]) {
  const byYear = pubs.reduce<Record<number, Publication[]>>((acc, pub) => {
    if (!acc[pub.year]) acc[pub.year] = [];
    acc[pub.year].push(pub);
    return acc;
  }, {});
  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);
  return { byYear, years };
}

function newestFirst(pubs: Publication[]) {
  return [...pubs].sort((a, b) => b.year - a.year);
}

export default function PublicationList({
  published,
  inPress,
  underReview,
}: {
  published: Publication[];
  inPress: Publication[];
  underReview: Publication[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const apply = (pubs: Publication[]) =>
    filter === "lead" ? pubs.filter((p) => p.isLeadAuthor === true) : pubs;

  const shownPublished = apply(published);
  const shownInPress = newestFirst(apply(inPress));
  const shownUnderReview = newestFirst(apply(underReview));
  const { byYear, years } = groupByYear(shownPublished);

  return (
    <>
      <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label="Filter publications">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                active
                  ? "border-ember bg-ember text-paper"
                  : "border-rule text-ink-muted hover:border-ember hover:text-ember"
              }`}
            >
              <T en={f.en} zh={f.zh} />
            </button>
          );
        })}
      </div>

      <div className="mt-8 space-y-14">
        {shownPublished.length > 0 && (
          <section>
            <h2 className="font-display text-2xl text-ink">
              <T en="Published" zh="已发表" />
            </h2>
            <div className="mt-4 space-y-10">
              {years.map((year) => (
                <div key={year}>
                  <h3 className="sticky top-[65px] z-10 border-b border-rule bg-paper/95 py-2 font-display text-xl text-ember backdrop-blur-sm">
                    {year}
                  </h3>
                  <div className="mt-4 space-y-1">
                    {byYear[year].map((pub) => (
                      <PublicationCard key={pub.title} pub={pub} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {shownInPress.length > 0 && (
          <section>
            <h2 className="font-display text-2xl text-ink">
              <T en="In press" zh="即将发表" />
            </h2>
            <div className="mt-4 space-y-1">
              {shownInPress.map((pub) => (
                <PublicationCard key={pub.title} pub={pub} />
              ))}
            </div>
          </section>
        )}

        {shownUnderReview.length > 0 && (
          <section>
            <details className="group/review">
              <summary className="flex cursor-pointer list-none items-baseline gap-2 font-display text-2xl text-ink [&::-webkit-details-marker]:hidden">
                <span
                  className="inline-block text-sm text-ink-faint transition-transform duration-200 group-open/review:rotate-90"
                  aria-hidden="true"
                >
                  ▶
                </span>
                <T en="Under review" zh="审稿中" />
                <span className="font-sans text-sm text-ink-faint">
                  ({shownUnderReview.length})
                </span>
              </summary>
              <div className="mt-4 space-y-1">
                {shownUnderReview.map((pub) => (
                  <PublicationCard key={pub.title} pub={pub} />
                ))}
              </div>
            </details>
          </section>
        )}
      </div>
    </>
  );
}
