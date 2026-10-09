import T from "@/components/T";
import { influence, INSTITUTION_TYPE_LABELS, countryName } from "@/lib/influence";

export default function WhoUses() {
  const { institutionTypes, topNonAcademicInstitutions, totals } = influence;
  const rows = institutionTypes.filter((t) => t.citingWorks > 0);
  const max = Math.max(...rows.map((r) => r.citingWorks));
  const label = (type: string) => INSTITUTION_TYPE_LABELS[type] ?? { en: type, zh: type };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
      <figure>
        <figcaption className="mb-3 text-sm text-ink-muted">
          <T
            en={`Citing works with at least one author at each type of institution (of ${totals.uniqueCitingWorks}; a work can count in several rows)`}
            zh={`至少有一位作者来自该类机构的施引文献数（共 ${totals.uniqueCitingWorks} 篇；一篇文献可计入多行）`}
          />
        </figcaption>
        <ul className="space-y-2">
          {rows.map((r) => {
            const l = label(r.type);
            const policy = r.type === "government" || r.type === "nonprofit";
            return (
              <li key={r.type} className="group grid grid-cols-[10.5rem_1fr] items-center gap-3 text-sm" title={`${l.en}: ${r.citingWorks} citing works, ${r.institutions} distinct institutions (OpenAlex)`}>
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
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          <T
            en="Institution types are OpenAlex/ROR labels, not ours. Note that OpenAlex types some public research academies (e.g. the Chinese Academy of Sciences) as “government”, so this row is not purely policy bodies — see the named list."
            zh="机构类型采用 OpenAlex/ROR 的标注。注意 OpenAlex 将部分公立科研院所（如中国科学院）标为“政府机构”，因此该行并非全部是政策部门——请参见右侧具体名单。"
          />
        </p>
      </figure>

      <div>
        <h3 className="mb-3 text-sm text-ink-muted">
          <T en="Most frequent non-university institutions" zh="出现最多的非高校机构" />
        </h3>
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-ink-faint">
            <tr>
              <th className="py-1 pr-3 font-normal"><T en="Institution" zh="机构" /></th>
              <th className="py-1 pr-3 font-normal"><T en="Type" zh="类型" /></th>
              <th className="py-1 text-right font-normal"><T en="Works" zh="文献" /></th>
            </tr>
          </thead>
          <tbody>
            {topNonAcademicInstitutions.map((i) => {
              const c = countryName(i.country);
              const l = label(i.type);
              return (
                <tr key={i.id} className="border-t border-rule-faint align-top">
                  <td className="py-1.5 pr-3">
                    <a href={`https://openalex.org/${i.id}`} target="_blank" rel="noopener noreferrer" className="text-ink hover:text-ember">
                      {i.name}
                    </a>
                    <span className="text-xs text-ink-faint"> · <T en={c.en} zh={c.zh} /></span>
                  </td>
                  <td className="py-1.5 pr-3 text-ink-muted"><T en={l.en} zh={l.zh} /></td>
                  <td className="py-1.5 text-right tabular-nums">{i.citingWorks}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
