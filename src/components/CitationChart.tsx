"use client";

import { useLanguage } from "@/lib/language-context";

const CAREER_MILESTONES = [
  { year: 2014, en: "PhD, Yale", zh: "博士，耶鲁", labelRow: 0 },
  { year: 2020, en: "Postdoc, NCAR", zh: "博士后，NCAR", labelRow: 0 },
  { year: 2022, en: "Asst Prof, NYU Shanghai", zh: "助理教授，上海纽约大学", labelRow: 1 },
];

interface CitationChartProps {
  citedByYears: Record<string, number>;
  totalCitations: number;
  hIndex: number;
  i10Index: number;
}

export default function CitationChart({
  citedByYears,
  totalCitations,
  hIndex,
  i10Index,
}: CitationChartProps) {
  const { language } = useLanguage();

  // Sort years and get the data
  const years = Object.keys(citedByYears)
    .map(Number)
    .sort((a, b) => a - b);
  const counts = years.map((y) => citedByYears[y.toString()]);
  const maxCount = Math.max(...counts);

  return (
    <div className="rounded-xl border border-rule bg-paper-warm/50 p-6">
      {/* Metrics row */}
      <div className="mb-6 flex flex-wrap items-center gap-6">
        <div>
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {totalCitations.toLocaleString()}
          </div>
          <div className="text-xs text-ink-muted">
            {language === "zh" ? "引用" : "Citations"}
          </div>
        </div>
        <div className="h-8 w-px bg-rule" />
        <div>
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {hIndex}
          </div>
          <div className="text-xs text-ink-muted">h-index</div>
        </div>
        <div className="h-8 w-px bg-rule" />
        <div>
          <div className="text-2xl font-semibold text-ink tabular-nums">
            {i10Index}
          </div>
          <div className="text-xs text-ink-muted">i10-index</div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="relative pt-14">
        <div className="flex items-end justify-between gap-1" style={{ height: "120px" }}>
          {years.map((year, i) => {
            const count = counts[i];
            const heightPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const isCurrentYear = year === new Date().getFullYear();
            const milestone = CAREER_MILESTONES.find((m) => m.year === year);

            return (
              <div
                key={year}
                className="group relative flex flex-1 flex-col items-center"
                style={{ height: "100%" }}
              >
                {/* Career milestone marker */}
                {milestone && (
                  <>
                    <div
                      className="absolute left-1/2 -translate-x-px border-l border-dashed border-ink-faint/60 pointer-events-none"
                      style={{
                        top: `${-(milestone.labelRow * 1.25 + 2.5)}rem`,
                        bottom: 0,
                      }}
                    />
                    <div
                      className="absolute left-1/2 -translate-x-1/2 text-[9px] font-medium text-ink-muted whitespace-nowrap pointer-events-none"
                      style={{
                        top: `${-(milestone.labelRow * 1.25 + 3.25)}rem`,
                      }}
                    >
                      {language === "zh" ? milestone.zh : milestone.en}
                    </div>
                  </>
                )}

                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-ink px-2 py-1 text-xs text-paper opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                  {count.toLocaleString()} {language === "zh" ? "次引用" : "citations"}
                </div>

                {/* Bar */}
                <div className="flex-1 flex items-end w-full">
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      isCurrentYear
                        ? "bg-ember/80 group-hover:bg-ember"
                        : "bg-teal/60 group-hover:bg-teal"
                    }`}
                    style={{
                      height: `${Math.max(heightPercent, 2)}%`,
                      minHeight: count > 0 ? "4px" : "0",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Year labels */}
        <div className="mt-2 flex justify-between gap-1">
          {years.map((year) => (
            <div
              key={year}
              className="flex-1 text-center text-[10px] text-ink-faint tabular-nums"
            >
              {year.toString().slice(-2)}
            </div>
          ))}
        </div>
      </div>

      {/* Source attribution */}
      <div className="mt-4 text-[11px] text-ink-faint">
        {language === "zh"
          ? "数据来自谷歌学术，自动更新"
          : "Data from Google Scholar, updated automatically"}
      </div>
    </div>
  );
}
