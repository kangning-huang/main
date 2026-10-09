import T from "@/components/T";
import worldMap from "@/data/world-map.json";
import { influence, countryName } from "@/lib/influence";

const MIN_WORKS = 5; // below this the ratio is too noisy to colour

const BINS: { min: number; color: string; en: string; zh: string }[] = [
  { min: 6, color: "#0d7377", en: "≥ 6× expected", zh: "≥ 预期 6 倍" },
  { min: 3, color: "#4fa5a8", en: "3–6×", zh: "3–6 倍" },
  { min: 1.5, color: "#a8d5d6", en: "1.5–3×", zh: "1.5–3 倍" },
  { min: 0.67, color: "#d9d2c6", en: "about as expected (0.67–1.5×)", zh: "接近预期（0.67–1.5 倍）" },
  { min: 0, color: "#e3b48f", en: "< 0.67×", zh: "< 0.67 倍" },
];
const binFor = (ratio: number) => BINS.find((b) => ratio >= b.min) ?? BINS[BINS.length - 1];

export default function WhereMap() {
  const { countries, totals, meta } = influence;
  const byCode = new Map(countries.map((c) => [c.code, c]));
  const drawn = new Set(worldMap.countries.map((c) => c.iso2));
  const notDrawn = countries.filter((c) => !drawn.has(c.code));
  const tableRows = countries.filter((c) => c.citingWorks >= MIN_WORKS);

  return (
    <div>
      <p className="max-w-3xl text-[15px] leading-relaxed text-ink-muted">
        <T
          en={
            <>
              Authors in <strong className="text-ink">{totals.countriesCount}</strong> countries and territories have
              built on these papers. A raw count would mostly map where science happens, so each country is
              shaded by <em>observed ÷ expected</em>: expected is what that country would contribute if it cited
              in proportion to its total OpenAlex output in each citing work&rsquo;s field.
            </>
          }
          zh={
            <>
              来自 <strong className="text-ink">{totals.countriesCount}</strong> 个国家和地区的作者引用了这些论文。原始计数主要反映科研产出的分布，
              因此地图按“实际 ÷ 预期”着色：预期值为该国按其在各施引文献所属领域的 OpenAlex 总产出比例应贡献的施引文献数。
            </>
          }
        />
      </p>

      <figure className="mt-6">
        <svg viewBox={`0 0 ${worldMap.width} ${worldMap.height}`} className="h-auto w-full" role="img" aria-label="World map of citing countries, normalized by each country's output in the citing fields (OpenAlex)">
          <defs>
            <pattern id="reach-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="4" height="4" fill="#efe9df" />
              <line x1="0" y1="0" x2="0" y2="4" stroke="#b9ae9f" strokeWidth="1.2" />
            </pattern>
          </defs>
          {worldMap.countries.map((c, i) => {
            const d = c.iso2 ? byCode.get(c.iso2) : undefined;
            let fill = "#f1ece3";
            let title = `${c.name}: no citing works`;
            if (d && d.citingWorks < MIN_WORKS) {
              fill = "url(#reach-hatch)";
              title = `${c.name}: ${d.citingWorks} citing work${d.citingWorks === 1 ? "" : "s"} — too few to normalize`;
            } else if (d && d.ratio != null) {
              fill = binFor(d.ratio).color;
              title = `${c.name}: ${d.citingWorks} citing works vs ${d.expected} expected → ${d.ratio}× (OpenAlex)`;
            }
            return (
              <path key={c.iso2 ?? `x${i}`} d={c.d} fill={fill} stroke="#fffcf7" strokeWidth={0.5} className="hover:stroke-ink hover:[stroke-width:1]">
                <title>{title}</title>
              </path>
            );
          })}
        </svg>
        <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
          {BINS.map((b) => (
            <span key={b.min} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: b.color }} />
              <T en={b.en} zh={b.zh} />
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <svg width="12" height="12" aria-hidden="true"><rect width="12" height="12" rx="2" fill="url(#reach-hatch)" /></svg>
            <T en={`1–${MIN_WORKS - 1} citing works`} zh={`1–${MIN_WORKS - 1} 篇施引文献`} />
          </span>
          <span className="w-full text-ink-faint">
            <T
              en={`Source: OpenAlex, author affiliations of citing works (self-citations removed), as of ${meta.asOf}. Basemap: Natural Earth 1:110m (public domain), Equal Earth projection.`}
              zh={`数据来源：OpenAlex 施引文献作者机构（已剔除自引），截至 ${meta.asOf}。底图：Natural Earth 1:110m（公有领域），等积地球投影。`}
            />
          </span>
        </figcaption>
      </figure>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-ink-muted hover:text-ink">
          <T en={`Countries with ≥ ${MIN_WORKS} citing works (table)`} zh={`施引文献 ≥ ${MIN_WORKS} 篇的国家和地区（表格）`} />
        </summary>
        <p className="mt-2 text-xs text-ink-faint">
          <T
            en={`Small research systems have small expected values, so their ratios swing widely (one extra paper moves them a lot). Not drawn at this map scale: ${notDrawn.map((c) => countryName(c.code).en).join(", ")}.`}
            zh={`科研体量较小的国家和地区预期值很小，比值波动较大（多一篇论文就会显著改变比值）。以下地区在此比例尺地图上未绘出：${notDrawn.map((c) => countryName(c.code).zh).join("、")}。`}
          />
        </p>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-xs text-ink-faint">
            <tr>
              <th className="py-1 pr-3 font-normal"><T en="Country / territory" zh="国家/地区" /></th>
              <th className="py-1 pr-3 text-right font-normal"><T en="Citing works" zh="施引文献" /></th>
              <th className="py-1 pr-3 text-right font-normal"><T en="Expected" zh="预期" /></th>
              <th className="py-1 text-right font-normal"><T en="Ratio" zh="比值" /></th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((c) => {
              const n = countryName(c.code);
              return (
                <tr key={c.code} className="border-t border-rule-faint">
                  <td className="py-1 pr-3"><T en={n.en} zh={n.zh} /></td>
                  <td className="py-1 pr-3 text-right tabular-nums">{c.citingWorks}</td>
                  <td className="py-1 pr-3 text-right tabular-nums text-ink-muted">{c.expected ?? "—"}</td>
                  <td className="py-1 text-right tabular-nums">{c.ratio != null ? `${c.ratio}×` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
    </div>
  );
}
