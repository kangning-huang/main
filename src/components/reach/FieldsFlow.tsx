import T from "@/components/T";
import { influence, THEMES, THEME_COLORS, fieldZh } from "@/lib/influence";

const W = 760;
const H = 420;
const NODE_W = 12;
const LEFT_X = 150;
const RIGHT_X = W - 250;
const GAP = 8;
const MAX_FIELDS = 8;
const LABEL_SPACING = 15;

interface Node {
  id: string;
  label: { en: string; zh: string };
  value: number;
  y: number;
  h: number;
  labelY: number;
}

function layout(nodes: Omit<Node, "y" | "h" | "labelY">[], scale: number): Node[] {
  let y = 0;
  let lastLabel = -Infinity;
  return nodes.map((n) => {
    const h = Math.max(n.value * scale, 2);
    const mid = y + h / 2;
    const labelY = Math.max(mid, lastLabel + LABEL_SPACING);
    lastLabel = labelY;
    const node = { ...n, y, h, labelY };
    y += h + GAP;
    return node;
  });
}

export default function FieldsFlow() {
  const { flows, fields, totals } = influence;

  // Right side: top fields by flow volume, rest folded into "Other fields".
  const fieldFlow: Record<string, number> = {};
  for (const f of flows) fieldFlow[f.field] = (fieldFlow[f.field] ?? 0) + f.citingWorks;
  const rankedFields = Object.entries(fieldFlow).sort((a, b) => b[1] - a[1]);
  const shown = new Set(rankedFields.slice(0, MAX_FIELDS).map(([id]) => id));
  const fieldKey = (id: string) => (shown.has(id) ? id : "__other");
  const otherCount = rankedFields.length - shown.size;
  const fieldName = (id: string) => fields.find((f) => f.id === id)?.name ?? id;

  const merged: Record<string, number> = {};
  for (const f of flows) {
    const k = `${f.theme}|${fieldKey(f.field)}`;
    merged[k] = (merged[k] ?? 0) + f.citingWorks;
  }

  const themeNodesRaw = THEMES.map((t) => ({
    id: t.id,
    label: { en: t.en, zh: t.zh },
    value: flows.filter((f) => f.theme === t.id).reduce((s, f) => s + f.citingWorks, 0),
  })).filter((n) => n.value > 0);
  const fieldNodesRaw = [
    ...rankedFields
      .filter(([id]) => shown.has(id))
      .map(([id, value]) => ({ id, label: { en: fieldName(id), zh: fieldZh(fieldName(id)) }, value })),
    ...(otherCount > 0
      ? [
          {
            id: "__other",
            label: { en: `${otherCount} other fields`, zh: `其他 ${otherCount} 个领域` },
            value: rankedFields.filter(([id]) => !shown.has(id)).reduce((s, [, v]) => s + v, 0),
          },
        ]
      : []),
  ];

  const total = themeNodesRaw.reduce((s, n) => s + n.value, 0);
  const maxNodes = Math.max(themeNodesRaw.length, fieldNodesRaw.length);
  const scale = (H - 20 - GAP * (maxNodes - 1)) / total;
  const left = layout(themeNodesRaw, scale);
  const right = layout(fieldNodesRaw, scale);

  // Ribbons: walk themes in order, fields in order, stacking offsets on both ends.
  const leftOffset: Record<string, number> = Object.fromEntries(left.map((n) => [n.id, n.y]));
  const rightOffset: Record<string, number> = Object.fromEntries(right.map((n) => [n.id, n.y]));
  const ribbons: { d: string; color: string; title: string }[] = [];
  for (const l of left) {
    for (const r of right) {
      const v = merged[`${l.id}|${r.id}`];
      if (!v) continue;
      const h = v * scale;
      const y0 = leftOffset[l.id];
      const y1 = rightOffset[r.id];
      leftOffset[l.id] += h;
      rightOffset[r.id] += h;
      const x0 = LEFT_X + NODE_W;
      const x1 = RIGHT_X;
      const mx = (x0 + x1) / 2;
      ribbons.push({
        d: `M${x0},${y0}C${mx},${y0} ${mx},${y1} ${x1},${y1}L${x1},${y1 + h}C${mx},${y1 + h} ${mx},${y0 + h} ${x0},${y0 + h}Z`,
        color: THEME_COLORS[l.id],
        title: `${l.label.en} → ${r.label.en}: ${v} citing works (OpenAlex)`,
      });
    }
  }

  const pctOutside = Math.round((totals.citingWorksOutsideOwnField / totals.uniqueCitingWorks) * 100);
  const svgH = Math.max(H, right[right.length - 1].labelY + 10, left[left.length - 1].labelY + 10);

  return (
    <div>
      <p className="max-w-3xl text-[15px] leading-relaxed text-ink-muted">
        <T
          en={
            <>
              <strong className="text-ink">{totals.citingWorksOutsideOwnField}</strong> of{" "}
              {totals.uniqueCitingWorks} citing works ({pctOutside}%) sit in a different OpenAlex field from
              the paper they cite. Citing works span <strong className="text-ink">{totals.fieldsCount}</strong>{" "}
              OpenAlex fields.
            </>
          }
          zh={
            <>
              在 {totals.uniqueCitingWorks} 篇施引文献中，有 <strong className="text-ink">{totals.citingWorksOutsideOwnField}</strong>{" "}
              篇（{pctOutside}%）与被引论文分属不同的 OpenAlex 领域；施引文献共覆盖{" "}
              <strong className="text-ink">{totals.fieldsCount}</strong> 个 OpenAlex 领域。
            </>
          }
        />
      </p>

      <p className="mt-6 text-xs text-ink-faint sm:hidden">
        <T en="Scroll sideways to see all fields →" zh="左右滑动查看全部领域 →" />
      </p>
      <figure className="mt-2 overflow-x-auto sm:mt-6">
        <svg
          viewBox={`0 0 ${W} ${svgH}`}
          className="h-auto w-full min-w-[560px]"
          role="img"
          aria-label="Flow from Ken Huang's research themes to the OpenAlex fields of the works that cite them"
        >
          {ribbons.map((r, i) => (
            <path key={i} d={r.d} fill={r.color} fillOpacity={0.35} className="transition-opacity hover:[fill-opacity:0.7]">
              <title>{r.title}</title>
            </path>
          ))}
          {left.map((n) => (
            <g key={n.id}>
              <rect x={LEFT_X} y={n.y} width={NODE_W} height={n.h} rx={2} fill={THEME_COLORS[n.id]}>
                <title>{`${n.label.en}: ${n.value} (citing work, theme) pairs — OpenAlex`}</title>
              </rect>
              <text x={LEFT_X - 8} y={n.labelY} dy="0.35em" textAnchor="end" className="fill-ink text-[12px]">
                <T en={n.label.en} zh={n.label.zh} />
                <tspan className="fill-ink-muted"> {n.value}</tspan>
              </text>
            </g>
          ))}
          {right.map((n) => (
            <g key={n.id}>
              <rect x={RIGHT_X} y={n.y} width={NODE_W} height={n.h} rx={2} fill="var(--color-ink-muted)">
                <title>{`${n.label.en}: ${n.value} — OpenAlex`}</title>
              </rect>
              <text x={RIGHT_X + NODE_W + 8} y={n.labelY} dy="0.35em" className="fill-ink text-[12px]">
                <T en={n.label.en} zh={n.label.zh} />
                <tspan className="fill-ink-muted"> {n.value}</tspan>
              </text>
            </g>
          ))}
        </svg>
        <figcaption className="mt-2 text-xs text-ink-faint">
          <T
            en="Ribbon width = citing works (self-citations removed). A work that builds on papers in two themes is counted once per theme. Source: OpenAlex primary-topic field of each citing work."
            zh="条带宽度 = 施引文献数（已剔除自引）。同时引用两个主题论文的文献在每个主题下各计一次。数据来源：OpenAlex 施引文献的主要主题所属领域。"
          />
        </figcaption>
      </figure>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-ink-muted hover:text-ink">
          <T en="All fields, with top subfields (table)" zh="全部领域及主要子领域（表格）" />
        </summary>
        <p className="mt-2 text-xs text-ink-faint">
          <T
            en="OpenAlex assigns topics automatically and subfield labels are noisy. Spot-check the top fields against the citing titles before quoting them; treat single-digit fields as indicative only."
            zh="OpenAlex 的主题由算法自动标注，子领域标签存在噪声。引用前请对照施引文献标题抽查排名靠前的领域；个位数的领域仅供参考。"
          />
        </p>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-xs text-ink-faint">
            <tr>
              <th className="py-1 pr-4 font-normal"><T en="Field" zh="领域" /></th>
              <th className="py-1 pr-4 text-right font-normal"><T en="Citing works" zh="施引文献" /></th>
              <th className="py-1 font-normal"><T en="Top subfields" zh="主要子领域" /></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.id} className="border-t border-rule-faint">
                <td className="py-1 pr-4"><T en={f.name} zh={fieldZh(f.name)} /></td>
                <td className="py-1 pr-4 text-right tabular-nums">{f.citingWorks}</td>
                <td className="py-1 text-ink-muted">{f.topSubfields.map((s) => `${s.name} (${s.citingWorks})`).join(" · ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
