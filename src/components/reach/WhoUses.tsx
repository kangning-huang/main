"use client";

import T from "@/components/T";
import { INSTITUTION_TYPE_LABELS, countryName } from "@/lib/influence";
import { useLanguage } from "@/lib/language-context";
import { useReachLens } from "./ReachLens";

export default function WhoUses() {
  const { language } = useLanguage();
  const zh = language === "zh";
  const { view } = useReachLens();
  const { institutionTypes, topNonAcademicInstitutions, totals } = view;
  const rows = institutionTypes.filter((t) => t.citingWorks > 0);
  const max = Math.max(1, ...rows.map((r) => r.citingWorks));
  const label = (type: string) => INSTITUTION_TYPE_LABELS[type] ?? { en: type, zh: type };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
      <figure>
        <figcaption className="mb-3 text-sm text-ink-muted">
          <T
            en={`Citing works grouped by the types of institutions their authors belong to. Of ${totals.uniqueCitingWorks.toLocaleString()} citing works, each is counted in every institution type represented by at least one author. A work may appear in several rows.`}
            zh={`按施引文献作者所属机构的类型统计。共 ${totals.uniqueCitingWorks.toLocaleString()} 篇施引文献。如果一篇文献的作者来自不同类型的机构，该文献会分别计入对应类别，因此可能出现在多行。`}
          />
        </figcaption>
        <ul className="space-y-2">
          {rows.map((r) => {
            const l = label(r.type);
            const policy = r.type === "government" || r.type === "nonprofit";
            return (
              <li key={r.type} className="group grid grid-cols-[10.5rem_1fr] items-center gap-3 text-sm" title={zh ? `${l.zh}：${r.citingWorks} 篇引用文献，${r.institutions} 家机构（OpenAlex）` : `${l.en}: ${r.citingWorks} citing works, ${r.institutions} distinct institutions (OpenAlex)`}>
                <span className={policy ? "font-medium text-ink" : "text-ink-muted"}>
                  <T en={l.en} zh={l.zh} />
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={`h-3 rounded-r-[4px] ${policy ? "bg-ember" : "bg-teal"} group-hover:opacity-80`}
                    style={{ width: `${Math.max((r.citingWorks / max) * 100, 0.8)}%` }}
                  />
                  <span className="tabular-nums text-ink">{r.citingWorks}</span>
                  <span className="whitespace-nowrap text-xs text-ink-faint">
                    <T en={`${r.institutions} inst.`} zh={`${r.institutions} 家机构`} />
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-ink-faint">
          <T en="Government and nonprofit institutions are shown in ember. Their citations may indicate policy relevance." zh="政府和非营利机构用余烬色标出。来自这些机构的引用可作为研究与政策相关的线索。" />
        </p>
      </figure>

      <div>
        <h3 className="text-sm font-medium text-ink">
          <T en="Most-cited non-university institutions" zh="被引最多的非高校机构" />
        </h3>
        <ol className="mt-3 space-y-2 text-sm">
          {topNonAcademicInstitutions.slice(0, 10).map((i, idx) => {
            const cn = countryName(i.country);
            const tl = label(i.type);
            return (
              <li key={i.id} className="flex gap-2">
                <span className="w-5 shrink-0 text-right text-ink-faint tabular-nums">{idx + 1}</span>
                <span>
                  <span className="text-ink">{i.name}</span>
                  <span className="text-ink-muted">
                    {" "}
                    · <T en={tl.en} zh={tl.zh} />
                    {i.country ? <> · <T en={cn.en} zh={cn.zh} /></> : null}
                    {" · "}
                    {i.citingWorks}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
